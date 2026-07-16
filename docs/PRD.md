# KGP PAWS — Product Requirements Document

| | |
|---|---|
| **Product** | KGP PAWS — digital animal welfare platform for IIT Kharagpur |
| **Owner** | Shubham (Animal Welfare Society, IIT Kharagpur) |
| **Doc status** | Living document — updated on every feature completion |
| **Last updated** | 2026-07-16 |
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
| G3 | Volunteers manage 100 % of content without touching code | Google Sheets is the CMS |
| G4 | Donation trust through radical transparency | Every campaign publishes its expense ledger; confirmations logged with UTR |
| G5 | Admins see operations at a glance | Dashboard: reports, dogs, donations, sync health |
| G6 | Best-in-class quality bar | Lighthouse: **Performance ≥ 95**, SEO 100, Accessibility 100, Best Practices 100 |
| G7 | Zero data-entry duplication | Two-way Google Sheets ⇄ Supabase sync with conflict handling + audit log |

**Non-goals (explicit):** online payment gateway integration (Razorpay/Stripe/PhonePe APIs) —
donations are UPI-QR + manual confirmation by design; native mobile apps; multi-campus support (v1 is IIT KGP only).

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
| **Real-photography experience** — replace all illustrated/vector animal portraits with real photos from Google Drive | P0 | BLOCKED | — awaiting photo→dog mapping + Drive pipeline (M3) |
| Floating image walls / scroll storytelling / parallax with real photos (GSAP + Lenis) | P1 | NOT STARTED | — |
| Three.js / R3F hero moment (photo-based, no cartoon 3D) | P2 | NOT STARTED | — |
| Interactive photo galleries per animal (lightbox, swipe, lazy-loaded) | P0 | NOT STARTED | — |
| Smooth page transitions (View Transitions / Framer Motion) | P1 | NOT STARTED | — |
| Glass-morphism card language where it aids hierarchy | P2 | NOT STARTED | — |
| About page (mission, pillars, policies) | P1 | COMPLETED | HTTP 200 verified |
| 404 + scan-not-found pages | P1 | COMPLETED | ✅ live |

### B. Animal identity & QR system

| Feature | Priority | Status | Tested |
|---|---|---|---|
| Permanent animal ID scheme (`DOG00023` public ID; internal UUID never exposed) | P0 | IN PROGRESS | current IDs are `PAWS-KGP-DOG-0012`; migrating to `DOG#####` in M4 |
| Animal profile page: photos, gallery, gender, age, breed, weight, color, vaccinated, sterilized, medical history, treatment timeline, story, notes | P0 | COMPLETED (illustrated placeholders; photo/gallery/weight/breed fields pending M3/M4) | ✅ live (Simba) |
| Medical timeline (unlimited events, typed: vaccination/deworming/sterilization/injury/treatment/checkup/recovery) | P0 | COMPLETED | ✅ manual |
| QR resolver — scan opens `kgppaws.org/dog/DOG00023` | P0 | IN PROGRESS | current: token route `/p/{token}` TESTED live; `/dog/{id}` route lands in M4 |
| Admin "Generate QR" → create, store in DB, downloadable PNG | P0 | COMPLETED (demo-mode local; DB persistence lands with M1) | ✅ manual |
| Printable A4 QR sheet (PDF, multiple tags per page) | P0 | NOT STARTED | — |
| QR deactivate / reissue for lost tags | P1 | COMPLETED (UI + schema; live persistence M1) | manual |
| Scan analytics (aggregate only, never scanner identity) | P2 | NOT STARTED | schema ready (`qr_scans`) |
| Emergency contact + Report + Donate CTAs on scanned profile | P0 | COMPLETED | ✅ live |

### C. Rescue reporting

| Feature | Priority | Status | Tested |
|---|---|---|---|
| 60-second mobile report form (photo, type, problem, severity, zone, description, optional contact) | P0 | COMPLETED | ✅ E2E 2026-07-13 |
| Report categories — exactly four: **Injured / Emergency / Missing / Dead** | P0 | IN PROGRESS | current taxonomy has 8 finer-grained problems; consolidating to the spec'd 4 in M6 |
| Public status tracker by report ID (no login) | P0 | COMPLETED | ✅ E2E |
| Store report in Supabase **and** Google Sheets | P0 | BLOCKED | needs Google credentials (M2) |
| Notify admin by Email on new report | P0 | BLOCKED | needs email provider (M6) |
| Notify admin by WhatsApp on new report | P0 | BLOCKED | needs WhatsApp provider decision (M6) |
| Location privacy: public sees zone only; precise location responders-only | P0 | COMPLETED | schema + UI |

### D. Donations (UPI — no payment gateway)

| Feature | Priority | Status | Tested |
|---|---|---|---|
| Donate page displays admin-provided UPI QR image(s) prominently | P0 | BLOCKED | awaiting UPI QR image(s) + UPI ID + account holder name |
| Multiple QR support (UPI / PhonePe / GPay variants) | P1 | NOT STARTED | — |
| "Scan with any UPI app" instructions + UPI ID + holder name display | P0 | NOT STARTED | — |
| Donation Confirmation Form (name, email?, phone?, amount, UTR, purpose, message) | P0 | NOT STARTED | — |
| Confirmation stored in Supabase + Google Sheets | P0 | BLOCKED | Google credentials |
| Admin notified (Email + WhatsApp) on confirmation | P0 | BLOCKED | providers |
| Admin approves → donor appears in "Recent Donors" | P1 | NOT STARTED | — |
| Campaign transparency: goals, progress, public expense ledger, updates | P0 | COMPLETED | ✅ live |
| Donation impact + thank-you section | P1 | COMPLETED (impact section live; thank-you wall in M5) | manual |
| **Remove** legacy Razorpay-oriented flow & demo payment intent | P0 | NOT STARTED | M5 |

### E. Blog / stories (Sheets-powered)

| Feature | Priority | Status | Tested |
|---|---|---|---|
| Editorial story pages (rich blocks: headings, quotes, images, timelines) | P0 | COMPLETED | ✅ live |
| Blogs authored entirely in Google Sheets (markdown body) → rendered as web pages | P0 | BLOCKED | Google credentials (M7) |
| Images & video embeds from Google Drive | P0 | BLOCKED | Drive pipeline (M3) |
| Markdown + tables support | P1 | NOT STARTED | — |
| SEO per post (meta description, OG image), reading time, related articles | P1 | IN PROGRESS | reading time + related done; per-post OG images pending |

### F. Google Sheets CMS & sync

| Feature | Priority | Status | Tested |
|---|---|---|---|
| Sheet designs for: Dogs, Medical History, Vaccination, Sterilization, Gallery, Blogs, Donations, Volunteers, Reports, QR Codes, Website Settings | P0 | COMPLETED (design — see [GOOGLE_SHEETS_SCHEMA.md](GOOGLE_SHEETS_SCHEMA.md)) | n/a (doc) |
| Sheets → Supabase sync (volunteer edits reach the website) | P0 | BLOCKED | Google service account (M2) |
| Supabase → Sheets sync (dashboard/website writes reach Sheets) | P0 | BLOCKED | Google service account (M2) |
| Conflict handling (row versioning, last-write-wins + conflict log) | P0 | NOT STARTED | design in ARCHITECTURE.md §6 |
| Sync audit log + admin sync-health panel | P0 | NOT STARTED | — |
| Scheduled sync (Vercel cron) + manual "Sync now" | P0 | NOT STARTED | — |

### G. Media pipeline (Google Drive)

| Feature | Priority | Status | Tested |
|---|---|---|---|
| Drive folders as asset source (dog photos, treatment photos, blog media, videos, documents) | P0 | BLOCKED | Drive API credentials (M3) |
| Ingest job: Drive → optimized storage → CDN (`next/image`) | P0 | NOT STARTED | — |
| Automatic optimization: responsive sizes, AVIF/WebP, lazy loading, blur placeholders, caching | P0 | NOT STARTED | — |
| Unlimited images / treatments / documents per animal | P0 | NOT STARTED | schema supports it |
| Cover-image selection per dog (via Sheets column) | P0 | NOT STARTED | — |

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
| Google Sheets sync panel (status, last run, conflicts, "Sync now") | P0 | NOT STARTED | M2 |
| System health (sync, storage, error budget) | P1 | NOT STARTED | — |
| Dark mode (Stripe/Linear/Vercel-grade) | P1 | NOT STARTED | M9 |
| Volunteer dashboard (assigned reports, tasks, animal updates, contributions) | P1 | COMPLETED | manual |

### J. Authentication & authorization

| Feature | Priority | Status | Tested |
|---|---|---|---|
| Supabase email/password auth | P0 | COMPLETED | ✅ live — credential form active on production, demo switcher correctly disabled |
| Two roles only: volunteer, admin | P0 | COMPLETED | manual |
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
| Unit tests (Vitest) + integration/E2E tests (Playwright) | P0 | NOT STARTED | M-B — no suite exists today, see KNOWN_ISSUES #12 |
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

Modules and sequencing live in [TASKS.md](TASKS.md). Summary: **M1** foundations (Supabase live,
GitHub) → **M2** Sheets sync engine → **M3** Drive media pipeline + real photos → **M4** Dog
profile v2 + `DOG#####` QR + A4 PDF → **M5** UPI donations → **M6** reports v2 + notifications →
**M7** blog engine → **M8** search → **M9** dashboard v2 + dark mode → **M10** performance/SEO
audit + domain launch.
