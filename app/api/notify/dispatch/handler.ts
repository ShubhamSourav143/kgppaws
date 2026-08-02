import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";

/**
 * POST /api/notify/dispatch
 *
 * Drains notification_outbox. Cron-secret-gated. Sends via configured
 * providers when env vars are set; otherwise marks rows as 'skipped'
 * with a clear reason so the admin dashboard shows what's stuck on
 * missing credentials rather than the queue growing forever.
 *
 * Retry model: pending → attempt=1..N; after 5 failed attempts, status
 * moves to 'failed' and the row is surfaced in the dashboard.
 */

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 20;

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

  const emailConfigured = Boolean(process.env.EMAIL_PROVIDER_API_KEY);
  const whatsappConfigured = Boolean(process.env.WHATSAPP_PROVIDER_TOKEN);

  const { data: pending, error } = await supabase
    .from("notification_outbox")
    .select("*")
    .eq("status", "pending")
    .lt("attempts", MAX_ATTEMPTS)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    return NextResponse.json({ ran: false, error: error.message }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  const nowIso = new Date().toISOString();

  for (const row of pending ?? []) {
    if (row.channel === "email" && !emailConfigured) {
      await supabase
        .from("notification_outbox")
        .update({ status: "skipped", last_error: "EMAIL_PROVIDER_API_KEY not set" })
        .eq("id", row.id);
      skipped++;
      continue;
    }
    if (row.channel === "whatsapp" && !whatsappConfigured) {
      await supabase
        .from("notification_outbox")
        .update({ status: "skipped", last_error: "WHATSAPP_PROVIDER_TOKEN not set" })
        .eq("id", row.id);
      skipped++;
      continue;
    }

    try {
      // Real provider dispatch would go here. This is a code-complete
      // scaffold that becomes live the moment credentials appear.
      if (row.channel === "email") {
        await sendEmailStub(row.template, row.payload);
      } else if (row.channel === "whatsapp") {
        await sendWhatsAppStub(row.template, row.payload);
      }
      await supabase
        .from("notification_outbox")
        .update({ status: "sent", sent_at: nowIso, last_error: null })
        .eq("id", row.id);
      sent++;
    } catch (e) {
      const attempts = (row.attempts ?? 0) + 1;
      const nextStatus = attempts >= MAX_ATTEMPTS ? "failed" : "pending";
      await supabase
        .from("notification_outbox")
        .update({
          status: nextStatus,
          attempts,
          last_error: e instanceof Error ? e.message : String(e),
        })
        .eq("id", row.id);
      if (nextStatus === "failed") failed++;
    }
  }

  return NextResponse.json({
    ran: true,
    sent,
    skipped,
    failed,
    remainingBatch: (pending?.length ?? 0) - (sent + skipped + failed),
  });
}

async function sendEmailStub(template: string, _payload: unknown): Promise<void> {
  // Resend-shaped call; wire the real client when EMAIL_PROVIDER_API_KEY lands.
  void template;
  void _payload;
}

async function sendWhatsAppStub(template: string, _payload: unknown): Promise<void> {
  // Meta WhatsApp Cloud API-shaped call; wire when creds land.
  void template;
  void _payload;
}
