import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { runHousekeeping } from "@/lib/sync/queue";
import { cronUnauthorized, isCronAuthorized } from "@/lib/api/cron-auth";

/**
 * POST /api/sync/housekeeping
 *
 * Cron-secret-gated. Runs the housekeeping pass: expire stale heartbeats,
 * enqueue retries for failed retryable jobs, clean succeeded jobs > 30 days.
 * See docs/API_SPEC.md §6.1 and docs/CMS_ARCHITECTURE.md §9.
 */
export async function POST(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return cronUnauthorized();
  }

  const supabase = createServiceSupabase();
  if (!supabase) {
    return NextResponse.json(
      { configured: false, ran: false, reason: "supabase service role not configured" },
      { status: 200 }
    );
  }

  try {
    const result = await runHousekeeping(supabase);
    return NextResponse.json({ ran: true, ...result }, { status: 200 });
  } catch (e) {
    // Logged server-side, not echoed: the message can carry table/column names
    // from a Postgres error and this endpoint is reachable by anyone who
    // guesses the URL (they just won't get past the 401 — but a future
    // misconfiguration shouldn't turn into schema disclosure).
    console.error("[sync/housekeeping] crashed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ ran: false, error: "housekeeping crash" }, { status: 500 });
  }
}
