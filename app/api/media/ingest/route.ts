import { NextRequest, NextResponse } from "next/server";
import { getDriveClient, DRIVE_ROOT_FOLDER_ID } from "@/lib/google/client";
import { createServiceSupabase } from "@/lib/supabase/server";
import { isGoogleConfigured } from "@/lib/config";
import { processImage, variantsMetadata } from "@/lib/media/pipeline";

/**
 * Drive → Storage media ingest v2 (M-CMS-3).
 *
 * Per animal Drive folder:
 *   Dogs/<public_id>/
 *     cover.<ext>           → animal_photos, sort_order 0
 *     gallery/*.<ext>       → animal_photos, sort_order 1+
 *     medical/*             → drive_assets only (never auto-published)
 *
 * Every image is processed into the responsive ladder (3200/1600/800/400 ×
 * AVIF/WebP/JPEG) and a blurhash. Idempotent: files are skipped if their
 * checksum matches the last-ingested row.
 *
 * See docs/CMS_ARCHITECTURE.md §12 for the folder convention and §12.5 for
 * the sibling broken-media sweep endpoint (/api/media/sweep).
 */

const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export async function POST(request: NextRequest) {
  if (request.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isGoogleConfigured || !DRIVE_ROOT_FOLDER_ID) {
    return NextResponse.json({ configured: false, ran: false }, { status: 200 });
  }

  const drive = getDriveClient();
  const supabase = createServiceSupabase();
  if (!drive || !supabase) {
    return NextResponse.json(
      { configured: false, ran: false, reason: "service role not configured" },
      { status: 200 }
    );
  }

  const started = Date.now();
  let filesSeen = 0;
  let filesIngested = 0;
  let filesSkipped = 0;
  const errors: { file: string; message: string }[] = [];

  try {
    const { data: dogFolders } = await drive.files.list({
      q: `'${DRIVE_ROOT_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name)",
      pageSize: 200,
    });

    for (const folder of dogFolders.files ?? []) {
      const publicId = folder.name!;
      const { data: animal } = await supabase
        .from("animals")
        .select("id, public_id")
        .eq("public_id", publicId)
        .maybeSingle();

      if (!animal) {
        errors.push({ file: publicId, message: `no animal with public_id ${publicId}` });
        continue;
      }

      const entries = await walkAnimalFolder(drive, folder.id!);
      let coverAssigned = false;
      let sortOrder = 1;

      for (const entry of entries) {
        filesSeen++;
        const isImage = IMAGE_MIMES.has(entry.mimeType);
        if (!isImage) continue;

        try {
          const { data: existing } = await supabase
            .from("drive_assets")
            .select("id, checksum")
            .eq("drive_file_id", entry.id)
            .maybeSingle();
          if (existing && existing.checksum === entry.md5Checksum) {
            filesSkipped++;
            continue;
          }

          // Download original
          const download = await drive.files.get(
            { fileId: entry.id, alt: "media" },
            { responseType: "arraybuffer" }
          );
          const originalBuf = Buffer.from(download.data as unknown as ArrayBuffer);

          const isCover = entry.name.toLowerCase().startsWith("cover.");
          const basename = isCover
            ? "cover"
            : entry.folderSlug === "gallery"
              ? entry.name.replace(/\.[^.]+$/, "")
              : entry.name.replace(/\.[^.]+$/, "");
          const folderPath = entry.folderSlug === "medical" ? `${publicId}/medical` : publicId;

          const processed = await processImage({
            buffer: originalBuf,
            folder: folderPath,
            basename,
          });

          // Upload each variant
          for (const variant of processed.variants) {
            const { error: upErr } = await supabase.storage
              .from("animal-photos")
              .upload(variant.storagePath, variant.buffer, {
                contentType: variant.contentType,
                upsert: true,
                cacheControl: "public, max-age=31536000, immutable",
              });
            if (upErr) throw upErr;
          }

          const meta = variantsMetadata({
            folder: folderPath,
            basename,
            width: processed.originalWidth,
            height: processed.originalHeight,
            blurhash: processed.blurhash,
          });

          const canonicalPath = `${folderPath}/${basename}-1600.webp`;

          await supabase.from("drive_assets").upsert(
            {
              drive_file_id: entry.id,
              kind: entry.folderSlug === "medical" ? "document" : "dog_photo",
              animal_id: animal.id,
              storage_path: canonicalPath,
              checksum: entry.md5Checksum,
              source: "drive_api",
              variants_metadata: meta,
              blurhash: processed.blurhash,
              width: processed.originalWidth,
              height: processed.originalHeight,
            },
            { onConflict: "drive_file_id" }
          );

          if (entry.folderSlug !== "medical") {
            await supabase.from("animal_photos").upsert(
              {
                animal_id: animal.id,
                storage_path: canonicalPath,
                caption: "",
                is_public: true,
                sort_order: isCover ? 0 : sortOrder++,
                variants: meta,
                blurhash: processed.blurhash,
                width: processed.originalWidth,
                height: processed.originalHeight,
                broken_at: null,
              },
              { onConflict: "animal_id, storage_path" }
            );
            if (isCover) coverAssigned = true;
          }

          filesIngested++;
        } catch (e) {
          errors.push({ file: entry.name, message: e instanceof Error ? e.message : String(e) });
        }
      }

      // Nothing to do if no cover was assigned — animal_photos handling above
      // already took care of ordering.
      void coverAssigned;
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

  return NextResponse.json({
    configured: true,
    ran: true,
    filesSeen,
    filesIngested,
    filesSkipped,
    errors: errors.length,
  });
}

interface FolderEntry {
  id: string;
  name: string;
  mimeType: string;
  md5Checksum: string | null;
  folderSlug: "root" | "gallery" | "medical";
}

async function walkAnimalFolder(
  drive: ReturnType<typeof getDriveClient>,
  folderId: string
): Promise<FolderEntry[]> {
  if (!drive) return [];
  const out: FolderEntry[] = [];

  const { data: root } = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id, name, mimeType, md5Checksum)",
    pageSize: 500,
  });

  for (const f of root.files ?? []) {
    if (f.mimeType === "application/vnd.google-apps.folder") {
      const slug = (f.name ?? "").toLowerCase();
      if (slug === "gallery" || slug === "medical") {
        const { data: sub } = await drive.files.list({
          q: `'${f.id}' in parents and trashed = false`,
          fields: "files(id, name, mimeType, md5Checksum)",
          pageSize: 500,
        });
        for (const sf of sub.files ?? []) {
          if (sf.mimeType !== "application/vnd.google-apps.folder") {
            out.push({
              id: sf.id!,
              name: sf.name ?? "",
              mimeType: sf.mimeType ?? "",
              md5Checksum: sf.md5Checksum ?? null,
              folderSlug: slug as "gallery" | "medical",
            });
          }
        }
      }
    } else {
      out.push({
        id: f.id!,
        name: f.name ?? "",
        mimeType: f.mimeType ?? "",
        md5Checksum: f.md5Checksum ?? null,
        folderSlug: "root",
      });
    }
  }
  return out;
}
