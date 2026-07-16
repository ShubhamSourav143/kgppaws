# KGP PAWS — Database Schema (Supabase Postgres)

Living document. Last updated **2026-07-16**. Source of truth: `supabase/migrations/*.sql`.
This file explains the schema in prose; the SQL is authoritative for exact types/constraints.

---

## 1. Migration `0001_initial_schema.sql` (written, not yet applied to a live project — see [TASKS.md](TASKS.md) M1)

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

## 2. Migration `0002` — planned additions (M1–M5)

Not yet written; scope agreed here so DB and product work land together.

### 2.1 Sync infrastructure (M2)

```sql
-- added to every syncable table (animals, stories, donation_campaigns, volunteers, …)
alter table animals add column sheet_row_id text;      -- stable _id from the Sheet
alter table animals add column row_version int not null default 1;
alter table animals add column sync_source text not null default 'app'; -- 'app' | 'sheets'
alter table animals add column synced_at timestamptz;

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

### 2.2 Permanent animal ID (M4)

```sql
alter table animals add column public_id text unique; -- 'DOG00023', 'CAT00004'
create sequence animal_public_id_seq;
-- backfill existing rows from paws_id; new rows allocate from sequence, zero-padded per species
```

`slug` stays for pretty story links; `public_id` becomes the canonical QR/URL identifier
(`/dog/DOG00023`). `/p/{token}` remains as the revocable-tag fallback.

### 2.3 UPI donation model (M5)

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

create table site_settings (
  key text primary key,          -- 'upi_qr_1', 'upi_id', 'upi_holder_name', …
  value jsonb not null,
  updated_at timestamptz not null default now()
);
```

### 2.4 Media pipeline (M3)

```sql
create table drive_assets (
  id uuid primary key default gen_random_uuid(),
  drive_file_id text unique not null,
  kind text not null,             -- 'dog_photo' | 'treatment_photo' | 'blog_image' | 'video' | 'document'
  animal_id uuid references animals(id),
  story_slug text,
  storage_path text not null,     -- optimized asset in Supabase Storage
  variants jsonb not null,        -- {orig, 1600, 800, 400, avif, webp, blurhash}
  checksum text not null,
  ingested_at timestamptz not null default now()
);
```

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

---

## 3. Conventions

- UUID PKs everywhere except lookup/config tables keyed by natural text (`site_settings.key`).
- `created_at` on every table; `updated_at` + `set_updated_at()` trigger on mutable ones.
- Money stored as **integer INR** (no currency ambiguity, no float rounding).
- Every "is this visible publicly" decision is a boolean column checked in RLS — never
  inferred in application code.
- Enum additions are additive-only migrations (`alter type … add value`) — never remove/rename
  a value that existing rows use.
