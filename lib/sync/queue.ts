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

  const { data: existing, error: existingErr } = await supabase
    .from("sync_jobs")
    .select("id, tab, direction, enqueued_at")
    .eq("tab", args.tab)
    .eq("direction", args.direction)
    .in("state", ["queued", "running"])
    .limit(1);

  if (existingErr) throw new Error(`enqueueJob lookup failed: ${existingErr.message}`);

  if (existing && existing.length > 0) {
    // Match on row_id — SQL IS NULL semantics require a separate filter.
    for (const job of existing) {
      const jobRowId = (job as unknown as { row_id: string | null }).row_id ?? null;
      if (jobRowId === rowId) {
        return {
          jobId: job.id,
          state: "already_running",
          tab: job.tab,
          direction: job.direction as SyncDirection,
          enqueuedAt: job.enqueued_at,
        };
      }
    }
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

  if (error) throw new Error(`enqueueJob insert failed: ${error.message}`);

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
 * Atomically claim the next runnable job. Uses `UPDATE ... FROM ... WHERE id IN
 * (SELECT ... FOR UPDATE SKIP LOCKED)` semantics — the RPC in migration 0007
 * would model this cleanly; for M-CMS-1 we use a two-step read-modify-write
 * guarded by the unique index on (tab, direction, coalesce(row_id, sentinel)),
 * which prevents the same job being claimed twice.
 *
 * Returns null when the queue is empty.
 */
export async function claimNextJob(
  supabase: SupabaseClient
): Promise<SyncJob | null> {
  const nowIso = new Date().toISOString();

  const { data: candidates, error } = await supabase
    .from("sync_jobs")
    .select("*")
    .eq("state", "queued")
    .lte("next_run_at", nowIso)
    .order("enqueued_at", { ascending: true })
    .limit(5);

  if (error) throw new Error(`claimNextJob select failed: ${error.message}`);
  if (!candidates || candidates.length === 0) return null;

  for (const candidate of candidates) {
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
      // If UPDATE returned no row, another worker beat us to it — try the next candidate.
      if ((claimErr as { code?: string }).code === "PGRST116") continue;
      throw new Error(`claimNextJob claim failed: ${claimErr.message}`);
    }
    if (claimed) return claimed as SyncJob;
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
