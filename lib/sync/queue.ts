/**
 * Sync job queue.
 *
 * Enqueue with dedup on (tab, direction, row_id). Dequeue via `for update
 * skip locked` so parallel workers never grab the same job. Retry with
 * exponential backoff per §9 of docs/CMS_ARCHITECTURE.md.
 *
 * Reads and writes go through the service-role client (bypasses RLS) —
 * the endpoints that call these helpers are already role-gated at the HTTP
 * layer (`x-cron-secret` for worker/housekeeping, admin session for enqueue).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ArchivePolicy,
  SyncDirection,
  SyncJob,
  SyncScope,
  SyncTriggeredBy,
  TabConfig,
} from "./types";

const HEARTBEAT_TTL_MS = 5 * 60 * 1000;
const BACKOFF_STEPS_SEC = [30, 120, 600, 3600];

// ---------- Tab config lookup ----------

export async function getTabConfig(
  supabase: SupabaseClient,
  tabName: string
): Promise<TabConfig | null> {
  const { data, error } = await supabase
    .from("tab_config")
    .select("*")
    .eq("tab_name", tabName)
    .maybeSingle();
  if (error) throw new Error(`getTabConfig(${tabName}) failed: ${error.message}`);
  if (!data) return null;
  return {
    ...data,
    archive_policy: data.archive_policy as ArchivePolicy,
  } as TabConfig;
}

export async function listTabConfigs(
  supabase: SupabaseClient
): Promise<TabConfig[]> {
  const { data, error } = await supabase.from("tab_config").select("*");
  if (error) throw new Error(`listTabConfigs failed: ${error.message}`);
  return (data ?? []).map((row) => ({
    ...row,
    archive_policy: row.archive_policy as ArchivePolicy,
  })) as TabConfig[];
}

// ---------- Enqueue ----------

export interface EnqueueArgs {
  tab: string;
  direction: SyncDirection;
  scope?: SyncScope;
  rowId?: string | null;
  triggeredBy: SyncTriggeredBy;
  actorId?: string | null;
  forceFullScan?: boolean;
}

export interface EnqueueResult {
  jobId: string;
  state: "queued" | "already_running";
  tab: string;
  direction: SyncDirection;
  enqueuedAt: string;
}

/**
 * Enqueue a job. If an active job for the same (tab, direction, row_id) key
 * already exists, returns its id with state='already_running' — no duplicate
 * queueing, ever.
 */
export async function enqueueJob(
  supabase: SupabaseClient,
  args: EnqueueArgs
): Promise<EnqueueResult> {
  const scope: SyncScope = args.forceFullScan
    ? "full"
    : (args.scope ?? "incremental");

  const rowId = args.rowId ?? null;

  const findActive = async () => {
    const { data, error } = await supabase
      .from("sync_jobs")
      .select("id, tab, direction, row_id, enqueued_at")
      .eq("tab", args.tab)
      .eq("direction", args.direction)
      .in("state", ["queued", "running"]);
    if (error) throw new Error(`enqueueJob lookup failed: ${error.message}`);
    return (data ?? []).find((job) => (job.row_id ?? null) === rowId) ?? null;
  };

  const existing = await findActive();
  if (existing) {
    return {
      jobId: existing.id,
      state: "already_running",
      tab: existing.tab,
      direction: existing.direction as SyncDirection,
      enqueuedAt: existing.enqueued_at,
    };
  }

  const { data, error } = await supabase
    .from("sync_jobs")
    .insert({
      tab: args.tab,
      direction: args.direction,
      scope,
      row_id: rowId,
      state: "queued",
      triggered_by: args.triggeredBy,
      actor_id: args.actorId ?? null,
      next_run_at: new Date().toISOString(),
    })
    .select("id, tab, direction, enqueued_at")
    .single();

  if (error) {
    // 23505 = the uniq_sync_jobs_active index caught a race with a concurrent
    // enqueue — the other job wins; report it as already_running.
    if (isDedupError(error)) {
      const raced = await findActive();
      if (raced) {
        return {
          jobId: raced.id,
          state: "already_running",
          tab: raced.tab,
          direction: raced.direction as SyncDirection,
          enqueuedAt: raced.enqueued_at,
        };
      }
    }
    throw new Error(`enqueueJob insert failed: ${error.message}`);
  }

  return {
    jobId: data.id,
    state: "queued",
    tab: data.tab,
    direction: data.direction as SyncDirection,
    enqueuedAt: data.enqueued_at,
  };
}

// ---------- Dequeue ----------

/**
 * Atomically claim the next runnable job.
 *
 * Mutual exclusion per tab is a heartbeat-guarded "running-job lease": a tab
 * that already has a `running` job with a fresh heartbeat cannot be claimed
 * again. (Session-scoped pg_advisory_lock was rejected — Supabase's pooled
 * HTTP connections mean acquire and release can land on different backend
 * sessions, leaking the lock. A table-based lease is pool-safe.)
 *
 * The claim itself is a state-guarded UPDATE (`eq("state", "queued")`), so
 * two workers racing for the same job see exactly one winner. Two workers
 * racing for *different* jobs of the same tab is closed by a post-claim
 * re-check: if an older running job exists for our tab, we revert our claim.
 *
 * Returns null when nothing is runnable.
 */
export async function claimNextJob(
  supabase: SupabaseClient
): Promise<SyncJob | null> {
  const now = new Date();
  const nowIso = now.toISOString();
  const freshHeartbeatCutoff = new Date(now.getTime() - HEARTBEAT_TTL_MS).toISOString();

  // Tabs currently leased by a live running job.
  const { data: runningRows, error: runningErr } = await supabase
    .from("sync_jobs")
    .select("tab")
    .eq("state", "running")
    .gte("heartbeat_at", freshHeartbeatCutoff);
  if (runningErr) throw new Error(`claimNextJob lease check failed: ${runningErr.message}`);
  const leasedTabs = new Set((runningRows ?? []).map((r) => r.tab));

  const { data: candidates, error } = await supabase
    .from("sync_jobs")
    .select("*")
    .eq("state", "queued")
    .lte("next_run_at", nowIso)
    .order("enqueued_at", { ascending: true })
    .limit(10);

  if (error) throw new Error(`claimNextJob select failed: ${error.message}`);
  if (!candidates || candidates.length === 0) return null;

  for (const candidate of candidates) {
    if (leasedTabs.has(candidate.tab)) continue;

    const { data: claimed, error: claimErr } = await supabase
      .from("sync_jobs")
      .update({
        state: "running",
        started_at: nowIso,
        heartbeat_at: nowIso,
      })
      .eq("id", candidate.id)
      .eq("state", "queued")
      .select("*")
      .single();

    if (claimErr) {
      // No row updated → another worker won this job; try the next candidate.
      if ((claimErr as { code?: string }).code === "PGRST116") continue;
      throw new Error(`claimNextJob claim failed: ${claimErr.message}`);
    }
    if (!claimed) continue;

    // Post-claim lease re-check: if another running job for the same tab
    // started before ours, yield to it.
    const { data: contenders, error: contendersErr } = await supabase
      .from("sync_jobs")
      .select("id, started_at")
      .eq("state", "running")
      .eq("tab", claimed.tab)
      .gte("heartbeat_at", freshHeartbeatCutoff)
      .neq("id", claimed.id);
    if (contendersErr) throw new Error(`claimNextJob re-check failed: ${contendersErr.message}`);

    const older = (contenders ?? []).some(
      (c) => c.started_at !== null && c.started_at <= (claimed.started_at ?? nowIso)
    );
    if (older) {
      await supabase
        .from("sync_jobs")
        .update({ state: "queued", started_at: null, heartbeat_at: null })
        .eq("id", claimed.id);
      continue;
    }

    return claimed as SyncJob;
  }

  return null;
}

// ---------- Heartbeat + completion ----------

export async function heartbeat(supabase: SupabaseClient, jobId: string): Promise<void> {
  const { error } = await supabase
    .from("sync_jobs")
    .update({ heartbeat_at: new Date().toISOString() })
    .eq("id", jobId);
  if (error) throw new Error(`heartbeat failed: ${error.message}`);
}

export interface CompleteJobArgs {
  jobId: string;
  finalState: "succeeded" | "failed" | "conflict";
  rowsRead?: number;
  rowsWritten?: number;
  conflicts?: number;
  durationMs?: number;
  lastError?: unknown;
}

export async function completeJob(
  supabase: SupabaseClient,
  args: CompleteJobArgs
): Promise<void> {
  const patch: Record<string, unknown> = {
    state: args.finalState,
    finished_at: new Date().toISOString(),
    rows_read: args.rowsRead ?? 0,
    rows_written: args.rowsWritten ?? 0,
    conflicts: args.conflicts ?? 0,
    duration_ms: args.durationMs ?? null,
  };
  if (args.lastError !== undefined) patch.last_error = serializeError(args.lastError);

  const { error } = await supabase.from("sync_jobs").update(patch).eq("id", args.jobId);
  if (error) throw new Error(`completeJob failed: ${error.message}`);
}

// ---------- Retry & housekeeping ----------

/**
 * Housekeeping pass: fail out jobs with expired heartbeats and enqueue their
 * retry if attempts remain. Deletes succeeded jobs older than 30 days.
 * Returns counts for observability.
 */
export async function runHousekeeping(supabase: SupabaseClient): Promise<{
  expired: number;
  retried: number;
  cleaned: number;
}> {
  const now = new Date();
  const heartbeatCutoff = new Date(now.getTime() - HEARTBEAT_TTL_MS).toISOString();
  const cleanCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Fail expired heartbeats.
  const { data: expired, error: expiredErr } = await supabase
    .from("sync_jobs")
    .update({
      state: "failed",
      finished_at: now.toISOString(),
      last_error: { message: "heartbeat expired (worker crash)" },
    })
    .eq("state", "running")
    .lt("heartbeat_at", heartbeatCutoff)
    .select("id, tab, direction, scope, row_id, attempt, max_attempts, triggered_by, actor_id");

  if (expiredErr) throw new Error(`housekeeping expire failed: ${expiredErr.message}`);

  // 2. Retry retryable expired jobs.
  let retried = 0;
  for (const job of expired ?? []) {
    if (job.attempt >= job.max_attempts) continue;
    const backoffSec = BACKOFF_STEPS_SEC[Math.min(job.attempt - 1, BACKOFF_STEPS_SEC.length - 1)];
    const nextRunAt = new Date(now.getTime() + backoffSec * 1000).toISOString();
    const { error: retryErr } = await supabase.from("sync_jobs").insert({
      tab: job.tab,
      direction: job.direction,
      scope: job.scope,
      row_id: job.row_id,
      state: "queued",
      attempt: job.attempt + 1,
      max_attempts: job.max_attempts,
      next_run_at: nextRunAt,
      triggered_by: job.triggered_by,
      actor_id: job.actor_id,
    });
    // Ignore dedup collisions — an active retry may already exist.
    if (retryErr && !isDedupError(retryErr)) {
      throw new Error(`housekeeping retry failed: ${retryErr.message}`);
    }
    if (!retryErr) retried++;
  }

  // 3. Clean succeeded jobs older than 30 days.
  const { data: cleaned, error: cleanErr } = await supabase
    .from("sync_jobs")
    .delete()
    .eq("state", "succeeded")
    .lt("finished_at", cleanCutoff)
    .select("id");
  if (cleanErr) throw new Error(`housekeeping clean failed: ${cleanErr.message}`);

  return {
    expired: expired?.length ?? 0,
    retried,
    cleaned: cleaned?.length ?? 0,
  };
}

// ---------- Helpers ----------

function serializeError(err: unknown): unknown {
  if (err instanceof Error) return { message: err.message, name: err.name, stack: err.stack };
  return err;
}

function isDedupError(err: unknown): boolean {
  if (err && typeof err === "object" && "code" in err) {
    return (err as { code?: string }).code === "23505";
  }
  return false;
}
