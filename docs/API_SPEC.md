# KGP PAWS — API Specification

Living document. Last updated **2026-07-17**. All endpoints are Next.js route handlers under
`app/api/*` unless noted. Public endpoints are rate-limited at the edge (see
[DEPLOYMENT.md](DEPLOYMENT.md)). Server-only operations use the Supabase service-role key —
**never shipped to the client**.

Status column uses the same legend as PRD.md: NOT STARTED / IN PROGRESS / COMPLETED / TESTED / BLOCKED.

> **CMS-first sync API (2026-07-17).** Section 6 has been restructured for the new job-queue-based
> sync architecture defined in [CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md). The legacy `/api/sync/run`
> endpoint is kept as a compatibility shim.

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

## 6. Sync engine (CMS-first architecture)

Full design: [CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md) §7. This section documents the API surface.

### 6.1 Job-queue endpoints (M-CMS-1)

| Route | Method | Auth | Status | Purpose |
|---|---|---|---|---|
| `POST /api/sync/enqueue` | POST | Admin session (`has_role(['admin','super_admin'])`) | NOT STARTED (M-CMS-1) | Enqueue a sync job. Body: `{ tab: string, direction: 'sheets_to_db' \| 'db_to_sheets', scope?: 'full' \| 'incremental' \| 'row', rowId?: uuid, forceFullScan?: boolean }`. Deduplicated on `(tab, direction, rowId)` — returns the existing job if one is queued/running. Returns `{ jobId: uuid, state: 'queued' \| 'already_running' }`. |
| `POST /api/sync/worker` | POST | Cron secret (`x-cron-secret`) | NOT STARTED (M-CMS-1) | Pull the next queued job and execute it end-to-end (lock, header check, validate, stage, apply, write-back, revalidate). Idempotent and reentrant — safe to call from parallel cron functions. Returns `{ ran: boolean, jobId?: uuid, state?: string, tab?: string }`. |
| `POST /api/sync/housekeeping` | POST | Cron secret (`x-cron-secret`) | NOT STARTED (M-CMS-1) | Scheduled every 1 minute. Marks jobs with expired heartbeats (>5min) as `failed`, re-enqueues retryable ones per §9 of CMS_ARCHITECTURE.md, deletes succeeded jobs older than 30 days. Returns `{ expired: N, retried: M, cleaned: K }`. |
| `POST /api/sync/resolve` | POST | Admin session | NOT STARTED (M-CMS-6) | Resolve a `sync_conflicts` row. Body: `{ conflictId: uuid, resolution: 'kept_db' \| 'kept_sheet' \| 'dismissed' }`. Applies the chosen side and clears the sync-status of the underlying row. |

### 6.2 Read endpoints (M-CMS-6, admin dashboard support)

| Route | Method | Auth | Status | Notes |
|---|---|---|---|---|
| `GET /api/sync/jobs?tab=&limit=` | GET | Admin session | NOT STARTED (M-CMS-6) | Recent jobs, optionally filtered. Consumed by `/admin/sync`. |
| `GET /api/sync/health` | GET | Admin session | NOT STARTED (M-CMS-6) | Per-tab summary: last successful sync, row count in DB vs sheet, drift flag, conflicts. |
| `GET /api/sync/conflicts` | GET | Admin session | NOT STARTED (M-CMS-6) | Open (`resolution IS NULL`) rows from `sync_conflicts`. |

### 6.3 Compatibility & deprecations

| Route | Method | Status | Notes |
|---|---|---|---|
| `POST /api/sync/run` | POST | **COMPATIBILITY SHIM** from M-CMS-1 | Existing route retained. New behavior: enqueues a `Dogs`-tab full-scan job into the new queue instead of executing sync inline. `sync_log` records `triggered_by = 'compat_shim'` on every call so we can see whether any caller (external cron, script) still hits it before removal. Not deleted; awaits owner sign-off after M-CMS-3 completes. |
| `GET /api/sync/status` | GET | KEPT (thin wrapper) from M-CMS-1 | Returns the last 20 `sync_jobs` rows in the same JSON shape it returned `sync_log` rows before, so any existing caller keeps working. Replaced by `GET /api/sync/jobs` in M-CMS-6. |

**Enqueue body — full spec:**
```jsonc
{
  "tab": "Dogs",
  "direction": "sheets_to_db",   // or "db_to_sheets"
  "scope": "incremental",         // default; other values: "full" | "row"
  "rowId": "uuid",                // required when scope='row'
  "forceFullScan": false          // admin-only escape hatch; forces mode='full' regardless of scope
}
```

**Response — 202 Accepted:**
```jsonc
{
  "jobId": "uuid",
  "state": "queued" | "already_running",
  "tab": "Dogs",
  "direction": "sheets_to_db",
  "enqueuedAt": "2026-07-17T…Z"
}
```

**Errors:**
- 400 — `{ "error": "unknown tab", "tab": "..." }` — tab not in `tab_config`.
- 400 — `{ "error": "direction not allowed for tab", "tab": "Dogs", "direction": "db_to_sheets" }` — a `sheets_to_db` tab cannot be enqueued in the reverse direction.
- 401 / 403 — auth failures.
- 503 — `{ "error": "sync disabled", "tab": "..." }` — when `tab_config.enabled = false` for the tab (kill switch).

## 7. Media ingestion (Google Drive)

| Route | Method | Status | Notes |
|---|---|---|---|
| `POST /api/media/ingest` | POST | IN PROGRESS (M3) | **Code complete, 2026-07-17** — see `app/api/media/ingest/route.ts`. Walks `Dogs/<public_id>/` subfolders under `GOOGLE_DRIVE_ROOT_FOLDER_ID`, downloads new/changed images (by `md5Checksum` vs. the last-ingested `drive_assets` row), optimizes with `sharp` (rotate/resize/strip metadata — one JPEG size, not yet the full AVIF/WebP responsive ladder), uploads to Storage, upserts `drive_assets` + `animal_photos`. `medical/`-folder files are catalogued but **deliberately not** auto-published — see code comment. **Untested against a real Drive folder.** Not cron-scheduled yet. |
| `GET /api/media/status` | GET | NOT STARTED (M3) | Reuses `/api/sync/status`'s `sync_log` rows (tagged `tab_name: 'drive_media'`) — a dedicated endpoint hasn't been built, but the data already exists. |

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
