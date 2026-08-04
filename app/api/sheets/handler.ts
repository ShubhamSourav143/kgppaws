import { NextRequest, NextResponse } from "next/server";
import { persistSubmission, type SubmissionForm } from "@/lib/submissions";
import type { UploadedFile } from "@/lib/uploads";

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
 * DB row is authoritative and the sync engine reconciles later.
 */

interface SubmissionRequestBody {
  form: SubmissionForm;
  submissionId?: string;
  data: Record<string, string>;
  attachments?: UploadedFile[];
}

export async function POST(req: NextRequest) {
  let body: SubmissionRequestBody;
  try {
    body = (await req.json()) as SubmissionRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body?.form || !body?.data) {
    return NextResponse.json(
      { error: "Missing form or data" },
      { status: 400 }
    );
  }

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
