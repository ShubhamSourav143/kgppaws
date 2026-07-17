# KGP PAWS — Database Schema (Supabase Postgres)

Living document. Last updated **2026-07-17**. Source of truth: `supabase/migrations/*.sql`.
Live project: `kgp-paws` (ref `unyhhkulkgznqoqalqxk`, ap-south-1). Migrations `0002`–`0005` were
applied directly to the live database via the Supabase MCP during development and only written
back into repo migration files afterward — a gap that existed briefly this session (see
CHANGELOG 2026-07-17) and is now closed; the files match what's actually live.

> **CMS-first architecture (2026-07-17).** Section 4 below defines the new content and sync
> infrastructure introduced in migration `0006`, per [CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md).
> Read that document first for the full design; this schema doc is the per-column reference.

---

## 1. Migration `0001_initial_schema.sql` — ✅ **applied to the live project** (2026-07-16)

23 tables, all RLS-enabled. Full policy text lives in the migration file; summarized here.

### 1.1 Enums

| Enum | Values |
|---|---|
| `user_role` | user, volunteer, admin, super_admin *(product only exposes volunteer/admin — see PRD §3)* |
| `species` | dog, cat, other |
| `animal_sex` | male, female, unknown |
| `animal_size` | small, medium, large |
| `health_status` | healthy, under_treatment, recovering, monitoring |
| `adoption_status` | available, foster_needed, not_available, adopted |
| `friendliness` | friendly, selective, cautious, shy |
| `medical_event_type` | vaccination, deworming, sterilization, injury, treatment, checkup, recovery |
| `report_problem` | injured, sick, unable_to_walk, bleeding, vehicle_accident, distressed, puppies_kittens_at_risk, other |
| `report_severity` | emergency, urgent, moderate, low |
| `report_status` | reported, volunteer_assigned, on_the_way, animal_located, treatment_started, monitoring, resolved |
| `application_status` | submitted, under_review, contacted, meet_scheduled, approved, not_selected, adopted |
| `donation_status` | created, pending_verification, verified, failed, refunded |
| `story_status` | draft, scheduled, published, archived |
| `campaign_category` | feeding, treatment, vaccination, sterilization, recovery, emergency |

### 1.2 Identity & roles

- **`profiles`** (`id` = `auth.users.id`) — `full_name`, `phone` (private), `affiliation`.
- **`user_roles`** — `user_id`, `role`, `granted_by`. Unique `(user_id, role)`. Checked via
  `has_role(required user_role[])`, a `security definer` SQL function used inside every RLS
  policy (avoids self-referential RLS recursion).

### 1.3 Animals & digital identity

- **`animals`** — `paws_id` (unique, human ID e.g. `PAWS-KGP-DOG-0012` → migrating to
  `DOG#####`, see §2), `slug` (unique), `name`, `species`, `sex`, `age_label`, `color`, `size`,
  `zone_id` (coarse, public-safe — **never** precise coordinates), `tagline`, `personality
  text[]`, `bio`, `friendliness`, `vaccinated`, `sterilized`, `health_status`, `health_note`
  (public-safe), `internal_note` (staff-only), `last_health_update`, `adoption_status`,
  `good_with_people/animals`, `special_care`, `emergency_note`, `portrait jsonb` (illustrated
  fallback config), `is_public`, `is_demo`.
- **`animal_photos`** — `storage_path`, `caption`, `taken_on`, `is_public`, `sort_order`.
- **`animal_health_records`** — periodic vet assessments: `weight_kg`, `condition`,
  `public_note`, `internal_note` (staff-only).
- **`animal_medical_events`** — the public medical timeline: `event_date`, `event_type`,
  `title`, `public_note`, `internal_note`. Column privilege: `internal_note` is **revoked**
  from `anon`/`authenticated` at the SQL grant level (defense in depth beyond RLS).
- **`animal_sightings`** — `seen_on`, `zone_id` (coarse only), `public_note`.
- **`qr_tags`** — `token` (unique, opaque — printed on tags), `active`, `deactivated_at`.
  Reissuing = deactivate old row + insert new; old printed tag stops resolving.
- **`qr_scans`** — privacy-conscious analytics: `scanned_at`, `device_category`, `referrer`.
  **No scanner identity, no precise location, ever.**

### 1.4 Rescue reports

- **`rescue_reports`** — `report_code` (unique public handle, e.g. `PAWS-RESCUE-2026-00124`),
  `reporter_id` (nullable — anonymous allowed), `reporter_contact` (responders-only),
  `animal_type`, `problem`, `severity`, `zone_id` (public), **`lat`/`lng` (restricted — never
  exposed through any public policy or view)**, `location_note`, `photo_path`, `description`,
  `status`, `linked_animal`.
- **`report_updates`** — append-only status/timeline entries (`status`, `note`, `created_by`).
- **`get_report_status(code)`** — `security definer` function: the *only* way anonymous
  visitors query a report by code. Returns just the safe columns (no lat/lng, no reporter
  contact) — the tracking page never needs a table-level public policy on `rescue_reports`.

### 1.5 Volunteers

- **`volunteers`** — `user_id` (nullable until they sign up), `full_name`, `email`, `phone`
  (coordinators-only), `affiliation`, `hall_dept`, `skills`, `availability`, `interests text[]`,
  `status`.
- **`volunteer_assignments`** — `volunteer_id`, `report_id`, `task`, `due_on`, `done`.

### 1.6 Donations & transparency

- **`donation_campaigns`** — `slug`, `title`, `category`, `story`, `goal_amount` (INR, int),
  `animal_id` (nullable), `active`, `is_demo`.
- **`donations`** — `campaign_id`, `donor_id` (nullable = guest), `amount`, `monthly`,
  `status`, `gateway`, `gateway_order`, `gateway_ref`, `verified_at`. **Private table** — no
  client insert/update policy; only server (service role) writes. *(Superseded by
  `donation_confirmations` in the UPI model — see §2.3; kept for historical/legacy data.)*
- **`campaigns_with_totals`** (view, `security_invoker`) — public totals computed **only**
  from `status = 'verified'` donations. This is the sole source for "amount raised" anywhere
  in the UI.
- **`campaign_expenses`**, **`campaign_updates`** — public transparency ledger + admin updates.

### 1.7 Adoption

- **`adoption_applications`** — `app_code` (unique), `animal_id`, `applicant_id` (nullable),
  `applicant jsonb`, `living jsonb`, `experience jsonb`, `motivation`, `status`,
  `internal_notes` (staff-only; `select` revoked from `authenticated`), `meet_at`.

### 1.8 Stories (CMS)

- **`stories`** — `slug`, `title`, `excerpt`, `category`, `animal_slug`, `author`,
  `read_minutes`, `hero_palette jsonb`, `blocks jsonb` (rich content array), `seo_description`,
  `status`, `featured`, `published_at`, `scheduled_for`, `is_demo`.
- **`story_media`** — `storage_path`, `kind` (image/video), `caption`, `sort_order`.

### 1.9 Config, notifications, audit

- **`impact_metrics`** — admin-editable public stats (dogs/cats supported, vaccinated,
  sterilized, treated, adopted, `note`). **Never hardcoded in the app.**
- **`notifications`** — in-app notifications, own-row-only.
- **`audit_logs`** — `actor_id`, `action`, `entity`, `entity_id`, `diff jsonb`. Triggers wired
  on `animals`, `qr_tags`, `donation_campaigns`, `adoption_applications` (update).

### 1.10 Row Level Security summary

| Pattern | Applied to |
|---|---|
| Public read of `is_public`/`active`/`published` rows; staff read all | animals, animal_photos, medical_events, sightings, campaigns, stories |
| Owner-or-staff read | profiles, rescue_reports, adoption_applications, donations, volunteers |
| Public insert allowed (rate-limit at edge) | rescue_reports, adoption_applications, volunteers |
| Staff/admin-only write | qr_tags, campaign_expenses, story CMS, impact_metrics |
| No client policy — server/service-role only | donations |
| Column-level revoke (defense in depth) | `animal_medical_events.internal_note`, `adoption_applications.internal_notes` |

---

## 2. Migrations `0002`–`0005` — ✅ **applied to the live project** (2026-07-17)

### 2.1 Sync infrastructure — `0002_cms_foundations.sql`

Scoped to `animals` and `stories` only — **not** "every syncable table" as first sketched here;
`donation_campaigns`/`volunteers` sync metadata is added if/when those sheets get built (M2
currently covers the Dogs tab only — see ARCHITECTURE.md §6).

```sql
alter table animals add column sheet_row_id text;      -- stable _id from the Sheet
alter table animals add column row_version int not null default 1;
alter table animals add column sync_source text not null default 'app'; -- 'app' | 'sheets'
alter table animals add column synced_at timestamptz;
-- identical four columns added to `stories`

create table sync_log (
  id uuid primary key default gen_random_uuid(),
  run_at timestamptz not null default now(),
  tab_name text not null,
  direction text not null,        -- 'sheets_to_db' | 'db_to_sheets'
  rows_read int not null default 0,
  rows_written int not null default 0,
  conflicts int not null default 0,
  errors jsonb not null default '[]',
  duration_ms int
);
```

### 2.2 Permanent animal ID — `0002` + `0004_auto_assign_public_id.sql`

```sql
alter table animals add column public_id text unique; -- 'DOG00023', 'CAT00004'
create sequence animal_public_id_seq;
-- backfill: existing rows numbered by creation order, zero-padded per species
-- (0004) trigger: new rows auto-assign via next_animal_public_id(species) on insert
--   if not already set — caught by testing, not assumed; see CHANGELOG 2026-07-17
```

`slug` stays for pretty story links; `public_id` is the canonical identifier — 9 animals have
one today (8 backfilled demo + 1 real). `/dog/[publicId]` route not yet built (still `/p/[token]`
+ `/animal/[slug]`); `/p/{token}` remains as the revocable-tag fallback regardless.

### 2.3 UPI donation model — **still planned, not built** (M5)

```sql
create table donation_confirmations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references donation_campaigns(id),
  donor_name text not null,
  donor_email text,
  donor_phone text,
  amount int not null check (amount > 0),
  utr text not null,                      -- UPI transaction reference, donor-reported
  purpose text,
  message text,
  status text not null default 'pending', -- pending | approved | rejected
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  is_public boolean not null default false, -- show on "Recent Donors" once approved
  created_at timestamptz not null default now()
);
-- campaigns_with_totals gains a second source: sum(amount) where status='approved'
-- (replaces the Razorpay-oriented `donations` table as the primary donation record)
```

`site_settings` itself is **already built** (moved to §2.1's migration since it's generic
key/value config, not UPI-specific) — see below. Only `donation_confirmations` remains open.

### 2.4 Site settings + media pipeline — `0002_cms_foundations.sql`

```sql
create table site_settings (
  key text primary key,          -- 'upi_qr_1', 'upi_id', 'upi_holder_name', …
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)   -- added vs. the original sketch
);

create table drive_assets (
  id uuid primary key default gen_random_uuid(),
  drive_file_id text unique,      -- nullable: local (non-Drive-API) imports have no Drive file ID
  kind text not null,             -- 'dog_photo' | 'story_photo' | 'blog_image' | 'video' | 'document'
  animal_id uuid references animals(id),
  story_id uuid references stories(id),      -- was `story_slug text` in the original sketch
  storage_path text not null,
  variants jsonb not null default '{}',      -- reserved for the AVIF/WebP ladder — not populated yet
  checksum text,                  -- nullable: local imports don't compute one
  source text not null default 'local_import', -- 'local_import' | 'drive_api' — new vs. original sketch
  ingested_at timestamptz not null default now()
);
```

Both tables are public-read (`for select using (true)`), admin-write (`has_role(admin)`).
10 real rows exist today — see §3 seed note.

### 2.5 Notification outbox (M6)

```sql
create table notification_outbox (
  id uuid primary key default gen_random_uuid(),
  channel text not null,          -- 'email' | 'whatsapp'
  template text not null,         -- 'new_report' | 'donation_confirmation' | 'adoption_application'
  payload jsonb not null,
  status text not null default 'pending', -- pending | sent | failed
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
```

### 2.6 Report taxonomy update (M6)

`report_problem` gains `missing` and `deceased` values to match the spec's four public
categories (Injured / Missing / Emergency / Dead animal — "Emergency" maps to `severity =
'emergency'` rather than a `problem`, so no enum change needed there).

### 2.7 Storage policy + small gap-closes — `0003`, `0005` — ✅ applied

```sql
-- 0003_storage_admin_write_policy.sql
create policy "admin_write_animal_photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'animal-photos' and has_role(array['admin','super_admin']::user_role[]));
create policy "admin_update_animal_photos" on storage.objects for update to authenticated
  using (bucket_id = 'animal-photos' and has_role(array['admin','super_admin']::user_role[]))
  with check (bucket_id = 'animal-photos' and has_role(array['admin','super_admin']::user_role[]));

-- 0005_breed_and_photo_constraint.sql
alter table animals add column breed text not null default '';
alter table animal_photos add constraint animal_photos_animal_path_key unique (animal_id, storage_path);
```

`0003` replaces a first attempt (a temporary `for insert to anon` policy) that was correctly
blocked by this session's own safety tooling before it ever ran — see CHANGELOG 2026-07-17.
`0005`'s unique constraint was added *before* the Drive ingest route's `upsert(...).onConflict`
could hit the bug of relying on a constraint that didn't exist yet.

---

## 3. Current live data (2026-07-17)

9 `animals` rows (8 demo + 1 real, `dreamland`/`DOG00009`), 7 `stories` rows (6 demo + 1 real,
`field-notes-2025`), 10 `drive_assets`/`animal_photos`+`story_media` rows from the local photo
import (see CHANGELOG). Everything else is the M1 seed (`supabase/seed.sql`), all `is_demo = true`.

---

## 4. Migration `0006_cms_first_architecture.sql` — **PLANNED** (M-CMS-1)

Implements the CMS-first architecture defined in [CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md).
Adds content tables (one per Sheets tab), sync infrastructure (jobs, conflicts, audit),
staging tables, and renames `site_settings → content_settings`.

### 4.1 Content tables (Sheets → Supabase)

Each table is public-read (renders on the public site), admin-write (`has_role(admin)`), with
RLS enforcing both. All get the standard sync-metadata columns:

| DB column | Sheet column | Purpose |
|---|---|---|
| `sheet_row_id text unique` | `_id` | Stable UUID row ID |
| `public_id text unique` (where applicable) | `_public_id` | Human-typeable ID (e.g. `DOG00023`, slug) |
| `row_version int` | `_row_version` | Monotonic counter, incremented on every write |
| `sync_status text` | `_sync_status` | `ok` \| `pending` \| `error` \| `conflict` |
| `last_synced_at timestamptz` | `_last_synced` | Last successful sync |
| `last_sync_error text` | `_last_error` | Error message when `sync_status = 'error'` |
| `updated_at timestamptz` (existing) | `_updated_at` | Last write, either side — drives incremental sync |
| `sync_source text` | `_sync_source` | `sheets` \| `app` \| `trigger` \| `system` |
| `is_active boolean default true` | `Active` | Soft-delete flag (present only where soft-delete applies) |
| `archived_at timestamptz` | *(not synced)* | Set by the archival policy; frontend queries filter `is null` by default |

#### `content_home`

Homepage sections, one row per section (Hero / Mission / Stats / Featured / Testimonials / Sponsors / Videos / Gallery).

```sql
create table content_home (
  id                uuid primary key default gen_random_uuid(),
  sheet_row_id      text unique,
  public_id         text,                       -- section-scoped stable ref (e.g. 'home-hero-1'), optional
  row_version       int not null default 1,
  sync_status       text not null default 'ok', -- 'ok' | 'pending' | 'error' | 'conflict'
  last_synced_at    timestamptz,
  last_sync_error   text,
  sync_source       text not null default 'sheets',
  section           text not null,              -- 'hero' | 'mission' | 'stats' | 'featured' | 'testimonials' | 'sponsors' | 'videos' | 'gallery'
  display_order     int not null default 0,
  title             text,
  subtitle          text,
  body              text,                       -- markdown
  cta_label         text,
  cta_url           text,
  media_ref         text,                       -- Drive filename → resolved storage_path via drive_assets
  data              jsonb not null default '{}',-- section-specific structured payload
  is_active         boolean not null default true,
  archived_at       timestamptz,                -- set by archival policy
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index on content_home (section, display_order) where is_active and archived_at is null;
```

*(The same sync-metadata column set applies to every table in this section — omitted from the
per-table snippets below to keep them readable. See the mapping table above §4.1.)*

#### `content_adoption`, `content_help`, `content_faq`, `content_events`, `content_navigation`, `content_footer`

Same shape as `content_home` in principle — one row per section/item, `section`/`category` discriminator, `data jsonb` for structured payloads. Full column list in the migration file; the pattern is uniform:

- `content_adoption` — sections: `intro` / `categories` / `instructions` / `success_stories` / `faq`. Adds `featured_animal_public_ids text[]`.
- `content_help` — sections: `opportunities` / `foster_info` / `emergency` / `contact_card` / `how_to_help`. Adds `icon text`.
- `content_faq` — flat table. Columns: `category`, `question`, `answer`, `display_order`.
- `content_events` — one row per event. Columns: `slug` (unique), `title`, `type`, `starts_at`, `ends_at`, `location`, `description`, `rsvp_url`, `featured`, `display_order`.
- `content_navigation` — one row per menu item. Columns: `label`, `url`, `icon`, `parent_label`, `display_order`, `visible`, `open_in_new_tab`.
- `content_footer` — one row per footer element. Columns: `section` (social_link/quick_link/contact/copyright/newsletter_blurb), `display_order`, `label`, `url`, `icon`, `value`.

#### `content_donate`

Page-level copy for `/donate` (intro, transparency section, etc.). Campaign rows continue to
live in `donation_campaigns` (existing) — enriched with sync-metadata columns.

```sql
create table content_donate (
  id            uuid primary key default gen_random_uuid(),
  sheet_row_id  text unique,
  row_version   int not null default 1,
  sync_source   text not null default 'sheets',
  synced_at     timestamptz,
  section       text not null,              -- 'intro' | 'transparency' | 'thank_you'
  display_order int not null default 0,
  title         text, subtitle text, body text,
  data          jsonb not null default '{}',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
```

#### `content_settings` (renames `site_settings`)

Key/value with typed JSONB value column. Existing 3 rows migrated in place.

```sql
alter table site_settings rename to content_settings;
alter table content_settings add column sheet_row_id text unique;
alter table content_settings add column row_version int not null default 1;
alter table content_settings add column sync_source text not null default 'sheets';
alter table content_settings add column synced_at timestamptz;
alter table content_settings add column description text;
```

#### `volunteer_directory`

Public-facing volunteer bios. **Distinct from `volunteers`** — that table is the applicant/roster
(populated by the signup form), transactional. `volunteer_directory` is content, edited via
Sheets.

```sql
create table volunteer_directory (
  id            uuid primary key default gen_random_uuid(),
  sheet_row_id  text unique,
  row_version   int not null default 1,
  sync_source   text not null default 'sheets',
  synced_at     timestamptz,
  name          text not null,
  role          text,
  contact       text,                        -- public-safe (email typically)
  photo_path    text,                        -- storage_path
  responsibilities text[],
  bio           text,
  display_order int not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
```

#### `animal_vaccinations`, `animal_sterilizations`

Extracted from `animal_medical_events` because vaccination has a recurring-reminder need
(`next_due date`) and sterilization is a single-event category with hospital/vet details.
Existing `animal_medical_events` rows with `event_type in ('vaccination', 'sterilization')` stay
put — the new tables are for **future** Sheets-driven records via the dedicated tabs.

```sql
create table animal_vaccinations (
  id            uuid primary key default gen_random_uuid(),
  sheet_row_id  text unique,
  row_version   int not null default 1,
  sync_source   text not null default 'sheets',
  synced_at     timestamptz,
  animal_id     uuid not null references animals(id) on delete cascade,
  vaccine       text not null,
  date_given    date not null,
  next_due      date,
  administered_by text,
  notes         text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on animal_vaccinations (animal_id, date_given desc);
create index on animal_vaccinations (next_due) where next_due is not null and is_active;

create table animal_sterilizations (
  id            uuid primary key default gen_random_uuid(),
  sheet_row_id  text unique,
  row_version   int not null default 1,
  sync_source   text not null default 'sheets',
  synced_at     timestamptz,
  animal_id     uuid not null references animals(id) on delete cascade,
  date          date not null,
  doctor        text,
  hospital      text,
  notes         text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
```

### 4.2 Sync infrastructure

#### `tab_config`

Declarative per-tab configuration. One row per Sheets tab. The sync engine reads this table on
startup and re-reads on cache-invalidation events. Changing a tab's archival policy is a one-row
UPDATE, not a code deploy.

```sql
create table tab_config (
  tab_name          text primary key,           -- 'Home' | 'Dogs' | 'Medical History' | …
  category          text not null,              -- 'content' | 'master_data' | 'transaction_data'
  direction         text not null,              -- 'sheets_to_db' | 'db_to_sheets'
  db_tables         text[] not null,            -- ['content_home'] or ['donation_campaigns', 'content_donate']
  db_primary_table  text not null,              -- the table for _id/_row_version tracking
  archive_policy    jsonb not null default '{"kind":"none"}',
    -- shape:
    --   { "kind": "none" }
    --   { "kind": "status_based",   "archive_when": "<sql-expr>" }
    --   { "kind": "time_window",    "column": "<col>", "keep": "<interval>" }
    --   { "kind": "size_threshold", "order_by": "<col>", "keep_newest": <n> }
    --   { "kind": "manual" }
  revalidate_paths  text[] not null default '{}', -- ['/adopt', '/animal/[slug]']
  active_column     boolean not null default true, -- does this tab have an Active column?
  enabled           boolean not null default true, -- master kill-switch per tab
  updated_at        timestamptz not null default now()
);
```

Seed rows are inserted by the migration for all 18 editable tabs. Example:

```sql
insert into tab_config (tab_name, category, direction, db_tables, db_primary_table, archive_policy, revalidate_paths, active_column) values
  ('Home',           'content',          'sheets_to_db', array['content_home'],         'content_home',   '{"kind":"none"}',                                                        array['/'],                            true),
  ('Dogs',           'master_data',      'sheets_to_db', array['animals'],              'animals',        '{"kind":"status_based","archive_when":"current_status = ''rainbow_bridge'' and updated_at < now() - interval ''365 days''"}', array['/adopt','/animal/[slug]'],     true),
  ('Medical History','transaction_data', 'sheets_to_db', array['animal_medical_events'],'animal_medical_events','{"kind":"time_window","column":"event_date","keep":"2 years"}',   array['/animal/[slug]'],              true),
  ('Reports',        'transaction_data', 'db_to_sheets', array['rescue_reports'],       'rescue_reports', '{"kind":"status_based","archive_when":"status = ''resolved'' and updated_at < now() - interval ''30 days''"}',   array['/admin/reports'],               false),
  -- … one row per tab
;
```

#### `sync_jobs`

Job queue. State machine per [CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md) §9.

```sql
create table sync_jobs (
  id            uuid primary key default gen_random_uuid(),
  tab           text not null,               -- 'Dogs' | 'Medical History' | … | 'Adoption Applications' | …
  direction     text not null,               -- 'sheets_to_db' | 'db_to_sheets' | 'drive_to_storage'
  scope         text not null default 'full',-- 'full' | 'row'
  row_id        uuid,                        -- when scope='row'
  state         text not null default 'queued', -- 'queued' | 'running' | 'succeeded' | 'failed' | 'conflict'
  attempt       int not null default 1,
  max_attempts  int not null default 4,
  next_run_at   timestamptz,
  last_error    jsonb,
  heartbeat_at  timestamptz,
  enqueued_at   timestamptz not null default now(),
  started_at    timestamptz,
  finished_at   timestamptz,
  triggered_by  text not null,               -- 'cron' | 'admin' | 'trigger' | 'apps_script'
  actor_id      uuid references auth.users(id),
  rows_read     int, rows_written int, conflicts int,
  duration_ms   int
);
create index on sync_jobs (state, next_run_at) where state in ('queued', 'running');
create index on sync_jobs (tab, direction, enqueued_at desc);
create unique index on sync_jobs (tab, direction, coalesce(row_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where state in ('queued', 'running');   -- dedup: no two active jobs for the same (tab, direction, row)
```

#### `sync_conflicts`

Per [CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md) §6.3.

```sql
create table sync_conflicts (
  id            uuid primary key default gen_random_uuid(),
  detected_at   timestamptz not null default now(),
  sync_job_id   uuid references sync_jobs(id),
  table_name    text not null,
  row_id        uuid not null,
  type          text not null,               -- 'row_version_mismatch' | 'broken_media' | 'unresolved_fk' | 'duplicate_public_id'
  sheet_payload jsonb, db_payload jsonb,
  resolution    text,                        -- 'kept_db' | 'kept_sheet' | 'dismissed' — null until admin resolves
  resolved_by   uuid references auth.users(id),
  resolved_at   timestamptz
);
create index on sync_conflicts (resolution) where resolution is null;
```

#### `content_audit_log`

Immutable per-row diff log. Per [CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md) §10.

```sql
create table content_audit_log (
  id            bigserial primary key,
  at            timestamptz not null default now(),
  sync_job_id   uuid references sync_jobs(id),
  table_name    text not null,
  row_id        uuid not null,
  operation     text not null,               -- 'insert' | 'update' | 'soft_delete'
  source        text not null,               -- 'sheets' | 'app' | 'trigger'
  actor         text,                        -- 'sheets:<email>' | 'admin:<uuid>' | 'system'
  diff          jsonb not null               -- { field: { old, new } } for updates; full row for inserts
);
create index on content_audit_log (table_name, row_id, at desc);
create index on content_audit_log (at desc);
-- RLS: enforced immutability
alter table content_audit_log enable row level security;
create policy audit_log_admin_read on content_audit_log for select
  using (has_role(array['admin','super_admin']::user_role[]));
create policy audit_log_service_insert on content_audit_log for insert
  with check (auth.jwt() ->> 'role' = 'service_role');
-- No update, no delete policies at all → both blocked by default RLS.
```

#### Staging tables

One `stg_<tab_name>` mirror per content tab. Same columns as the live table plus a `sync_job_id`
FK. Truncated at the start of each sync run, populated in bulk, diffed against the live table,
then discarded when the job commits.

```sql
create table stg_content_home (like content_home including defaults, sync_job_id uuid);
create table stg_animals (like animals including defaults, sync_job_id uuid);
-- … one per content tab
```

Staging tables are visible only to the service role (RLS: `for all using (false)`).

### 4.3 Transactional-table triggers (DB → Sheets)

```sql
create or replace function enqueue_db_to_sheets_sync() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into sync_jobs (tab, direction, scope, row_id, triggered_by)
  values (
    case tg_table_name
      when 'adoption_applications'  then 'Adoption Applications'
      when 'donation_confirmations' then 'Donation Confirmations'
      when 'rescue_reports'         then 'Reports'
    end,
    'db_to_sheets', 'row', new.id, 'trigger'
  )
  on conflict do nothing;   -- dedup via the unique index on sync_jobs
  return new;
end $$;

create trigger tr_adoption_applications_sync after insert or update on adoption_applications
  for each row execute function enqueue_db_to_sheets_sync();
-- same for donation_confirmations and rescue_reports
```

### 4.4 Deprecations

- `site_settings` → renamed to `content_settings` (see 4.1).
- Existing `/api/sync/run` → replaced by `/api/sync/enqueue` + `/api/sync/worker` in M-CMS-1.
  The route file stays temporarily as a shim that enqueues a `Dogs` full-sync job.
- Existing `stories.blocks jsonb` → still used at render time, but populated by a markdown-to-blocks
  parser at sync time from the `Stories.Markdown` column. Direct edits via the admin story CMS
  panel are deprecated (see [CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md) §15).

---

## 5. Conventions

- UUID PKs everywhere except lookup/config tables keyed by natural text (`content_settings.key`).
- `created_at` on every table; `updated_at` + `set_updated_at()` trigger on mutable ones.
- Money stored as **integer INR** (no currency ambiguity, no float rounding).
- Every "is this visible publicly" decision is a boolean column checked in RLS — never
  inferred in application code.
- Enum additions are additive-only migrations (`alter type … add value`) — never remove/rename
  a value that existing rows use.
- Every content table has `sheet_row_id text unique`, `row_version int`, `sync_source text`,
  `synced_at timestamptz`. This is the sync contract — a table without these columns cannot be
  synced.
- Every transactional table whose workflow fields sync back to Sheets has a corresponding
  `enqueue_db_to_sheets_sync()` trigger.
- Media URLs are **never stored** in content tables. The frontend resolves media at render time
  via `drive_assets.storage_path` joins.
