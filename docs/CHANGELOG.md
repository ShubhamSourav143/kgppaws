# KGP PAWS — Changelog

All notable changes to this project, newest first. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/). Every entry corresponds to a status change in
[PRD.md](PRD.md) and, where relevant, a verification note in [TEST_REPORT.md](TEST_REPORT.md).

## [Unreleased]

### Added
- `docs/` engineering documentation suite: PRD, ARCHITECTURE, DATABASE_SCHEMA,
  GOOGLE_SHEETS_SCHEMA, API_SPEC, DEPLOYMENT, TASKS, CHANGELOG, TEST_REPORT, KNOWN_ISSUES.
- Formal module plan (M0–M10) and external-dependency checklist in TASKS.md.

---

## 2026-07-18 — M-CMS-2 through M-CMS-6, M4, M6: CMS rollout completes; production-readiness review

Two work streams landed since the last recorded entry: (1) a separate agent session
("Antigravity," documented in `docs/ANTIGRAVITY_WORK.md`) migrated Home/Nav/Footer/FAQ/Help/
Dogs/Medical/Vaccination/Sterilization/Stories/Events/Volunteers/Donate content off hardcoded
strings and onto the CMS read layer; (2) this session independently verified that work against
actual code (not the handoff doc's claims), found and fixed two real production-safety bugs,
and completed the remaining M-CMS-5/M-CMS-6/M4/M6 scaffolding.

### Added — CMS content migration (M-CMS-2, M-CMS-3)
- `lib/sync/tabs/*.ts` — 15 tab handlers (Home, Navigation, Footer, FAQ, Help, Website Settings,
  Dogs, Medical History, Vaccination, Sterilization, Stories, Events, Volunteers, Adoption,
  Donate), each with a Zod-shaped mapper feeding the shared `runSheetsToDb` apply engine
  (`lib/sync/apply.ts`) built in M-CMS-1.
- `lib/sync/sheet.ts`, `lib/sync/parse.ts` — Sheets I/O (header verification, incremental-scan
  markers, batched system-column write-back) and cell-value coercion helpers shared by every tab.
- `lib/demo/content.ts` — centralised built-in copy for every CMS content type (Home, Adoption,
  Donate, Help, FAQ, Navigation, Footer, Events, Volunteers), used only as the pre-first-sync
  fallback described in `CMS_ARCHITECTURE.md` — never as a stand-in for real domain data (see
  Fixed, below, for why that distinction matters).
- `services/content.ts` — public read layer for all `content_*` tables; `components/layout/
  SiteChrome.tsx`, `Header.tsx`, `Footer.tsx`, `app/faq/page.tsx`, `app/volunteer/page.tsx`,
  `app/donate/page.tsx`, homepage sections (`Hero`, `Impact`, `MeetThePaws`, `HelpSection`,
  `CampusHome`) now read through it instead of hardcoded JSX strings.
- `animal-mapper.ts`/`PUBLIC_ANIMAL_SELECT` — vaccination and sterilization records now merge
  into the public medical timeline (previously only `animal_medical_events`).

### Added — media pipeline v2 (M-CMS-3)
- `lib/media/pipeline.ts` — responsive variant ladder (3200/1600/800/400 × AVIF/WebP/JPEG) +
  blurhash placeholder generation via `sharp`/`blurhash`.
- `/api/media/ingest` rewritten to produce the full ladder per image (previously one JPEG),
  walk `gallery/`/`medical/` subfolders explicitly, and skip unchanged files by checksum.
- `/api/media/sweep` (new) — cross-references `animal_photos.storage_path` against Storage
  bucket contents; marks orphans via `broken_at` and raises a `sync_conflicts` row.
- Migration `0008_media_variants_and_blurhash.sql` — `variants`/`blurhash`/`width`/`height`/
  `broken_at` columns on `animal_photos`, `story_media`, `drive_assets`.

### Added — reverse sync (M-CMS-5)
- Migration `0009_reverse_sync_triggers.sql` — `AFTER INSERT/UPDATE` triggers on
  `adoption_applications`, `donation_confirmations`, `rescue_reports` enqueue a single-row
  `db_to_sheets` sync job automatically (dedup'd via the existing `sync_jobs` unique index).
- Migration `0010_donation_confirmations.sql` — the UPI donation-confirmation table (planned
  since M1, never built until now): public insert of donor-safe columns only, admin-only
  status transitions, column-level grants keeping phone/email out of the general read policy.

### Added — admin sync dashboard (M-CMS-6)
- `/admin/sync` — health strip, per-tab status table, recent-job stream, and a conflict inbox
  with Keep Sheet / Keep DB / Dismiss resolution actions (`components/admin/SyncActions.tsx`).
- `services/sync-admin.ts` — read helpers backing the dashboard (`listRecentJobs`,
  `listTabsHealth`, `listOpenConflicts`).
- `/api/sync/enqueue-all` (admin-authenticated "Sync everything" shortcut) and
  `/api/sync/resolve` (conflict resolution, applies the chosen payload and bumps `row_version`).
- `vercel.json` — five Vercel Cron schedules (enqueue-all hourly, worker every 5 min,
  housekeeping every 10 min, media ingest every 15 min, notification dispatch every minute).

### Added — QR/public-ID system (M4)
- `/dog/[publicId]` — canonical scan route; resolves `animals.public_id` and redirects to the
  existing `/animal/[slug]` profile with the `?via=qr` greeting. `/p/[token]` retained as the
  revocable-tag fallback, per the original plan (KNOWN_ISSUES #9).
- `/api/qr/generate` — admin-authenticated; issues/reuses a `qr_tags` row and renders an
  error-correction-H PNG encoding `/dog/<public_id>`.
- `/api/qr/print-sheet` — admin-authenticated; renders an HTML A4 print sheet (2×4 grid, crop
  marks, print button) for up to 24 tags per request. Shipped as printable HTML rather than a
  `react-pdf` binary — every browser prints it at exact millimetre sizing with zero new
  dependency, and it was the smaller, equally-correct implementation for the stated goal.

### Added — real write routes + notification outbox (M6, partial)
- `/api/reports`, `/api/adopt/apply`, `/api/donate/confirm` — Zod-validated public write routes
  replacing the client-only `localStorage` demo writes for these three flows. Each fires a
  `notification_outbox` row on success.
- Migration `0011_notification_outbox.sql` + `/api/notify/dispatch` — drains the outbox with
  exponential-retry semantics (5 attempts); marks rows `skipped` with an explicit reason when
  `EMAIL_PROVIDER_API_KEY`/`WHATSAPP_PROVIDER_TOKEN` aren't set, rather than erroring silently.
  **Provider integration itself is a stub** — the send functions are structured for a real
  provider call but don't make one yet; still blocked on TASKS.md deps #9/#10 (provider choice).
- **Not done**: `DonatePanel.tsx` still shows the old Razorpay-oriented UI, not a UPI QR +
  confirmation form. The backend (`donation_confirmations` table, `/api/donate/confirm`) is
  ready; the UI was not rewired this pass. Still genuinely blocked on dep #11 (UPI QR image/ID
  from the owner) for a correct final UI, so this was left alone rather than half-built.
- Report taxonomy (`problem` enum) already included `missing`/`deceased` — no enum migration
  needed for the M6 taxonomy item.

### Fixed — found by verifying the prior session's claims against actual code, not trusting them
- **Fictional demo data could silently appear on a live production database.**
  `services/animals.ts`, `campaigns.ts`, `stories.ts` had been changed to fall back to
  `DEMO_ANIMALS`/`DEMO_CAMPAIGNS`/`DEMO_STORIES` whenever Supabase returned **zero rows**, not
  just when Supabase was unconfigured. On a connected production database, if the real
  public-animal count ever legitimately reached zero (the exact scenario KNOWN_ISSUES #24
  describes once demo rows are purged for launch), visitors would have silently seen 8
  completely fictional dogs presented as real ones — a serious integrity problem for a platform
  that has otherwise been unusually careful about never inventing content (see the 2026-07-17
  "real vs. fictional" entry above). Root cause: a `data.length > 0` check copied from
  `services/content.ts`, where the same pattern is *correct* — CMS marketing copy legitimately
  should show built-in defaults before the first Sheets sync. Applying it to core domain data
  (animals/campaigns/stories) conflated "not yet synced" with "genuinely nothing to show."
  Reverted to the original `if (!error && data)` check in these three files only; the CMS
  content-table pattern in `services/content.ts` is untouched and remains correct as designed.
- **Every route in the app had become dynamically rendered**, including pages with no
  personalized content (`/faq`, `/offline`, `/login`, `/signup`, `/scan-not-found`, `/about`,
  the whole `/admin/*` tree). Root cause: `app/layout.tsx`'s new `generateMetadata()` and
  `components/layout/SiteChrome.tsx` (both added for the M-CMS-2 nav/footer/settings wiring)
  called `createServerSupabase()`, which invokes Next's `cookies()` API unconditionally —
  forcing every route in the tree to opt out of static rendering, even though `content_*` reads
  are fully public and need no per-request cookie context. Switched `services/content.ts` to
  `createStaticSupabase()` (the cookie-less anon client already used elsewhere in the app for
  exactly this class of read). Verified via `npm run build`: static (`○`) routes went from 3
  before the fix to 19 after, with no loss of correctness (content still reads live from
  Supabase, just without forcing per-request dynamic rendering). Left `/admin/*`'s prerendered
  shell alone after confirming its authorization is enforced client-side (`RequireRole`) plus
  Postgres RLS at the data layer — consistent with the documented security model in PRD.md §5.I,
  not a regression from this session.
- Consolidated two separate `import { ... } from "@/lib/demo/content"` statements in
  `services/content.ts` into one at the top of the file (harmless due to import hoisting, but
  untidy and easy to miss in review).
- `lib/sync/queue.test.ts` — removed an unused destructured variable flagged by lint.

### Verified — this session, against actual code and live commands (not assumed)
- `npm run build`: 61 routes, clean TypeScript, before and after the fixes above.
- `npm run lint`: 0 errors, 3 pre-existing warnings (React Compiler + React Hook Form
  incompatibility notices on `ReportForm.tsx`/`VolunteerForm.tsx` — functionally harmless, not
  introduced this session). **KNOWN_ISSUES #25 (9 lint errors) is resolved in the code** — the
  doc describing it was stale; corrected separately.
- `npm test`: 45/45 runnable tests pass. `lib/sync/queue.test.ts`'s 5 integration tests
  correctly skip (`describe.runIf`) because `SUPABASE_SERVICE_ROLE_KEY` isn't set in this
  environment's `.env.local` — expected per the standing dependency checklist, not a failure.
- Migration 0006 (from the prior session) plus 0008–0010 (this session) applied to the live
  Supabase project (`unyhhkulkgznqoqalqxk`) and confirmed present via schema inspection.
- **Migration `0011_notification_outbox` had NOT actually applied** despite an earlier attempt
  in the prior session — that attempt hit a classifier-availability error on both tries, and the
  session moved on without confirming success or retrying. `notification_outbox` genuinely did
  not exist on the live database until this was caught by direct schema inspection during this
  session's review and applied for real. Until this fix, `/api/notify/dispatch` would have
  returned HTTP 500 in production, and `/api/reports`/`/api/adopt/apply`/`/api/donate/confirm`
  would have silently failed to queue any notification (the insert error was never checked).
  Re-verified post-fix: `notification_outbox` present, RLS enabled, admin-read policy applied.

---

## 2026-07-17 — Final architecture review pack + migration 0006 fixes (pre-apply)

Owner-requested review deliverables before the live migration, plus real defects found by
re-reviewing the committed migration *before* it ever ran against the database.

### Added — architecture review deliverables (all seven)
- **Sync Matrix** — CMS_ARCHITECTURE.md §4.7: one authoritative row per tab (ownership,
  direction, edit permissions per surface, workflow fields, archival).
- **ER diagrams** — DATABASE_SCHEMA.md §0: sync infrastructure + domain core (mermaid).
- **Full column contract** — GOOGLE_SHEETS_SCHEMA.md rewritten: every column on all 18 tabs
  now carries type, required flag, and validation rule; tabs grouped by category; `Donate`
  two-row-shape discrimination; Website Settings known-key registry.
- **Drive folder standard** — CMS_ARCHITECTURE.md §12.1: every media category (Dogs, Stories,
  Events, Volunteers, Assets, Medical Documents, QR Codes) with naming rules the ingest walker
  enforces.
- **`docs/CMS_OPERATIONS.md`** (new): sync-dashboard wireframe (§1), schema evolution strategy
  (§2 — name-based column matching, three-phase additive rollout, tab lifecycle), backup &
  disaster-recovery strategy (§3 — per-system RPO/RTO, five scenario runbooks, drill plan).

### Fixed — migration 0006 defects caught by review before first application
- **Dollar-quoting collision**: the column-helper function's `$$`-delimited body contained a
  nested `do $$` block, which would have terminated the body early — syntax error on apply.
  Rewrote with `$fn$` delimiters and inline `IF` (no nested DO).
- **Multi-statement `EXECUTE`**: the trigger-creation loop passed two statements in one
  `EXECUTE` (plpgsql rejects that). Split into separate executes.
- **Staging tables were documented but not created.** Added `stg_<table>` for all 16
  Sheets→DB synced tables (LIKE-based, RLS-sealed to the service role).
- **Audit-log immutability was RLS-only — which the service role bypasses.** Added a
  `BEFORE UPDATE OR DELETE` trigger raising an exception, making append-only real for every
  role.
- **Advisory locks replaced with a heartbeat lease.** Session-scoped `pg_advisory_lock` over
  PostgREST's pooled connections can acquire on one backend session and release on another —
  leaking the lock and wedging a tab. Per-tab mutual exclusion is now a table-based
  "running-job lease" in `claimNextJob` (fresh-heartbeat check + post-claim re-check);
  `lib/sync/locks.ts` deleted.
- **Dedup lookup in `enqueueJob` never selected `row_id`**, so row-scoped dedup silently
  matched nothing; also now treats a 23505 insert race as `already_running` instead of erroring.
- Dogs archival policy seeded as `manual` (the intended `status_based` predicate needs the
  `current_status` column that only lands in M-CMS-3 — no point seeding a predicate that
  references a column that doesn't exist).

---

## 2026-07-17 — Content Management System milestone (M2/M3, real photos, R3F/GSAP)

The single largest module so far: real (non-demo) content on the site for the first time,
a real-photo gallery system, a React Three Fiber + GSAP homepage showcase, and the code (not
yet live-testable) for Google Sheets/Drive sync. Kicked off from the owner's own photo folder,
which turned out to hold something more significant than expected.

### A finding that reshaped the plan before any code was written
- The owner's `Dog photo` folder wasn't stock/example imagery — it contained a real "URGENT:
  ABANDONED DOG NEEDS YOU!" rescue poster from IIT KGP campus (a Dobermann found tied near
  Dreamland), a real litter of rescued puppies, and several other individually-documented real
  animals, spanning roughly Dec 2024–Sept 2025. This was established by actually opening and
  looking at the photos before making any assumption, not by inferring intent from filenames.
- Given the stakes of misattributing a real, possibly-still-open rescue case, this was treated
  as a content decision only the owner could make (not a default to guess past) — confirmed via
  a single, tightly-scoped question before proceeding. Chosen path: build real animal/story
  records grounded only in directly-evidenced facts (the poster's own printed text; what the
  photos actually show), explicitly marking anything unconfirmed (name, current status) rather
  than inventing an ending. The 8 fictional demo animals were left untouched, still clearly
  labelled `is_demo: true`.

### Added — real content
- **First real animal record**: `/animal/dreamland` (`PAWS-KGP-DOG-0034`, `public_id DOG00009`,
  `is_demo: false`). Bio, health status ("monitoring") and health note are deliberately hedged —
  no invented name, no claimed outcome, no asserted timeline between the two source photos
  beyond what's visually apparent. Real QR tag issued (token `cfef198b`).
- **First real story**: `/stories/field-notes-2025`, "Field Notes: Faces We've Met This Year" —
  8 real photos (a December 2024 litter, several March 2025 individuals), honestly captioned,
  explicitly declining to invent outcomes the record can't support.
- 10 of 12 real photos optimized (sharp: EXIF/GPS stripped via `.rotate()` + default metadata
  stripping, resized to a 1920px max dimension, re-encoded as JPEG q82) and uploaded to a new
  public `animal-photos` Supabase Storage bucket. 2 photos failed — not a code defect, see Fixed.

### Added — infrastructure to support real content
- **Real admin auth account** (`shubhamsourav055+kgppawsadmin@gmail.com`, granted `admin` in
  `user_roles`) — needed because Storage writes require an authenticated admin session, not
  just a database connection, and this is also the first real `/admin` login going forward.
- **Permanent `public_id` system** (migration `0002`/`0004`): `DOG#####`/`CAT#####`, backfilled
  for all 9 existing animals, auto-assigned for new ones via a `BEFORE INSERT` trigger.
- `drive_assets`, `site_settings`, `sync_log` tables; sync metadata columns on `animals`/`stories`.
- A permanent, properly-scoped Storage RLS policy: authenticated admins may write to
  `animal-photos`; everyone can read. Not a temporary hole — see Fixed below for what didn't
  make it into the final design.
- **`components/media/PhotoGallery.tsx`** — lightbox gallery (grid + full-view, prev/next,
  Escape to close, arrow-key navigation), real photos via `next/image`, graceful gradient
  fallback for demo entries with no upload. Wired into both animal profiles and story pages,
  which previously only ever rendered a decorative "photo via CMS" placeholder — **no code
  path existed to show a real photo at all** before this session.
- **`components/home/RealFaces.tsx` + `RealFacesScene.tsx`** — homepage section, the first use
  of React Three Fiber on the site: real photos as gently floating/rotating textured tiles
  (`@react-three/drei`'s `Image`), mouse-parallax camera, plus a GSAP ScrollTrigger-pinned
  horizontal scrub of photo captions. Dynamically imported (`ssr:false`), renders nothing when
  there's no real content yet, and skips the Canvas entirely under `prefers-reduced-motion`
  (static caption list only) rather than forcing WebGL motion on a visitor who asked for less.
- `AnimalPortrait` now accepts an optional `photoUrl` and renders it (inside the same sized/
  rounded container) instead of the illustration when a real cover photo exists — used on both
  the animal profile hero and `AnimalCard`.
- **Sheets sync engine code** (`app/api/sync/run`, `/status`) and **Drive ingest code**
  (`app/api/media/ingest`) — real, complete `googleapis`-based implementations, cron-secret-
  gated, following the exact "return `configured: false` rather than erroring" pattern used for
  Supabase everywhere else. Deliberately scoped to one direction (Sheets/Drive → Supabase) and
  one tab (Dogs) for this pass — see TASKS.md for why bidirectional sync and conflict
  resolution are a follow-up, not this pass.

### Fixed — found by review or by actually testing, not assumed correct
- **A public-write Storage policy was correctly blocked before it shipped.** The first plan for
  uploading local photos was a temporary `anon`-role INSERT policy on `storage.objects` — the
  session's own safety classifier blocked it as a public-write security concern, which was the
  right call. Replaced with a permanent, properly-scoped policy (authenticated admins only) and
  a real admin account, rather than finding a way around the block.
- **`services/stories.ts` hardcoded `demo: false` for every live-mode story** regardless of the
  row's actual `is_demo` column — harmless while every live row happened to be non-demo, but
  wrong in general and would have mislabelled a demo row if one were ever seeded live. Fixed to
  read `row.is_demo`.
- **Photo dates would have shown today's date, not the photo's actual date.** The animal-photo
  mapper fell back to `created_at` (row-insertion time) when `taken_on` was unset — for a live
  upload that's "whenever a volunteer got round to uploading it," not when the photo was taken.
  Caught by looking at the actual rendered page ("17 Jul 2026" next to a photo of a 2025 rescue
  poster) rather than trusting the query. Removed the fallback; no known date now shows no date
  line at all, which is more honest than a wrong one.
- **2 of 12 local photo uploads failed with `ENOSPC`**: the owner's local Google Drive cache
  (`G:`) was at 100% capacity (104 MB free of 232 GB). Not a code defect — confirmed via `df -h`
  before concluding it wasn't transient. Did not attempt to free space by deleting the owner's
  files (out of scope, risky); proceeded with the 10 photos that succeeded, which was enough
  for both the animal record and the story.
- **`googleapis` and the Three.js/R3F/GSAP packages initially failed to install with `ENOSPC`**
  — a *different* disk this time: the `C:` drive (npm's cache location) was at 0 bytes free,
  even though the actual install target (`E:`) had 171 GB free. Fixed by redirecting npm's
  cache to a folder on `E:` rather than touching anything on `C:`. The `C:` drive being
  completely full is a standing environment issue, not something resolved here — see
  KNOWN_ISSUES.
- `animal_photos` had no unique constraint on `(animal_id, storage_path)`, which the Drive
  ingest route's `upsert(...).onConflict(...)` silently depends on — would have errored the
  first time the route actually ran. Added the constraint (migration `0005`) before it could
  bite.
- Documented Google Sheets "Dogs" tab has a `Breed` column with no matching database column.
  Added `animals.breed` (migration `0005`) rather than silently dropping it during sync.
- **Migrations `0002`–`0005` existed live in the database but not as files in the repo** —
  applied directly via the Supabase MCP during development, never written back. A fresh clone
  running `supabase db push` would not have reproduced the current schema. Closed by writing
  `supabase/migrations/0002_cms_foundations.sql` through `0005_breed_and_photo_constraint.sql`
  with the exact SQL that was actually applied, and correcting `docs/DATABASE_SCHEMA.md`'s
  framing (it still said "planned additions" for things that had been live for hours).

### Verified
- Public Storage URL pattern (`{project}.supabase.co/storage/v1/object/public/animal-photos/…`)
  fetches the real uploaded file directly (curl, 200 `image/jpeg`).
- Next.js Image Optimizer correctly proxies and serves the same file through
  `/_next/image?url=…` once `next.config.ts` allowlisted the Supabase host via `remotePatterns`.
- `/animal/dreamland` and `/stories/field-notes-2025` both render real photos end-to-end (DOM
  inspection: correct `<img>` src, correct alt text) — 1 real-photo card + 8 illustrated demo
  cards on `/adopt`, confirming no regression to the existing fictional dataset.
- Production build re-verified after all of today's changes: **48 routes** (up from 45 — the
  3 new API routes), clean TypeScript, all static pages generated. Two real problems surfaced
  and fixed along the way (not silently patched around) — see Fixed above for the
  `isPaymentConfigured` regression, and below for the memory issue.
- **`next build`'s TypeScript-checking phase ran out of memory** after adding Three.js/R3F/drei
  (their type definitions are large; default V8 heap ~2 GB wasn't enough — first attempt crashed
  with `FATAL ERROR: Ineffective mark-compacts near heap limit`, second attempt with a larger
  heap took 2.9–3.9 min to typecheck successfully). Fixed **permanently**, not just for this one
  run: added `cross-env` and changed `package.json`'s `build` script to
  `cross-env NODE_OPTIONS=--max-old-space-size=6144 next build`, so both local builds and
  Vercel's build inherit the larger heap automatically.

---

## 2026-07-16 — Module M-B: Automated test suite ✅ TESTED

45 Vitest unit tests + 17 Playwright E2E tests, all passing. Closes KNOWN_ISSUES #12
("no automated test suite" — every regression up to this point was caught only by manual
clicking or direct SQL). Run with `npm test` and `npm run test:e2e`.

### Added
- **Vitest** (`vitest.config.ts`) — `lib/utils.test.ts` (18 tests: formatting, percentage
  clamping, age parsing, hash determinism), `lib/local-store.test.ts` (14 tests, jsdom
  environment: saved animals, report/application ID sequencing, demo session round-trips),
  `services/animal-mapper.test.ts` (13 tests — see refactor note below).
- **Extracted `services/animal-mapper.ts`** out of `services/animals.ts`: `mapAnimalRow` moved
  to its own module with zero Next.js/Supabase imports, specifically so it's unit-testable
  without evaluating `next/headers` outside a request context. This is the exact function the
  QR-token bug (M1) lived in — it now has direct regression tests: active-vs-inactive tag
  selection, missing `qr_tags` array, medical-timeline/sightings sort order, and default
  fallbacks for every optional column.
- **Playwright** (`playwright.config.ts`, `e2e/*.spec.ts`) — homepage, adopt search/empty-state,
  report submission → tracking code → tracker page, QR scan → profile (+ unknown-token →
  scan-not-found), demo role login → admin/volunteer dashboards, unauthenticated `/admin` guard,
  and a PWA offline test that automates the exact manual check that caught the M-A
  service-worker bug (visit a profile, go fully offline, confirm it still renders; visit an
  unvisited page offline, confirm the `/offline` fallback shows).
- E2E always runs against a **forced demo-mode server** — `playwright.config.ts`'s
  `webServer.env` overrides the two Supabase env vars for the spawned test server process only,
  so the suite is deterministic and credential-free regardless of what's in the developer's
  `.env.local`. (Live-mode/RLS behavior is covered separately, via direct SQL — see M1.)

### Fixed
- **Playwright's default full parallelism caused one test to silently fail to navigate** — a
  button click landed before React had finished attaching its handler (classic hydration race
  under resource contention), reproduced consistently in parallel and passed cleanly every time
  under `--workers=1` on this machine. Verified the root cause empirically (isolated re-run)
  before concluding it was contention and not a real bug, rather than guessing. Set `workers: 1`
  with a comment explaining why and when to revisit it.
- Six Playwright assertions used ambiguous locators for text that legitimately renders twice on
  a page (a status value in both a summary chip and a progress stepper; a PAWS ID in both the
  identity header and the QR tag flip-card; "Demo mode" in both the login banner and an
  unrelated footer badge) — each is a real strict-mode catch, not a false positive; scoped with
  `.first()` or `exact: true` as appropriate.
- `services/animals.ts`'s `resolveQrToken` had an `(data as any)` cast (pre-existing, from M1) —
  typed the Supabase response shape properly while the file was already open for the refactor.

### Found, not fixed here (flagged separately)
- `npm run lint` fails with **9 pre-existing errors**, none introduced by this module (confirmed
  via `git diff HEAD` — every affected file was untouched today). All are
  `react-hooks/set-state-in-effect`: components hydrating localStorage-backed demo state via
  `useEffect` + `setState` on mount, a legitimate pattern that a newer, stricter lint rule now
  flags. Plus one `react-hooks/immutability` error (`window.location.href` in `AuthCard.tsx`).
  Flagged as a separate background task rather than folded into "add tests" scope — see
  KNOWN_ISSUES #25.

---

## 2026-07-16 — Module M1: Live Supabase backend ✅ TESTED & PRODUCTION VERIFIED

The app no longer runs on demo fixtures: https://kgp-paws.vercel.app now reads
every animal, campaign, story and QR tag from a real Postgres database.

### Added
- **Supabase project provisioned** — `kgp-paws`, region `ap-south-1` (Mumbai, lowest latency
  to Kharagpur), free tier ($0/month, confirmed before creation). Deliberately a *separate*
  project from the pre-existing "Shubham's Project" so KGP PAWS tables don't mix with
  unrelated BMS work in the same org.
- **Schema applied**: 23 tables, 15 enums, RLS on every table, audit triggers.
- **Demo data seeded** — 8 animals, 8 QR tags, 11 medical events, 5 campaigns, 2 reports,
  3 stories, impact metrics. Every row `is_demo = true` so real data can replace it cleanly.
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` wired into Vercel production.
- `createStaticSupabase()` — cookie-less anon client for build-time contexts.

### Fixed — schema bugs that made the migration unrunnable as written
- **`has_role()` was declared before the `user_roles` table it queries.** It's a `language sql`
  function, so Postgres validates the body at creation time — the migration would have failed
  with "relation user_roles does not exist" the first time anyone ran it. Moved below the table.
- **`set_updated_at()` had a mutable `search_path`** (Supabase advisor 0011) — a known
  privilege-escalation vector. Pinned to `public`.

### Fixed — security holes found by the Supabase advisor + verification
- **Privilege escalation via public INSERT.** The public write policies use
  `WITH CHECK (true)` (correct — reporting an injured animal must never require login), but
  RLS governs *rows*, not *columns*, and Supabase grants table-level INSERT by default. A
  crafted request could submit an adoption application already marked **`approved`**, write
  staff-only `internal_notes`, or set a report's triage `status`. Fixed by revoking INSERT at
  table level and granting back an explicit safe-column list.
  A first attempt using column-level `REVOKE` was **ineffective** (Postgres ignores a
  column-level revoke when a table-level grant exists) and was only caught by verifying the
  actual grants afterwards rather than trusting the migration's success response.
- **`log_audit()` was callable over `/rest/v1/rpc/`.** Revoking from `anon`/`authenticated`
  was a no-op — Postgres grants EXECUTE to `PUBLIC` by default and those roles inherit it.
  Revoked from `PUBLIC`; verified the audit triggers still fire afterwards.

### Fixed — bugs that would have shipped broken to users
- **Every campaign showed ₹0 raised.** `campaigns_with_totals` is `security_invoker` over the
  private `donations` table, so an anonymous visitor aggregated across zero visible rows.
  Totals now come from a `security definer` function returning only the aggregate — campaign
  rows still respect RLS (flipping the whole view to definer would have leaked inactive
  campaigns).
- **`supporter_count` was permanently 0** for guest donations: it counted
  `distinct donor_id`, which is NULL for guests — i.e. for the entire UPI donation model.
  Now counts verified donations.
- **Every QR code would have been blank in live mode.** `services/animals.ts` read
  `row.qr_token`, a column that doesn't exist on `animals` (tokens live in `qr_tags`). The
  flagship scan feature would have generated QR codes pointing at `/p/` with no token.
- **The build broke as soon as credentials existed.** `generateStaticParams` called `cookies()`
  through the Supabase server client; `cookies()` throws at build time. Demo mode had masked
  this by returning `null` before reaching it.
- **Seed data showed 153% funded.** Donations were cross-joined onto every campaign, so
  Simba's ₹12,000 fund displayed ₹18,400 raised. Now per-campaign (61%/77%/48%/41%/62%).
- **`.gitignore` excluded `.env.example`** via `.env*`, so a fresh clone had no setup template
  despite the README pointing at it.

### Verified
Anonymous-role SQL checks: public animals readable (8); `get_report_status` works for
anonymous tracking; donations invisible (0 rows despite 15 existing); `rescue_reports`
invisible (precise lat/lng never exposed); campaign totals correct. Live production: QR scan
→ Simba's profile from the database, donate page shows real totals, login shows the real
credential form instead of the demo role switcher.

---

## 2026-07-16 — Module M-A: PWA ✅ TESTED & PRODUCTION VERIFIED

### Added
- **Installable PWA.** `app/manifest.ts` (Next-native manifest route) with standalone display,
  brand theme/background colors, categories, and two app shortcuts ("Report an animal", "Meet
  the paws") so a volunteer can jump straight to reporting from their home screen.
- **Service worker** (`public/sw.js`, hand-rolled — no `next-pwa`, which isn't maintained
  against Next.js 16). Network-first for pages (health/medical info must never be stale when
  online), cache-first for content-hashed static assets, versioned caches purged on activate.
  **Never caches** `/admin`, `/dashboard`, `/login`, `/signup`, `/api/*` — authenticated or
  personalised responses must not persist on a shared or borrowed phone.
- **Offline shell** (`app/offline/page.tsx`) — precached fallback that points the visitor at
  the emergency contact on a previously-viewed profile when they have no data.
- **App icons** generated from the existing brand `PawMark` (`public/icons/`): 192, 512,
  maskable 512 (paw inside the 80% safe zone so Android's mask can't clip it), and a 180px
  Apple touch icon. Generated with `sharp` from the same SVG path used by the in-app logo, so
  the installed icon and the header logo can't drift apart.
- `appleWebApp` metadata + apple-touch-icon wired into the root layout.

### Fixed
- **Service worker never registered.** `ServiceWorker.tsx` waited on `window`'s `load` event,
  but the effect runs after hydration — by which point `load` has almost always already fired,
  so the listener never ran and no SW was installed. Now registers immediately when
  `document.readyState === "complete"` and only waits for `load` when genuinely still loading.
  Caught by testing actual registration state in-browser rather than assuming the code worked.

### Changed
- Docs reconciled against the owner's formal JSON specification: Lighthouse performance target
  corrected to **≥ 95** (was incorrectly documented as 100); Google Sheets tab names fixed to
  the exact case-sensitive strings (`MedicalHistory`, `QRCode`, `WebsiteSettings`); the
  proposed `Gallery` tab removed in favour of Drive folder auto-discovery; Drive folder
  structure corrected to `Dogs/DOG0001/{cover.jpg, gallery/, medical/}`; search re-specified
  as **AI semantic** (pgvector + hybrid lexical re-rank) rather than lexical-only; PWA,
  dark mode, Supabase Realtime, and automated tests added to the PRD as first-class P0/P1
  requirements (they were missing entirely).

### Changed
- Product direction: moving from illustrated-portrait demo experience to a production platform
  with real photography (Google Drive-sourced), Google Sheets as the volunteer-facing CMS, and
  a UPI-QR donation flow (no payment gateway).

### Planned removals (see TASKS.md M5)
- Razorpay-oriented donation intent UI and associated `.env.example` entries — replaced by the
  UPI QR + confirmation-form model described in PRD §5.D.

---

## 2026-07-16

### Added
- Production deployment to Vercel: **https://kgp-paws.vercel.app** (project `kgp-paws`, team
  `shubhams-projects-866f85e4`), deployed via `vercel deploy --prod --yes` from the local
  working tree (no GitHub connection yet).
- `NEXT_PUBLIC_SITE_URL` production env var set to the live Vercel URL so QR codes and sitemap
  entries resolve to the deployed domain.

### Fixed
- `.vercelignore` initially excluded `supabase` unanchored, which also matched `lib/supabase/`
  (imported by the app) and broke the first deploy (`Module not found`). Anchored the pattern
  to `/supabase` — the SQL migrations directory only — and redeployed successfully.

### Verified
- Live-site smoke test: homepage, QR resolver (`/p/{token}` → animal profile with scan
  greeting), sitemap.xml, robots.txt all confirmed working post-deploy (see TEST_REPORT.md).

## 2026-07-13 → 2026-07-15 (local build, pre-deployment)

### Added
- Full Next.js 16 App Router application scaffolded from the 27-section specification:
  homepage (11 sections), animal digital identity profile, adopt discovery + 6-step
  application flow, donate page + campaign transparency ledger, editorial stories platform,
  rescue report form + public tracker, stylized campus map with zone-level privacy, about/
  volunteer pages, Supabase-backed auth with demo-mode role switcher, three role-based
  dashboards (user, volunteer, admin CMS with 6 operational panels).
- Demo-mode architecture: `lib/demo/*` fixtures + `lib/local-store.ts` localStorage
  persistence, so the entire app is explorable and functional with zero external credentials.
- Illustrated SVG animal portrait system with idle animation (breathing, blinking, ear/tail
  movement) as photo-ready placeholders.
- Real QR code generation (`qrcode` package) + 3D flip tag component.
- `supabase/migrations/0001_initial_schema.sql` — 23-table schema with RLS on every table,
  audit-log triggers, privacy-preserving views/functions (`campaigns_with_totals`,
  `get_report_status`).
- `supabase/seed.sql` — fully labelled demo dataset (8 animals, 5 campaigns, reports, stories,
  impact metrics — every row `is_demo = true`).
- SEO infrastructure: `sitemap.ts`, `robots.ts`, custom 404 page.
- `README.md` — architecture overview, setup instructions, Supabase/payment/map setup guides.

### Fixed
- `AuthCard.tsx` — a single Zod schema shared between login/signup modes caused a
  `react-hook-form` resolver type mismatch (`name` field only valid in signup). Split into
  `makeSchema(mode)` returning a mode-specific schema.
- `app/layout.tsx` — added `data-scroll-behavior="smooth"` to silence a Next.js dev warning
  about smooth-scroll route transitions.
- Footer social icons — `lucide-react` has no `Twitter` export; replaced with custom inline SVG
  icons (Instagram/Facebook/X).

### Verified
- Full production build (`next build`) — 44 routes compiled and statically generated with zero
  type errors.
- Manual E2E pass in-browser: animal profile + medical timeline render; adopt search/filter
  narrows correctly; report submission → tracker shows the new report with full status
  stepper; demo role-switch login → admin dashboard shows live stats from seed + local data.
