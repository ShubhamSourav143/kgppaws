# KGP PAWS — Deployment Guide

Living document. Last updated **2026-07-16**.

---

## 1. Current state

| | |
|---|---|
| **Hosting** | Vercel — project `kgp-paws`, team `shubhams-projects-866f85e4` |
| **Production URL** | https://kgp-paws.vercel.app |
| **Custom domain** | kgppaws.org — **not yet purchased/pointed** (BLOCKED, see TASKS.md M10) |
| **Database** | Supabase — **not yet provisioned**; app runs in demo mode (BLOCKED, M1) |
| **Deploy method used** | `vercel deploy --prod --yes` via CLI, authenticated as `shubhamsourav055-4315` |
| **Git remote** | none yet — deployed by direct file upload from local working tree, not CI/CD |

## 2. Target state (after M1/M10)

```
GitHub (main branch, protected)
  → Vercel (auto-deploy on push, preview deploys on PR)
      → Production: kgppaws.org
      → Preview: <branch>-kgp-paws.vercel.app
  Supabase (production project, migrations applied via `supabase db push`)
  Vercel Cron (sync engine, media ingest, notification outbox)
```

## 3. Environment variables

Full reference: [.env.example](../.env.example). Grouped by what unlocks:

| Variable | Unlocks | Where set |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for SEO, sitemap, QR codes | Vercel production env — currently set to `https://kgp-paws.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Live database reads/auth (vs. demo mode) | Vercel — **not yet set** |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only privileged writes (sync, notifications, QR) | Vercel (server env only) — **not yet set** |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Sheets + Drive API access for the sync/ingest engine | Vercel (server env only) — **not yet set** |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | Which spreadsheet is the CMS | Vercel — **not yet set** |
| `EMAIL_PROVIDER_API_KEY` (Resend or similar) | Email notifications | Vercel — **not yet set**, provider TBD |
| `WHATSAPP_PROVIDER_*` | WhatsApp notifications | Vercel — **not yet set**, provider TBD |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Bot protection on public forms | Vercel — **not yet set**, recommended before public launch |
| `CRON_SECRET` | Authenticates Vercel Cron → `/api/sync/*`, `/api/media/ingest`, `/api/notify/dispatch` | Vercel — set when those routes are built (M2/M3/M6) |

**Note on the removed payment scope:** `RAZORPAY_*` variables in the original `.env.example`
are obsolete per the updated spec (no payment gateway) and will be deleted from `.env.example`
in M5 alongside the donation flow rework.

## 4. Standard deploy procedure (until CI/CD is wired)

```bash
npm run build            # verify locally first — never deploy an unverified build
npx vercel deploy --prod --yes
```

`.vercelignore` excludes `node_modules`, `.next`, and `/supabase` (the SQL migrations aren't
part of the Next.js build). **Do not** add an unanchored `supabase` ignore pattern — it also
matches `lib/supabase/`, which the app imports (this broke the first deploy attempt on
2026-07-16; fixed by anchoring to `/supabase`).

## 5. Target deploy procedure (after GitHub is connected, M1)

1. Push to `main` → Vercel auto-builds and promotes to production.
2. Feature branches / PRs → Vercel preview deployment, shareable for review before merge.
3. `supabase db push` applies pending migrations to the linked Supabase project as a separate,
   explicit step (schema changes are never silently applied by the app).

## 6. Cron jobs (Vercel Cron — configured in `vercel.json`, added in M2/M3/M6)

| Job | Schedule | Route |
|---|---|---|
| Sheets ⇄ Supabase sync | `*/5 * * * *` | `POST /api/sync/run` |
| Drive media ingest | `*/15 * * * *` | `POST /api/media/ingest` |
| Notification outbox drain | `* * * * *` | `POST /api/notify/dispatch` |

All cron routes require the `x-cron-secret` header to match `CRON_SECRET` — never public.

## 7. Security & abuse protection (before public launch)

- **Turnstile** on `/report`, `/adopt/apply/*`, `/donate` confirmation — prevents scripted spam.
- **Rate limiting** on all public-write routes (IP-based token bucket at the Vercel Edge
  Middleware layer, or Vercel WAF rules).
- **Service-role key** only ever referenced in server-only files (`route.ts`, server actions) —
  never imported into a `"use client"` component; verified by code review each release.
- **RLS is the real authority** — client-side `RequireRole` guards are UX only (see
  ARCHITECTURE.md §8); a misconfigured page can never leak data because Postgres enforces it.

## 8. Monitoring & observability (M10)

- Vercel Analytics (privacy-respecting, no cookies) for traffic.
- `sync_log` + `notification_outbox` tables double as operational logs, surfaced on the admin
  dashboard's System Health panel.
- Lighthouse CI check before promoting to production (target: 100×4 — see PRD G6).

## 9. Rollback

Vercel keeps every deployment; `vercel rollback` (or promoting a prior deployment in the
dashboard) reverts the app instantly. Database migrations are the harder rollback — write every
migration with an explicit down-path or a forward-fix plan documented in the migration file
itself before it's applied to production.

## 10. External accounts checklist

See [TASKS.md §Dependency checklist](TASKS.md#dependency-checklist-blocking-items) for the full
list of credentials/access needed from the project owner before each blocked module can start.
