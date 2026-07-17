# KGP PAWS — CMS Architecture

Authoritative design document. Last updated **2026-07-17**.

This document defines the long-term Content Management System architecture for KGP PAWS.
It is the anchor for [PRD.md](PRD.md) §5.F, [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md),
[GOOGLE_SHEETS_SCHEMA.md](GOOGLE_SHEETS_SCHEMA.md), and [API_SPEC.md](API_SPEC.md) — those
documents describe *what* is stored and *what* the API surface looks like; this document
describes *why the pieces fit together the way they do* and *what invariants must never break*.

Changes to this document require the project owner's approval before implementation.

---

## 1. Purpose

Give volunteers and administrators a **zero-code** interface for managing every piece of
website content, while keeping the production application on a database designed for scale.
The system must be reliable at 1,000× current data volumes without a rewrite.

### 1.1 Non-goals

- **Google Sheets is not the database.** No frontend code and no public API ever reads from
  Sheets. Sheets is an editing surface only.
- **Not a general two-way sync.** Every field has exactly one owning system. Bidirectional
  editing of the same field is prohibited by design.
- **No payment-gateway integration through the CMS.** Donation *confirmations* are recorded;
  actual money movement stays UPI + human verification.
- **Not a headless CMS product replacement.** We deliberately don't build features (workflow
  approvals, per-user permissions inside the sheet, rich WYSIWYG) that Google Sheets already
  provides adequately.

---

## 2. Core principles (hard rules — never violated)

| # | Principle | Consequence |
|---|---|---|
| **P1** | Supabase is the **single source of truth** for the running application. | Every route handler, every server component, every service module reads from Supabase. Never from Sheets, never from Drive. |
| **P2** | Google Sheets is the **operational CMS** — an editing surface, not a database. | The website degrades gracefully if the Sheets API is down; the website breaks if Supabase is down. |
| **P3** | Google Drive is the **media inbox** — not a CDN. | Files never leave Drive to a public visitor. They are ingested, optimized, and served from Supabase Storage. |
| **P4** | Every field has exactly **one owning system.** Content fields → Sheets. Transactional fields → Supabase. Never both. | Eliminates the class of "who edited this last" conflicts by construction, not by policy. |
| **P5** | Sync is a **job**, not a request. | Every sync is enqueued, executed by a worker, checkpointed, and auditable. Failed jobs are retried; partial jobs are rolled back. |
| **P6** | Validation is **at the boundary**, before the DB is touched. | Invalid sheet rows are flagged in-place (`_status: ERROR`) and skipped. One bad row never blocks a sync run. |
| **P7** | Everything is **auditable**. | Every row-level change carries `sync_source`, `synced_at`, `row_version`, and appends to `content_audit_log` with a diff. |

---

## 3. System overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        VOLUNTEERS + ADMINS (humans)                        │
│                                                                            │
│   edit CONTENT              upload MEDIA                                   │
│         │                        │                                         │
│         ▼                        ▼                                         │
│   ┌───────────────┐        ┌──────────────┐                                │
│   │ Google Sheets │        │ Google Drive │                                │
│   │  (KGP PAWS    │        │  (Dogs/,     │                                │
│   │   CMS xlsx)   │        │   Stories/,  │                                │
│   │               │        │   …)         │                                │
│   └───────┬───────┘        └──────┬───────┘                                │
└───────────┼───────────────────────┼────────────────────────────────────────┘
            │  Sheets → DB          │  Drive → Storage
            ▼                       ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                       SYNCHRONIZATION SERVICE                              │
│                                                                            │
│   ┌──────────────┐   ┌──────────┐   ┌──────────┐   ┌────────────────┐      │
│   │ Job enqueue  │──▶│  Worker  │──▶│Validator │──▶│ Applier (txn)  │      │
│   │ (cron + UI + │   │ (pulls   │   │ (Zod per │   │ Staging → live │      │
│   │  triggers)   │   │  next    │   │  tab)    │   │ Audit log      │      │
│   │              │   │  job)    │   │          │   │ Revalidate     │      │
│   └──────────────┘   └────┬─────┘   └────┬─────┘   └────────┬───────┘      │
│                           │              │                  │              │
│                           ▼              ▼                  ▼              │
│                    sync_jobs table   sync_conflicts    content_audit_log   │
│                                      table            table                │
└────────────────────────────────────┬───────────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                      SUPABASE (Postgres + Storage + Auth)                  │
│                                                                            │
│   ┌───────────────────────┐    ┌─────────────────────────────────┐         │
│   │ Content tables        │    │ Transactional tables            │         │
│   │  animals, stories,    │    │  adoption_applications,         │         │
│   │  content_home,        │    │  donation_confirmations,        │         │
│   │  content_faq, …       │    │  rescue_reports, …              │         │
│   │  (owned by Sheets)    │    │  (owned by app)                 │         │
│   └───────────────────────┘    └─────────────┬───────────────────┘         │
│                                              │                             │
│                                              │  AFTER INSERT trigger       │
│                                              ▼                             │
│                                     enqueues DB → Sheets job               │
└────────────────────────────────────┬───────────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                       NEXT.JS APP (Vercel)                                 │
│                                                                            │
│   Public website · Admin dashboard · Public API                            │
│   ─── reads only from Supabase ─── never from Sheets, never from Drive ──  │
└────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Data flow: content

```
Volunteer  →  Sheets tab row  →  cron/trigger  →  Sync worker
                                                       │
                                                       ▼
                                                  Validation
                                                       │
                                          ┌────────────┴────────────┐
                                          ▼                         ▼
                                     valid row               invalid row
                                          │                         │
                                          ▼                         ▼
                                Staging table              _status: "ERROR: …"
                                          │                 written back to sheet
                                          ▼                 (row skipped, run continues)
                                  Diff vs live table
                                          │
                                          ▼
                                  Transaction:
                                    - upsert live table
                                    - increment row_version
                                    - insert content_audit_log
                                          │
                                          ▼
                                  revalidatePath(affected routes)
                                          │
                                          ▼
                                  Live site updates
```

### 3.2 Data flow: transactions

```
Public visitor  →  Website form  →  Server action  →  Supabase INSERT
                                                            │
                                                            │  AFTER INSERT trigger
                                                            ▼
                                                     enqueue sync_job
                                                     (direction: db_to_sheets)
                                                            │
                                                            ▼
                                                     Sync worker
                                                            │
                                                            ▼
                                                     Append to Sheets tab
                                                     (Adoption Applications,
                                                      Donation Confirmations,
                                                      Reports, …)
                                                            │
                                                            ▼
                                                     Volunteers review in Sheets
                                                     Admins triage in dashboard
```

---

## 4. Google Sheets tab structure

**One spreadsheet:** `KGP PAWS CMS` — lives in `KGP PAWS/CMS/` in Drive.

**Eighteen editable tabs plus three reference tabs.** Full column specs live in
[GOOGLE_SHEETS_SCHEMA.md](GOOGLE_SHEETS_SCHEMA.md). This document groups them by **category**,
which drives ownership, cadence, and archival policy per §4.5.

### 4.1 Tab categories

Every tab belongs to exactly one of three categories. Category determines default sync behavior,
ownership direction, expected update frequency, and archival strategy.

| Category | What it holds | Sync direction | Ownership |
|---|---|---|---|
| **Content** | The words and images on public/marketing pages. Homepage copy, page-level copy on `/adopt`, `/donate`, `/help`, blog posts, navigation, footer, FAQ. Volunteer-edited frequently. | Sheets → Supabase | Sheets is source of truth |
| **Master Data** | Foundational reference entities other tables point to. The animal directory, the volunteer directory, donation campaigns, global settings, dropdown reference lists. Change infrequently but critically. | Sheets → Supabase | Sheets is source of truth |
| **Transaction Data** | Timestamped events. Two subtypes distinguished by *who submits*:<br>**a) Volunteer-submitted events** (medical history, vaccination, sterilization) — Sheets is source of truth; volunteers record events they observed.<br>**b) Public-submitted events** (adoption applications, donation confirmations, rescue reports) — Supabase is source of truth; public visitors submit via web forms. | (a) Sheets → Supabase<br>(b) Supabase → Sheets | (a) Sheets<br>(b) Supabase (workflow fields dual-owned per §6.3) |

### 4.2 Content tabs (nine)

| Tab | Purpose | Primary DB table(s) | Cadence |
|---|---|---|---|
| **Home** | Hero copy, mission, featured sections, testimonials, homepage stats, sponsor list | `content_home` | Weekly |
| **Adoption** | Adopt-page copy: intro, categories, instructions, FAQs, success stories | `content_adoption` | Monthly |
| **Donate** | Donation-page copy (intro, transparency section, thank-you). Campaign rows live in Master Data. | `content_donate` | Monthly |
| **Stories** | Blog posts — markdown body, cover image, SEO fields | `stories` | Weekly |
| **Help** | Volunteer opportunities, foster info, emergency help, contact cards, how-to-help sections | `content_help` | Monthly |
| **Events** | Upcoming events — feeding drives, camps, fundraisers | `content_events` | Weekly |
| **FAQ** | Q&A pairs with categories and display order | `content_faq` | Monthly |
| **Navigation** | Every menu item — label, URL, icon, order, visible flag | `content_navigation` | Rarely |
| **Footer** | Social links, contact info, quick links, copyright | `content_footer` | Rarely |

### 4.3 Master Data tabs (four editable + three reference)

**Editable:**

| Tab | Purpose | Primary DB table(s) | Cadence |
|---|---|---|---|
| **Dogs** | Animal directory — one row per animal. Media auto-discovered from Drive. | `animals` (+ `animal_photos` via Drive) | Weekly (new arrivals, status changes) |
| **Volunteers** | Volunteer directory (public-facing) — name, role, contact, photo, responsibilities | `volunteer_directory` | Rarely |
| **Donate — Campaigns** *(sub-tab of Donate; see [GOOGLE_SHEETS_SCHEMA.md](GOOGLE_SHEETS_SCHEMA.md))* | Donation campaigns: name, description, goal, QR image, UPI ID, holder name | `donation_campaigns` | Monthly |
| **Website Settings** | Global settings — name, logo, SEO, analytics IDs, theme, announcement banner, emergency contact | `content_settings` | Rarely |

**Reference (admin-only, dropdown sources):**

| Tab | Purpose |
|---|---|
| **Reference — Zones** | Campus zones. Powers `Dogs.Zone` and `Reports.Zone` dropdowns. |
| **Reference — Categories** | Blog categories, report categories, event types. |
| **Reference — Statuses** | Adoption statuses, donation statuses, report statuses. |

Reference tabs are read-only for volunteers and edited only by admins when the underlying enum
changes in Postgres (which is a schema migration, not a CMS update).

### 4.4 Transaction Data tabs (six)

**Volunteer-submitted (Sheets → Supabase):**

| Tab | Source table | Cadence |
|---|---|---|
| **Medical History** | `animal_medical_events` | Daily (volunteers log observations) |
| **Vaccination** | `animal_vaccinations` | Weekly (during drives) |
| **Sterilization** | `animal_sterilizations` | Weekly (during camps) |

**Public-submitted (Supabase → Sheets):**

| Tab | Source table | Cadence | Workflow fields (Sheets-editable) |
|---|---|---|---|
| **Adoption Applications** | `adoption_applications` | Continuous (public form) | `Status`, `Meet At`, `Internal Notes` |
| **Donation Confirmations** | `donation_confirmations` | Continuous | `Status`, `Show Publicly` |
| **Reports** | `rescue_reports` | Continuous | `Status`, `Assigned Volunteer`, `Linked Dog Public ID` |

For public-submitted tabs, everything except workflow fields is locked (protected ranges).
Applicant name, donor UTR, report photo are never mutable in Sheets.

### 4.5 Archival policy (per-tab, configurable)

Every tab declares an **archival policy** in `tab_config` (see [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) §4.2).
The policy controls *which rows the sync engine keeps in the primary sheet range* — archived rows
stay in Supabase forever but are removed from the sheet's active view to keep it manageable.

Policies are declarative data; changing a policy for a tab does **not** require touching the sync
engine. Available policy kinds:

| Kind | Config | When it fires | Example |
|---|---|---|---|
| `none` | — | Never archives. All rows stay in the sheet forever. | Website Settings, Navigation, Footer — small, stable tabs. |
| `status_based` | `{ archive_when: <expr> }` | A row is archived when the predicate is true. Predicate operates on DB columns. | Reports: `{ archive_when: "status = 'resolved' AND updated_at < now() - interval '30 days'" }` — resolved reports leave the sheet after 30 days. |
| `time_window` | `{ column: <col>, keep: <interval> }` | Only rows where `<col>` is within `<interval>` of now stay in the sheet. | Medical History: `{ column: 'event_date', keep: '2 years' }` — the sheet always shows events from the last two years. |
| `size_threshold` | `{ order_by: <col>, keep_newest: <n> }` | The `n` most recent rows (by `<col>`) stay in the sheet. | Donation Confirmations: `{ order_by: 'submitted_at', keep_newest: 500 }`. |
| `manual` | — | Nothing is archived automatically. Admin flags rows as `archived = true` via the dashboard. | Any tab where policy is still being figured out. |

**Archived rows in the DB.** Archived rows carry an `archived_at timestamptz` column. All frontend
queries filter `archived_at is null` by default. Admin views can toggle inclusion. The sync engine
excludes archived rows from full-sync reads.

**Un-archiving.** An admin can un-archive any row via the dashboard, which clears `archived_at`
and enqueues a single-row sync back into the sheet.

**Rationale.** This design avoids hardcoding decisions like "split into a new tab every year".
Different tabs will need different strategies as the platform grows; the archival kind is a
config value, so tuning it is a one-row update, not a code change.

### 4.6 System columns (present on every tab)

Every editable tab carries the same **eight** system columns, in a fixed order at the leftmost
positions. They provide volunteers with immediate, in-line visibility into sync state and errors.

| # | Column | Sheet type | Purpose |
|---|---|---|---|
| 1 | `_id` | text | Stable row ID (UUID). Assigned by the engine on first sync. |
| 2 | `_public_id` | text | Human-typeable public ID where one exists (`DOG00023`, story `slug`, campaign `slug`). Blank for tabs with no natural public ID. Assigned by the engine; read-only. |
| 3 | `_row_version` | number | Monotonically increasing integer. Incremented on every write. Used for conflict detection (see §6.3). |
| 4 | `_sync_status` | text | `OK` (blank cell) / `PENDING` (edited, awaiting next sync) / `ERROR` (validation failed) / `CONFLICT` (concurrent edit detected). |
| 5 | `_last_synced` | timestamp | ISO timestamp of last successful sync for this row. |
| 6 | `_last_error` | text | Human-readable message when `_sync_status = ERROR`. Blank otherwise. |
| 7 | `_updated_at` | timestamp | ISO timestamp of the last write to this row (either side). Drives incremental sync (see §7.1). |
| 8 | `_sync_source` | text | Which side originated the last write: `sheets` \| `app` \| `trigger` \| `system`. |

All eight are **protected ranges** in Sheets — only the service account can write to them.
Attempting to edit produces a Sheets UI warning and the write is rejected.

**Note on `Active`.** The `Active` column is *no longer* a system column — it is a normal
user-editable column, present only on tabs where volunteer-driven soft-delete makes sense:

- ✅ **Content tabs** (Home, Adoption, Donate, Stories, Help, Events, FAQ, Navigation, Footer) —
  volunteers may soft-delete a section, story, event, menu item, etc.
- ✅ **Master Data tabs with row-per-entity semantics** (Dogs, Volunteers, Donate — Campaigns) —
  soft-delete retires an animal from the public site, hides a volunteer bio, etc.
- ❌ **Website Settings** — key/value pairs; setting a key to inactive means removing it, so
  `Active` would be redundant.
- ✅ **Volunteer-submitted Transaction Data** (Medical History, Vaccination, Sterilization) —
  volunteers may need to soft-delete a mistakenly-entered event; the row stays in the DB for
  audit but stops appearing on the timeline.
- ❌ **Public-submitted Transaction Data** (Adoption Applications, Donation Confirmations,
  Reports) — public writes are the source of truth; soft-deletion via Sheets would let a
  volunteer erase a submitted report, which is not appropriate. Workflow status handles the
  "resolved / rejected / archived" cases instead.

Setting `Active = FALSE` (where present) is the volunteer soft-delete gesture; the engine never
hard-deletes either side.

---

## 5. Database mapping

Each Sheets tab maps to one or more Supabase tables. This table is the contract — if it
changes, both the sync engine and the Sheets header row must change together.

### 5.1 Content tables

| Sheets tab | DB table | Notes |
|---|---|---|
| Home | `content_home` | Single-row-per-section table keyed by `section` enum (`hero`, `mission`, `stats`, `featured`, `testimonials`, `sponsors`, `videos`). JSONB `content` column per section — schema-validated per section type. |
| Dogs | `animals` | Existing table (migration 0001). Media URLs are **never** stored here — the frontend joins `animals ⨝ animal_photos` at render time. |
| Medical History | `animal_medical_events` | Existing table. `event_type` restricted to the enum in migration 0001. |
| Vaccination | `animal_vaccinations` | **New table** (migration 0006). One row per vaccine dose. Fields: `vaccine`, `date_given`, `next_due`, `administered_by`, `notes`. |
| Sterilization | `animal_sterilizations` | **New table** (migration 0006). One row per procedure. Fields: `date`, `procedure`, `clinic`, `vet`, `recovery_notes`. |
| Adoption | `content_adoption` | **New table** (migration 0006). Categories, instructions, FAQs, success-story references. |
| Donate | `donation_campaigns` + `content_donate` | Campaigns table (existing) + page-level copy (new). Campaign QR images are Drive file IDs → resolved to Supabase Storage URLs at ingest time. |
| Stories | `stories` | Existing table. Markdown body stored in `blocks jsonb` as a single `markdown` block during sync (parsed to rich blocks at render time). |
| Volunteers | `volunteer_directory` | **New table** (migration 0006). Public-facing directory. Distinct from `volunteers` (which is the applicant/roster table, transactional). |
| Help | `content_help` | **New table**. Sections: opportunities, foster info, emergency help, contact cards. |
| Events | `content_events` | **New table**. `starts_at`, `ends_at`, `location`, `type`, `body`. |
| FAQ | `content_faq` | **New table**. `category`, `question`, `answer`, `display_order`. |
| Navigation | `content_navigation` | **New table**. `label`, `url`, `icon`, `display_order`, `visible`, `parent_id` (for submenus). |
| Footer | `content_footer` | **New table**. Sections: `social_links`, `contact`, `quick_links`, `copyright`. |
| Website Settings | `content_settings` | Rename of existing `site_settings`. Key/value with typed JSONB value column. |

### 5.2 Transactional tables

| Sheets tab | DB table | Notes |
|---|---|---|
| Adoption Applications | `adoption_applications` | Existing table. Sync appends new rows to Sheets on insert; Sheets `Status` column syncs back to DB. |
| Donation Confirmations | `donation_confirmations` | Existing table (planned in migration 0002; created in migration 0006). |
| Reports | `rescue_reports` | Existing table. Lat/lng deliberately excluded from Sheets — server-side only. |

### 5.3 Sync infrastructure

| Table | Purpose | Migration |
|---|---|---|
| `sync_jobs` | Job queue. State machine: `queued → running → succeeded | failed | conflict`. | 0006 |
| `sync_conflicts` | Rows where sheet `_row_version` < DB `row_version`. Admin resolves in dashboard. | 0006 |
| `content_audit_log` | Immutable per-row diff log. `table_name`, `row_id`, `field`, `old_value`, `new_value`, `source`, `actor`, `at`. | 0006 |
| `stg_<tab>` | Staging mirrors for atomic apply. One per content tab. | 0006 |
| `sync_log` | Per-run summary (existing, migration 0002). Kept; expanded with `job_id` FK. | 0002 → 0006 |
| `drive_assets` | Drive file → Storage path tracking (existing, migration 0002). Kept as-is. | 0002 |

---

## 6. Ownership rules

The most important design invariant. Ownership is defined **per field**, not per table.

### 6.1 Content fields — Sheets owns

Every field in a content tab is Sheets-owned unless explicitly marked otherwise. The admin
dashboard displays these fields as **read-only** with a "Edit in Sheets" link.

Example: `animals.name` is Sheets-owned. The admin dashboard shows the name; changing it
requires editing the Dogs tab in Sheets.

### 6.2 Transactional fields — Supabase owns

Fields written by the public website (applicant name, donor UTR, report photo) are Supabase-
owned. Sheets can display them but never modify them. The Sheets header row marks these columns
with a lock icon and a protected-range rule (service-account-only edit).

Example: `adoption_applications.applicant_name` is Supabase-owned. Volunteers see it in the
Sheet but cannot change it.

### 6.3 Workflow fields — dual-owned by explicit design

A small, enumerated set of workflow fields on transactional rows are editable in Sheets *and*
in the dashboard. Ownership is resolved by **last-write-wins with row_version comparison**.
These are the only fields where two-way editing is permitted:

| Table | Workflow fields | Rationale |
|---|---|---|
| `adoption_applications` | `status`, `internal_notes` (staff-only), `meet_at` | Volunteers commonly triage in Sheets. |
| `donation_confirmations` | `status`, `is_public`, `approved_by` | Admin approves in either UI. |
| `rescue_reports` | `status`, `assigned_volunteer_id`, `linked_animal_id` | Same. |

For workflow fields:
- If the sheet `_row_version` matches the DB `row_version` → apply the sheet change, increment
  `row_version`, log to `content_audit_log`.
- If they diverge → mark `_status: CONFLICT` in the sheet, write both payloads to
  `sync_conflicts`, do not apply. Admin resolves via dashboard.

### 6.4 System fields — sync engine owns

`_id`, `_row_version`, `_synced_at`, `_status` on every tab. `public_id` on Dogs. Protected
ranges in Sheets; no user role can edit them.

### 6.5 Ownership summary

```
┌──────────────────┬────────────┬──────────────┬──────────────┐
│ Field type       │ Sheets can │ Dashboard    │ Public forms │
│                  │ edit?      │ can edit?    │ can write?   │
├──────────────────┼────────────┼──────────────┼──────────────┤
│ Content          │    Yes     │      No      │      No      │
│ Transactional    │    No      │      No      │     Yes      │
│ Workflow         │    Yes     │     Yes      │      No      │
│ System           │    No      │      No      │      No      │
└──────────────────┴────────────┴──────────────┴──────────────┘
```

---

## 7. Synchronization flow

### 7.1 Sync mode: incremental by default

Every sync job runs **incremental by default**, from the very first release. Full-scan mode
exists only as a fallback for two cases: (a) initial bootstrap when `_updated_at` is not yet
populated for any row, and (b) explicit admin request via the dashboard ("Force full re-sync").

**How incremental sync works:**

1. The worker reads the target tab's **`_updated_at`** column *only* (single-column `values.get`
   request — cheap even for large tabs).
2. Compares each row's sheet `_updated_at` against the DB's `last_synced_at` for that
   `sheet_row_id`. Rows where `sheet_updated_at > db_last_synced_at` are the candidate set.
3. The full row values are then fetched for **only the candidate set** (batched via
   `values.batchGet` on individual row ranges).
4. Validation, staging, apply, audit, and write-back proceed exactly as in full mode, but on the
   candidate set only.

This means a 5,000-row Dogs tab where 3 rows changed since the last sync only reads ~5,000
timestamp cells and 3 full rows — a ~100× read reduction vs. full-scan. Design decision: this
optimization is worth having on day one, because it's not just a scale story — it also
substantially reduces Sheets API quota pressure and worker latency at any size.

**When incremental cannot be used:**

- First sync of a tab (no rows have `_updated_at` yet) → full-scan bootstrap.
- Header schema changed → full-scan required to re-validate every row against the new schema.
- Admin-requested "Force full re-sync" → full-scan.
- Housekeeping cron once every 24 hours → full-scan sweep as a safety net against missed edits.

### 7.2 Triggers (what enqueues a sync job)

| Trigger | Direction | Mode | Cadence |
|---|---|---|---|
| Vercel Cron — per-tab | `sheets_to_db` | Incremental | Every 10 minutes |
| Vercel Cron — safety sweep | `sheets_to_db` | Full-scan | Every 24 hours (2 AM local) |
| Vercel Cron | `drive_to_storage` | (n/a — checksum diff) | Every 15 minutes |
| Admin "Sync Now" per tab | `sheets_to_db` | Incremental | On demand |
| Admin "Sync Now" per row | `sheets_to_db` | Single-row | On demand |
| Admin "Force Full Re-sync" | `sheets_to_db` | Full-scan | On demand |
| Postgres `AFTER INSERT` on transactional tables | `db_to_sheets` | Single-row append | Immediate (enqueue) |
| Postgres `AFTER UPDATE` on workflow fields | `db_to_sheets` | Single-row update | Immediate (enqueue) |
| Google Apps Script `onEdit` webhook (optional, Phase 2) | `sheets_to_db` | Single-row | Immediate (best-effort; cron remains the floor) |

**Deduplication.** If a job for `(tab, direction, row_id?)` is already queued or running, a new
identical enqueue is a no-op. The queue never grows unbounded from repeated triggers.

### 7.3 Worker execution (Sheets → DB, per tab, incremental)

```
 1. LOCK the tab (Postgres advisory lock on hashtext('sync:tab:<name>')) — prevents concurrent
    workers from applying to the same tab. TTL 5 minutes via heartbeat.

 2. HEADER CHECK — read the header row (values.get on A1:<last_col>1). Compare against the
    tab's expected header spec. Mismatch → abort with `header_mismatch`, no rows touched.

 3. INCREMENTAL SCAN (if mode = incremental and any row has _updated_at populated):
      a. Read the _updated_at column only (values.get on the single column range).
      b. Read the _id column only.
      c. Compute candidate set: rows where sheet _updated_at > DB last_synced_at for the
         matching _id, OR sheet _id is blank (new row).
      d. If candidate set is empty → skip to step 10 (nothing to do; still a successful run).
      e. Read full row values for the candidate set via values.batchGet on individual ranges.
    FULL-SCAN SCAN (otherwise): read the full tab range in a single values.get.

 4. VALIDATE candidate rows in-memory with the tab's Zod schema.
      - Valid rows → staging batch.
      - Invalid rows → error batch (skipped; will write _sync_status=ERROR + _last_error at step 8).

 5. LOAD staging table (stg_<tab>). TRUNCATE + bulk INSERT the batch. No triggers, no FKs on
    staging — it's a pure landing zone.

 6. DIFF against live table by _id:
      - New rows (staging._id not in live, or blank _id → will assign UUID).
      - Modified rows:
          * staging._row_version == live.row_version and content differs → APPLY.
          * staging._row_version <  live.row_version → CONFLICT (someone edited DB-side since
            last sync). Write to sync_conflicts; mark _sync_status=CONFLICT; skip.
          * staging._row_version >  live.row_version → impossible; log defensively + skip.
      - Soft-deleted rows (live has is_active=true, sheet Active=FALSE) → set is_active=false in live.

 7. APPLY in a single transaction:
      - UPSERT changed rows to live table.
      - Increment row_version on every updated row.
      - Set last_synced_at = now(), sync_source = 'sheets' on every updated row.
      - INSERT diff rows to content_audit_log (one row per changed field).
      - COMMIT.
    Any exception rolls back the entire transaction. sync_job → 'failed', retry queued.

 8. WRITE BACK to sheet (values.batchUpdate — one API call, all changes batched):
      - System columns (_id, _public_id, _row_version, _last_synced, _updated_at, _sync_source)
        for successfully applied rows.
      - _sync_status = 'OK', _last_error = '' for successfully applied rows.
      - _sync_status = 'ERROR', _last_error = '<message>' for invalid rows.
      - _sync_status = 'CONFLICT', _last_error = '<explanation>' for conflicted rows.

 9. REVALIDATE affected Next.js routes via revalidatePath (declared per tab in the tab config).

10. UPDATE sync_job → 'succeeded' with per-row counts. INSERT sync_log summary row.

11. RELEASE lock.
```

### 7.4 Worker execution (DB → Sheets, single row)

```
1. FETCH sync_job payload (row_id, table, event: 'insert' | 'update').

2. FETCH current row from DB.

3. APPLY per-table allowlist — only fields in the tab's DB → Sheets allowlist are written to
   the sheet (see §11.4). Precise lat/lng, reporter phone, applicant email are filtered out here.

4. LOOK UP `_id` in the sheet by row_id (via _id column). If not present (insert case):
      APPEND new row to the sheet with the allowlisted values.
   Otherwise (update case):
      UPDATE existing row in place by row range (values.update on the matched range).

5. WRITE system columns:
      - _row_version = DB row_version
      - _last_synced = now, _updated_at = row's DB updated_at
      - _sync_source = 'app' or 'trigger'
      - _sync_status = 'OK', _last_error = ''

6. UPDATE sync_job → 'succeeded'.
```

### 7.5 Rollback semantics

- **Row-level:** a validation failure on one row does not affect other rows in the same run.
  The failed row is marked `_sync_status: ERROR` with the reason in `_last_error`, everything
  else proceeds.
- **Batch-level:** if the `APPLY` transaction fails (constraint violation, deadlock, etc.),
  the entire batch is rolled back. The staging table is preserved for the retry attempt so the
  sheet is not re-read.
- **Job-level:** if the worker crashes mid-run, the job stays `running` until its heartbeat
  expires (TTL 5 minutes), then a housekeeping cron marks it `failed` and enqueues a retry.

---

## 8. Validation & error handling

### 8.1 Validation layers

| Layer | What it checks | Failure mode |
|---|---|---|
| **1. Sheet header check** | Header row matches the tab's expected columns (order and names). | Whole run aborts. `sync_job → failed` with `header_mismatch`. Admin alerted. |
| **2. Row-level Zod schema** | Every cell parses to the expected type; required fields present; enums match; FK references resolvable. | Row skipped. `_status: ERROR: <field>: <reason>` written to sheet. Run continues. |
| **3. DB constraint check** | UNIQUE, CHECK, FK constraints in Postgres. | Row skipped. `_status: ERROR: DB constraint violated: <constraint>`. Run continues. |
| **4. Post-apply invariant check** | Cross-row invariants (e.g. exactly one home hero row; navigation display_order is unique). | Whole batch rolls back. `sync_job → failed` with `invariant_violation`. Admin alerted. |

### 8.2 Error surface

| Where | What appears | Who sees it |
|---|---|---|
| Sheet `_status` column | Per-row error message, or blank | Volunteer editing the row |
| Admin dashboard `/admin/sync` | Recent job list with status + counts | Admin |
| `sync_jobs.error` JSONB | Per-job error details | Admin (deep inspection) |
| `sync_conflicts` table | Rows needing manual conflict resolution | Admin |
| Email/Slack alert (Phase 2) | Batch-level failures (`invariant_violation`, `header_mismatch`) | Admin's notification channel |

### 8.3 Common failure examples

| Cause | Where it surfaces | User-visible message |
|---|---|---|
| Volunteer types "yeah" in a boolean cell | Sheet `_status` on that row | `ERROR: Vaccinated: expected TRUE/FALSE, got "yeah"` |
| Volunteer references a non-existent `Dog Public ID` in Medical History | Sheet `_status` on that row | `ERROR: Dog Public ID DOG99999 not found` |
| Two rows with the same `Public ID` | Sheet `_status` on both rows | `ERROR: duplicate Public ID (also on row 47)` |
| Volunteer accidentally deletes the header row | Whole run aborts | Admin dashboard: `header_mismatch: expected 27 columns, got 0` |
| Volunteer renames "Name" column to "Full Name" | Whole run aborts | Admin dashboard: `header_mismatch: unknown column 'Full Name'` |
| DB is unreachable | Whole run aborts | Admin dashboard: `db_unreachable`. Job retried. |

---

## 9. Retry strategy

### 9.1 Retry classifications

| Error class | Retryable? | Strategy |
|---|---|---|
| Sheets API 5xx / network timeout | Yes | Exponential backoff: 30s, 2min, 10min, 1hr. Max 4 attempts. |
| Sheets API 429 (rate limit) | Yes | Honor `Retry-After` header. |
| DB deadlock (40P01) | Yes | Immediate retry, max 3 attempts. |
| DB constraint violation | No | Marked `failed`. Not retried. |
| Zod validation failure | No | Row skipped, `_status: ERROR`. Not retried until human edits row. |
| `header_mismatch` | No | Whole run failed. Admin must fix the sheet. |
| `invariant_violation` | No | Whole run failed. Admin must reconcile the sheet. |
| Worker crash (heartbeat expired) | Yes | Housekeeping cron re-enqueues, up to 3 attempts. |

### 9.2 Retry state on `sync_jobs`

```sql
sync_jobs (
  id            uuid PK,
  tab           text,             -- 'Dogs' | 'Medical History' | …
  direction     text,             -- 'sheets_to_db' | 'db_to_sheets'
  scope         text,             -- 'full' | 'row'
  row_id        uuid,             -- populated when scope='row'
  state         text,             -- 'queued' | 'running' | 'succeeded' | 'failed' | 'conflict'
  attempt       int default 1,
  max_attempts  int default 4,
  next_run_at   timestamptz,      -- when the next retry is due (null if terminal)
  last_error    jsonb,
  heartbeat_at  timestamptz,      -- worker's last liveness signal (5-min TTL)
  enqueued_at   timestamptz,
  started_at    timestamptz,
  finished_at   timestamptz,
  triggered_by  text,             -- 'cron' | 'admin' | 'trigger' | 'apps_script'
  actor_id      uuid              -- when triggered_by = 'admin'
);
```

### 9.3 Dead-letter policy

After `max_attempts` failed attempts, the job stays `failed` and appears in the admin dashboard's
"Needs attention" panel. Requeuing requires an admin action ("Retry" button). No infinite retry.

---

## 10. Audit logging

### 10.1 `content_audit_log` schema

```sql
content_audit_log (
  id            bigserial PK,
  at            timestamptz default now(),
  sync_job_id   uuid references sync_jobs(id),
  table_name    text not null,
  row_id        uuid not null,
  operation     text not null,       -- 'insert' | 'update' | 'soft_delete'
  source        text not null,       -- 'sheets' | 'app' | 'trigger'
  actor         text,                -- 'sheets:volunteer@example.com' | 'admin:<user_id>' | 'system'
  diff          jsonb not null       -- { field: { old: <value>, new: <value> } } for updates
);

create index on content_audit_log (table_name, row_id, at desc);
create index on content_audit_log (at desc);
```

**Immutability.** The table has RLS `for update using (false)` and `for delete using (false)` —
even the service role cannot modify or delete rows. This is enforced at the DB layer, not
policy.

### 10.2 What every entry answers

- Who changed this row? (`actor`)
- When? (`at`)
- What was the previous value of every changed field? (`diff.old`)
- What is the new value? (`diff.new`)
- Which sync run did it? (`sync_job_id`)
- Which side originated the change? (`source`)

### 10.3 Retention

Content audit log is retained **forever**. It is small (only diffs, not full rows), append-only,
and compresses well. Postgres partitioning by month is used once the table exceeds 100M rows
(estimated: never at current growth; Phase 3 concern).

---

## 11. Security model

### 11.1 Service account (Google)

- One Google Cloud service account for KGP PAWS: `sync@kgp-paws.iam.gserviceaccount.com` (name
  is illustrative). Scopes: **Sheets** (read + write), **Drive** (read only — never write to Drive).
- Service account is granted **Editor** on the spreadsheet, **Viewer** on the Drive folders.
- Private key stored in Vercel env var `GOOGLE_SERVICE_ACCOUNT_JSON`. Never in git.
- Key rotation: every 90 days, or immediately on any suspected exposure. Documented runbook in
  [DEPLOYMENT.md](DEPLOYMENT.md).

### 11.2 Cron secret

- All sync API routes gated by `x-cron-secret` header check. Value in Vercel env var
  `CRON_SECRET`. Rotated on the same schedule as the service account key.
- The admin dashboard's "Sync Now" button hits an *authenticated* route (not cron-secret-gated),
  which then enqueues the job. The admin never sees the cron secret.

### 11.3 Row-Level Security

All new content and sync tables have RLS enabled:

| Table | Anon read | Authenticated read | Admin read/write | Service role |
|---|---|---|---|---|
| `content_home`, `content_help`, `content_events`, `content_adoption`, `content_faq`, `content_navigation`, `content_footer`, `content_settings` | Yes (public content) | Yes | Yes | Yes |
| `content_donate` | Yes | Yes | Yes | Yes |
| `volunteer_directory` | Yes | Yes | Yes | Yes |
| `animal_vaccinations`, `animal_sterilizations` | Yes (via public-safe view) | Yes | Yes | Yes |
| `sync_jobs`, `sync_conflicts`, `sync_log` | No | No | Read only | Yes |
| `content_audit_log` | No | No | Read only | Insert only |
| `stg_*` staging tables | No | No | No | Yes only |

Public content is world-readable because the whole point is that it renders on the public site.
"Public read" is not a privacy leak; it is the intended behavior. Only sync infrastructure and
audit tables are role-restricted.

### 11.4 Column-level privacy on transactional tabs

Fields marked private in the current schema (`rescue_reports.lat`, `rescue_reports.lng`,
`rescue_reports.reporter_contact`, `donation_confirmations.donor_phone`,
`adoption_applications.internal_notes`) are **never written to Sheets by the sync engine**.
The DB → Sheets writer maintains an explicit allowlist per table.

### 11.5 Service-account audit trail

Every Sheets API call the worker makes is logged with the tab name, range, direction, and
timestamp. Retention: 30 days in `sync_log`; forever in `content_audit_log` for row-level changes.

---

## 12. Media pipeline (Google Drive)

Media handling is a first-class part of the CMS but is architecturally separate from row sync
because the invariants are different (idempotent by checksum, not by version; large-object
handling, not row-level diff).

### 12.1 Drive folder convention

```
KGP PAWS/
├── CMS/
│     KGP PAWS CMS.xlsx        ← the spreadsheet
│
├── Dogs/                       ← GOOGLE_DRIVE_DOGS_FOLDER_ID
│   ├── DOG00001/
│   │   ├── cover.jpg           ← exactly one cover.*, sort_order 0
│   │   ├── gallery/
│   │   │   ├── 1.jpg
│   │   │   ├── 2.jpg
│   │   │   └── 3.jpg
│   │   └── medical/
│   │       ├── vaccination-report.pdf
│   │       └── treatment.jpg   ← NOT auto-published (see §12.4)
│   ├── DOG00002/
│   └── DOG00003/
│
├── Stories/                    ← GOOGLE_DRIVE_STORIES_FOLDER_ID
│   ├── <slug>/
│   │   ├── cover.jpg
│   │   └── images/
│   └── …
│
├── Events/                     ← GOOGLE_DRIVE_EVENTS_FOLDER_ID
│   └── <event_slug>/
│
├── Blog Media/                 ← alias of Stories/ for backward compatibility
├── Medical Documents/          ← restricted-access folder — never auto-published
├── QR Codes/                   ← generated by admin dashboard; not user-editable
└── Assets/                     ← logos, sponsor images, generic homepage media
    └── homepage/
```

### 12.2 Ingest pipeline

```
Volunteer drops file in Drive
       ↓
Ingest cron (every 15 min)
       ↓
List folder → filter by mimeType (image/* or application/pdf)
       ↓
For each new/changed file (md5 checksum diff):
       ↓
Download from Drive
       ↓
sharp: strip EXIF-GPS, rotate, generate variants:
   - original (max 3200px)
   - large (1600px)
   - medium (800px)
   - small (400px)
   - Each variant produced in AVIF, WebP, JPEG fallback
       ↓
Upload all variants to Supabase Storage bucket `animal-photos`
       ↓
Upsert drive_assets row (drive_file_id, checksum, storage_paths jsonb)
       ↓
Insert/update animal_photos / story_media row
       ↓
revalidatePath affected routes
```

### 12.3 Automatic linkage rules

| Drive path | Linked entity | DB row |
|---|---|---|
| `Dogs/<public_id>/cover.*` | `animals.public_id = <public_id>` | `animal_photos` (sort_order 0) |
| `Dogs/<public_id>/gallery/*` | Same | `animal_photos` (sort_order 1+) |
| `Dogs/<public_id>/medical/*` | Same | `drive_assets` only — NOT `animal_photos` (see §12.4) |
| `Stories/<slug>/cover.*` | `stories.slug = <slug>` | `story_media` (sort_order 0) |
| `Stories/<slug>/images/*` | Same | `story_media` (sort_order 1+) |
| `Events/<slug>/*` | `content_events.slug = <slug>` | Referenced via `content_events.images jsonb` |
| `Assets/**/*` | Global | `content_settings` references by filename |

If the linked entity does not exist (e.g. a Drive folder for `DOG99999` when no such animal is
in the DB), the file is catalogued in `drive_assets` with `animal_id = null` and flagged as
`unresolved`. Admin sees it in the sync dashboard.

### 12.4 What is not auto-published

- Files under any `medical/` subfolder. Treatment photos and medical documents may not be
  appropriate for public display — that's an admin judgment call, not a folder-name inference.
  They land in `drive_assets` but never in `animal_photos`. Admin can promote them to public via
  the dashboard.
- Files in `Medical Documents/` at the root. Same rationale; whole folder is restricted.
- Any file whose EXIF or filename contains sensitive location metadata that survives the
  strip pass. Sharp handles standard EXIF; anything unusual is logged for review.

### 12.5 Broken-image detection

A nightly cron job cross-references:
- Every `animal_photos.storage_path` against Storage bucket contents.
- Every `drive_assets.drive_file_id` against Drive folder contents.

Discrepancies (row exists, file doesn't; file exists, row doesn't) are written to
`sync_conflicts` with `type: 'broken_media'`. Admin resolves in the dashboard.

### 12.6 Responsive delivery

Frontend uses `next/image` with `srcset` populated from the variant ladder. Blurhash placeholder
is generated at ingest time and stored in `animal_photos.blurhash`. Result: LCP < 1.5 s on 4G,
Lighthouse image metrics green.

---

## 13. Scalability

### 13.1 Target capacity (design targets, not current state)

| Entity | v1 target | v3 target (5 years) | Bottleneck at target? |
|---|---|---|---|
| Animals | 100 | 10,000 | Postgres: no. Sheets: kept manageable by the tab's archival policy (§4.5) — e.g. archive animals with `Current Status = 'Rainbow Bridge'` after 1 year, keep active roster in-sheet. |
| Medical records | 1,000 | 1,000,000 | Postgres: no (partitioned by month at 100M+ via declarative partitioning — see §13.5). Sheets: archival policy `time_window` keeps the last 2 years in-sheet; older records queryable via DB/API only. |
| Rescue reports | 100/year | 10,000/year | Postgres: no. Sheets: archival policy `status_based` archives `resolved` reports after 30 days. |
| Adoption applications | 50/year | 5,000/year | Same. Archived once `status in ('adopted', 'not_selected')` for > 90 days. |
| Donations | 500/year | 50,000/year | Same. `size_threshold` keeps the 500 most recent in-sheet. |
| Volunteers | 30 | 500 | No bottleneck |
| Concurrent admins | 3 | 20 | Advisory lock in §7.2 prevents contention |
| Storage (media) | 1 GB | 500 GB | Supabase Pro tier at 100 GB → self-managed R2/S3 at 500 GB |

### 13.2 What scales linearly

- Row count per tab. Postgres handles millions per table trivially; Sheets slows at 10,000+
  rows per tab, hence the yearly-tab-split strategy.
- Ingest throughput. Job queue is parallelizable — worker count can scale from 1 to N Vercel
  functions running concurrently (per-tab advisory lock prevents cross-worker interference).
- Audit log volume. Append-only, indexed. Partitioning kicks in at 100M rows.

### 13.3 What doesn't scale, and what we do about it

- **Sheets API rate limits.** 60 write requests per minute per user, 300 reads per minute per
  project. Mitigation: batch reads/writes (one API call per tab, not per row); global rate
  limiter in the worker; incremental mode (§7.1) reads only the `_updated_at` column plus the
  changed rows, so 10,000 rows with 3 changes is ~10,000 timestamp reads + 3 row reads, not
  10,000 row reads.
- **Full-scan safety-sweep cost.** The daily full-scan sweep (§7.2) does read all rows. At
  10,000 rows × 20 tabs × 30 cells = 6M cell reads per day, well inside daily quota. If quota
  becomes a concern, the sweep interval extends to weekly.
- **Concurrent worker contention.** Postgres advisory locks per tab prevent two workers from
  applying to the same tab simultaneously. Different tabs run in parallel freely.
- **Archived-row visibility.** The DB retains everything forever; only the sheet view is
  bounded. Admin dashboard and public API can query archived rows on demand.

### 13.4 Multi-campus (Phase 3)

If a second campus adopts the platform (mentioned in the goals), the architecture supports it
without a rewrite:
- Add a `campus_id` column to every content and transactional table (default `iit-kgp`).
- One spreadsheet per campus. Each has its own `sync_job` scoping.
- One Supabase project shared across campuses, RLS filters by campus_id per subdomain.
- Zero code changes to the sync engine, just config-per-campus.

### 13.5 Future integrations

The architecture accommodates without redesign:
- **Mobile app** — reads Supabase directly via the same anon key + RLS.
- **Public API** — Vercel route handlers over Supabase RPC or PostgREST.
- **AI features** — pgvector column on relevant content tables; embedding worker follows the
  same job-queue pattern.
- **Third-party integrations** (Slack alerts, WhatsApp bots) — subscribe to `sync_jobs` or
  transactional table changes via Supabase Realtime.

---

## 14. Monitoring & operations

### 14.1 Admin sync dashboard

Route: `/admin/sync`. Shows:
- **Job history** — last 100 jobs with tab, direction, state, duration, actor.
- **Live status** — Supabase Realtime subscription to `sync_jobs` — jobs stream in without refresh.
- **Per-tab health** — for each tab: last successful sync, row count in DB vs sheet, drift flag.
- **Conflict inbox** — `sync_conflicts` rows with resolve/dismiss actions.
- **Manual controls** — "Sync Now" per tab and "Sync Everything" buttons; "Retry" for failed jobs.
- **Media health** — broken-image count, unresolved Drive files.

### 14.2 Alerting (Phase 2)

Any of the following triggers an admin email/WhatsApp alert:
- Job `failed` with `header_mismatch` or `invariant_violation`.
- Any tab has not successfully synced in > 1 hour.
- Conflict count > 10.
- Broken-media count > 20.

Alerts route through the same `notification_outbox` used for the transactional notifications
(see [ARCHITECTURE.md](ARCHITECTURE.md) §11), so they inherit retry and delivery logging.

### 14.3 Metrics (Phase 3)

- Sync latency p50 / p95 per tab.
- API quota headroom (Sheets writes/reads used per minute).
- Job success rate rolling 24h / 7d.
- Time-to-detect for broken media.

---

## 15. Migration path from current state

The current implementation (`/api/sync/run`, `/api/media/ingest`) covers ~15% of this design.
Migration is additive — nothing gets deleted until its replacement is live and verified.

| Current | Replaced by | When |
|---|---|---|
| `/api/sync/run` (Dogs-only, no queue) | **Compatibility shim** forwarding to `/api/sync/enqueue`. Kept until the migration is complete (all content moved to the new engine), then removed. | M-CMS-1 (shim); M-CMS-4 completion (removal candidate) |
| `/api/sync/status` | **Kept as thin wrapper** over the new `sync_jobs` table until `/admin/sync` dashboard replaces it in M-CMS-6. | M-CMS-6 |
| `/api/media/ingest` (single-size sharp) | Same route, variant ladder + broken-image detection | M-CMS-3 |
| `sync_log` (aggregate only) | Kept + `content_audit_log` (row-level diffs) added | M-CMS-1 |
| Hard-coded copy in `app/page.tsx` | `content_home` table read via server component | M-CMS-2 |
| Hard-coded copy in `Header.tsx`, footer, `/about` | `content_navigation`, `content_footer`, `content_help` | M-CMS-2 |
| In-app Story CMS admin panel | Read-only preview; Sheets is source of truth | M-CMS-4 |

**Compatibility layer principle.** No existing endpoint is deleted until (a) its replacement is
live and verified, (b) any callers still using it (Vercel Cron, external scripts) have been
migrated, and (c) at least one release cycle has passed with the shim in place. The shim path
is instrumented — every call is logged to `sync_log` with `triggered_by = 'compat_shim'` so we
can see whether it's actually still being hit before removing it.

---

## 16. Implementation roadmap

Seven milestones. Each ends with a shippable, verifiable state. All work continues on `master`.

| Milestone | Scope | Verifiable outcome | Blocked on |
|---|---|---|---|
| **M-CMS-1: Foundations** | New schema (`sync_jobs`, `content_audit_log`, `sync_conflicts`, `tab_config`, staging tables); job queue library (`lib/sync/*`); worker skeleton at `/api/sync/worker`; enqueue endpoint at `/api/sync/enqueue`; housekeeping at `/api/sync/housekeeping`. Rewrite `/api/sync/run` as a **compatibility shim** that enqueues a `Dogs` full-sync job (kept alive; not deleted). | Empty sync job runs successfully; writes `sync_log` + `content_audit_log`; job appears in `sync_jobs` in `succeeded` state. Compat-shim call to `/api/sync/run` enqueues a job in the new queue. | Migration 0006 applied. |
| **M-CMS-2: Content tabs (part 1)** | Home, Website Settings, Navigation, Footer, FAQ, Help. Zod schemas + mappers + staging + apply per tab. Refactor `app/page.tsx`, `Header.tsx`, footer, FAQ, `/about` to read from `content_*` tables. | Change a Home hero title in Sheets → run sync → homepage renders new title within one sync cycle. | Google service account (dep #2). |
| **M-CMS-3: Dogs + Medical + Vaccination + Sterilization + Media v2** | Full Dogs tab (all 26 fields). Medical History, Vaccination, Sterilization tabs. Media ingest v2: variant ladder (AVIF/WebP/JPEG × 3200/1600/800/400), blurhash, broken-image detector. | Add a new dog row + drop 3 photos in Drive → both appear on site within one sync cycle with responsive images. | Same as M-CMS-2. |
| **M-CMS-4: Donate + Adoption + Stories + Volunteers + Events** | Five remaining content tabs. Retire in-app Story CMS admin panel. Donation campaign QR image auto-linkage from Assets folder. | Publish a new story via Sheets → live on `/stories` within one cycle. Change donation campaign goal in Sheet → homepage stat updates. | Same. |
| **M-CMS-5: Reverse sync (DB → Sheets)** | Postgres `AFTER INSERT/UPDATE` triggers on `adoption_applications`, `donation_confirmations`, `rescue_reports`. Worker appends to Adoption Applications, Donation Confirmations, Reports tabs. Workflow-field two-way sync (§6.3). | Submit a report on the website → within one cycle, appears as a new row in the Reports tab. Change status in Sheets → appears in dashboard. | Same. |
| **M-CMS-6: Admin sync dashboard** | `/admin/sync` page: job history, live status, per-tab health, conflict inbox, manual controls. Realtime subscription to `sync_jobs`. Vercel Cron wired (10-min sheets sync, 15-min media, 1-min housekeeping). | Cron runs on schedule; admin sees jobs stream in without refresh; force-sync + retry buttons work; conflicts appear and can be resolved. | Same. |
| **M-CMS-7: Hardening + alerting** | Alert routing (§14.2). Metrics dashboard (§14.3). Runbook in DEPLOYMENT.md. Load test at 10× current row count. Security audit of service account permissions. | Kill the sync worker mid-run → housekeeping cron re-enqueues; kill the Sheets API mid-run → job retries with backoff; alert fires on `header_mismatch`. | Same. |

**Total estimated effort:** 12–16 working days.

**Delivery order rationale:** M-CMS-1 unlocks everything. M-CMS-2 delivers immediate visible
value (volunteers can edit copy). M-CMS-3 completes the "core dogs experience". M-CMS-4
finishes content coverage. M-CMS-5 completes the two-way flow. M-CMS-6 and M-CMS-7 make it
operable at production standard.

**Kickoff dependencies** (must be resolved before M-CMS-2 can be verified end-to-end):
1. Google Cloud service account JSON key (`GOOGLE_SERVICE_ACCOUNT_JSON`).
2. Spreadsheet created in `KGP PAWS/CMS/` with the 18 tabs (initial headers can be scripted by
   the sync engine on first run once credentials exist).
3. Drive folder structure per §12.1 (empty folders are OK; media ingest is a no-op until files
   arrive).

The engine can be built and unit-tested without these; live verification cannot.

---

## 17. Appendix — glossary

- **Content tab.** A Sheets tab that describes website content. Editable by volunteers/admins.
  Sheets is source of truth.
- **Transactional tab.** A Sheets tab that mirrors user-generated data. Supabase is source of
  truth; workflow fields are the only exception (§6.3).
- **Sync job.** A single unit of synchronization work — one tab, one direction, one scope
  (full or single-row).
- **Staging table.** A `stg_<tab>` mirror table used inside a single sync transaction to
  atomically swap into the live table.
- **Advisory lock.** A Postgres `pg_advisory_lock` on a tab-name-derived key, used to prevent
  two workers from applying to the same tab concurrently.
- **Row version.** A monotonically-increasing integer on every content row. Incremented by the
  sync engine on every write. Used for conflict detection.
- **Ownership.** Which system's changes to a given field are authoritative. Every field has
  exactly one owner (§6).
- **Workflow field.** The narrow class of transactional-table fields that are dual-editable by
  Sheets and dashboard (§6.3). The only exception to strict single-ownership.

---

## 18. Change history

| Date | Change | Approved by |
|---|---|---|
| 2026-07-17 | Initial version. Supersedes the ARCHITECTURE.md §6 sketch. | Owner |
| 2026-07-17 | Six refinements applied: (1) incremental sync from day one, (2) `/api/sync/run` kept as compat shim, (3) API_SPEC updated in-lockstep, (4) expanded 8-column system-column set, (5) tab categorization into Content / Master Data / Transaction Data, (6) flexible per-tab archival policy replacing hardcoded yearly splits. | Owner |
