# KGP PAWS — Google Sheets CMS Schema

Living document. Last updated **2026-07-17**. Column-level contract for the sync engine.
Design rationale: [CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md) · edit-permission summary:
[CMS_ARCHITECTURE.md §4.7 Sync Matrix](CMS_ARCHITECTURE.md#47-sync-matrix-authoritative-summary) ·
operations: [CMS_OPERATIONS.md](CMS_OPERATIONS.md).

**One spreadsheet:** `KGP PAWS CMS` — location `KGP PAWS/CMS/` in Drive.

**Eighteen editable tabs + three reference tabs**, grouped by category. Tab names are **exact
and case-sensitive** — the sync engine matches these literal strings.

| Category | Tabs |
|---|---|
| **Content** (9) | `Home` · `Adoption` · `Donate` · `Stories` · `Help` · `Events` · `FAQ` · `Navigation` · `Footer` |
| **Master Data** (3 + 3 reference) | `Dogs` · `Volunteers` · `Website Settings` · `Reference — Zones` · `Reference — Categories` · `Reference — Statuses` |
| **Transaction Data** (6) | volunteer-submitted: `Medical History` · `Vaccination` · `Sterilization` — public-submitted: `Adoption Applications` · `Donation Confirmations` · `Reports` |

*(The `Donate` tab carries campaign rows — Master Data in nature — alongside page-copy rows;
see its section for the two row shapes.)*

---

## Conventions

### System columns (columns A–H on every editable tab, in this exact order)

All eight are **protected ranges** — only the service account can write them. Volunteers see
them but cannot edit them. Business columns start at column I.

| # | Column | Type | Written when | Purpose |
|---|---|---|---|---|
| A | `_id` | UUID text | first sync of the row | Stable row ID. Never changes; row position never matters. |
| B | `_public_id` | text | first sync | Human-typeable ID where one exists (`DOG00023`, a slug). Blank otherwise. |
| C | `_row_version` | integer | every write | Monotonic counter; drives conflict detection. |
| D | `_sync_status` | text | every sync touching the row | `OK` / `PENDING` / `ERROR` / `CONFLICT`. |
| E | `_last_synced` | ISO timestamp | every successful sync | Last successful sync of this row. |
| F | `_last_error` | text | on validation failure | Human-readable reason when `_sync_status = ERROR`; blank otherwise. |
| G | `_updated_at` | ISO timestamp | every write (either side) | Drives incremental sync — the engine reads only this column to find changed rows. |
| H | `_sync_source` | text | every write | `sheets` \| `app` \| `trigger` \| `system`. |

### The `Active` column

A normal user-editable boolean, present only where volunteer soft-delete makes sense (see
[CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md) §4.6): all Content tabs, `Dogs`, `Volunteers`, and
the three volunteer-submitted Transaction tabs. Not present on `Website Settings` or the
public-submitted Transaction tabs. `FALSE` = soft delete; nothing is ever hard-deleted.

### Validation model

Validation runs in the sync engine (Zod, layer 2 of
[CMS_ARCHITECTURE.md §8.1](CMS_ARCHITECTURE.md#81-validation-layers)) — Sheets data-validation
dropdowns are a UX nicety layered on top, not the enforcement. A failing row gets
`_sync_status = ERROR` + `_last_error` and is skipped; the run continues.

Common rules referenced below:

| Rule | Meaning |
|---|---|
| `bool` | `TRUE` / `FALSE` (also accepts `yes`/`no`/`1`/`0`, case-insensitive; normalized on write-back) |
| `date` | `YYYY-MM-DD` |
| `datetime` | `YYYY-MM-DD HH:MM` (IST assumed) |
| `slug` | `^[a-z0-9]+(-[a-z0-9]+)*$`, unique within its tab |
| `public-id` | `^(DOG|CAT|OTH)\d{5}$`; FK rules also require the animal to exist |
| `url` | absolute `https://…` or site-internal path starting `/` |
| `json:<schema>` | must parse as JSON and match the named Zod schema |
| `drive:<folder>` | filename must exist in the stated Drive folder at sync time (checked against `drive_assets`) |

### Header verification

The engine's first step on every run compares the header row against this document's column
lists (system columns by position A–H; business columns **by name**, order-independent from
column I). Any missing or unknown header aborts the run with `header_mismatch` — see
[CMS_OPERATIONS.md](CMS_OPERATIONS.md) §2 for how columns are added safely.

---

# Content tabs (Sheets → Supabase)

### Tab: `Home` → `content_home` · archival: none

One row per homepage section slot.

| Column | Type | Req | Validation |
|---|---|---|---|
| `Section` | select | ✓ | one of `Hero`, `Mission`, `Stats`, `Featured`, `Testimonials`, `Sponsors`, `Videos`, `Gallery` |
| `Display Order` | int | ✓ | ≥ 0; unique within a Section |
| `Title` | text | – | ≤ 120 chars |
| `Subtitle` | text | – | ≤ 200 chars |
| `Body` | markdown | – | ≤ 5,000 chars |
| `CTA Label` | text | – | ≤ 40 chars; requires `CTA URL` |
| `CTA URL` | url | – | `url` rule |
| `Media Reference` | text | – | `drive:Assets/homepage/` |
| `Data (JSON)` | json | – | per-section: `Stats` → `json:statItems` `[{label,value,note?}]`; `Testimonials` → `json:testimonials` `[{quote,author,role?}]`; `Sponsors` → `json:sponsors` `[{name,logo,url?}]`; `Videos` → `json:videos` `[{title,youtubeUrl}]` |
| `Active` | bool | ✓ | `bool` rule |

### Tab: `Adoption` → `content_adoption` · archival: none

| Column | Type | Req | Validation |
|---|---|---|---|
| `Section` | select | ✓ | `Intro`, `Categories`, `Instructions`, `Success Stories`, `FAQ` |
| `Display Order` | int | ✓ | ≥ 0; unique within Section |
| `Title` | text | – | ≤ 120 chars |
| `Body` | markdown | – | ≤ 5,000 chars |
| `Featured Animals` | text | – | comma-separated `public-id`s, each must exist and be `Active` |
| `Data (JSON)` | json | – | `Categories` → `json:adoptCategories`; `FAQ` → `json:qaPairs` `[{question,answer}]` |
| `Active` | bool | ✓ | |

### Tab: `Donate` → `donation_campaigns` + `content_donate` · archival: status_based (inactive > 180 d)

**Two row shapes**, discriminated by which of the two required-one-of columns is filled:
a **campaign row** has `Campaign Name` set (and `Section` blank); a **page-copy row** has
`Section` set (and `Campaign Name` blank). A row with both or neither → `ERROR`.

| Column | Type | Req | Validation |
|---|---|---|---|
| `Section` | select | copy rows | `Intro`, `Transparency`, `Thank You` |
| `Campaign Name` | text | campaign rows | ≤ 100 chars |
| `Slug` | slug | campaign rows | `slug` rule, unique |
| `Category` | select | campaign rows | `Feeding`, `Treatment`, `Vaccination`, `Sterilization`, `Recovery`, `Emergency` |
| `Description` / `Body` | markdown | – | ≤ 5,000 chars |
| `Goal Amount (INR)` | int | campaign rows | > 0; integer rupees |
| `Raised Amount (INR)` | int | system | **read-only** — computed from approved `donation_confirmations`, echoed back by DB→Sheets sync |
| `Display Progress` | bool | – | default `TRUE` |
| `QR Image` | text | – | `drive:Assets/donation-qr/` |
| `UPI ID` | text | – | `^[\w.\-]+@[a-z]+$` |
| `Account Holder` | text | – | ≤ 100 chars |
| `Featured` | bool | – | at most 3 campaign rows `TRUE` |
| `Display Order` | int | ✓ | ≥ 0 |
| `Linked Dog Public ID` | text | – | `public-id`, must exist |
| `Active` | bool | ✓ | |

### Tab: `Stories` → `stories` · archival: status_based (draft > 180 d)

Media auto-discovered from `Stories/<Slug>/` in Drive — no image URLs in the sheet.

| Column | Type | Req | Validation |
|---|---|---|---|
| `Slug` | slug | ✓ | `slug` rule, unique |
| `Title` | text | ✓ | ≤ 120 chars |
| `Category` | select | ✓ | from `Reference — Categories` (type `blog`) |
| `Related Dog Public ID` | text | – | `public-id`, must exist |
| `Author` | text | ✓ | ≤ 80 chars |
| `Date` | date | ✓ | `date` rule; publish date |
| `Excerpt` | text | – | ≤ 300 chars |
| `Markdown` | markdown | ✓ | ≤ 50,000 chars; image refs use `![](drive:<filename>)` resolved against `Stories/<Slug>/images/` |
| `Tags` | text | – | comma-separated, ≤ 10 tags, each ≤ 30 chars |
| `SEO Title` | text | – | ≤ 60 chars |
| `SEO Description` | text | – | ≤ 160 chars |
| `Published` | bool | ✓ | `FALSE` → synced as draft, not publicly visible |
| `Featured` | bool | – | |
| `Cover Image` | text | system | **read-only** — filled by the media pipeline from `Stories/<Slug>/cover.*` |
| `Active` | bool | ✓ | |

### Tab: `Help` → `content_help` · archival: none

| Column | Type | Req | Validation |
|---|---|---|---|
| `Section` | select | ✓ | `Volunteer Opportunities`, `Foster Information`, `Emergency Help`, `Contact Card`, `How to Help` |
| `Display Order` | int | ✓ | ≥ 0; unique within Section |
| `Title` | text | – | ≤ 120 chars |
| `Body` | markdown | – | ≤ 5,000 chars |
| `Icon` | text | – | lucide-react icon name, kebab-case |
| `CTA Label` | text | – | ≤ 40 chars; requires `CTA URL` |
| `CTA URL` | url | – | `url` rule |
| `Data (JSON)` | json | – | `Contact Card` → `json:contactCard` `{name,role,phone?,email?}`; `Volunteer Opportunities` → `json:opportunities` `[{role,commitment,description}]` |
| `Active` | bool | ✓ | |

### Tab: `Events` → `content_events` · archival: status_based (ended > 90 d)

| Column | Type | Req | Validation |
|---|---|---|---|
| `Slug` | slug | ✓ | unique |
| `Title` | text | ✓ | ≤ 120 chars |
| `Type` | select | ✓ | `Feeding Drive`, `Vaccination Camp`, `Adoption Camp`, `Fundraiser`, `Volunteer Meet` |
| `Start Date` | datetime | ✓ | `datetime` rule |
| `End Date` | datetime | – | ≥ `Start Date` |
| `Location` | text | – | ≤ 160 chars |
| `Description` | markdown | – | ≤ 5,000 chars |
| `RSVP URL` | url | – | https only |
| `Featured` | bool | – | |
| `Display Order` | int | ✓ | ties broken by `Start Date` |
| `Active` | bool | ✓ | |

### Tab: `FAQ` → `content_faq` · archival: none

| Column | Type | Req | Validation |
|---|---|---|---|
| `Category` | select | ✓ | `General`, `Adoption`, `Donation`, `Volunteering`, `Reporting`, `Medical` |
| `Question` | text | ✓ | ≤ 200 chars; unique within Category |
| `Answer` | markdown | ✓ | ≤ 2,000 chars |
| `Display Order` | int | ✓ | ≥ 0 |
| `Active` | bool | ✓ | |

### Tab: `Navigation` → `content_navigation` · archival: none

One row per menu item; one level of nesting via `Parent Label`.

| Column | Type | Req | Validation |
|---|---|---|---|
| `Label` | text | ✓ | ≤ 30 chars; unique among siblings |
| `URL` | url | ✓ | `url` rule |
| `Icon` | text | – | lucide-react icon name |
| `Parent Label` | text | – | must equal an existing top-level `Label`; grandchildren rejected |
| `Display Order` | int | ✓ | unique among siblings |
| `Visible` | bool | ✓ | |
| `Open In New Tab` | bool | – | only meaningful for external URLs |
| `Active` | bool | ✓ | |

### Tab: `Footer` → `content_footer` · archival: none

| Column | Type | Req | Validation |
|---|---|---|---|
| `Section` | select | ✓ | `Social Link`, `Quick Link`, `Contact`, `Copyright`, `Newsletter Blurb` |
| `Display Order` | int | ✓ | ≥ 0 |
| `Label` | text | – | ≤ 40 chars; required for `Social Link` / `Quick Link` |
| `URL` | url | – | required for `Social Link` / `Quick Link` |
| `Icon` | text | – | e.g. `instagram` |
| `Value` | text | – | ≤ 200 chars; required for `Contact` / `Copyright` |
| `Active` | bool | ✓ | |

---

# Master Data tabs (Sheets → Supabase)

### Tab: `Dogs` → `animals` · archival: manual (→ status_based once `Current Status` lands in M-CMS-3)

One row per animal. Media is never in the sheet — volunteers drop photos in
`Dogs/<Public ID>/`; the pipeline links them (see [CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md) §12).

| Column | Type | Req | Validation |
|---|---|---|---|
| `Public ID` | text | system | **read-only** — DB-assigned on first sync (`public-id` pattern) |
| `Name` | text | ✓ | ≤ 60 chars |
| `Species` | select | ✓ | `Dog`, `Cat`, `Other` |
| `Gender` | select | ✓ | `Male`, `Female`, `Unknown` |
| `Age` | text | – | ≤ 40 chars, free label ("~3 years") |
| `Breed` | text | – | ≤ 60 chars |
| `Colour` | text | – | ≤ 60 chars |
| `Weight (kg)` | number | – | 0 < w ≤ 100 |
| `Size` | select | ✓ | `Small`, `Medium`, `Large` |
| `Zone` | select | ✓ | must exist in `Reference — Zones` |
| `Tagline` | text | – | ≤ 120 chars |
| `Personality` | text | – | comma-separated, ≤ 10 tags, each ≤ 30 chars |
| `Description` | text | – | ≤ 1,000 chars; short bio at top of profile |
| `Story` | markdown | – | ≤ 20,000 chars; full narrative |
| `Friendly` | select | ✓ | `Friendly`, `Selective`, `Cautious`, `Shy` |
| `Vaccinated` | bool | ✓ | |
| `Sterilized` | bool | ✓ | |
| `Health Status` | select | ✓ | `Healthy`, `Under Treatment`, `Recovering`, `Monitoring` |
| `Health Note (public)` | text | – | ≤ 500 chars; publicly visible |
| `Internal Note` | text | – | ≤ 2,000 chars; **never rendered publicly** |
| `Current Status` | select | ✓ | `On Campus`, `In Foster`, `In Treatment`, `Adopted`, `Rainbow Bridge` *(column lands with M-CMS-3 schema)* |
| `Adoption Status` | select | ✓ | `Available`, `Foster Needed`, `Not Available`, `Adopted` |
| `Good With People` | bool | – | |
| `Good With Animals` | bool | – | |
| `Special Care` | bool | – | |
| `Notes` | text | – | ≤ 2,000 chars; free volunteer notes |
| `Cover Image` | text | system | **read-only** — filled by the pipeline from `Dogs/<Public ID>/cover.*` |
| `Active` | bool | ✓ | |

### Tab: `Volunteers` → `volunteer_directory` · archival: none

Public-facing directory — **not** the applicant roster (`volunteers` table, populated by the
signup form).

| Column | Type | Req | Validation |
|---|---|---|---|
| `Name` | text | ✓ | ≤ 80 chars |
| `Role` | text | – | ≤ 80 chars |
| `Contact` | text | – | email format; personal phone numbers rejected by pattern (public page!) |
| `Photo` | text | – | `drive:Volunteers/` |
| `Responsibilities` | text | – | comma-separated, ≤ 10 items |
| `Bio` | text | – | ≤ 1,000 chars |
| `Display Order` | int | ✓ | ≥ 0 |
| `Active` | bool | ✓ | |

### Tab: `Website Settings` → `content_settings` · archival: none · no `Active` column

Key/value rows; only `Value` is volunteer-editable. `Value` is validated per key.

| Column | Type | Req | Validation |
|---|---|---|---|
| `Key` | text | ✓ | `^[a-z0-9_]+$`; must be a known key (below) — unknown keys → `ERROR`, not silently stored |
| `Value` | text/json | ✓ | typed per key (below) |
| `Description` | text | – | documentation only; not synced |

| Key | Value validation |
|---|---|
| `site_name`, `site_tagline` | text ≤ 80 |
| `logo_url`, `favicon_url`, `seo_default_og_image` | `drive:Assets/branding/` |
| `seo_default_title` | text ≤ 60 |
| `seo_default_description` | text ≤ 160 |
| `google_analytics_id` | `^G-[A-Z0-9]+$` |
| `google_search_console_verification` | text ≤ 100 |
| `theme` | `json:theme` — palette token overrides |
| `announcement_banner` | `json:banner` — `{enabled,text,cta?{label,url},variant}` |
| `emergency_contact_phone`, `emergency_contact_whatsapp` | E.164 phone |
| `emergency_contact_email` | email |

### Reference tabs (admin-only; mirror Postgres enums; not synced as content)

`Reference — Zones` (`Zone ID`, `Zone Name`, `Notes`) · `Reference — Categories`
(`Category Type` ∈ blog/report/donation/event/help, `Category ID`, `Category Label`) ·
`Reference — Statuses` (`Entity` ∈ adoption/donation/report, `Status ID`, `Status Label`,
`Display Order`). Edited only alongside the corresponding enum migration.

---

# Transaction Data tabs — volunteer-submitted (Sheets → Supabase)

No `Cover Image`/media columns; documents referenced by filename. These tabs have an `Active`
column (soft-delete for mistaken entries — row stays in the DB for audit).

### Tab: `Medical History` → `animal_medical_events` · archival: time_window (last 2 years in-sheet)

| Column | Type | Req | Validation |
|---|---|---|---|
| `Dog Public ID` | text | ✓ | `public-id`, must exist |
| `Date` | date | ✓ | not > 1 day in the future |
| `Event Type` | select | ✓ | `Vaccination`, `Deworming`, `Sterilization`, `Injury`, `Treatment`, `Checkup`, `Recovery` |
| `Diagnosis` | text | – | ≤ 500 chars |
| `Treatment` | text | – | ≤ 500 chars |
| `Medicine` | text | – | ≤ 300 chars |
| `Veterinarian` | text | – | ≤ 120 chars |
| `Public Note` | text | – | ≤ 1,000 chars; shown on the public timeline |
| `Internal Note` | text | – | ≤ 2,000 chars; staff-only |
| `Documents` | text | – | comma-separated filenames, each `drive:Dogs/<Public ID>/medical/`; catalogued, never auto-published |
| `Active` | bool | ✓ | |

### Tab: `Vaccination` → `animal_vaccinations` · archival: time_window (3 years)

| Column | Type | Req | Validation |
|---|---|---|---|
| `Dog Public ID` | text | ✓ | `public-id`, must exist |
| `Vaccine` | text | ✓ | ≤ 80 chars |
| `Date` | date | ✓ | not > 1 day in the future |
| `Due Date` | date | – | ≥ `Date` |
| `Veterinarian` | text | – | ≤ 120 chars |
| `Notes` | text | – | ≤ 500 chars |
| `Active` | bool | ✓ | |

### Tab: `Sterilization` → `animal_sterilizations` · archival: none

| Column | Type | Req | Validation |
|---|---|---|---|
| `Dog Public ID` | text | ✓ | `public-id`, must exist; at most one `Active` row per animal |
| `Date` | date | ✓ | not > 1 day in the future |
| `Doctor` | text | – | ≤ 120 chars |
| `Hospital` | text | – | ≤ 120 chars |
| `Notes` | text | – | ≤ 500 chars |
| `Active` | bool | ✓ | |

---

# Transaction Data tabs — public-submitted (Supabase → Sheets)

Rows originate from website forms. Only the marked **workflow** columns are Sheets-editable
(dual-owned, resolved by `_row_version` — [CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md) §6.3);
everything else is a protected range. No `Active` column. **Privacy allowlist:** the DB→Sheets
writer sends only the columns listed here — `lat`/`lng` and raw reporter contact details are
never written to the spreadsheet.

### Tab: `Adoption Applications` ← `adoption_applications` · archival: status_based (closed > 90 d)

| Column | Type | Editable | Validation (for workflow edits) |
|---|---|---|---|
| `Application Code` | text | ❌ | |
| `Dog Public ID` | text | ❌ | |
| `Applicant Name` / `Applicant Email` / `Applicant Phone` | text | ❌ | phone visible to coordinators via this sheet — sheet sharing is the access boundary |
| `Living Situation` / `Experience` / `Motivation` | text | ❌ | JSON summaries flattened to readable text |
| `Status` | select | ✅ workflow | `Submitted`, `Under Review`, `Contacted`, `Meet Scheduled`, `Approved`, `Not Selected`, `Adopted` |
| `Meet At` | datetime | ✅ workflow | `datetime` rule |
| `Internal Notes` | text | ✅ workflow | ≤ 2,000 chars; staff-only |
| `Submitted At` | timestamp | ❌ | |

### Tab: `Donation Confirmations` ← `donation_confirmations` · archival: size_threshold (newest 500)

| Column | Type | Editable | Validation |
|---|---|---|---|
| `Campaign Slug` | text | ❌ | |
| `Donor Name` / `Email` / `Phone` | text | ❌ | |
| `Amount (INR)` | int | ❌ | |
| `UTR / Transaction ID` | text | ❌ | donor-reported |
| `Purpose` / `Message` | text | ❌ | |
| `Status` | select | ✅ workflow | `Pending`, `Approved`, `Rejected` |
| `Show Publicly` | bool | ✅ workflow | only honored when `Status = Approved` |
| `Submitted At` | timestamp | ❌ | |

### Tab: `Reports` ← `rescue_reports` · archival: status_based (resolved > 30 d)

| Column | Type | Editable | Validation |
|---|---|---|---|
| `Report Code` | text | ❌ | |
| `Animal Type` | select | ❌ | |
| `Category` | select | ❌ | `Injured`, `Missing`, `Emergency`, `Dead Animal`, `Other` |
| `Severity` | select | ❌ | `Emergency`, `Urgent`, `Moderate`, `Low` |
| `Zone` | text | ❌ | public-safe zone only — **precise lat/lng never appears in this sheet** |
| `Location Note` / `Description` | text | ❌ | |
| `Photo` | text | ❌ | Storage URL |
| `Status` | select | ✅ workflow | `Reported`, `Volunteer Assigned`, `On the Way`, `Animal Located`, `Treatment Started`, `Monitoring`, `Resolved` |
| `Assigned Volunteer` | text | ✅ workflow | must match a `Volunteers` tab `Name`, or blank |
| `Linked Dog Public ID` | text | ✅ workflow | `public-id`, must exist |
| `Reported At` | timestamp | ❌ | |

---

## Access model

- **Volunteers/admins:** Editor on the spreadsheet. Enforcement of "what they may actually
  change" is the protected-range set below plus engine-side validation — not trust.
- **Sync service account:** Editor on the spreadsheet; **Viewer** on the Drive media folders
  (never write access to Drive).
- **Protected ranges** (service-account-only), applied by the engine on first run:
  system columns A–H on every tab · `Public ID` + `Cover Image` on `Dogs` · `Cover Image` on
  `Stories` · `Raised Amount (INR)` on `Donate` · all non-workflow columns on the three
  public-submitted Transaction tabs.

## Change history

| Date | Change |
|---|---|
| 2026-07-16 | Initial 10-tab draft. |
| 2026-07-17 | Rewritten for the CMS-first architecture (18 tabs, ownership per tab). |
| 2026-07-17 | Owner-approved refinements: 8 system columns; Content / Master Data / Transaction Data categorization; per-tab archival policies; `Active` clarified as a user column. |
| 2026-07-17 | **Full column contract**: every column now carries type, required flag, and validation rule (architecture-review deliverable 3). Tabs regrouped by category; `Donate` two-row-shape discrimination documented; Website Settings known-key registry with per-key validation. |
