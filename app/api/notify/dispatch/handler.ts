import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { cronUnauthorized, isCronAuthorized } from "@/lib/api/cron-auth";
import {
  sendViaChannel,
  type NotificationChannel,
  type NotificationInput,
  type NotificationKind,
} from "@/lib/notifications";
import type { UploadedFile } from "@/lib/uploads";

/**
 * GET/POST /api/notify/dispatch
 *
 * Drains notification_outbox. Cron-secret-gated.
 *
 * This used to call `sendEmailStub`/`sendWhatsAppStub` — empty functions —
 * and then mark the row `sent`. Any row that reached this endpoint was
 * therefore recorded as delivered while nothing was ever sent; for the
 * rescue-report rows written by /api/reports that meant a life-safety page
 * silently disappearing. It now sends through the same providers as the
 * synchronous path in lib/notifications.ts.
 *
 * Retry model: pending → attempt=1..N; after 5 failed attempts, status
 * moves to 'failed' and the row is surfaced in the dashboard.
 */

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 20;

interface OutboxRow {
  id: string;
  channel: NotificationChannel;
  template: string;
  payload: Record<string, unknown> | null;
  attempts: number | null;
}

/**
 * Rebuild a NotificationInput from a stored row.
 *
 * Two writers use this table with different payload shapes:
 *   - lib/notifications.ts recordOutbox → { kind, code, title, fields, body, attachments }
 *   - app/api/reports/handler.ts        → { reportCode, severity, animalType, zone }
 * Both are handled so neither writer's rows are silently undeliverable.
 */
function toNotificationInput(row: OutboxRow): NotificationInput {
  const p = row.payload ?? {};
  const kindFromTemplate = row.template.split(":")[0];
  const kind = (typeof p.kind === "string" ? p.kind : kindFromTemplate) as NotificationKind;

  if (Array.isArray(p.fields)) {
    return {
      kind: (["bite", "report", "adoption", "volunteer"] as string[]).includes(kind)
        ? kind
        : "report",
      channels: [row.channel],
      code: typeof p.code === "string" ? p.code : undefined,
      title: typeof p.title === "string" ? p.title : "KGP PAWS notification",
      fields: p.fields as Array<{ label: string; value: string }>,
      body: typeof p.body === "string" ? p.body : undefined,
      attachments: Array.isArray(p.attachments) ? (p.attachments as UploadedFile[]) : undefined,
    };
  }

  // /api/reports shape.
  return {
    kind: "report",
    channels: [row.channel],
    code: typeof p.reportCode === "string" ? p.reportCode : undefined,
    title: "Animal Rescue Report",
    fields: [
      { label: "Animal", value: String(p.animalType ?? "") },
      { label: "Severity", value: String(p.severity ?? "").toUpperCase() },
      { label: "Zone", value: String(p.zone ?? "") },
    ],
  };
}

async function drain(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return cronUnauthorized();
  }

  const supabase = createServiceSupabase();
  if (!supabase) {
    return NextResponse.json(
      { ran: false, configured: false, reason: "service role not configured" },
      { status: 200 }
    );
  }

  const { data: pending, error } = await supabase
    .from("notification_outbox")
    .select("id, channel, template, payload, attempts")
    .eq("status", "pending")
    .lt("attempts", MAX_ATTEMPTS)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error("[notify/dispatch] outbox query failed:", error.message);
    return NextResponse.json({ ran: false, error: "outbox_query_failed" }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  let contended = 0;

  for (const row of (pending ?? []) as OutboxRow[]) {
    const attempts = row.attempts ?? 0;

    // Optimistic claim. The outbox status CHECK constraint has no 'sending'
    // state to move through, so the attempt counter doubles as the lease: the
    // guarded UPDATE only matches if no other overlapping run has already
    // bumped this row. Without it, two cron invocations (Vercel documents that
    // cron delivery can duplicate) would both send the same page.
    const { data: claimed } = await supabase
      .from("notification_outbox")
      .update({ attempts: attempts + 1 })
      .eq("id", row.id)
      .eq("status", "pending")
      .eq("attempts", attempts)
      .select("id")
      .maybeSingle();

    if (!claimed) {
      contended++;
      continue;
    }

    const outcome = await sendViaChannel(row.channel, toNotificationInput(row));

    if (outcome.status === "sent") {
      await supabase
        .from("notification_outbox")
        .update({ status: "sent", sent_at: new Date().toISOString(), last_error: null })
        .eq("id", row.id);
      sent++;
    } else if (outcome.status === "skipped") {
      // Missing credentials — terminal until an operator sets them, and the
      // reason is what the dashboard shows.
      await supabase
        .from("notification_outbox")
        .update({ status: "skipped", last_error: outcome.reason ?? null })
        .eq("id", row.id);
      skipped++;
    } else {
      const nextStatus = attempts + 1 >= MAX_ATTEMPTS ? "failed" : "pending";
      await supabase
        .from("notification_outbox")
        .update({ status: nextStatus, last_error: outcome.reason ?? null })
        .eq("id", row.id);
      if (nextStatus === "failed") failed++;
    }
  }

  return NextResponse.json({
    ran: true,
    considered: pending?.length ?? 0,
    sent,
    skipped,
    failed,
    contended,
  });
}

export const GET = drain;
export const POST = drain;
