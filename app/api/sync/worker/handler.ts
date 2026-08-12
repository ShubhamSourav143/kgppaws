import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { runOnce } from "@/lib/sync/worker";
import { cronUnauthorized, isCronAuthorized } from "@/lib/api/cron-auth";

/**
 * POST /api/sync/worker
 *
 * Cron-secret-gated. Drains queued jobs until the queue is empty or the
 * function's time budget runs out, whichever comes first.
 * Reentrant: safe to call in parallel from multiple cron functions.
 * See docs/API_SPEC.md §6.1.
 *
 * Why a drain loop and not a single job: `runOnce` claims exactly ONE job,
 * and Vercel Hobby caps cron at one invocation per day. With 15 registered
 * tab handlers (lib/sync/tabs/index.ts), one-job-per-day meant a full sync
 * cycle took over two weeks. The loop keeps the same per-job semantics —
 * claim, lease, complete — just repeated until there is nothing runnable.
 */

/** Stop claiming new work with this much of the budget left, so the in-flight job can finish and record its outcome. */
const TIME_BUDGET_MS = 45_000;
/** Backstop against a pathological queue; the next cron run picks up the rest. */
const MAX_JOBS_PER_RUN = 50;

export async function POST(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return cronUnauthorized();
  }

  const supabase = createServiceSupabase();
  if (!supabase) {
    return NextResponse.json(
      { ran: false, configured: false, reason: "supabase service role not configured" },
      { status: 200 }
    );
  }

  const startedAt = Date.now();
  const results: Awaited<ReturnType<typeof runOnce>>[] = [];

  try {
    while (results.length < MAX_JOBS_PER_RUN) {
      if (Date.now() - startedAt > TIME_BUDGET_MS) break;
      const result = await runOnce(supabase);
      if (!result.ran) break; // queue drained
      results.push(result);
    }

    return NextResponse.json(
      {
        ran: results.length > 0,
        jobsProcessed: results.length,
        durationMs: Date.now() - startedAt,
        // Truncated: a full drain can process dozens of jobs and the cron log
        // only needs the shape of what happened, not every row.
        jobs: results.slice(0, 20),
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("[sync/worker] crashed:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      {
        ran: results.length > 0,
        jobsProcessed: results.length,
        error: "worker crash",
      },
      { status: 500 }
    );
  }
}
