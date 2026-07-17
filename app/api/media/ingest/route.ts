import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getDriveClient, DRIVE_ROOT_FOLDER_ID } from "@/lib/google/client";
import { createServiceSupabase } from "@/lib/supabase/server";
import { isGoogleConfigured } from "@/lib/config";

/**
 * Drive → Storage media ingest. Folder convention (see docs/ARCHITECTURE.md
 * §7): the Drive root folder contains one subfolder per animal, named with
 * that animal's public_id —
 *
 *   Dogs/                       (= GOOGLE_DRIVE_ROOT_FOLDER_ID)
 *     DOG00001/
 *       cover.jpg                → animal_photos, sort_order 0
 *       gallery/*                → animal_photos, sort_order 1+
 *       medical/*                → NOT auto-published (see note below)
 *
 * `medical/` files are catalogued in drive_assets but deliberately NOT
 * inserted into animal_photos automatically — treatment photos and
 * documents may not be appropriate for public display, and that's a human
 * judgement call for an admin to make, not something this pipeline should
 * decide by folder name alone.
 *
 * Cron-secret-gated, same reasoning as /api/sync/run.
 */

const MIME_TO_KIND: Record<string, "dog_photo" | "document"> = {
  "image/jpeg": "dog_photo",
  "image/png": "dog_photo",
  "image/webp": "dog_photo",
};

export async function POST(request: NextRequest) {
  if (request.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGoogleConfigured || !DRIVE_ROOT_FOLDER_ID) {
    return NextResponse.json({ configured: false, ran: false }, { status: 200 });
  }

  const drive = getDriveClient();
  const supabase = createServiceSupabase();
  if (!drive || !supabase) {
    return NextResponse.json(
      { configured: false, ran: false, reason: "Supabase service role not configured" },
      { status: 200 }
    );
  }

  const started = Date.now();
  let filesSeen = 0;
  let filesIngested = 0;
  const errors: { file: string; message: string }[] = [];

  try {
    const { data: animalFolders } = await drive.files.list({
      q: `'${DRIVE_ROOT_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name)",
    });

    for (const folder of animalFolders.files ?? []) {
      const publicId = folder.name!;
      const { data: animal } = await supabase
        .from("animals")
        .select("id")
        .eq("public_id", publicId)
        .maybeSingle();

      if (!animal) {
        errors.push({ file: publicId, message: `No animal with public_id ${publicId} — folder skipped` });
        continue;
      }

      const { data: filesRes } = await drive.files.list({
        q: `'${folder.id}' in parents and trashed = false`,
        fields: "files(id, name, mimeType, md5Checksum, parents)",
      });

      let sortOrder = 0;
      for (const file of filesRes.files ?? []) {
        filesSeen++;
        const kind = MIME_TO_KIND[file.mimeType ?? ""];
        if (!kind) continue; // subfolders (gallery/, medical/) and non-images handled below/skipped

        try {
          const { data: existing } = await supabase
            .from("drive_assets")
            .select("id, checksum")
            .eq("drive_file_id", file.id)
            .maybeSingle();
          if (existing && existing.checksum === file.md5Checksum) continue; // unchanged

          // googleapis' types don't model the alt:"media" binary-download
          // case cleanly (the `get` overloads resolve to Schema$File); at
          // runtime, responseType:"arraybuffer" does return raw bytes in
          // `.data` — this is the standard, documented pattern for
          // downloading Drive file content. Cast through `unknown` since
          // the declared and actual types aren't considered overlapping.
          const download = await drive.files.get(
            { fileId: file.id!, alt: "media" },
            { responseType: "arraybuffer" }
          );
          const optimized = await sharp(Buffer.from(download.data as unknown as ArrayBuffer))
            .rotate()
            .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 82 })
            .toBuffer();

          const storagePath = `${publicId}/${file.name}.jpg`;
          const { error: upErr } = await supabase.storage
            .from("animal-photos")
            .upload(storagePath, optimized, { contentType: "image/jpeg", upsert: true });
          if (upErr) throw upErr;

          await supabase.from("drive_assets").upsert(
            {
              drive_file_id: file.id,
              kind,
              animal_id: animal.id,
              storage_path: storagePath,
              checksum: file.md5Checksum,
              source: "drive_api",
            },
            { onConflict: "drive_file_id" }
          );

          // cover.* → sort_order 0, everything else appends after it.
          const isCover = file.name!.toLowerCase().startsWith("cover.");
          await supabase.from("animal_photos").upsert(
            {
              animal_id: animal.id,
              storage_path: storagePath,
              caption: "",
              is_public: true,
              sort_order: isCover ? 0 : ++sortOrder,
            },
            { onConflict: "animal_id, storage_path" }
          );

          filesIngested++;
        } catch (e) {
          errors.push({ file: file.name ?? file.id ?? "unknown", message: e instanceof Error ? e.message : String(e) });
        }
      }
    }
  } catch (e) {
    errors.push({ file: "(root listing)", message: e instanceof Error ? e.message : String(e) });
  }

  await supabase.from("sync_log").insert({
    tab_name: "drive_media",
    direction: "sheets_to_db",
    rows_read: filesSeen,
    rows_written: filesIngested,
    conflicts: 0,
    errors,
    duration_ms: Date.now() - started,
  });

  return NextResponse.json({ configured: true, ran: true, filesSeen, filesIngested, errors: errors.length });
}
