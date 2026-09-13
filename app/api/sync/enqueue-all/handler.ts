import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";
import { enqueueJob, listTabConfigs } from "@/lib/sync/queue";
import { cronUnauthorized, isCronAuthorized } from "@/lib/api/cron-auth";

/**
 * GET /api/sync/enqueue-all — the nightly cron entry point.
 *
 * vercel.json schedules this path, and Vercel Cron issues a GET with no
 * cookies. The POST below requires an interactive admin session, so the
 * scheduled run could never have enqueued anything even once the routing and
 * header mismatches were fixed. This variant authenticates with CRON_SECRET
 * and enqueues through the service role instead.
 *
 * Same work, different caller: one job per enabled sheets_to_db tab.
 */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return cronUnauthorized();
  }

  const service = createServiceSupabase();
  if (!service) {
    return NextResponse.json(
      { enqueued: 0, configured: false, reason: "service role not configured" },
      { status: 200 }
    );
  }

  return enqueueAllTabs(service, null);
}

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

  return enqueueAllTabs(service, userData.user.id);
}

/**
 * Shared body for both entry points. `actorId` is the admin's user id for a
 * dashboard-triggered run, or null for the cron — which is also what
 * distinguishes 'admin' from 'cron' in sync_jobs.triggered_by, so the job
 * history shows who asked for each sync.
 */
async function enqueueAllTabs(
  service: NonNullable<ReturnType<typeof createServiceSupabase>>,
  actorId: string | null
) {
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
        triggeredBy: actorId ? "admin" : "cron",
        actorId,
      });
      enqueued.push(c.tab_name);
    } catch (e) {
      // continue — one tab's error mustn't block the rest
      console.warn(
        `[sync/enqueue-all] enqueue failed for tab '${c.tab_name}':`,
        e instanceof Error ? e.message : e
      );
    }
  }

  return NextResponse.json({ enqueued: enqueued.length, tabs: enqueued }, { status: 202 });
}
