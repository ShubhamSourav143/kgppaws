import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { isGoogleConfigured } from "@/lib/config";

/**
 * Recent sync runs, for the admin dashboard's sync-health panel.
 * Auth: relies on the caller's own session — RLS on sync_log already
 * restricts reads to admin/super_admin (see supabase/migrations).
 */
export async function GET() {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json({ configured: false, runs: [] });
  }

  const { data, error } = await supabase
    .from("sync_log")
    .select("*")
    .order("run_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ configured: isGoogleConfigured, runs: [], error: error.message }, { status: 500 });
  }

  return NextResponse.json({ configured: isGoogleConfigured, runs: data });
}
