import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { runHousekeeping } from "@/lib/sync/queue";

/**
 * POST /api/sync/housekeeping
 *
 * Cron-secret-gated. Runs the housekeeping pass: expire stale heartbeats,
 * enqueue retries for failed retryable jobs, clean succeeded jobs > 30 days.
 * See docs/API_SPEC.md §6.1 and docs/CMS_ARCHITECTURE.md §9.
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
    const result = await runHousekeeping(supabase);
    return NextResponse.json({ ran: true, ...result }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { ran: false, error: "housekeeping crash", details: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
