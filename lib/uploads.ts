/**
 * Shared upload contract used by every public form on the site.
 *
 * Client submits form → for each attached file, gets a short-lived signed
 * upload URL from /api/upload/sign → PUTs the bytes directly to Supabase
 * Storage (bypasses Vercel's 4.5 MB body limit) → posts submission text +
 * this metadata array to the form-specific submissions endpoint. That
 * endpoint writes both the DB row and forwards the whole thing to the
 * Apps Script webhook for Google Sheets.
 *
 * Same shape everywhere so the wall clock and the DB row and the Sheet
 * row all describe the same file the same way.
 */

export const SUBMISSIONS_BUCKET = "submissions";
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB — matches the bucket ceiling

/** Every mime type the `submissions` bucket accepts. Keep in sync with the migration. */
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/heic",
  "image/heif",
  "application/pdf",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/** Every form kind that can carry file uploads. Also becomes the top-level folder. */
export const FORM_KINDS = [
  "bite-reports",
  "rescue-reports",
  "adoption",
  "volunteers",
  "donations",
] as const;

export type FormKind = (typeof FORM_KINDS)[number];

/**
 * A user's file BEFORE it has been uploaded — just what the client can
 * measure locally, plus which slot it belongs to inside the form
 * (e.g. "wound" or "medical" on the bite report). The server needs
 * (contentType, size) to validate before minting the signed URL.
 */
export interface FileSignRequest {
  slot: string;
  filename: string;
  contentType: string;
  size: number;
}

/**
 * A file's identity AFTER it has been uploaded to Supabase Storage.
 * Copied verbatim into the DB row's `attachments` jsonb column and
 * forwarded to Google Sheets so volunteers see the same URL from
 * either surface.
 */
export interface UploadedFile {
  slot: string;
  path: string;                 // e.g. bite-reports/2026/08/<uuid>/wound-<uuid>.jpg
  url: string;                  // public URL on the CDN, always valid while the object exists
  filename: string;             // original user-supplied name, safe to display
  contentType: string;
  size: number;
}

/**
 * Reject files the bucket would reject, before we spend a round-trip
 * minting a signed URL that will fail at PUT time.
 */
export function validateFileMeta(file: FileSignRequest): string | null {
  if (!file.filename || file.filename.length > 260) {
    return `${file.slot}: filename missing or too long`;
  }
  if (typeof file.size !== "number" || file.size <= 0) {
    return `${file.slot}: file appears to be empty`;
  }
  if (file.size > MAX_FILE_BYTES) {
    return `${file.slot}: file is larger than ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB`;
  }
  if (!ALLOWED_MIME_TYPES.includes(file.contentType as AllowedMimeType)) {
    return `${file.slot}: file type ${file.contentType || "unknown"} is not allowed`;
  }
  return null;
}

/**
 * Turn a user-supplied filename into something safe for a storage path.
 * We only keep the last extension — the rest becomes a UUID so there is
 * no way for a hostile filename to break the path structure or collide
 * with another user's upload.
 */
export function safeExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot < 0 || dot === filename.length - 1) return "";
  const raw = filename.slice(dot + 1).toLowerCase();
  // strict allowlist keeps ../ or query-string chars out
  return /^[a-z0-9]{1,8}$/.test(raw) ? `.${raw}` : "";
}

/**
 * Turn a client-supplied slot name into a single safe path segment.
 *
 * `slot` arrives verbatim from the browser and used to be interpolated
 * straight into the storage path, so a slot of `../../../avatars/admin`
 * walked the upload out of its submission folder. Everything outside
 * [a-z0-9-] is collapsed, which removes `.` and `/` and therefore any
 * traversal sequence; an empty result falls back to "file" so the leaf is
 * never just a bare UUID.
 */
export function safeSlot(slot: string): string {
  const cleaned = (slot ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return cleaned || "file";
}

/**
 * Build a storage path for one uploaded file.
 *
 * Layout: <form-kind>/<YYYY>/<MM>/<submissionId>/<slot>-<uuid><ext>
 *
 * Grouping by month keeps folder listings tractable when we accumulate
 * thousands of reports. Including the slot in the leaf makes any
 * download unambiguously "the wound photo from that submission" without
 * needing to consult the DB.
 *
 * Every interpolated segment is constrained: formKind is checked against
 * FORM_KINDS by the caller, submissionId against a UUID regex, slot by
 * safeSlot() and the extension by safeExtension(). Nothing user-controlled
 * reaches the path unfiltered.
 */
export function buildStoragePath(
  formKind: FormKind,
  submissionId: string,
  slot: string,
  filename: string,
  now: Date = new Date()
): string {
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const ext = safeExtension(filename);
  const leaf = `${safeSlot(slot)}-${crypto.randomUUID()}${ext}`;
  return `${formKind}/${yyyy}/${mm}/${submissionId}/${leaf}`;
}

/**
 * Public CDN URL for a file in the `submissions` bucket.
 * Kept as one function so the URL shape lives in exactly one place.
 */
export function publicUrlFor(supabaseUrl: string, path: string): string {
  const base = supabaseUrl.replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${SUBMISSIONS_BUCKET}/${path}`;
}
