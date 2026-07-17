import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";

/**
 * POST /api/media/sweep
 *
 * Broken-media sweep. Cross-references animal_photos.storage_path against the
 * Supabase Storage bucket contents and marks orphans by setting broken_at.
 * Broken rows also raise a sync_conflicts entry so admins see them in the
 * conflict inbox.
 *
 * Cron-secret-gated. Idempotent — re-runs re-check and can clear broken_at
 * once a re-ingest fixes it.
 */
export async function POST(request: NextRequest) {
  if (request.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceSupabase();
  if (!supabase) {
    return NextResponse.json(
      { ran: false, configured: false, reason: "service role not configured" },
      { status: 200 }
    );
  }

  const started = Date.now();
  let checked = 0;
  let broken = 0;
  let restored = 0;

  const { data: photos, error } = await supabase
    .from("animal_photos")
    .select("id, animal_id, storage_path, broken_at");
  if (error) {
    return NextResponse.json(
      { ran: false, error: `photos_query_failed: ${error.message}` },
      { status: 500 }
    );
  }

  for (const p of photos ?? []) {
    checked++;
    const { data: fileList, error: listErr } = await supabase.storage
      .from("animal-photos")
      .list(dirOf(p.storage_path), { limit: 1000 });
    const exists =
      !listErr &&
      (fileList ?? []).some((f) => `${dirOf(p.storage_path)}/${f.name}` === p.storage_path);

    if (!exists && !p.broken_at) {
      await supabase
        .from("animal_photos")
        .update({ broken_at: new Date().toISOString() })
        .eq("id", p.id);
      await supabase.from("sync_conflicts").insert({
        table_name: "animal_photos",
        row_id: p.id,
        type: "broken_media",
        sheet_payload: null,
        db_payload: { storage_path: p.storage_path },
      });
      broken++;
    } else if (exists && p.broken_at) {
      await supabase
        .from("animal_photos")
        .update({ broken_at: null })
        .eq("id", p.id);
      restored++;
    }
  }

  await supabase.from("sync_log").insert({
    tab_name: "media_sweep",
    direction: "sheets_to_db",
    rows_read: checked,
    rows_written: restored,
    conflicts: broken,
    errors: [],
    duration_ms: Date.now() - started,
  });

  return NextResponse.json({ ran: true, checked, broken, restored });
}

function dirOf(path: string): string {
  const i = path.lastIndexOf("/");
  return i < 0 ? "" : path.substring(0, i);
}
