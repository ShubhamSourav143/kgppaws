# KGP PAWS — Google Sheets CMS Schema

Living document. Last updated **2026-07-16**. Implements PRD §5.F. One spreadsheet, **"KGP PAWS
CMS"**, one tab per entity. Sync engine design: [ARCHITECTURE.md §6](ARCHITECTURE.md#6-google-sheets-cms--two-way-sync).

**Tab names are exact and case-sensitive** — the sync engine's config maps these literal strings:

`Dogs` · `MedicalHistory` · `Vaccination` · `Sterilization` · `Blogs` · `Donations` ·
`Reports` · `Volunteers` · `QRCode` · `WebsiteSettings`

> **Note on Gallery:** there is deliberately **no `Gallery` tab**. Per the spec, media is
> auto-discovered from the Google Drive folder structure
> (`Dogs/DOG0001/cover.jpg`, `Dogs/DOG0001/gallery/*`, `Dogs/DOG0001/medical/*`) — volunteers
> manage photos by dropping files in Drive, not by maintaining spreadsheet rows. Captions and
> ordering fall back to filename order; a future `Gallery` tab can be added if per-image
> captions become necessary.

---

## Conventions (apply to every tab)

| Column | Meaning |
|---|---|
| `_id` | **Protected.** Stable row ID, auto-filled by the sync engine on first sync. Never edit or reorder-dependent. |
| `_row_version` | **Protected.** Incremented by the engine on every write from either side. |
| `_synced_at` | **Protected.** Timestamp of last successful sync. |
| `_status` | **Protected.** Blank = OK. `ERROR: <reason>` or `CONFLICT` = needs human attention — the row is skipped until fixed. |
| `Active` | Volunteer-editable. `TRUE`/`FALSE`. Sets are **soft deletes** — the engine never hard-deletes either side. |

Column headers are the sync engine's field map — renaming a header breaks sync until the
mapping config is updated (surfaced clearly as a sync error, not a silent failure).

---

## Tab: `Dogs`

Primary content for every animal.

| Column | Type | Notes |
|---|---|---|
| `_id`, `_row_version`, `_synced_at`, `_status` | system | |
| `Public ID` | text | `DOG00023` / `CAT00004`; system-generated on first sync, then read-only |
| `Name` | text | required |
| `Species` | select | Dog / Cat / Other |
| `Gender` | select | Male / Female / Unknown |
| `Age` | text | free label, e.g. "~3 years" |
| `Breed` | text | e.g. "Indie" |
| `Weight (kg)` | number | optional |
| `Color` | text | |
| `Size` | select | Small / Medium / Large |
| `Zone` | select | campus zone (matches `zones` reference list, tab `Reference — Zones`) |
| `Tagline` | text | one-liner shown on cards |
| `Personality` | text | comma-separated tags |
| `Bio` | long text | |
| `Story` | long text (markdown) | full narrative for the profile page |
| `Friendliness` | select | Friendly / Selective / Cautious / Shy |
| `Vaccinated` | boolean | |
| `Sterilized` | boolean | |
| `Health Status` | select | Healthy / Under Treatment / Recovering / Monitoring |
| `Health Note (public)` | text | shown publicly |
| `Internal Note` | text | **never rendered publicly** — staff only |
| `Adoption Status` | select | Available / Foster Needed / Not Available / Adopted |
| `Good With People` | boolean | |
| `Good With Animals` | boolean | |
| `Special Care` | boolean | |
| `Cover Image` | text | Drive filename or file ID from the animal's Gallery folder |
| `Active` | boolean | soft delete |

## Tab: `MedicalHistory`

One row per event, unlimited events per dog. Wide-format alternative to a nested structure —
easiest for volunteers to fill in a spreadsheet.

| Column | Notes |
|---|---|
| `_id`, `_row_version`, `_synced_at`, `_status`, `Active` | system |
| `Dog Public ID` | foreign key by `Public ID` (not `_id` — human-readable, typeable) |
| `Date` | date |
| `Event Type` | Vaccination / Deworming / Sterilization / Injury / Treatment / Checkup / Recovery |
| `Title` | short label |
| `Public Note` | shown on the timeline |
| `Internal Note` | staff-only, never public |
| `Recorded By` | volunteer name |

## Tab: `Vaccination`

Kept separate from generic Medical History because vaccination has its own recurring-reminder
need (next-due tracking).

| Column | Notes |
|---|---|
| `Dog Public ID` | FK |
| `Vaccine` | e.g. "Anti-rabies" |
| `Date Given` | date |
| `Next Due` | date, optional — powers a future reminder |
| `Administered By` | vet/clinic name |
| `Notes` | |

## Tab: `Sterilization`

| Column | Notes |
|---|---|
| `Dog Public ID` | FK |
| `Date` | |
| `Procedure` | |
| `Vet / Clinic` | |
| `Recovery Notes` | |

## Tab: `Blogs`

| Column | Notes |
|---|---|
| `_id`, `_row_version`, `_synced_at`, `_status`, `Active` | system |
| `Slug` | url-safe, unique |
| `Title` | |
| `Category` | Rescue / Recovery / Adoption / Campus Paw / Volunteer Diary / Education |
| `Related Dog Public ID` | optional FK |
| `Author` | |
| `Excerpt` | |
| `Body (Markdown)` | full post — headings, quotes, images `![](drive:filename)`, tables all supported |
| `Cover Image` | Drive filename |
| `SEO Description` | ~155 chars |
| `Status` | Draft / Scheduled / Published / Archived |
| `Publish Date` | date (used when Status=Scheduled) |
| `Featured` | boolean |

## Tab: `Donations`

Mirrors `donation_confirmations` (DATABASE_SCHEMA.md §2.3) — this tab is the admin's review
surface; the Donate page writes into it via sync, not the other way around, but admins may
correct/annotate here.

| Column | Notes |
|---|---|
| `_id`, `_row_version`, `_synced_at`, `_status` | system |
| `Campaign` | FK by campaign slug |
| `Donor Name` | |
| `Email` | optional |
| `Phone` | optional |
| `Amount (INR)` | |
| `UTR / Transaction ID` | donor-reported |
| `Purpose` | |
| `Message` | |
| `Status` | Pending / Approved / Rejected |
| `Show Publicly` | boolean — powers "Recent Donors" once Approved |
| `Submitted At` | timestamp |

## Tab: `Volunteers`

| Column | Notes |
|---|---|
| `_id`, `_row_version`, `_synced_at`, `_status` | system |
| `Full Name` | |
| `Email` | |
| `Phone` | coordinators-only, never public |
| `Affiliation` | hall / department |
| `Skills` | |
| `Availability` | |
| `Interests` | comma-separated |
| `Status` | Applied / Active / Inactive |

## Tab: `Reports`

Read-mostly from admin's perspective (reports originate on the website), but admins can update
status/assignment here too — two-way.

| Column | Notes |
|---|---|
| `_id`, `_row_version`, `_synced_at`, `_status` | system |
| `Report Code` | public handle, e.g. `PAWS-RESCUE-2026-00124` |
| `Animal Type` | Dog / Cat / Other |
| `Category` | Injured / Missing / Emergency / Dead Animal |
| `Severity` | Emergency / Urgent / Moderate / Low |
| `Zone` | public-safe |
| `Location Note` | |
| `Description` | |
| `Status` | Reported / Volunteer Assigned / On the Way / Animal Located / Treatment Started / Monitoring / Resolved |
| `Assigned Volunteer` | |
| `Linked Dog Public ID` | optional |
| `Reported At` | timestamp |
| **not present** | precise `lat`/`lng` — deliberately excluded from the sheet; stays server-side only |

## Tab: `QRCode`

Read-mostly ledger of issued tags (generation itself happens in the admin dashboard, not the sheet).

| Column | Notes |
|---|---|
| `Dog Public ID` | FK |
| `Token` | opaque, printed value |
| `Active` | boolean |
| `Issued At` | |
| `Deactivated At` | |
| `Print Batch` | which A4 sheet run it was printed in |

## Tab: `WebsiteSettings`

Key/value tab → `site_settings` table. Powers things that shouldn't require a code deploy.

| Key | Example value | Used for |
|---|---|---|
| `upi_qr_1` | Drive file ID | primary UPI QR image |
| `upi_qr_2` | Drive file ID | secondary (e.g. PhonePe-specific) QR, optional |
| `upi_id` | `awskgp@upi` | shown next to QR |
| `upi_holder_name` | `Animal Welfare Society, IIT KGP` | shown next to QR |
| `emergency_contact_phone` | `+91…` | shown on animal profile & report confirmation |
| `emergency_contact_email` | | |
| `impact_dogs_supported` | `300` | homepage impact counter (mirrors `impact_metrics`) |
| `impact_note` | "Demo values — updated monthly" | transparency label |

## Reference tabs (dropdown sources, not synced as content)

- **`Reference — Zones`**: campus zone list (id, name) — keeps `Dogs.Zone` and
  `Reports.Zone` dropdowns consistent with the app's zone privacy model.
- **`Reference — Categories`**: blog categories, report categories — single source for select
  options across tabs.

---

## Access model

- Spreadsheet shared as **Editor** to volunteers/admins (Google account or org email).
- Shared as **Editor** to the sync service account (server-only credential) — required for the
  engine to read/write.
- Protected ranges: all `_id`/`_row_version`/`_synced_at`/`_status` columns, and the `Public
  ID`/`Token` system-generated columns, are locked to "only the service account can edit" via
  Sheets API protected-range rules, applied by the sync engine on first run.
