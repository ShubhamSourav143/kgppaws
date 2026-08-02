import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";

/**
 * POST /api/sync/resolve
 *
 * Admin-authenticated. Resolves a sync_conflicts row.
 *
 *   kept_sheet → apply sheet_payload onto the DB row, bump row_version
 *   kept_db    → leave the DB row alone; the next db_to_sheets sync pushes DB back to the sheet
 *   dismissed  → mark resolved without changing either side
 */

const BodySchema = z.object({
  conflictId: z.string().uuid(),
  resolution: z.enum(["kept_sheet", "kept_db", "dismissed"]),
});

export async function POST(request: NextRequest) {
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

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch (e) {
    return NextResponse.json(
      { error: "invalid body", details: e instanceof Error ? e.message : String(e) },
      { status: 400 }
    );
  }

  const service = createServiceSupabase();
  if (!service) return NextResponse.json({ error: "service role not configured" }, { status: 503 });

  const { data: conflict } = await service
    .from("sync_conflicts")
    .select("*")
    .eq("id", body.conflictId)
    .maybeSingle();
  if (!conflict) return NextResponse.json({ error: "conflict not found" }, { status: 404 });
  if (conflict.resolution) return NextResponse.json({ error: "already resolved" }, { status: 409 });

  if (body.resolution === "kept_sheet" && conflict.sheet_payload) {
    // Apply the sheet payload to the DB row and bump row_version.
    const { data: existing } = await service
      .from(conflict.table_name)
      .select("row_version")
      .eq("id", conflict.row_id)
      .maybeSingle();
    const nextVersion = (existing?.row_version ?? 0) + 1;
    await service
      .from(conflict.table_name)
      .update({
        ...(conflict.sheet_payload as Record<string, unknown>),
        row_version: nextVersion,
        sync_status: "ok",
        last_sync_error: null,
        sync_source: "sheets",
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", conflict.row_id);
  }

  await service
    .from("sync_conflicts")
    .update({
      resolution: body.resolution,
      resolved_by: userData.user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", body.conflictId);

  return NextResponse.json({ ok: true, resolution: body.resolution });
}
