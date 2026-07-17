import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { enqueueJob } from "@/lib/sync/queue";

/**
 * POST /api/sync/run — COMPATIBILITY SHIM (M-CMS-1, 2026-07-17).
 *
 * The original one-shot Dogs-only sync route has been replaced by the
 * job-queue architecture defined in docs/CMS_ARCHITECTURE.md. This route
 * is preserved so any existing caller (external cron, script) keeps
 * working: it enqueues a Dogs full-scan job into the new queue and
 * returns the enqueued jobId.
 *
 * The `triggered_by = 'compat_shim'` marker on the resulting sync_jobs
 * row lets us see whether the shim is still being hit before removing
 * it in a later milestone. Not deleted until owner sign-off.
 */
export async function POST(request: NextRequest) {
  if (request.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceSupabase();
  if (!supabase) {
    return NextResponse.json(
      { configured: false, ran: false, reason: "supabase service role not configured" },
      { status: 200 }
    );
  }

  try {
    const result = await enqueueJob(supabase, {
      tab: "Dogs",
      direction: "sheets_to_db",
      scope: "full",
      triggeredBy: "compat_shim",
    });
    return NextResponse.json(
      {
        configured: true,
        ran: false,
        enqueued: true,
        compatShim: true,
        note: "Sync is now job-queue-based. This endpoint enqueued a job; the worker will pick it up. Update your caller to use POST /api/sync/enqueue directly.",
        ...result,
      },
      { status: 202 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: "shim failed", details: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
