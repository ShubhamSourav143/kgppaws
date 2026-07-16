# KGP PAWS — API Specification

Living document. Last updated **2026-07-16**. All endpoints are Next.js route handlers under
`app/api/*` unless noted. Public endpoints are rate-limited at the edge (see
[DEPLOYMENT.md](DEPLOYMENT.md)). Server-only operations use the Supabase service-role key —
**never shipped to the client**.

Status column uses the same legend as PRD.md: NOT STARTED / IN PROGRESS / COMPLETED / TESTED / BLOCKED.

---

## 1. Public read (mostly RSC direct-to-Supabase, not REST)

Most public reads happen server-side inside React Server Components via `services/*`
(`services/animals.ts`, `services/campaigns.ts`, `services/stories.ts`, `services/metrics.ts`)
— there is no public JSON API surface to keep stable for these; the seam is the `services/`
module contract, which stays: `Promise<DomainType[]>` / `Promise<DomainType | null>`, Supabase
when configured, demo data otherwise.

## 2. QR resolution

| Route | Method | Status | Notes |
|---|---|---|---|
| `/p/[token]` | GET | **TESTED** | Existing token→slug redirect. Looks up `qr_tags.token`, 307-redirects to `/animal/[slug]?via=qr`, or `/scan-not-found`. |
| `/dog/[publicId]` | GET | NOT STARTED (M4) | New canonical scan URL. Resolves `animals.public_id` directly (no token indirection needed once the ID itself is the permanent, printable identifier) → renders the profile with `?via=qr` greeting. |
| `POST /api/qr/generate` | POST | NOT STARTED (M4) | Admin-only. Body `{ animalId }` → allocates `public_id` if missing, creates `qr_tags` row, renders PNG (error-correction H) to Storage, returns `{ token, publicId, pngUrl }`. |
| `POST /api/qr/reissue` | POST | COMPLETED as UI/demo; server route NOT STARTED | Admin-only. Body `{ animalId }` → deactivates active tag, issues new token. Old printed tag stops resolving immediately. |
| `POST /api/qr/print-sheet` | POST | NOT STARTED (M4) | Admin-only. Body `{ animalIds: string[] }` → generates an A4 PDF (react-pdf), 2×4 grid, name + public ID + QR + crop marks. Returns a signed download URL. |

## 3. Rescue reports

| Route | Method | Status | Notes |
|---|---|---|---|
| `/report` (form) → `POST /api/reports` | POST | IN PROGRESS | Currently a client-side demo write (`local-store.ts`) when Supabase isn't configured; needs a real route handler that (a) validates with the existing Zod schema, (b) inserts into `rescue_reports`, (c) writes a `notification_outbox` row, (d) queues a Sheets sync. Anonymous-friendly — no auth required. Rate-limited by IP + Turnstile (see DEPLOYMENT.md). |
| `GET /api/reports/[code]` | GET | IN PROGRESS | Wraps `get_report_status(code)` SQL function — the only public read path for report status. No lat/lng, no reporter contact ever returned. |
| `PATCH /api/reports/[id]` | PATCH | NOT STARTED (M6) | Admin/volunteer only. Updates status/assignment; RLS-checked (`has_role`); appends `report_updates` row; triggers sync-to-Sheets. |

**Request body — `POST /api/reports`:**
```jsonc
{
  "animalType": "dog | cat | other",
  "problem": "injured | missing | emergency | dead | sick | unable_to_walk | bleeding | vehicle_accident | distressed | puppies_kittens_at_risk | other",
  "severity": "emergency | urgent | moderate | low",
  "zoneId": "tech-market",
  "locationNote": "string, optional",
  "description": "string, required",
  "photo": "multipart file, optional, ≤ 8MB, image/*",
  "contact": "string, optional"
}
```
**Response:** `{ "reportCode": "PAWS-RESCUE-2026-00128" }` (201) or `{ "error": string }` (4xx).

## 4. Adoption

| Route | Method | Status | Notes |
|---|---|---|---|
| `POST /api/adopt/apply` | POST | IN PROGRESS | Same pattern as reports: demo-mode client write today → route handler needed. Inserts `adoption_applications`; `internal_notes` never accepted from client input. |
| `PATCH /api/adopt/applications/[id]` | PATCH | NOT STARTED | Admin-only status/notes update. |

## 5. Donations (UPI model — see PRD §5.D, DATABASE_SCHEMA §2.3)

| Route | Method | Status | Notes |
|---|---|---|---|
| `GET /api/donate/settings` | GET | NOT STARTED (M5) | Public. Returns `site_settings` donation keys (`upi_qr_1/2`, `upi_id`, `upi_holder_name`) resolved to public Storage URLs. |
| `POST /api/donate/confirm` | POST | NOT STARTED (M5) | Public. Body below → inserts `donation_confirmations` (`status='pending'`), outbox notification, Sheets sync. **Never marks a donation verified from client input** — that's an admin action. |
| `PATCH /api/donate/confirmations/[id]` | PATCH | NOT STARTED (M5) | Admin-only. `{ status: 'approved' \| 'rejected', isPublic?: boolean }`. |
| ~~`POST /api/donate/order`~~ | — | **REMOVED from scope** | Legacy Razorpay-oriented endpoint referenced in the original README; explicitly out of scope per updated spec (no payment gateway). To be deleted in M5, not built. |

**Request body — `POST /api/donate/confirm`:**
```jsonc
{
  "campaignSlug": "simbas-recovery-fund",
  "donorName": "string, required",
  "donorEmail": "string, optional",
  "donorPhone": "string, optional",
  "amount": 500,
  "utr": "string, required — UPI transaction reference",
  "purpose": "string, optional",
  "message": "string, optional"
}
```

## 6. Google Sheets sync engine

| Route | Method | Status | Notes |
|---|---|---|---|
| `POST /api/sync/run` | POST | NOT STARTED (M2) | Cron-triggered (Vercel Cron, every 5 min) + manually triggerable from the admin dashboard. Header `x-cron-secret` required. Body `{ tabs?: string[] }` (omit = all tabs). Runs the diff/upsert/conflict logic described in ARCHITECTURE.md §6, writes a `sync_log` row, returns a summary. |
| `GET /api/sync/status` | GET | NOT STARTED (M2) | Admin-only. Last N `sync_log` rows + any rows currently `_status=CONFLICT` or `ERROR`. Powers the dashboard sync-health panel. |
| `POST /api/sync/resolve` | POST | NOT STARTED (M2) | Admin-only. Body `{ table, rowId, resolution: 'keep_sheet' | 'keep_db' }` — manually resolves a flagged conflict. |

## 7. Media ingestion (Google Drive)

| Route | Method | Status | Notes |
|---|---|---|---|
| `POST /api/media/ingest` | POST | NOT STARTED (M3) | Cron-triggered (every 15 min) + manual trigger. Lists Drive changes since last cursor, downloads new/changed files, runs the optimize pipeline (sharp: strip EXIF-GPS, resize ladder, AVIF/WebP, blurhash), uploads to Supabase Storage, upserts `drive_assets`, links to `animal_photos`/`story_media` by folder convention, revalidates affected pages. |
| `GET /api/media/status` | GET | NOT STARTED (M3) | Admin-only. Last ingest run summary, error list (e.g. unrecognized folder, corrupt file). |

## 8. Search

| Route | Method | Status | Notes |
|---|---|---|---|
| `GET /api/search?q=` | GET | NOT STARTED (M8) | Public. Postgres FTS (`tsvector`) + `pg_trgm` fuzzy + lightweight intent mapping over a `search_index` materialized view spanning dogs, blogs, static pages, FAQ, volunteer info. Medical detail rows filtered server-side by caller's role. Returns grouped, ranked results with type + snippet. |

## 9. Notifications

| Route | Method | Status | Notes |
|---|---|---|---|
| `POST /api/notify/dispatch` | POST | NOT STARTED (M6) | Cron-triggered (every 1 min). Drains `notification_outbox` (status='pending'), sends via configured Email/WhatsApp providers, updates status + `last_error`/`attempts` with backoff. |

## 10. Auth

Handled entirely by Supabase Auth client SDK (`lib/supabase/client.ts`, `AuthCard.tsx`) — no
custom auth routes. Role assignment (`user_roles` insert) is a one-time admin SQL/dashboard
action, not a public endpoint.

## 11. Conventions

- All mutating endpoints validate with **Zod** server-side (never trust client validation alone).
- All public-write endpoints (`reports`, `adopt/apply`, `donate/confirm`) are behind
  Turnstile + IP rate limiting once configured (see DEPLOYMENT.md §Security).
- Error shape is always `{ "error": string, "fields"?: Record<string,string> }`.
- Every admin-only route checks role **both** via Supabase RLS (defense-in-depth) and an
  explicit `has_role` check in the handler before doing privileged work.
