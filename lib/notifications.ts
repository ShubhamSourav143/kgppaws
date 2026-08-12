import { createServiceSupabase } from "@/lib/supabase/server";
import type { UploadedFile } from "@/lib/uploads";

/**
 * Notification service — one entry point every form submission calls.
 *
 * Design decisions (documented so future callers understand the shape):
 *
 * 1. Sync send, not queued. The Vercel serverless function that just
 *    persisted the form calls sendNotifications() before returning. This
 *    keeps latency low and avoids needing a cron worker (Vercel Hobby's
 *    cron limits + the operational burden of another job). A future
 *    high-volume regime can switch to enqueuing into notification_outbox
 *    and draining with app/api/notify/dispatch — the outbox is already
 *    modelled and this function still writes receipts into it.
 *
 * 2. Never throws. Every provider call is wrapped; the worst outcome is
 *    a logged failure + an outbox row with status='failed'. The user's
 *    "form submission must still succeed" invariant is preserved by
 *    callers wrapping this in try/catch too, but even a bug in this
 *    module can't bubble up.
 *
 * 3. Channel choice per form. Rescue reports get email + WhatsApp
 *    (life-safety); everything else is email-only. Passed by the caller
 *    so a future form can opt in to different channels without editing
 *    this file.
 *
 * 4. Missing credentials = skipped, not failed. If RESEND_API_KEY isn't
 *    set the outbox row records status='skipped' with a clear reason,
 *    matching the pattern the /api/notify/dispatch handler already uses.
 */

export type NotificationChannel = "email" | "whatsapp";

export type NotificationKind =
  | "bite"
  | "report"
  | "adoption"
  | "volunteer";

export interface NotificationInput {
  kind: NotificationKind;
  channels: NotificationChannel[];
  /** Public code for the row (BITE-2026-…, APP-2026-…, etc). */
  code?: string;
  /** Human-readable label — e.g. "Bite Incident Report". */
  title: string;
  /** Ordered list of key/value pairs rendered as a table in the email. */
  fields: Array<{ label: string; value: string }>;
  /** Longer free-form text (e.g. "description" from the form). */
  body?: string;
  /** Files uploaded with this submission (rendered as links + previews). */
  attachments?: UploadedFile[];
  /** Optional URL for the admin dashboard row. */
  adminUrl?: string;
}

export interface NotificationOutcome {
  channel: NotificationChannel;
  status: "sent" | "failed" | "skipped";
  reason?: string;
}

/**
 * Send one channel and return its outcome, WITHOUT writing an outbox receipt.
 *
 * Split out from sendNotifications so the outbox drainer
 * (app/api/notify/dispatch) can retry an existing row using the same real
 * providers and then update that row in place — draining used to call
 * no-op stubs and mark everything 'sent', which silently lost notifications.
 *
 * Never throws.
 */
export async function sendViaChannel(
  channel: NotificationChannel,
  input: NotificationInput
): Promise<NotificationOutcome> {
  try {
    if (channel === "email") return await sendEmail(input);
    if (channel === "whatsapp") return await sendWhatsApp(input);
    return { channel, status: "skipped", reason: `unknown channel ${channel}` };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(`[notify/${channel}] threw:`, reason);
    return { channel, status: "failed", reason };
  }
}

/**
 * Send notifications for one submission. Returns per-channel outcomes.
 * Never throws; caller can log the array or ignore it.
 */
export async function sendNotifications(
  input: NotificationInput
): Promise<NotificationOutcome[]> {
  const outcomes: NotificationOutcome[] = [];

  for (const channel of input.channels) {
    const outcome = await sendViaChannel(channel, input);
    outcomes.push(outcome);
    await recordOutbox(input, outcome);
  }

  return outcomes;
}

/* ————————————————————————— email (Resend) ————————————————————————— */

async function sendEmail(input: NotificationInput): Promise<NotificationOutcome> {
  // Sanitize like the webhook URL — a BOM or trailing newline from a
  // copy-paste is invisible in the Vercel dashboard but makes Resend
  // reject the request as "API key is invalid".
  const apiKey = cleanEnv(
    process.env.RESEND_API_KEY ?? process.env.EMAIL_PROVIDER_API_KEY
  );
  const from = cleanEnv(process.env.NOTIFY_FROM_EMAIL);
  const to = parseList(process.env.NOTIFY_TO_EMAILS);

  if (!apiKey || !from || to.length === 0) {
    return {
      channel: "email",
      status: "skipped",
      reason: !apiKey
        ? "RESEND_API_KEY (or EMAIL_PROVIDER_API_KEY) not set"
        : !from
        ? "NOTIFY_FROM_EMAIL not set"
        : "NOTIFY_TO_EMAILS not set",
    };
  }

  const subject = subjectFor(input);
  const html = renderEmailHtml(input);
  const text = renderEmailText(input);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "<no body>");
    return {
      channel: "email",
      status: "failed",
      reason: `Resend ${res.status}: ${body.slice(0, 200)}`,
    };
  }

  return { channel: "email", status: "sent" };
}

/* ————————————————————————— whatsapp (Meta Cloud API) ————————————————————————— */

async function sendWhatsApp(
  input: NotificationInput
): Promise<NotificationOutcome> {
  const token = cleanEnv(
    process.env.WHATSAPP_ACCESS_TOKEN ?? process.env.WHATSAPP_PROVIDER_TOKEN
  );
  const phoneNumberId = cleanEnv(process.env.WHATSAPP_PHONE_NUMBER_ID);
  const to = normalizePhone(process.env.RESCUE_WHATSAPP_TO);

  if (!token || !phoneNumberId || !to) {
    return {
      channel: "whatsapp",
      status: "skipped",
      reason: !token
        ? "WHATSAPP_ACCESS_TOKEN not set"
        : !phoneNumberId
        ? "WHATSAPP_PHONE_NUMBER_ID not set"
        : "RESCUE_WHATSAPP_TO not set",
    };
  }

  const body = renderWhatsAppText(input);

  const res = await fetch(
    `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { preview_url: true, body },
      }),
    }
  );

  if (!res.ok) {
    const errBody = await res.text().catch(() => "<no body>");
    return {
      channel: "whatsapp",
      status: "failed",
      reason: `WhatsApp ${res.status}: ${errBody.slice(0, 300)}`,
    };
  }

  return { channel: "whatsapp", status: "sent" };
}

/* ————————————————————————— outbox receipt ————————————————————————— */

async function recordOutbox(
  input: NotificationInput,
  outcome: NotificationOutcome
): Promise<void> {
  const supabase = createServiceSupabase();
  if (!supabase) return;

  try {
    await supabase.from("notification_outbox").insert({
      channel: outcome.channel,
      template: `${input.kind}:submission`,
      payload: {
        kind: input.kind,
        code: input.code,
        title: input.title,
        fields: input.fields,
        body: input.body,
        attachments: input.attachments,
      },
      status: outcome.status,
      last_error: outcome.reason ?? null,
      sent_at: outcome.status === "sent" ? new Date().toISOString() : null,
    });
  } catch (err) {
    // Outbox is a receipt log — not persisting is undesirable but not
    // user-facing. Never let it break the caller.
    console.warn(
      "[notify] outbox write failed:",
      err instanceof Error ? err.message : err
    );
  }
}

/* ————————————————————————— content ————————————————————————— */

function subjectFor(input: NotificationInput): string {
  const codeSuffix = input.code ? ` — ${input.code}` : "";
  switch (input.kind) {
    case "bite":
      return `🚨 New Bite Incident Report${codeSuffix}`;
    case "report":
      return `🐾 New Animal Rescue Report${codeSuffix}`;
    case "adoption":
      return `🏠 New Adoption Request${codeSuffix}`;
    case "volunteer":
      return `🙌 New Volunteer Registration`;
  }
}

/** Clean, inline-styled HTML with basic KGP PAWS palette. */
function renderEmailHtml(input: NotificationInput): string {
  const rows = input.fields
    .filter((f) => f.value && f.value.trim().length > 0)
    .map(
      (f) => `
        <tr>
          <td style="padding:8px 12px 8px 0;color:#6b7280;font-size:13px;vertical-align:top;white-space:nowrap;">
            ${escapeHtml(f.label)}
          </td>
          <td style="padding:8px 0;color:#111827;font-size:14px;">
            ${escapeHtml(f.value)}
          </td>
        </tr>`
    )
    .join("");

  const bodyBlock = input.body
    ? `
    <div style="margin:20px 0 8px;padding:16px;background:#fdfaf3;border-left:3px solid #d97706;border-radius:8px;color:#1f2937;font-size:14px;line-height:1.55;white-space:pre-wrap;">
      ${escapeHtml(input.body)}
    </div>`
    : "";

  const images = (input.attachments ?? []).filter((a) =>
    a.contentType.startsWith("image/")
  );
  const others = (input.attachments ?? []).filter(
    (a) => !a.contentType.startsWith("image/")
  );

  const imageStrip =
    images.length > 0
      ? `
    <div style="margin:20px 0;">
      <p style="margin:0 0 10px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">
        Photos
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        <tr>
          ${images
            .map(
              (a) => `
            <td style="padding:0 8px 0 0;vertical-align:top;">
              <a href="${escapeAttr(a.url)}" style="text-decoration:none;">
                <img src="${escapeAttr(a.url)}" width="140" alt="${escapeAttr(
                a.slot
              )}" style="display:block;border-radius:10px;border:1px solid #e5e7eb;max-width:140px;height:auto;" />
                <p style="margin:6px 0 0;color:#6b7280;font-size:11px;text-align:center;">${escapeHtml(
                  a.slot
                )}</p>
              </a>
            </td>`
            )
            .join("")}
        </tr>
      </table>
    </div>`
      : "";

  const attachmentList =
    others.length > 0
      ? `
    <div style="margin:16px 0;">
      <p style="margin:0 0 8px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">
        Attachments
      </p>
      <ul style="margin:0;padding-left:20px;color:#111827;font-size:14px;line-height:1.6;">
        ${others
          .map(
            (a) => `
          <li>
            <a href="${escapeAttr(a.url)}" style="color:#b45309;">${escapeHtml(
              a.filename
            )}</a>
            <span style="color:#6b7280;font-size:12px;">
              (${escapeHtml(a.slot)} · ${formatBytes(a.size)})
            </span>
          </li>`
          )
          .join("")}
      </ul>
    </div>`
      : "";

  const adminLink = input.adminUrl
    ? `
    <a href="${escapeAttr(input.adminUrl)}"
       style="display:inline-block;margin-top:20px;padding:10px 20px;background:#065f46;color:#f5f0e8;text-decoration:none;border-radius:9999px;font-size:14px;font-weight:700;">
      Open in admin
    </a>`
    : "";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(subjectFor(input))}</title>
</head>
<body style="margin:0;padding:0;background:#faf6ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background:#faf6ee;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" width="600" style="max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#b45309,#d97706);padding:22px 28px;">
              <p style="margin:0;color:#fef3c7;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;">
                KGP PAWS · notification
              </p>
              <h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;line-height:1.25;font-weight:800;">
                ${escapeHtml(subjectFor(input))}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px;">
              <p style="margin:0 0 6px;color:#6b7280;font-size:13px;">
                ${escapeHtml(input.title)}${
    input.code ? ` · <strong style="color:#111827;">${escapeHtml(input.code)}</strong>` : ""
  }
              </p>
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                ${new Date().toUTCString()}
              </p>
              ${bodyBlock}
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:20px;border-collapse:collapse;">
                ${rows}
              </table>
              ${imageStrip}
              ${attachmentList}
              ${adminLink}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 22px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;color:#9ca3af;font-size:11px;line-height:1.5;">
                Automated notification from kgp-paws.vercel.app. Reply-to is not monitored — respond to the reporter directly using the contact above.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Plain-text fallback so ancient / text-only clients still get content. */
function renderEmailText(input: NotificationInput): string {
  const lines: string[] = [];
  lines.push(subjectFor(input));
  lines.push("");
  lines.push(input.title + (input.code ? ` — ${input.code}` : ""));
  lines.push(new Date().toUTCString());
  lines.push("");
  for (const f of input.fields) {
    if (!f.value?.trim()) continue;
    lines.push(`${f.label}: ${f.value}`);
  }
  if (input.body) {
    lines.push("");
    lines.push(input.body);
  }
  if (input.attachments?.length) {
    lines.push("");
    lines.push("Attachments:");
    for (const a of input.attachments) {
      lines.push(`  - ${a.slot} (${a.filename}): ${a.url}`);
    }
  }
  if (input.adminUrl) {
    lines.push("");
    lines.push(`Admin: ${input.adminUrl}`);
  }
  return lines.join("\n");
}

/** Concise text for WhatsApp — hits eye on the notification banner. */
function renderWhatsAppText(input: NotificationInput): string {
  const lines: string[] = [];
  lines.push(subjectFor(input));
  if (input.code) lines.push(`Ref: ${input.code}`);
  lines.push("");
  for (const f of input.fields) {
    if (!f.value?.trim()) continue;
    lines.push(`${f.label}: ${f.value}`);
  }
  if (input.body) {
    lines.push("");
    // WhatsApp caps message length ~4096; keep description short.
    lines.push(input.body.length > 400 ? input.body.slice(0, 400) + "…" : input.body);
  }
  const firstPhoto = (input.attachments ?? []).find((a) =>
    a.contentType.startsWith("image/")
  );
  if (firstPhoto) {
    lines.push("");
    lines.push(`Photo: ${firstPhoto.url}`);
  }
  if (input.adminUrl) lines.push(`Track: ${input.adminUrl}`);
  return lines.join("\n");
}

/* ————————————————————————— helpers ————————————————————————— */

/**
 * Strip whitespace and any stray BOM (﻿) from an env-var value. Vercel's
 * dashboard input strips a lot of things but not always the UTF-8 BOM
 * that comes with copy-paste from some editors; a leading BOM makes
 * Resend's `Authorization: Bearer …` reject the key with "API key is
 * invalid" and Meta's Graph API reject the token with an opaque 400.
 * Same trick that fixed the GOOGLE_SHEET_WEBHOOK_URL earlier.
 */
function cleanEnv(v: string | undefined): string | undefined {
  return v?.replace(/^[\s﻿]+|[\s﻿]+$/g, "") || undefined;
}

function parseList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim().replace(/^﻿/, ""))
    .filter(Boolean);
}

/** Meta expects E.164 without the leading +; accepts a +. Strip spaces. */
function normalizePhone(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.replace(/[\s()-]/g, "");
  return cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
