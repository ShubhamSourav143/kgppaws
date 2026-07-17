import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";
import { enqueueJob, getTabConfig } from "@/lib/sync/queue";

/**
 * POST /api/sync/enqueue
 *
 * Admin-authenticated. Enqueues a sync job on the new job queue.
 * See docs/API_SPEC.md §6.1 and docs/CMS_ARCHITECTURE.md §7 for the design.
 */

const BodySchema = z.object({
  tab: z.string().min(1),
  direction: z.enum(["sheets_to_db", "db_to_sheets"]),
  scope: z.enum(["full", "incremental", "row"]).optional(),
  rowId: z.string().uuid().optional(),
  forceFullScan: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "supabase not configured" }, { status: 503 });
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: roleData, error: roleErr } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);

  if (roleErr) {
    return NextResponse.json({ error: "role lookup failed" }, { status: 500 });
  }
  const roles = new Set((roleData ?? []).map((r) => r.role));
  if (!roles.has("admin") && !roles.has("super_admin")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let payload: z.infer<typeof BodySchema>;
  try {
    payload = BodySchema.parse(await request.json());
  } catch (e) {
    return NextResponse.json(
      { error: "invalid body", details: e instanceof Error ? e.message : String(e) },
      { status: 400 }
    );
  }

  // Use the service-role client for privileged writes to sync_jobs.
  const service = createServiceSupabase();
  if (!service) {
    return NextResponse.json(
      { error: "service role not configured" },
      { status: 503 }
    );
  }

  const config = await getTabConfig(service, payload.tab);
  if (!config) {
    return NextResponse.json({ error: "unknown tab", tab: payload.tab }, { status: 400 });
  }
  if (!config.enabled) {
    return NextResponse.json({ error: "sync disabled", tab: payload.tab }, { status: 503 });
  }
  if (config.direction !== payload.direction) {
    return NextResponse.json(
      {
        error: "direction not allowed for tab",
        tab: payload.tab,
        direction: payload.direction,
        expected: config.direction,
      },
      { status: 400 }
    );
  }
  if (payload.scope === "row" && !payload.rowId) {
    return NextResponse.json(
      { error: "rowId required when scope='row'" },
      { status: 400 }
    );
  }

  try {
    const result = await enqueueJob(service, {
      tab: payload.tab,
      direction: payload.direction,
      scope: payload.scope,
      rowId: payload.rowId ?? null,
      triggeredBy: "admin",
      actorId: userData.user.id,
      forceFullScan: payload.forceFullScan,
    });
    return NextResponse.json(result, { status: 202 });
  } catch (e) {
    return NextResponse.json(
      { error: "enqueue failed", details: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
