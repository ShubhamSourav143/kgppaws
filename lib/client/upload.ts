"use client";

import { createClient } from "@/lib/supabase/client";
import { SUBMISSIONS_BUCKET, type FormKind, type UploadedFile } from "@/lib/uploads";

/**
 * A file the form wants to upload, tagged with its named slot
 * (e.g. "wound" or "medical" on the bite report). The slot travels
 * with the file through the whole pipeline so the DB row and the
 * Sheet row both know which slot each file came from.
 */
export interface FileToUpload {
  slot: string;
  file: File;
}

/**
 * Uploads all files for one submission in parallel:
 *   1. Ask /api/upload/sign for a signed upload URL per file
 *   2. PUT each file directly to Supabase Storage (bypasses Vercel)
 *   3. Return the same metadata shape the DB and Sheet will store
 *
 * `submissionId` MUST be the same UUID the caller uses when creating
 * the DB row afterwards — this is what ties the file bytes on the CDN
 * to the row in the DB to the row in the Sheet. Callers generate it
 * once via crypto.randomUUID() before the first upload begins.
 *
 * Throws on any failure so the form's submit handler can surface a
 * real error rather than the historical fire-and-forget lie.
 */
export async function uploadAll(
  formKind: FormKind,
  submissionId: string,
  files: FileToUpload[]
): Promise<UploadedFile[]> {
  if (files.length === 0) return [];

  const supabase = createClient();
  if (!supabase) {
    throw new Error("Storage is not configured in this environment.");
  }

  // Round-trip 1: sign every file in one call. The server validates
  // extension / size / mime before minting anything, so we either get
  // all URLs back or a single 400 that names the offending slot.
  const signRes = await fetch("/api/upload/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      formKind,
      submissionId,
      files: files.map(({ slot, file }) => ({
        slot,
        filename: file.name,
        contentType: file.type,
        size: file.size,
      })),
    }),
  });
  if (!signRes.ok) {
    const body = await signRes.json().catch(() => ({ error: "Upload sign failed" }));
    throw new Error(body?.error ?? "Upload sign failed");
  }
  const { files: signed } = (await signRes.json()) as {
    files: Array<{
      slot: string;
      path: string;
      token: string;
      url: string;
      filename: string;
      contentType: string;
      size: number;
    }>;
  };

  // Round-trip 2: PUT each file straight to Supabase Storage. Doing
  // them in parallel makes the wall clock the slowest single upload
  // rather than the sum — a bite report has 2-3 files, adopt/rescue
  // have at most 1, so concurrency here is bounded and safe.
  await Promise.all(
    signed.map(async (s, i) => {
      const file = files[i].file;
      const { error } = await supabase.storage
        .from(SUBMISSIONS_BUCKET)
        .uploadToSignedUrl(s.path, s.token, file, {
          contentType: s.contentType,
          upsert: false,
        });
      if (error) {
        throw new Error(`Upload failed for ${s.slot}: ${error.message}`);
      }
    })
  );

  return signed.map((s) => ({
    slot: s.slot,
    path: s.path,
    url: s.url,
    filename: s.filename,
    contentType: s.contentType,
    size: s.size,
  }));
}
