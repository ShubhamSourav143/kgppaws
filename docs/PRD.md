# KGP PAWS — Product Requirements Document

| | |
|---|---|
| **Product** | KGP PAWS — digital animal welfare platform for IIT Kharagpur |
| **Owner** | Shubham (Animal Welfare Society, IIT Kharagpur) |
| **Doc status** | Living document — updated on every feature completion |
| **Last updated** | 2026-07-18 |
| **Production URL** | https://kgp-paws.vercel.app (custom domain kgppaws.org pending) |

> **Maintenance rule:** whenever a feature changes state, update its row here, add a line to
> [CHANGELOG.md](CHANGELOG.md), record verification in [TEST_REPORT.md](TEST_REPORT.md), and
> tick the task in [TASKS.md](TASKS.md). Documentation is part of "done".

---

## 1. Vision

Every animal on the IIT Kharagpur campus deserves to be **known** — not a nameless street dog,
but an individual with a name, a health record, and a story. KGP PAWS gives each animal a
permanent digital identity, reachable from a QR tag on its collar, and gives the humans around
it — students, staff, visitors, volunteers — a fast, beautiful, trustworthy way to help:
report, adopt, donate, volunteer.

The platform must feel like a **modern product** (Apple / Stripe / Linear / Framer calibre),
not a traditional NGO website: cinematic, editorial, premium — powered by **real photographs**
of real campus animals, never stock imagery or cartoon illustration.

## 2. Goals

| # | Goal | Measure |
|---|------|---------|
| G1 | Any scanned collar QR resolves to that animal's living profile | Scan → profile < 3 s on 4G |
| G2 | Reporting an animal in distress takes under 60 seconds on mobile | Form completion time |
| G3 | Volunteers manage 100 % of content without touching code | Google Sheets is the CMS — see [CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md) |
| G4 | Donation trust through radical transparency | Every campaign publishes its expense ledger; confirmations logged with UTR |
| G5 | Admins see operations at a glance | Dashboard: reports, dogs, donations, sync health |
| G6 | Best-in-class quality bar | Lighthouse: **Performance ≥ 95**, SEO 100, Accessibility 100, Best Practices 100 |
| G7 | Zero data-entry duplication | Owned-per-field Sheets ⇄ Supabase sync with conflict handling, retry, audit — see [CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md) |
| G8 | Architecture ready for 1,000× current volume without a rewrite | Job-queue-based sync, staging tables, partitioned audit log, per-tab locks — see [CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md) §13 |

**Non-goals (explicit):** online payment gateway integration (Razorpay/Stripe/PhonePe APIs) —
donations are UPI-QR + manual confirmation by design; native mobile apps; multi-campus support
in v1 (v3-ready by design, but IIT KGP only through launch).

### 2.1 CMS-first architecture

As of 2026-07-17, the platform's content architecture follows the principles in
[CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md):

- **Supabase is the single source of truth** for everything the application renders.
- **Google Sheets is the operational CMS** — volunteers edit content in one spreadsheet
  (`KGP PAWS CMS`, 18 tabs); the sync engine keeps Supabase updated.
- **Google Drive is the media inbox** — never a CDN. Files are ingested, optimized, and served
  from Supabase Storage.
- **Every field has exactly one owning system.** Content fields → Sheets. Transactional fields
  → Supabase. Workflow fields (a narrow enumerated set) are the only dual-owned exception.
- **Sync is a job**, not a request — queued, executed by a worker, retryable, auditable.

Read [CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md) before touching sync-related code.

## 3. Target users

| Role | Who | Needs | Access |
|------|-----|-------|--------|
| **Public** | Students, staff, campus visitors, donors, adopters | Scan QR → learn about an animal; report distress; adopt; donate via UPI; read stories | No login required for anything public |
| **Volunteer** | AWS IIT KGP volunteers | Edit content in Google Sheets (dogs, medical records, blogs); see assigned reports & tasks; upload photos to Google Drive | Authenticated, `volunteer` role |
| **Admin** | AWS coordinators | Everything volunteers can + dashboard, QR generation & printing, donation approval, report dispatch, sync control, settings | Authenticated, `admin` role |

Roles are exactly **two** authenticated tiers: `volunteer` and `admin`. (The existing DB schema
also carries `user`/`super_admin` enum values; they are retained in the enum for forward
compatibility but are not exposed in the product UI.)

## 4. Status legend

`NOT STARTED` → `IN PROGRESS` → `COMPLETED` (works, verified by developer) → `TESTED` (verified
end-to-end and recorded in TEST_REPORT.md) | `BLOCKED` (waiting on external dependency — see
[KNOWN_ISSUES.md](KNOWN_ISSUES.md) and the dependency checklist in TASKS.md).

Priorities: **P0** = launch-blocking · **P1** = launch-important · **P2** = post-launch.

---

## 5. Functional requirements

### A. Public website & experience

| Feature | Priority | Status | Tested |
|---|---|---|---|
| Cinematic homepage (hero, scan story, impact, meet-the-paws, stories, map, help, donate, join) | P0 | COMPLETED | ✅ manual (2026-07-13) |
| Editorial design system (Fraunces/Manrope, forest/cream/terracotta palette, motion tokens) | P0 | COMPLETED | ✅ manual |
| **PWA** — installable, manifest, service worker, offline shell, app icons | P0 | COMPLETED | ✅ E2E 2026-07-16 (see TEST_REPORT.md) |
| **Dark mode** — full app, token-driven, respects system preference + manual toggle | P0 | NOT STARTED | — M9 |
| Lenis smooth scrolling (site-wide, reduced-motion aware) | P1 | NOT STARTED | — M3 |
| **Real-photography experience** — real animal profile + gallery, cover photo replacing the illustration, sourced from actual volunteer photography | P0 | TESTED | ✅ live (`/animal/dreamland`) — see CHANGELOG 2026-07-17. The 8 *fictional* demo animals (Simba, Muesli, …) intentionally keep their illustrated portraits — they have no real photos to replace them with, and are labelled demo |
| Real-photo lightbox gallery (grid + keyboard-accessible full view, prev/next) | P0 | TESTED | ✅ `components/media/PhotoGallery.tsx`, used on animal profiles + story pages |
| Floating image wall / scroll storytelling with real photos — **R3F (not GSAP+Lenis as originally scoped) + GSAP ScrollTrigger** | P1 | TESTED | ✅ homepage "Real Faces on Campus" section — 3D floating photo tiles (React Three Fiber) + horizontal scroll-scrubbed captions (GSAP); renders nothing when there are no real photos yet; static fallback under reduced-motion |
| Three.js / R3F hero moment (photo-based, no cartoon 3D) | P2 | NOT STARTED | — |
| Interactive photo galleries per animal (lightbox, swipe, lazy-loaded) | P0 | NOT STARTED | — |
| Smooth page transitions (View Transitions / Framer Motion) | P1 | NOT STARTED | — |
| Glass-morphism card language where it aids hierarchy | P2 | NOT STARTED | — |
| About page (mission, pillars, policies) | P1 | COMPLETED | HTTP 200 verified |
| 404 + scan-not-found pages | P1 | COMPLETED | ✅ live |

### B. Animal identity & QR system

| Feature | Priority | Status | Tested |
|---|---|---|---|
| Permanent animal ID scheme (`DOG00023` public ID; internal UUID never exposed) | P0 | COMPLETED | ✅ live since M1 — all 9 animals confirmed to have a `public_id` via direct schema query, 2026-07-18 |
| Animal profile page: photos, gallery, gender, age, breed, weight, color, vaccinated, sterilized, medical history, treatment timeline, story, notes | P0 | COMPLETED (illustrated placeholders; weight/breed pending confirmation of UI surfacing — see KNOWN_ISSUES) | ✅ live (Simba) |
| Medical timeline (unlimited events, typed: vaccination/deworming/sterilization/injury/treatment/checkup/recovery) | P0 | COMPLETED | ✅ manual; vaccination + sterilization records now merge into the same timeline (2026-07-18) |
| QR resolver — scan opens `kgppaws.org/dog/DOG00023` | P0 | COMPLETED (code) | `/dog/[publicId]` route built and compiles; `/p/{token}` remains the tested-live fallback. **Not yet verified with an actual printed/scanned QR code** |
| Admin "Generate QR" → create, store in DB, downloadable PNG | P0 | COMPLETED | `/api/qr/generate` — admin-authenticated, issues/reuses a `qr_tags` row, error-correction-H PNG. Code-complete, not yet manually exercised |
| Printable A4 QR sheet (multiple tags per page) | P0 | COMPLETED | `/api/qr/print-sheet` — shipped as a printable HTML A4 sheet (2×4 grid, crop marks) rather than a `react-pdf` binary; functionally equivalent, no new PDF dependency |
| QR deactivate / reissue for lost tags | P1 | COMPLETED (UI + schema; live persistence M1) | manual |
| Scan analytics (aggregate only, never scanner identity) | P2 | NOT STARTED | schema ready (`qr_scans`) |
| Emergency contact + Report + Donate CTAs on scanned profile | P0 | COMPLETED | ✅ live |

### C. Rescue reporting

| Feature | Priority | Status | Tested |
|---|---|---|---|
| 60-second mobile report form (photo, type, problem, severity, zone, description, optional contact) | P0 | COMPLETED | ✅ E2E 2026-07-13 |
| Report categories — exactly four: **Injured / Emergency / Missing / Dead** | P0 | IN PROGRESS | current taxonomy has 8 finer-grained problems; consolidating to the spec'd 4 in M6 |
| Public status tracker by report ID (no login) | P0 | COMPLETED | ✅ E2E |
| Store report in Supabase **and** Google Sheets | P0 | PARTIAL | ✅ Supabase half done — `/api/reports` is a real Zod-validated route handler (not the old client-only demo write). ❌ Sheets half: the DB→Sheets trigger fires correctly but no tab handler is registered to act on it yet — see KNOWN_ISSUES #31 |
| Notify admin by Email on new report | P0 | PARTIAL | Outbox infra live (`notification_outbox`, `/api/notify/dispatch`, retry/backoff) but the actual send call is a no-op stub — see KNOWN_ISSUES #5 |
| Notify admin by WhatsApp on new report | P0 | PARTIAL | Same as Email above |
| Location privacy: public sees zone only; precise location responders-only | P0 | COMPLETED | schema + UI |

### D. Donations (UPI — no payment gateway)

| Feature | Priority | Status | Tested |
|---|---|---|---|
| Donate page displays admin-provided UPI QR image(s) prominently | P0 | BLOCKED | awaiting UPI QR image(s) + UPI ID + account holder name; `DonatePanel.tsx` UI not yet rewired even though the backend is ready |
| Multiple QR support (UPI / PhonePe / GPay variants) | P1 | NOT STARTED | — |
| "Scan with any UPI app" instructions + UPI ID + holder name display | P0 | NOT STARTED (UI) | — |
| Donation Confirmation Form (name, email?, phone?, amount, UTR, purpose, message) | P0 | PARTIAL | ✅ Backend: `donation_confirmations` table (migration 0010, live) + `/api/donate/confirm` (Zod-validated). ❌ Frontend form not built — `DonatePanel.tsx` untouched |
| Confirmation stored in Supabase + Google Sheets | P0 | PARTIAL | ✅ Supabase done and live. ❌ Sheets: same reverse-sync handler gap as reports — see KNOWN_ISSUES #31 |
| Admin notified (Email + WhatsApp) on confirmation | P0 | PARTIAL | Outbox fires; send is a stub — see KNOWN_ISSUES #5 |
| Admin approves → donor appears in "Recent Donors" | P1 | NOT STARTED | Backend supports the `is_public`/`status` fields needed; approval UI + public wall not built |
| Campaign transparency: goals, progress, public expense ledger, updates | P0 | COMPLETED | ✅ live |
| Donation impact + thank-you section | P1 | COMPLETED (impact section live; thank-you wall in M5) | manual |
| **Remove** legacy Razorpay-oriented flow & demo payment intent | P0 | NOT STARTED | M5 |

### E. Blog / stories (Sheets-powered)

| Feature | Priority | Status | Tested |
|---|---|---|---|
| Editorial story pages (rich blocks: headings, quotes, images, timelines) | P0 | COMPLETED | ✅ live |
| First real (non-demo) story, with a real photo gallery | P0 | TESTED | ✅ [Field Notes: Faces We've Met This Year](/stories/field-notes-2025) — 8 real photos, honestly worded, no invented outcomes |
| Blogs authored entirely in Google Sheets (markdown body) → rendered as web pages | P0 | BLOCKED | Google credentials (M7) |
| Images & video embeds from Google Drive | P0 | IN PROGRESS | `story_media` + `PhotoGallery` render real images now (this session); Drive-sourced ingestion still credential-gated (M3) |
| Markdown + tables support | P1 | NOT STARTED | — |
| SEO per post (meta description, OG image), reading time, related articles | P1 | IN PROGRESS | reading time + related done; per-post OG images pending |

### F. Google Sheets CMS & sync

Detailed design: [CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md). Column-level tab spec:
[GOOGLE_SHEETS_SCHEMA.md](GOOGLE_SHEETS_SCHEMA.md).

| Feature | Priority | Status | Tested |
|---|---|---|---|
| **18-tab spreadsheet design** (Home, Dogs, Medical History, Vaccination, Sterilization, Adoption, Adoption Applications, Donate, Donation Confirmations, Stories, Reports, Volunteers, Help, Events, FAQ, Navigation, Footer, Website Settings) | P0 | COMPLETED (design — see [GOOGLE_SHEETS_SCHEMA.md](GOOGLE_SHEETS_SCHEMA.md)) | n/a (doc) |
| **CMS architecture spec** (ownership rules, job queue, retry, audit, scalability targets) | P0 | COMPLETED (see [CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md)) | n/a (doc) |
| **Sync foundations** (job queue, staging tables, audit log, worker, enqueue API) | P0 | COMPLETED | M-CMS-1. Live schema confirmed (`sync_jobs`, `tab_config` 18 rows, `content_audit_log`, 16 staging tables) 2026-07-18 |
| **Content tabs — batch 1** (Home, Settings, Navigation, Footer, FAQ, Help; homepage/header/footer refactored to read from `content_*` tables) | P0 | CODE COMPLETE | M-CMS-2. `npm run build` verified (61 routes). **Not yet live-verified against a real spreadsheet** — blocked on Google service account |
| **Content tabs — batch 2** (Dogs v2, Medical History, Vaccination, Sterilization) + media pipeline v2 (variants + blurhash + broken-image detection) | P0 | CODE COMPLETE | M-CMS-3. Migration 0008 confirmed live. Not yet live-verified against a real Drive folder |
| **Content tabs — batch 3** (Donate, Adoption, Stories, Volunteers, Events) + retire in-app story CMS panel | P0 | PARTIAL | M-CMS-4. Five tabs implemented; story CMS panel retirement not done |
| **Reverse sync** (Supabase → Sheets for adoption applications, donation confirmations, reports; workflow-field two-way sync) | P0 | PARTIAL — infra done, handlers missing | M-CMS-5. Triggers + `donation_confirmations` table confirmed live; **the three `applyDbToSheets` tab handlers were never written**, so enqueued jobs currently no-op — see KNOWN_ISSUES #31 |
| **Admin sync dashboard** (`/admin/sync`: job history, live status, per-tab health, conflict inbox, manual controls) + Vercel Cron | P0 | CODE COMPLETE | M-CMS-6. `/admin/sync` + `vercel.json` (5 schedules) built. Realtime subscription not wired (manual refresh instead); not yet exercised against live cron |
| **Alerting + monitoring + load test + security audit** | P1 | NOT STARTED | M-CMS-7 |
| Sync audit log (`sync_log`, per-run aggregate) | P0 | COMPLETED | ✅ live, migration 0002 — extended with `content_audit_log` (row-level diffs) in M-CMS-1 |

### G. Media pipeline (Google Drive)

| Feature | Priority | Status | Tested |
|---|---|---|---|
| Drive folders as asset source, `Dogs/<public_id>/{cover,gallery/,medical/}` convention | P0 | CODE COMPLETE | Ingest route v2 built (`/api/media/ingest`) with responsive variant ladder + blurhash — credential-gated, untestable without Drive API access. `medical/` files are deliberately **not** auto-published (see code comment) — that's an admin judgement call |
| **One-time local import** (bypassing the Drive API, reading the owner's local Drive mirror directly) | P0 | TESTED | ✅ 10 real photos optimized (sharp: EXIF-stripped, resized, re-encoded) and uploaded to Supabase Storage 2026-07-17. 2 of 12 failed — the local Drive cache disk was at 100% capacity; not a code defect, see KNOWN_ISSUES |
| Automatic optimization: strip EXIF/GPS, resize, re-encode | P0 | TESTED | ✅ via `sharp`, both the local import and the Drive ingest route |
| **Responsive AVIF/WebP variant ladder + blurhash placeholders** | P0 | CODE COMPLETE | `lib/media/pipeline.ts` — 3200/1600/800/400 × AVIF/WebP/JPEG + blurhash. Migration 0008 confirmed live. **Frontend not yet switched to consume the ladder** — animal profile/gallery components still render the single canonical path |
| **Broken-media detection** | P0 | COMPLETED | `/api/media/sweep` — cross-references `animal_photos` against Storage, flags via `broken_at` + `sync_conflicts` |
| Unlimited images / treatments / documents per animal | P0 | COMPLETED | schema + `drive_assets` tracking table support it |
| Cover-image selection per dog (via Sheets column, or `cover.*` filename convention for Drive) | P0 | IN PROGRESS | Drive convention implemented in the ingest route; Sheets-column override not yet wired |

### H. Search

| Feature | Priority | Status | Tested |
|---|---|---|---|
| **AI semantic search** (dogs, blogs, pages, FAQ, medical history*, volunteers, adoption) — embedding-based, understands intent not keywords | P1 | NOT STARTED | M8; *medical detail role-restricted. Requires pgvector + an embedding provider — see KNOWN_ISSUES #21 |
| Adopt-page filter & personality search | P0 | COMPLETED | ✅ E2E ("biscuit" → Simba) |

### I. Dashboard & operations (admin)

| Feature | Priority | Status | Tested |
|---|---|---|---|
| Admin overview (stats, incoming reports, campaign health, activity) | P0 | COMPLETED | ✅ manual 2026-07-13 |
| Animal management (list, search, create, QR download/reissue) | P0 | COMPLETED (demo persistence) | manual |
| Report management (severity sort, assign, status advance) | P0 | COMPLETED (demo persistence) | manual |
| Adoption application review (status, meet scheduling, private notes) | P1 | COMPLETED (demo persistence) | manual |
| Donation verification queue + expense publishing | P0 | COMPLETED (rework to UTR model in M5) | manual |
| Story/Blog CMS panel (drafts, publish, schedule, SEO fields) | P1 | COMPLETED (moves to Sheets-first in M7) | manual |
| Google Sheets sync panel (status, last run, conflicts, "Sync now") | P0 | COMPLETED | `/admin/sync` — M-CMS-6, code-complete, not yet exercised against live cron |
| System health (sync, storage, error budget) | P1 | PARTIAL | Sync health covered by `/admin/sync`; storage/error-budget panels not built |
| Dark mode (Stripe/Linear/Vercel-grade) | P1 | NOT STARTED | M9 |
| Volunteer dashboard (assigned reports, tasks, animal updates, contributions) | P1 | COMPLETED | manual |

### J. Authentication & authorization

| Feature | Priority | Status | Tested |
|---|---|---|---|
| Supabase email/password auth | P0 | COMPLETED | ✅ live — credential form active on production, demo switcher correctly disabled |
| Two roles only: volunteer, admin | P0 | COMPLETED | manual |
| First real admin account provisioned | P0 | TESTED | ✅ `shubhamsourav055+kgppawsadmin@gmail.com`, granted `admin` in `user_roles` 2026-07-17 — needed for Storage's admin-write policy (photo uploads), doubles as the first real `/admin` login. Password shared with the project owner out of band, not stored in this repo |
| DB-enforced authorization (RLS on every table; client guards are UX only) | P0 | TESTED | ✅ verified as the `anon` role: donations/reports invisible, privilege-escalation hole found & closed (see TEST_REPORT.md) |
| Demo-mode role explorer (no credentials configured) | P2 | COMPLETED | ✅ manual |
| Supabase Realtime (live dashboard updates: new reports/donations appear without refresh) | P1 | NOT STARTED | M9 |

### K. Notifications

| Feature | Priority | Status | Tested |
|---|---|---|---|
| Email notifications (new report, donation confirmation, adoption application) | P0 | BLOCKED | email provider (M6) |
| WhatsApp notifications to admin | P0 | BLOCKED | provider decision (M6) |
| Notification outbox with retry + delivery log | P1 | NOT STARTED | design ready |

### L. Performance, SEO, accessibility

| Feature | Priority | Status | Tested |
|---|---|---|---|
| Metadata, OpenGraph, sitemap.xml, robots.txt, canonical URLs | P0 | COMPLETED | ✅ live |
| Lighthouse audit + hardening (Perf ≥ 95, SEO/A11y/BP = 100) | P0 | NOT STARTED | M10 |
| Google Analytics + Google Search Console | P1 | NOT STARTED | M10 — needs property/verification access |
| Unit tests (Vitest) + integration/E2E tests (Playwright) | P0 | TESTED | ✅ 45 unit + 17 E2E, all passing (2026-07-16) — see TEST_REPORT.md |
| `prefers-reduced-motion` respected across all animation | P0 | COMPLETED | manual |
| WCAG-AA contrast, landmarks, focus management, keyboard support | P0 | COMPLETED (audit pass pending M10) | manual |
| Analytics (privacy-respecting) | P1 | NOT STARTED | M10 |

### M. Platform & deployment

| Feature | Priority | Status | Tested |
|---|---|---|---|
| Vercel production deployment | P0 | TESTED | ✅ live 2026-07-16 |
| Supabase project provisioned + migrations applied | P0 | TESTED | ✅ `kgp-paws`, ap-south-1, RLS verified from the anon role (2026-07-16) |
| GitHub repository + CI | P1 | IN PROGRESS | local git ready; remote pending |
| Custom domain kgppaws.org | P1 | BLOCKED | domain purchase/DNS |
| Environment variable management (see DEPLOYMENT.md) | P0 | COMPLETED | ✅ |

---

## 6. Release plan

Modules and sequencing live in [TASKS.md](TASKS.md).

**Delivered (2026-07):** M0 docs · M1 Supabase live · M-A PWA · M-B automated tests · initial
real-photo experience (`/animal/dreamland`, `/stories/field-notes-2025`).

**Next up — CMS-first architecture rollout ([CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md)):**
**M-CMS-1** sync foundations → **M-CMS-2** content tabs batch 1 (Home/Settings/Nav/Footer/FAQ/Help)
→ **M-CMS-3** Dogs v2 + medical + media v2 → **M-CMS-4** Donate/Adoption/Stories/Volunteers/Events
→ **M-CMS-5** reverse sync (DB → Sheets) → **M-CMS-6** admin sync dashboard + Vercel Cron →
**M-CMS-7** hardening + alerting.

**Remaining independent modules:** **M-C** dark mode · **M4** `DOG#####` QR + A4 PDF · **M5**
UPI donation flow (unblocks with UPI QR image) · **M6** email/WhatsApp notifications (unblocks
with provider decisions) · **M8** AI semantic search · **M9** dashboard v2 + Realtime · **M10**
Lighthouse audit + domain launch.

The legacy M2/M3/M7 milestones (Sheets sync + Drive pipeline + Sheets-driven blog) are
subsumed by M-CMS-1 through M-CMS-4 and are marked SUPERSEDED in [TASKS.md](TASKS.md).
