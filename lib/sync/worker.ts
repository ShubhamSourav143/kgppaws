/**
 * Sync worker.
 *
 * Called by POST /api/sync/worker (cron-secret-gated). Claims one job,
 * dispatches to the registered tab handler, records the outcome. Reentrant
 * — safe for parallel invocation from multiple Vercel functions because
 * (a) claim uses UPDATE-guard-by-state, and (b) the tab's advisory lock
 * gates the actual work.
 *
 * In M-CMS-1 the tab registry is empty; the worker still exercises the full
 * plumbing (claim, lock, heartbeat, apply-noop, audit-noop, complete). That
 * gives us the verifiable outcome: an empty sync job runs end-to-end.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { sheets_v4 } from "googleapis";
import { getSheetsClient, SPREADSHEET_ID } from "@/lib/google/client";
import { isGoogleConfigured } from "@/lib/config";
import {
  claimNextJob,
  completeJob,
  getTabConfig,
  heartbeat,
} from "./queue";
import { releaseLock, tryAcquireLock } from "./locks";
import { getHandler } from "./tabs";
import type { SyncJob, TabConfig, TabRunContext, TabRunResult } from "./types";

export interface WorkerResult {
  ran: boolean;
  jobId?: string;
  state?: "succeeded" | "failed" | "skipped_locked" | "no_handler";
  tab?: string;
  direction?: string;
  reason?: string;
}

export async function runOnce(supabase: SupabaseClient): Promise<WorkerResult> {
  const job = await claimNextJob(supabase);
  if (!job) return { ran: false };

  const started = Date.now();

  const config = await getTabConfig(supabase, job.tab);
  if (!config) {
    await completeJob(supabase, {
      jobId: job.id,
      finalState: "failed",
      durationMs: Date.now() - started,
      lastError: { message: `no tab_config row for tab '${job.tab}'` },
    });
    return {
      ran: true,
      jobId: job.id,
      state: "failed",
      tab: job.tab,
      direction: job.direction,
      reason: "no_tab_config",
    };
  }

  if (!config.enabled) {
    await completeJob(supabase, {
      jobId: job.id,
      finalState: "failed",
      durationMs: Date.now() - started,
      lastError: { message: `tab '${job.tab}' is disabled via tab_config.enabled` },
    });
    return {
      ran: true,
      jobId: job.id,
      state: "failed",
      tab: job.tab,
      direction: job.direction,
      reason: "tab_disabled",
    };
  }

  // Try to acquire the tab's advisory lock. If another worker holds it, we
  // release our claim on the job (revert state → queued) and let the next
  // poll pick it up when the other worker finishes.
  const locked = await tryAcquireLock(supabase, job.tab);
  if (!locked) {
    await supabase
      .from("sync_jobs")
      .update({ state: "queued", started_at: null, heartbeat_at: null })
      .eq("id", job.id);
    return {
      ran: true,
      jobId: job.id,
      state: "skipped_locked",
      tab: job.tab,
      direction: job.direction,
    };
  }

  try {
    const handler = getHandler(job.tab);
    if (!handler) {
      // Plumbing verified — nothing to do. Empty successful run.
      await completeJob(supabase, {
        jobId: job.id,
        finalState: "succeeded",
        rowsRead: 0,
        rowsWritten: 0,
        conflicts: 0,
        durationMs: Date.now() - started,
        lastError: { note: "no_handler_registered" },
      });
      return {
        ran: true,
        jobId: job.id,
        state: "no_handler",
        tab: job.tab,
        direction: job.direction,
        reason: "no_handler_registered",
      };
    }

    // Real dispatch path — used from M-CMS-2 onward.
    const ctx = await buildContext(supabase, job, config);
    if (!ctx) {
      await completeJob(supabase, {
        jobId: job.id,
        finalState: "failed",
        durationMs: Date.now() - started,
        lastError: { message: "google credentials not configured" },
      });
      return {
        ran: true,
        jobId: job.id,
        state: "failed",
        tab: job.tab,
        direction: job.direction,
        reason: "google_not_configured",
      };
    }

    await heartbeat(supabase, job.id);

    let result: TabRunResult;
    if (job.direction === "sheets_to_db") {
      if (!handler.applySheetsToDb) {
        throw new Error(`handler for '${job.tab}' does not implement applySheetsToDb`);
      }
      result = await handler.applySheetsToDb(ctx);
    } else if (job.direction === "db_to_sheets") {
      if (!handler.applyDbToSheets) {
        throw new Error(`handler for '${job.tab}' does not implement applyDbToSheets`);
      }
      result = await handler.applyDbToSheets(ctx);
    } else {
      throw new Error(`unsupported direction '${job.direction}' in worker`);
    }

    const finalState: "succeeded" | "conflict" =
      result.conflicts > 0 ? "conflict" : "succeeded";

    await completeJob(supabase, {
      jobId: job.id,
      finalState,
      rowsRead: result.rowsRead,
      rowsWritten: result.rowsWritten,
      conflicts: result.conflicts,
      durationMs: Date.now() - started,
      lastError: result.errors.length > 0 ? { errors: result.errors } : undefined,
    });

    return {
      ran: true,
      jobId: job.id,
      state: "succeeded",
      tab: job.tab,
      direction: job.direction,
    };
  } catch (err) {
    await completeJob(supabase, {
      jobId: job.id,
      finalState: "failed",
      durationMs: Date.now() - started,
      lastError: err,
    });
    return {
      ran: true,
      jobId: job.id,
      state: "failed",
      tab: job.tab,
      direction: job.direction,
      reason: err instanceof Error ? err.message : String(err),
    };
  } finally {
    await releaseLock(supabase, job.tab);
  }
}

async function buildContext(
  supabase: SupabaseClient,
  job: SyncJob,
  config: TabConfig
): Promise<TabRunContext | null> {
  if (!isGoogleConfigured || !SPREADSHEET_ID) return null;
  const sheets = getSheetsClient() as sheets_v4.Sheets | null;
  if (!sheets) return null;
  return {
    job,
    config,
    supabase,
    sheets,
    spreadsheetId: SPREADSHEET_ID,
    now: () => new Date(),
  };
}
