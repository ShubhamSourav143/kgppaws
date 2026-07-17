import { NextResponse } from "next/server";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";
import { enqueueJob, listTabConfigs } from "@/lib/sync/queue";

/**
 * POST /api/sync/enqueue-all
 *
 * Admin-authenticated shortcut for "Sync Everything" — enqueues one job per
 * enabled sheets_to_db tab in the direction dictated by tab_config.
 */
export async function POST() {
  const supabase = await createServerSupabase();
  if (!supabase) return NextResponse.json({ error: "supabase not configured" }, { status: 503 });

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);
  const roles = new Set((roleData ?? []).map((r) => r.role));
  if (!roles.has("admin") && !roles.has("super_admin")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const service = createServiceSupabase();
  if (!service) return NextResponse.json({ error: "service role not configured" }, { status: 503 });

  const configs = await listTabConfigs(service);
  const enqueued: string[] = [];
  for (const c of configs) {
    if (!c.enabled) continue;
    if (c.direction !== "sheets_to_db") continue;
    try {
      await enqueueJob(service, {
        tab: c.tab_name,
        direction: c.direction,
        scope: "incremental",
        triggeredBy: "admin",
        actorId: userData.user.id,
      });
      enqueued.push(c.tab_name);
    } catch (e) {
      // continue — one tab's error mustn't block the rest
      void e;
    }
  }

  return NextResponse.json({ enqueued: enqueued.length, tabs: enqueued }, { status: 202 });
}
