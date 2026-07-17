# KGP PAWS — Google Sheets CMS Schema

Living document. Last updated **2026-07-17**. Implements the CMS design in
[CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md) — read that first for the *why*; this document is
the *what* (column-level spec for every tab).

**One spreadsheet:** `KGP PAWS CMS` — location `KGP PAWS/CMS/KGP PAWS CMS.xlsx` in Drive.

**Eighteen editable tabs, three reference tabs.** Tab names are **exact and case-sensitive** —
the sync engine matches these literal strings. Grouped by category (see
[CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md) §4.1):

**Content — 9 tabs (Sheets → Supabase, page copy):**
`Home` · `Adoption` · `Donate` · `Stories` · `Help` · `Events` · `FAQ` · `Navigation` · `Footer`

**Master Data — 4 editable + 3 reference tabs (Sheets → Supabase, foundational entities):**
`Dogs` · `Volunteers` · `Donate — Campaigns` · `Website Settings` ·
`Reference — Zones` · `Reference — Categories` · `Reference — Statuses`

**Transaction Data — 6 tabs (mixed direction, timestamped events):**
*Volunteer-submitted (Sheets → Supabase):* `Medical History` · `Vaccination` · `Sterilization`
*Public-submitted (Supabase → Sheets):* `Adoption Applications` · `Donation Confirmations` · `Reports`

---

## Conventions (apply to every tab)

### System columns (present on every editable tab, in this fixed order)

Every editable tab carries these **eight** system columns as columns A–H. All are **protected
ranges** — service-account-only edit. Volunteers see them but cannot modify them.

| # | Column | Sheet type | Purpose |
|---|---|---|---|
| A | `_id` | text | Stable row ID (UUID). Assigned by the engine on first sync. Never changes. |
| B | `_public_id` | text | Human-typeable public ID where one exists (`DOG00023`, story `slug`, campaign `slug`). Blank on tabs with no natural public ID. |
| C | `_row_version` | number | Monotonically increasing integer. Incremented on every write. Used for conflict detection. |
| D | `_sync_status` | text | `OK` / `PENDING` (volunteer edited, awaiting next sync) / `ERROR` / `CONFLICT`. |
| E | `_last_synced` | timestamp | ISO timestamp of last successful sync for this row. |
| F | `_last_error` | text | Human-readable message when `_sync_status = ERROR`. Blank otherwise. |
| G | `_updated_at` | timestamp | ISO timestamp of the last write to this row (either side). Drives incremental sync. |
| H | `_sync_source` | text | `sheets` \| `app` \| `trigger` \| `system` — which side originated the last write. |

Volunteer-editable business columns start at column I on every tab.

**On `Active`.** The `Active` column is a normal user-editable column on tabs where soft-delete
makes sense (Content and Master Data tabs). It is *not* a system column. Setting `Active =
FALSE` triggers a soft-delete in the DB (`is_active = false`); rows are never hard-deleted from
either side. Transaction Data tabs do not have an `Active` column — deletion of events is not a
supported operation.

**On the `PENDING` status.** When a volunteer edits a row, ideally the sheet immediately writes
`_sync_status = PENDING` and `_updated_at = now` via a lightweight Apps Script `onEdit` handler.
This is a Phase-2 nicety; without it, the engine detects the change on the next incremental scan
via the `_updated_at` column (which the volunteer would need to update manually, or the engine
falls back to full-scan). In M-CMS-1 through M-CMS-6, the manual-`_updated_at` fallback is used;
the Apps Script `onEdit` handler ships in M-CMS-7 as part of hardening.

### Header verification

Column headers are the sync engine's field map — renaming or reordering a header breaks sync
until the mapping config is updated. Header drift is caught by the header check (see
[CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md) §8.1) and surfaces as `header_mismatch` in the admin
dashboard, not a silent failure.

### Ownership legend (per tab)

Every tab header below shows:
- **Category:** Content / Master Data / Transaction Data (see [CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md) §4.1).
- **Direction:** `Sheets → DB` or `DB → Sheets`.
- **DB table(s):** which Supabase table this tab maps to.
- **Archival policy:** how the sheet view is bounded as data grows (see [CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md) §4.5).
- **Change scope:** which fields are editable by volunteers in the sheet.

---

## Tab reference

Tabs appear below in the reading order used throughout this document. Each header includes:
**Category** (Content / Master Data / Transaction Data), **Direction** (sync direction),
**DB table** (Supabase mapping), **Archival** policy, and **Change scope** (which fields
volunteers may edit).

### Tab: `Home`

**Category:** Content · **Direction:** Sheets → DB · **DB table:** `content_home` ·
**Archival:** `none` · **Change scope:** all non-system columns.

One row per homepage section. `Section` column is a discriminator; the schema of `Content`
depends on the section type. This keeps homepage structure flat and volunteer-friendly.

| Column | Type | Notes |
|---|---|---|
| `_id`, `_public_id`, `_row_version`, `_sync_status`, `_last_synced`, `_last_error`, `_updated_at`, `_sync_source` | system (8 protected cols) | See Conventions above. |
| `Active` | boolean | Soft-delete flag; `TRUE` by default. |
| `Section` | select | `Hero`, `Mission`, `Stats`, `Featured`, `Testimonials`, `Sponsors`, `Videos`, `Gallery` |
| `Display Order` | number | Sections render in ascending order |
| `Title` | text | Section-level title (may be blank; e.g. hero has no separate title) |
| `Subtitle` | text | |
| `Body` | long text (markdown) | For Hero → hero description; for Mission → the mission text; for Featured → intro copy |
| `CTA Label` | text | e.g. "Meet the paws" (hero) |
| `CTA URL` | text | e.g. `/adopt` (hero) |
| `Media Reference` | text | Drive filename in `Assets/homepage/` (e.g. `hero-cover.jpg`); resolved to Storage URL at sync time |
| `Data (JSON)` | long text (JSON) | Section-specific structured data. For `Stats`: `[{label,value,note}, …]`. For `Testimonials`: `[{quote,author,role}, …]`. For `Sponsors`: `[{name,logo,url}, …]`. Validated with a per-section Zod schema. |

### Tab: `Dogs`

**Category:** Master Data · **Direction:** Sheets → DB · **DB table:** `animals`
(media auto-discovered from Drive; see [CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md) §12) ·
**Archival:** `status_based` — animals with `Current Status = 'Rainbow Bridge'` and no updates
for > 365 days are archived out of the sheet (still queryable via DB) ·
**Change scope:** all non-system columns except `Public ID` (which the DB assigns on first sync).

One row per animal. Media is **not stored in the sheet** — volunteers drop photos in
`Dogs/<Public ID>/` in Drive, and the media pipeline links them automatically.

| Column | Type | Notes |
|---|---|---|
| `_id`, `_public_id`, `_row_version`, `_sync_status`, `_last_synced`, `_last_error`, `_updated_at`, `_sync_source` | system (8 protected cols) | See Conventions above. |
| `Active` | boolean | Soft-delete flag; `TRUE` by default. |
| `Public ID` | text | `DOG00023` / `CAT00004`. System-assigned on first sync via `next_animal_public_id()`. Read-only after that. |
| `Name` | text | required |
| `Species` | select | `Dog` / `Cat` / `Other` |
| `Gender` | select | `Male` / `Female` / `Unknown` |
| `Age` | text | free label, e.g. "~3 years" |
| `Breed` | text | e.g. "Indie" |
| `Colour` | text | |
| `Weight (kg)` | number | optional |
| `Size` | select | `Small` / `Medium` / `Large` |
| `Zone` | select | matches `Reference — Zones` |
| `Tagline` | text | one-liner shown on cards |
| `Personality` | text | comma-separated tags |
| `Story` | long text (markdown) | full narrative for the profile page |
| `Description` | long text | short bio shown at top of profile |
| `Friendly` | select | `Friendly` / `Selective` / `Cautious` / `Shy` |
| `Vaccinated` | boolean | |
| `Sterilized` | boolean | |
| `Health Status` | select | `Healthy` / `Under Treatment` / `Recovering` / `Monitoring` |
| `Health Note (public)` | text | shown publicly on profile |
| `Internal Note` | text | **never rendered publicly** — staff only |
| `Current Status` | select | `On Campus` / `In Foster` / `In Treatment` / `Adopted` / `Rainbow Bridge` |
| `Adoption Status` | select | `Available` / `Foster Needed` / `Not Available` / `Adopted` |
| `Good With People` | boolean | |
| `Good With Animals` | boolean | |
| `Special Care` | boolean | |
| `Notes` | text | free-form volunteer notes |
| `Cover Image` | text (auto) | Populated by the media pipeline from `Dogs/<Public ID>/cover.*`. Displayed as a Drive file link. **Not manually editable** — protected. |

### Tab: `Medical History`

**Category:** Transaction Data (volunteer-submitted) · **Direction:** Sheets → DB ·
**DB table:** `animal_medical_events` ·
**Archival:** `time_window` — the sheet keeps events from the last 2 years
(`{ column: 'event_date', keep: '2 years' }`); older events remain in the DB and are queryable
via the admin dashboard · **Change scope:** all non-system.

Unlimited rows per animal. Foreign-keyed by `Dog Public ID` (typeable) rather than `_id`.
No `Active` column — Transaction Data rows are not soft-deletable; corrections happen by editing
the row.

| Column | Type | Notes |
|---|---|---|
| `_id`, `_public_id`, `_row_version`, `_sync_status`, `_last_synced`, `_last_error`, `_updated_at`, `_sync_source` | system (8 protected cols) | See Conventions above. |
| `Active` | boolean | Soft-delete flag; `TRUE` by default. |
| `Dog Public ID` | text | FK to `Dogs.Public ID`. Validated at sync time. |
| `Date` | date | required |
| `Event Type` | select | `Vaccination` / `Deworming` / `Sterilization` / `Injury` / `Treatment` / `Checkup` / `Recovery` |
| `Diagnosis` | text | |
| `Treatment` | text | |
| `Medicine` | text | |
| `Veterinarian` | text | vet or clinic name |
| `Public Note` | text | shown on the public timeline |
| `Internal Note` | text | staff-only, never public |
| `Documents` | text | Drive filename(s) from `Dogs/<Public ID>/medical/` (comma-separated); catalogued in `drive_assets`, not auto-published |

### Tab: `Vaccination`

**Category:** Transaction Data (volunteer-submitted) · **Direction:** Sheets → DB ·
**DB table:** `animal_vaccinations` ·
**Archival:** `time_window` — 3 years (`{ column: 'date', keep: '3 years' }`) · **Change scope:** all non-system.

Separate from `Medical History` because vaccinations have a recurring-reminder need (`Due Date`).

| Column | Type | Notes |
|---|---|---|
| `_id`, `_public_id`, `_row_version`, `_sync_status`, `_last_synced`, `_last_error`, `_updated_at`, `_sync_source` | system (8 protected cols) | See Conventions above. |
| `Active` | boolean | Soft-delete flag; `TRUE` by default. |
| `Dog Public ID` | text | FK |
| `Vaccine` | text | e.g. "Anti-rabies" |
| `Date` | date | date given |
| `Due Date` | date | optional — powers a future reminder |
| `Veterinarian` | text | |
| `Notes` | text | |

### Tab: `Sterilization`

**Category:** Transaction Data (volunteer-submitted) · **Direction:** Sheets → DB ·
**DB table:** `animal_sterilizations` · **Archival:** `none` (one row per animal; small tab) ·
**Change scope:** all non-system.

| Column | Type | Notes |
|---|---|---|
| `_id`, `_public_id`, `_row_version`, `_sync_status`, `_last_synced`, `_last_error`, `_updated_at`, `_sync_source` | system (8 protected cols) | See Conventions above. |
| `Active` | boolean | Soft-delete flag; `TRUE` by default. |
| `Dog Public ID` | text | FK |
| `Date` | date | |
| `Doctor` | text | |
| `Hospital` | text | |
| `Notes` | text | |

### Tab: `Adoption`

**Category:** Content · **Direction:** Sheets → DB · **DB table:** `content_adoption` ·
**Archival:** `none` · **Change scope:** all non-system.

Controls the copy on `/adopt` — not the animal list (that comes from `Dogs`), but the page-level
copy around it: intro, categories, instructions, FAQs, success stories.

| Column | Type | Notes |
|---|---|---|
| `_id`, `_public_id`, `_row_version`, `_sync_status`, `_last_synced`, `_last_error`, `_updated_at`, `_sync_source` | system (8 protected cols) | See Conventions above. |
| `Active` | boolean | Soft-delete flag; `TRUE` by default. |
| `Section` | select | `Intro`, `Categories`, `Instructions`, `Success Stories`, `FAQ` |
| `Display Order` | number | |
| `Title` | text | |
| `Body` | long text (markdown) | |
| `Featured Animals` | text | comma-separated `Dog Public ID`s (for `Categories`/`Success Stories`) |
| `Data (JSON)` | long text (JSON) | Section-specific: `Categories` → `[{name, description, icon, filter}, …]`; `FAQ` → `[{question, answer}, …]` |

### Tab: `Donate`

**Category:** Master Data (Campaigns) + Content (page copy) — this tab hybridises both;
in practice, page-level copy rows have `Section != blank` and campaign rows have
`Campaign Name != blank`. If clarity becomes a problem, split into a separate `Donate — Campaigns`
tab (already flagged in [CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md) §4.3). ·
**Direction:** Sheets → DB ·
**DB tables:** `donation_campaigns` (one row per campaign) + `content_donate` (page-level copy) ·
**Archival:** `status_based` — campaigns with `Active = FALSE` for > 180 days are archived out ·
**Change scope:** all non-system except `Raised Amount (INR)` (which is computed from
`donation_confirmations` and echoed back into the sheet by DB→Sheets sync).

| Column | Type | Notes |
|---|---|---|
| `_id`, `_public_id`, `_row_version`, `_sync_status`, `_last_synced`, `_last_error`, `_updated_at`, `_sync_source` | system (8 protected cols) | See Conventions above. |
| `Active` | boolean | Soft-delete flag; `TRUE` by default. |
| `Campaign Name` | text | required |
| `Slug` | text | URL-safe unique key |
| `Category` | select | `Feeding` / `Treatment` / `Vaccination` / `Sterilization` / `Recovery` / `Emergency` |
| `Description` | long text (markdown) | |
| `Goal Amount (INR)` | number | integer |
| `Raised Amount (INR)` | number (auto) | **Read-only** — computed by DB, echoed back on sync. Protected. |
| `Display Progress` | boolean | show/hide the progress bar |
| `QR Image` | text | Drive filename in `Assets/donation-qr/`; resolved to Storage URL |
| `UPI ID` | text | e.g. `awskgp@upi` |
| `Account Holder` | text | |
| `Featured` | boolean | pin to homepage |
| `Display Order` | number | |
| `Linked Dog Public ID` | text | optional — for treatment/recovery campaigns tied to one animal |

### Tab: `Stories`

**Category:** Content · **Direction:** Sheets → DB · **DB table:** `stories` (media
auto-discovered from `Stories/<Slug>/`) ·
**Archival:** `status_based` — `Published = FALSE` for > 180 days are archived out ·
**Change scope:** all non-system.

| Column | Type | Notes |
|---|---|---|
| `_id`, `_public_id`, `_row_version`, `_sync_status`, `_last_synced`, `_last_error`, `_updated_at`, `_sync_source` | system (8 protected cols) | See Conventions above. |
| `Active` | boolean | Soft-delete flag; `TRUE` by default. |
| `Slug` | text | url-safe, unique |
| `Title` | text | |
| `Category` | select | `Rescue` / `Recovery` / `Adoption` / `Campus Paw` / `Volunteer Diary` / `Education` |
| `Related Dog Public ID` | text | optional FK |
| `Author` | text | |
| `Date` | date | publish date |
| `Excerpt` | text | ~200 chars, shown on cards |
| `Markdown` | long text (markdown) | full post body |
| `Tags` | text | comma-separated |
| `SEO Title` | text | ~60 chars |
| `SEO Description` | text | ~155 chars |
| `Published` | boolean | `TRUE` → visible on `/stories`; `FALSE` → draft (still synced to DB, `status: 'draft'`) |
| `Featured` | boolean | pin to homepage |
| `Cover Image` | text (auto) | populated from `Stories/<Slug>/cover.*` |

### Tab: `Volunteers`

**Category:** Master Data · **Direction:** Sheets → DB ·
**DB table:** `volunteer_directory` (public-facing) — **not** `volunteers` (which is the
applicant/roster table populated by the signup form) ·
**Archival:** `none` · **Change scope:** all non-system.

| Column | Type | Notes |
|---|---|---|
| `_id`, `_public_id`, `_row_version`, `_sync_status`, `_last_synced`, `_last_error`, `_updated_at`, `_sync_source` | system (8 protected cols) | See Conventions above. |
| `Active` | boolean | Soft-delete flag; `TRUE` by default. |
| `Name` | text | |
| `Role` | text | e.g. "Coordinator, Vaccination Drives" |
| `Contact` | text | public-facing contact (typically an email; never a personal phone) |
| `Photo` | text | Drive filename in `Assets/volunteers/`; resolved to Storage URL |
| `Responsibilities` | text | comma-separated |
| `Bio` | long text | optional |
| `Display Order` | number | |

### Tab: `Help`

**Category:** Content · **Direction:** Sheets → DB · **DB table:** `content_help` ·
**Archival:** `none` · **Change scope:** all non-system.

| Column | Type | Notes |
|---|---|---|
| `_id`, `_public_id`, `_row_version`, `_sync_status`, `_last_synced`, `_last_error`, `_updated_at`, `_sync_source` | system (8 protected cols) | See Conventions above. |
| `Active` | boolean | Soft-delete flag; `TRUE` by default. |
| `Section` | select | `Volunteer Opportunities`, `Foster Information`, `Emergency Help`, `Contact Card`, `How to Help` |
| `Display Order` | number | |
| `Title` | text | |
| `Body` | long text (markdown) | |
| `Icon` | text | lucide-react icon name, e.g. `heart-handshake` |
| `CTA Label` | text | |
| `CTA URL` | text | |
| `Data (JSON)` | long text (JSON) | Section-specific: `Contact Card` → `{name, role, phone, email, avatar}`; `Volunteer Opportunities` → `[{role, commitment, description}, …]` |

### Tab: `Events`

**Category:** Content · **Direction:** Sheets → DB · **DB table:** `content_events`
(media auto-discovered from `Events/<Slug>/`) ·
**Archival:** `status_based` — events with `End Date` more than 90 days in the past are archived out ·
**Change scope:** all non-system.

| Column | Type | Notes |
|---|---|---|
| `_id`, `_public_id`, `_row_version`, `_sync_status`, `_last_synced`, `_last_error`, `_updated_at`, `_sync_source` | system (8 protected cols) | See Conventions above. |
| `Active` | boolean | Soft-delete flag; `TRUE` by default. |
| `Slug` | text | url-safe, unique |
| `Title` | text | |
| `Type` | select | `Feeding Drive` / `Vaccination Camp` / `Adoption Camp` / `Fundraiser` / `Volunteer Meet` |
| `Start Date` | datetime | |
| `End Date` | datetime | optional |
| `Location` | text | |
| `Description` | long text (markdown) | |
| `RSVP URL` | text | optional external link |
| `Featured` | boolean | pin to homepage |
| `Display Order` | number | ties broken by Start Date |

### Tab: `FAQ`

**Category:** Content · **Direction:** Sheets → DB · **DB table:** `content_faq` ·
**Archival:** `none` · **Change scope:** all non-system.

| Column | Type | Notes |
|---|---|---|
| `_id`, `_public_id`, `_row_version`, `_sync_status`, `_last_synced`, `_last_error`, `_updated_at`, `_sync_source` | system (8 protected cols) | See Conventions above. |
| `Active` | boolean | Soft-delete flag; `TRUE` by default. |
| `Category` | select | `General`, `Adoption`, `Donation`, `Volunteering`, `Reporting`, `Medical` |
| `Question` | text | |
| `Answer` | long text (markdown) | |
| `Display Order` | number | |

### Tab: `Navigation`

**Category:** Content · **Direction:** Sheets → DB · **DB table:** `content_navigation` ·
**Archival:** `none` · **Change scope:** all non-system.

One row per menu item. Supports one level of nesting via `Parent Label`.

| Column | Type | Notes |
|---|---|---|
| `_id`, `_public_id`, `_row_version`, `_sync_status`, `_last_synced`, `_last_error`, `_updated_at`, `_sync_source` | system (8 protected cols) | See Conventions above. |
| `Active` | boolean | Soft-delete flag; `TRUE` by default. |
| `Label` | text | |
| `URL` | text | internal path (`/adopt`) or external URL (`https://…`) |
| `Icon` | text | optional lucide-react icon name |
| `Parent Label` | text | optional — for submenus. Blank = top-level. |
| `Display Order` | number | |
| `Visible` | boolean | |
| `Open In New Tab` | boolean | for external links |

### Tab: `Footer`

**Category:** Content · **Direction:** Sheets → DB · **DB table:** `content_footer` ·
**Archival:** `none` · **Change scope:** all non-system.

One row per footer element.

| Column | Type | Notes |
|---|---|---|
| `_id`, `_public_id`, `_row_version`, `_sync_status`, `_last_synced`, `_last_error`, `_updated_at`, `_sync_source` | system (8 protected cols) | See Conventions above. |
| `Active` | boolean | Soft-delete flag; `TRUE` by default. |
| `Section` | select | `Social Link`, `Quick Link`, `Contact`, `Copyright`, `Newsletter Blurb` |
| `Display Order` | number | |
| `Label` | text | e.g. "Instagram" |
| `URL` | text | e.g. `https://instagram.com/…` |
| `Icon` | text | e.g. `instagram` |
| `Value` | text | e.g. `+91 …` (for `Contact`) or the copyright text |

### Tab: `Website Settings`

**Category:** Master Data · **Direction:** Sheets → DB ·
**DB table:** `content_settings` (renamed from `site_settings`) ·
**Archival:** `none` · **Change scope:** the `Value` column.

Key/value table. Each row is a single setting. The engine validates the `Value` against a
Zod schema keyed by `Key`.

| Column | Type | Notes |
|---|---|---|
| `_id`, `_public_id`, `_row_version`, `_sync_status`, `_last_synced`, `_last_error`, `_updated_at`, `_sync_source` | system (8 protected cols) | See Conventions above. Master Data — key/value table, no `Active` column (settings are always active; disabling one means removing it). |
| `Key` | text | e.g. `site_name`, `logo_url`, `seo_default_title` |
| `Value` | text or JSON | typed per key |
| `Description` | text | human-readable purpose (documentation-only; not synced) |

**Well-known keys:**

| Key | Value type | Purpose |
|---|---|---|
| `site_name` | text | e.g. "KGP PAWS" |
| `site_tagline` | text | shown next to logo |
| `logo_url` | text | Drive filename in `Assets/branding/` |
| `favicon_url` | text | same |
| `seo_default_title` | text | fallback for pages without a specific title |
| `seo_default_description` | text | ~155 chars |
| `seo_default_og_image` | text | Drive filename |
| `google_analytics_id` | text | e.g. `G-XXXXXXX` |
| `google_search_console_verification` | text | meta-tag content |
| `theme` | JSON | `{"palette":{"forest":"…","cream":"…"}}` — overrides `app/globals.css` tokens |
| `announcement_banner` | JSON | `{"enabled":true,"text":"…","cta":{"label":"…","url":"…"},"variant":"info"}` |
| `emergency_contact_phone` | text | |
| `emergency_contact_email` | text | |
| `emergency_contact_whatsapp` | text | |

---

## Transaction Data tabs — public-submitted (Supabase → Sheets)

Rows are written by the public website into Supabase; the sync engine appends them to Sheets so
volunteers can triage. **Volunteers/admins may only edit workflow columns** (see
[CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md) §6.3) — everything else is protected.

### Tab: `Adoption Applications`

**Category:** Transaction Data (public-submitted) · **Direction:** DB → Sheets
(workflow fields dual-owned) · **DB table:** `adoption_applications` ·
**Archival:** `status_based` — applications with `Status in ('Adopted', 'Not Selected')` for
> 90 days are archived out · **Change scope:** `Status`, `Internal Notes`, `Meet At` only.

| Column | Type | Editable? | Notes |
|---|---|---|---|
| `_id`, `_public_id`, `_row_version`, `_sync_status`, `_last_synced`, `_last_error`, `_updated_at`, `_sync_source` | system (8 protected cols) | ❌ | See Conventions above. Transaction Data — no `Active` column. |
| `Application Code` | text | ❌ | e.g. `PAWS-ADOPT-2026-00042` |
| `Dog Public ID` | text | ❌ | |
| `Applicant Name` | text | ❌ | |
| `Applicant Email` | text | ❌ | |
| `Applicant Phone` | text | ❌ | coordinators-only, hidden from public views |
| `Living Situation` | text | ❌ | JSON summary |
| `Experience` | text | ❌ | JSON summary |
| `Motivation` | text | ❌ | |
| `Status` | select | ✅ | `Submitted` / `Under Review` / `Contacted` / `Meet Scheduled` / `Approved` / `Not Selected` / `Adopted` |
| `Meet At` | datetime | ✅ | optional |
| `Internal Notes` | text | ✅ | staff-only |
| `Submitted At` | timestamp | ❌ | |

### Tab: `Donation Confirmations`

**Category:** Transaction Data (public-submitted) · **Direction:** DB → Sheets
(workflow fields dual-owned) · **DB table:** `donation_confirmations` ·
**Archival:** `size_threshold` — the 500 most recent submissions
(`{ order_by: 'submitted_at', keep_newest: 500 }`) stay in the sheet ·
**Change scope:** `Status`, `Show Publicly` only.

| Column | Type | Editable? | Notes |
|---|---|---|---|
| `_id`, `_public_id`, `_row_version`, `_sync_status`, `_last_synced`, `_last_error`, `_updated_at`, `_sync_source` | system (8 protected cols) | ❌ | See Conventions above. Transaction Data — no `Active` column. |
| `Campaign Slug` | text | ❌ | |
| `Donor Name` | text | ❌ | |
| `Email` | text | ❌ | optional |
| `Phone` | text | ❌ | optional, coordinators-only |
| `Amount (INR)` | number | ❌ | |
| `UTR / Transaction ID` | text | ❌ | donor-reported |
| `Purpose` | text | ❌ | |
| `Message` | text | ❌ | |
| `Status` | select | ✅ | `Pending` / `Approved` / `Rejected` |
| `Show Publicly` | boolean | ✅ | powers "Recent Donors" wall once Approved |
| `Submitted At` | timestamp | ❌ | |

### Tab: `Reports`

**Category:** Transaction Data (public-submitted) · **Direction:** DB → Sheets
(workflow fields dual-owned) · **DB table:** `rescue_reports` ·
**Archival:** `status_based` — reports with `Status = 'Resolved'` and `updated_at` older than
30 days are archived out (queryable via admin dashboard) ·
**Change scope:** `Status`, `Assigned Volunteer`, `Linked Dog Public ID` only.

**Never present in this tab (server-side only):** precise `lat`/`lng` coordinates,
`reporter_contact` phone/email.

| Column | Type | Editable? | Notes |
|---|---|---|---|
| `_id`, `_public_id`, `_row_version`, `_sync_status`, `_last_synced`, `_last_error`, `_updated_at`, `_sync_source` | system (8 protected cols) | ❌ | See Conventions above. Transaction Data — no `Active` column. |
| `Report Code` | text | ❌ | e.g. `PAWS-RESCUE-2026-00128` |
| `Animal Type` | select | ❌ | `Dog` / `Cat` / `Other` |
| `Category` | select | ❌ | `Injured` / `Missing` / `Emergency` / `Dead Animal` / `Other` |
| `Severity` | select | ❌ | `Emergency` / `Urgent` / `Moderate` / `Low` |
| `Zone` | text | ❌ | public-safe zone id |
| `Location Note` | text | ❌ | free text; precise coords never appear |
| `Description` | text | ❌ | |
| `Photo` | text | ❌ | Storage URL |
| `Status` | select | ✅ | `Reported` / `Volunteer Assigned` / `On the Way` / `Animal Located` / `Treatment Started` / `Monitoring` / `Resolved` |
| `Assigned Volunteer` | text | ✅ | matches a row in `Volunteers` tab by Name (or blank) |
| `Linked Dog Public ID` | text | ✅ | optional — once the animal is identified |
| `Reported At` | timestamp | ❌ | |

---

## Reference tabs (admin-only, dropdown sources)

Reference tabs are **not synced as content**. They power Sheets data-validation dropdowns and
are edited only when the underlying Postgres enum changes (which is a schema migration, not a
CMS update).

### Tab: `Reference — Zones`

| Column | Notes |
|---|---|
| `Zone ID` | e.g. `tech-market`, `main-building`, `patel-hall` |
| `Zone Name` | e.g. "Tech Market", "Main Building" |
| `Notes` | |

Used by `Dogs.Zone` and `Reports.Zone` dropdowns.

### Tab: `Reference — Categories`

| Column | Notes |
|---|---|
| `Category Type` | `blog` / `report` / `donation` / `event` / `help` |
| `Category ID` | machine-readable slug |
| `Category Label` | display name |

### Tab: `Reference — Statuses`

| Column | Notes |
|---|---|
| `Entity` | `adoption` / `donation` / `report` |
| `Status ID` | matches the Postgres enum value |
| `Status Label` | display name |
| `Display Order` | for sorting |

---

## Access model

- **Volunteers/admins:** shared as **Editor** on the spreadsheet.
- **Sync service account:** shared as **Editor** on the spreadsheet, **Viewer** on the media
  Drive folders (`Dogs/`, `Stories/`, `Events/`, `Assets/`). Service account never has write
  access to Drive.
- **Protected ranges** (service-account-only edit), enforced via Sheets API on first sync:
  - All system columns (`_id`, `_row_version`, `_synced_at`, `_status`) on every tab.
  - `Public ID` column on `Dogs`.
  - `Raised Amount (INR)` on `Donate`.
  - `Cover Image` column on `Dogs` and `Stories` (populated by the media pipeline).
  - All non-workflow columns on transactional tabs.

---

## Header verification

The sync engine's first step on every run is a header check. Expected headers per tab are
hard-coded in `lib/sync/tabs/<tab-name>.ts`. Any drift (renamed, reordered, or missing columns)
aborts the run with `header_mismatch`, surfaces in the admin dashboard, and requires the sheet
to be fixed before sync resumes. No silent failure ever.

---

## Change history

| Date | Change |
|---|---|
| 2026-07-16 | Initial 10-tab draft. |
| 2026-07-17 | Rewritten for the CMS-first architecture. Now 18 content + transactional tabs, ownership direction per tab, explicit DB mapping per tab, workflow-field callouts. Supersedes the pre-2026-07-17 draft in full. |
| 2026-07-17 | Owner-approved refinements applied: (a) system columns expanded to 8 (`_id`, `_public_id`, `_row_version`, `_sync_status`, `_last_synced`, `_last_error`, `_updated_at`, `_sync_source`) — replaces the previous 4-column set; (b) tabs categorized into Content / Master Data / Transaction Data; (c) archival policy declared per tab; (d) `Active` clarified as a user column (not system) present only where soft-delete makes sense. |
