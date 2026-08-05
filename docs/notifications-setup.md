# Notifications setup

Every successful form submission on kgp-paws.vercel.app can page the
volunteer team via **email** (Resend) and, for animal rescue reports
only, via **WhatsApp** (Meta Cloud API). Setup is entirely by env
vars — with none set, submissions still land in Supabase + the Sheet
and the `notification_outbox` records each channel as `skipped` with a
clear reason.

## Which forms trigger what

| Form | Email | WhatsApp |
|---|---|---|
| Animal Rescue Report (`/report`, floating widget) | ✅ | ✅ |
| Bite Incident Report (`/report/bite`) | ✅ | — |
| Adoption Request (`/adopt/apply/[slug]`) | ✅ | — |
| Volunteer Registration (`/volunteer`) | ✅ | — |

Adding a new form kind = one call to `sendNotifications({ kind,
channels, … })` from its `persist*` function in `lib/submissions.ts`.
See the existing four for the shape.

## Email (Resend)

1. Sign up at https://resend.com and add + verify your sending domain
   (or use `onboarding@resend.dev` for testing, capped to your account
   inbox).
2. Create an API key.
3. Add these env vars to Vercel Production:

   | Var | Example | Notes |
   |---|---|---|
   | `RESEND_API_KEY` | `re_XXXXXXXXXXX` | The API key |
   | `NOTIFY_FROM_EMAIL` | `KGP PAWS <notify@kgppaws.org>` | Must be on a verified domain in Resend |
   | `NOTIFY_TO_EMAILS` | `team@kgppaws.org,coord@kgppaws.org` | Comma-separated; all recipients get every notification |

4. Redeploy (empty commit).

## WhatsApp (Meta Cloud API)

Meta Cloud API is the production-grade path — free for the first 1,000
service conversations/month and covered under Meta's Terms of Service.

1. Create a **Meta Business Manager** account and a **WhatsApp Business
   Account** (WABA): https://business.facebook.com
2. In WhatsApp → API Setup, add a test phone number (or graduate to a
   verified sender). Note its **Phone Number ID** — the long number in
   the API Setup panel, NOT the human-readable phone.
3. Generate a **permanent access token**: create a **System User** in
   Business Settings → Users → System Users → Add → grant it
   `whatsapp_business_messaging` + `whatsapp_business_management` scopes
   scoped to your WABA.
4. Add these env vars to Vercel Production:

   | Var | Example | Notes |
   |---|---|---|
   | `WHATSAPP_ACCESS_TOKEN` | `EAAG…` | The system-user token |
   | `WHATSAPP_PHONE_NUMBER_ID` | `123456789012345` | From API Setup |
   | `RESCUE_WHATSAPP_TO` | `+919876543210` | The rescue coordinator's phone in E.164; will be stripped of `+` at send time |

5. **Keep the 24-hour session open**. Meta only allows free-form
   messages within 24 hours of the recipient last messaging the sender.
   For a small rescue team, the easiest keepalive is for the coordinator
   to reply "ok" to the number once a day. If the window closes, sends
   return HTTP 400 with a `re_engagement_required` error and the outbox
   row records that as the failure reason. The long-term fix is to
   create + Meta-approve a **message template** and switch the sender to
   template mode; the current code path uses free-form text, which
   works for the first send after any coordinator reply.

6. Redeploy.

## Verifying it works

After each submission the `notification_outbox` table gets one row per
channel. Query it:

```sql
select created_at, channel, template, status, last_error
from notification_outbox
order by created_at desc
limit 20;
```

- `status = 'sent'` — provider accepted the request
- `status = 'skipped'` — env var missing (see `last_error` for which)
- `status = 'failed'` — provider rejected (see `last_error` for the raw
  message; e.g. Resend's `422 Unprocessable Entity` when the from-address
  isn't on a verified domain, or Meta's `re_engagement_required`)

The submission itself never fails because notifications did — the
`notify()` helper in `lib/submissions.ts` swallows any throw and the
outbox row records what happened.
