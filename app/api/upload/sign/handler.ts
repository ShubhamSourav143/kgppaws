import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import {
  FORM_KINDS,
  SUBMISSIONS_BUCKET,
  buildStoragePath,
  publicUrlFor,
  validateFileMeta,
  type FileSignRequest,
  type FormKind,
} from "@/lib/uploads";

/**
 * Mints one signed upload URL per attached file so the browser can PUT
 * the bytes straight to Supabase Storage — Vercel serverless functions
 * cap request bodies at 4.5 MB, but the bite report form accepts files
 * up to 8-10 MB, so routing bytes through the API is not an option.
 *
 * Every file is validated (extension, size, mime) BEFORE minting so a
 * hostile file that would be rejected at PUT time doesn't burn a
 * signed-URL slot. The submissionId is client-provided so all files
 * from one submission share a folder, and the same id is later used
 * for the DB row and the Sheet row — one identifier ties all three
 * together.
 */

interface SignRequestBody {
  formKind: FormKind;
  submissionId: string;
  files: FileSignRequest[];
}

interface SignedFile {
  slot: string;
  path: string;
  token: string;
  url: string;         // public URL, valid the moment the object exists
  filename: string;
  contentType: string;
  size: number;
}

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export async function POST(req: NextRequest) {
  const supabase = createServiceSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Storage is not configured on the server" },
      { status: 503 }
    );
  }

  let body: SignRequestBody;
  try {
    body = (await req.json()) as SignRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { formKind, submissionId, files } = body ?? {};

  if (!formKind || !FORM_KINDS.includes(formKind)) {
    return NextResponse.json({ error: "Unknown formKind" }, { status: 400 });
  }
  if (!submissionId || !isUuid(submissionId)) {
    return NextResponse.json({ error: "submissionId must be a UUID" }, { status: 400 });
  }
  if (!Array.isArray(files) || files.length === 0) {
    return NextResponse.json({ error: "files must be a non-empty array" }, { status: 400 });
  }
  if (files.length > 10) {
    return NextResponse.json({ error: "Too many files in one request" }, { status: 400 });
  }

  // Validate every file BEFORE minting anything — atomic all-or-nothing
  // so a request with one bad file doesn't leave dangling signed URLs.
  for (const file of files) {
    const err = validateFileMeta(file);
    if (err) {
      return NextResponse.json({ error: err }, { status: 400 });
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const signed: SignedFile[] = [];

  for (const file of files) {
    const path = buildStoragePath(formKind, submissionId, file.slot, file.filename);
    const { data, error } = await supabase.storage
      .from(SUBMISSIONS_BUCKET)
      .createSignedUploadUrl(path);
    if (error || !data) {
      console.error("[upload/sign] createSignedUploadUrl failed:", error?.message);
      return NextResponse.json(
        { error: "Could not create upload URL" },
        { status: 502 }
      );
    }
    signed.push({
      slot: file.slot,
      path: data.path,
      token: data.token,
      url: publicUrlFor(supabaseUrl, data.path),
      filename: file.filename,
      contentType: file.contentType,
      size: file.size,
    });
  }

  return NextResponse.json({ files: signed });
}
