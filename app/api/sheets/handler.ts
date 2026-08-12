import { NextRequest, NextResponse } from "next/server";
import { persistSubmission, type SubmissionForm } from "@/lib/submissions";
import { ALLOWED_MIME_TYPES, MAX_FILE_BYTES, SUBMISSIONS_BUCKET, type UploadedFile } from "@/lib/uploads";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/api/rate-limit";

/**
 * POST /api/sheets
 *
 * Endpoint name is legacy — this is the single "submit this form"
 * entry point every public form on the site funnels through. It:
 *   1. Inserts the row into the right Supabase table (authoritative)
 *   2. Forwards the row + any uploaded-file URLs to the Google Apps
 *      Script webhook so volunteers see it in the Sheet
 *
 * A DB failure returns 500 and blocks the submit UI. A Sheet
 * forwarding failure is logged but does NOT fail the request — the
 * DB row is authoritative and the sync engine reconciles later. If
 * NEITHER sink accepts the row on a configured deployment, the request
 * fails: see durabilityError() in lib/submissions.ts.
 *
 * This endpoint is intentionally unauthenticated (anonymous bite and rescue
 * reports are a life-safety requirement) but it writes with the RLS-bypassing
 * service role, so everything it accepts is validated here rather than
 * trusted: form kind, field count and length, and — critically — attachment
 * metadata, whose `url` is rendered into the staff notification email. An
 * unvalidated URL there let an attacker put an arbitrary remote image (a
 * tracking pixel, or a phishing link behind a plausible filename) into the
 * volunteers' inbox.
 */

const FORMS: SubmissionForm[] = ["bite", "report", "volunteer", "adoption"];

/** Generous enough for the longest legitimate description, small enough to bound a row. */
const MAX_FIELDS = 40;
const MAX_FIELD_LENGTH = 5_000;
const MAX_ATTACHMENTS = 10;

/** 3 submissions per minute and 10 per hour, per IP. A real reporter never hits either. */
const BURST = { limit: 3, windowMs: 60_000 };
const SUSTAINED = { limit: 10, windowMs: 60 * 60_000 };

interface SubmissionRequestBody {
  form: SubmissionForm;
  submissionId?: string;
  data: Record<string, string>;
  attachments?: UploadedFile[];
}

function isUuid(s: unknown): s is string {
  return (
    typeof s === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
  );
}

/**
 * An attachment is only trusted if its URL is a public object URL in our own
 * submissions bucket on our own Supabase project — i.e. something
 * /api/upload/sign actually minted. Anything else is rejected outright rather
 * than sanitized, because there is no legitimate reason for a foreign URL to
 * appear here.
 */
function attachmentsError(attachments: unknown): string | null {
  if (attachments === undefined) return null;
  if (!Array.isArray(attachments)) return "attachments must be an array";
  if (attachments.length > MAX_ATTACHMENTS) return "too many attachments";

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) {
    // No configured project means no legitimate attachment URL can exist.
    return attachments.length > 0 ? "attachments are not accepted right now" : null;
  }
  const expectedPrefix = `${base.replace(/\/+$/, "")}/storage/v1/object/public/${SUBMISSIONS_BUCKET}/`;

  for (const file of attachments) {
    if (!file || typeof file !== "object") return "malformed attachment";
    const f = file as Record<string, unknown>;
    if (typeof f.url !== "string" || !f.url.startsWith(expectedPrefix)) {
      return "attachment url is not a KGP PAWS upload";
    }
    if (typeof f.path !== "string" || f.path.includes("..")) return "malformed attachment path";
    if (typeof f.filename !== "string" || f.filename.length > 260) return "malformed attachment name";
    if (typeof f.slot !== "string" || f.slot.length > 40) return "malformed attachment slot";
    if (typeof f.size !== "number" || f.size <= 0 || f.size > MAX_FILE_BYTES) {
      return "attachment size out of range";
    }
    if (
      typeof f.contentType !== "string" ||
      !ALLOWED_MIME_TYPES.includes(f.contentType as (typeof ALLOWED_MIME_TYPES)[number])
    ) {
      return "attachment type is not allowed";
    }
  }
  return null;
}

function dataError(data: unknown): string | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return "data must be an object";
  const entries = Object.entries(data as Record<string, unknown>);
  if (entries.length > MAX_FIELDS) return "too many fields";
  for (const [key, value] of entries) {
    if (typeof value !== "string") return `field '${key}' must be a string`;
    if (value.length > MAX_FIELD_LENGTH) return `field '${key}' is too long`;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const burst = rateLimit(clientKey(req, "sheets"), BURST.limit, BURST.windowMs);
  if (!burst.ok) return tooManyRequests(burst.retryAfter);
  const sustained = rateLimit(clientKey(req, "sheets:h"), SUSTAINED.limit, SUSTAINED.windowMs);
  if (!sustained.ok) return tooManyRequests(sustained.retryAfter);

  let body: SubmissionRequestBody;
  try {
    body = (await req.json()) as SubmissionRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body?.form || !FORMS.includes(body.form)) {
    return NextResponse.json({ error: "Unknown form" }, { status: 400 });
  }
  if (body.submissionId !== undefined && !isUuid(body.submissionId)) {
    return NextResponse.json({ error: "submissionId must be a UUID" }, { status: 400 });
  }

  const badData = dataError(body.data);
  if (badData) return NextResponse.json({ error: badData }, { status: 400 });

  const badAttachment = attachmentsError(body.attachments);
  if (badAttachment) return NextResponse.json({ error: badAttachment }, { status: 400 });

  const result = await persistSubmission({
    form: body.form,
    submissionId: body.submissionId,
    data: body.data,
    attachments: body.attachments,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Submission failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, code: result.code });
}
