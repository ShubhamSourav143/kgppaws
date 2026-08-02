import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { isGoogleConfigured } from "@/lib/config";

/**
 * Recent sync runs, for the admin dashboard's sync-health panel.
 *
 * Kept as a thin wrapper over the new `sync_jobs` table (M-CMS-1) — returns
 * the same {configured, runs: [...]} shape the earlier `sync_log`-based
 * version returned, mapping the new columns so any existing consumer works
 * unchanged. Replaced by GET /api/sync/jobs in M-CMS-6.
 *
 * Auth: relies on the caller's own session — RLS on sync_jobs already
 * restricts reads to admin/super_admin.
 */
export async function GET() {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json({ configured: false, runs: [] });
  }

  const { data, error } = await supabase
    .from("sync_jobs")
    .select("*")
    .order("enqueued_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json(
      { configured: isGoogleConfigured, runs: [], error: error.message },
      { status: 500 }
    );
  }

  // Map the new schema to the legacy response shape so existing callers keep
  // working. `direction` and `tab` map straight through; `run_at` maps from
  // `enqueued_at`, `errors` from `last_error`.
  const runs = (data ?? []).map((job) => ({
    id: job.id,
    tab_name: job.tab,
    direction: job.direction,
    scope: job.scope,
    state: job.state,
    run_at: job.enqueued_at,
    started_at: job.started_at,
    finished_at: job.finished_at,
    rows_read: job.rows_read ?? 0,
    rows_written: job.rows_written ?? 0,
    conflicts: job.conflicts ?? 0,
    errors: job.last_error ?? [],
    duration_ms: job.duration_ms,
    triggered_by: job.triggered_by,
  }));

  return NextResponse.json({ configured: isGoogleConfigured, runs });
}
