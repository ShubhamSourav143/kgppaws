import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { runOnce } from "@/lib/sync/worker";

/**
 * POST /api/sync/worker
 *
 * Cron-secret-gated. Pulls the next queued job and executes it.
 * Reentrant: safe to call in parallel from multiple cron functions.
 * See docs/API_SPEC.md §6.1.
 */
export async function POST(request: NextRequest) {
  if (request.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceSupabase();
  if (!supabase) {
    return NextResponse.json(
      { ran: false, configured: false, reason: "supabase service role not configured" },
      { status: 200 }
    );
  }

  try {
    const result = await runOnce(supabase);
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { ran: false, error: "worker crash", details: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
