import { NextRequest, NextResponse } from "next/server";
import { submitToGoogleSheet, type SheetForm } from "@/lib/google-sheets";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const form = body.form as SheetForm;
    const data = body.data as Record<string, string>;

    if (!form || !data) {
      return NextResponse.json({ error: "Missing form or data" }, { status: 400 });
    }

    const ok = await submitToGoogleSheet({ form, data });
    if (!ok) {
      return NextResponse.json({ error: "Sheet submission failed or not configured" }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
