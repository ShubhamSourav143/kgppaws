# KGP PAWS — Task Plan & Dependency Checklist

Living document. Last updated **2026-07-18**. This is the execution plan referenced by
PRD.md §6. Work proceeds **module by module**: plan → implement → test → update docs → mark
PRD status → summarize changes. No module starts before the previous one is stable, except
where explicitly parallelizable (noted below).

> **CMS-first architecture (2026-07-17).** The M-CMS-1 through M-CMS-7 milestones added below
> supersede the legacy M2/M3/M7 sync milestones. See [CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md)
> for the full design.

---

## Dependency checklist (blocking items) — **read this first**

Several modules cannot start until the project owner provides access or makes a decision.
Nothing below is guessed or assumed — each is called out at the module it blocks.

| # | Needed | For | How to provide | Status |
|---|---|---|---|---|
| 1 | **GitHub repository** (new or existing empty repo) + push access | CI/CD, PR previews, code history | ⚠️ **I tried and cannot do this for you**: `gh` CLI isn't installed here, and the GitHub MCP connector requires an OAuth flow that a non-interactive session can't complete. Either (a) create an empty repo and send me the URL, or (b) authorize the GitHub connector / install `gh` and run `gh auth login` in an interactive terminal. Work is committed locally meanwhile. | ❌ blocked on you |
| 2 | **Google Cloud project** with Sheets API + Drive API enabled, plus a **service account** JSON key, with the target Spreadsheet and Drive folders shared to that service account's email as Editor | Sheets CMS sync (M2), Drive media pipeline (M3) | Share the service-account email on the Sheet/Drive folders; paste the JSON key (I'll store it only as a Vercel env var, never in the repo) | ❌ not provided |
| 3 | **The actual Google Sheet** (new, based on GOOGLE_SHEETS_SCHEMA.md) or confirmation to create one from the schema | M2 | Share link, or say "create it for me" | ❌ not provided |
| 4 | **The actual Google Drive folder structure** (Dog Photos, Treatment Photos, Blog Images, Videos, Documents) — can be the folder already referenced (`G:\My Drive\By Shubham\Dog photo\`) reorganized, or a fresh structure | M3 | Folder link(s) + confirmation of the convention | ⏳ one local folder seen; not yet mapped to dogs or shared via API |
| 5 | **Supabase project** | Live database (M1) | — | ✅ **done** — provisioned `kgp-paws` (ref `unyhhkulkgznqoqalqxk`, ap-south-1, $0/mo) in your `bms` org, schema + RLS applied, seeded, wired to Vercel |
| 6 | **Photo → animal mapping** | Real-photography experience | ✅ **resolved 2026-07-17, differently than expected** — the photos in `G:\My Drive\By Shubham\Dog photo\` turned out to be real IIT KGP rescue documentation (an "abandoned dog" appeal poster, real puppies), not stock/example content or photos of the 8 fictional demo dogs. Confirmed with the owner before use (see CHANGELOG); resulted in one new real animal record + one new real story, **not** a mapping onto Simba/Muesli/etc. |
| 7 | **Vercel project access** | Already have it — deployed 2026-07-16 | — | ✅ done |
| 8 | **Domain** `kgppaws.org` (or chosen alternative) | Custom domain, canonical QR URLs (M10) | Registrar access or confirmation to purchase | ❌ not provided |
| 9 | **Email provider** decision + credentials (Resend recommended; or Gmail/Workspace SMTP app password) | Notifications (M6) | Pick one; provide API key or Gmail app password | ❌ not decided |
| 10 | **WhatsApp provider** decision + credentials (Meta WhatsApp Cloud API recommended, free tier; or Twilio) | Notifications (M6) | Pick one; provide credentials | ❌ not decided |
| 11 | **UPI donation details**: QR image(s), UPI ID, account holder name | Donations (M5) | Upload image(s) + text | ❌ not provided |
| 12 | **Turnstile site/secret keys** (Cloudflare, free) | Anti-spam on public forms | Sign up, paste keys — optional but recommended before public launch | ❌ not provided (optional) |

**Nothing in items 1–6, 8–11 is assumed.** Where a module's status below says BLOCKED, that
dependency is why — work resumes the same day the item is provided.

---

## Module plan

### M0 — Documentation — **COMPLETED** (2026-07-16)
Deliverable: the `docs/` suite (10 documents), reconciled against the owner's formal JSON spec.

### M-A — PWA — **TESTED & PRODUCTION VERIFIED** (2026-07-16)
Installable manifest, service worker (network-first pages / cache-first assets / never caches
authenticated routes), offline shell, brand-derived icons. Chosen as the first module
specifically because it needs **zero external credentials** — real progress while the
connector checklist is outstanding. Live on https://kgp-paws.vercel.app.

### M-B — Automated test suite — **TESTED** (2026-07-16)
Vitest (45 unit tests: `lib/utils.ts`, `lib/local-store.ts`, and a new `services/animal-mapper.ts`
— the exact module the QR-token bug lived in, now with regression tests for it) + Playwright
(17 E2E tests: homepage, adopt search, report submit→track, QR scan→profile, PWA offline —
automating the identical manual check that caught the SW-registration bug in M-A). Closes
KNOWN_ISSUES #12. Run with `npm test` / `npm run test:e2e`.

- Extracted `mapAnimalRow` out of `services/animals.ts` into its own pure module
  (`services/animal-mapper.ts`, zero Next.js imports) specifically so it's unit-testable without
  fighting `next/headers` in a non-Next test runner.
- E2E runs against a forced demo-mode server (`playwright.config.ts` overrides the two Supabase
  env vars for the spawned test server only) regardless of the live credentials in the
  developer's `.env.local` — deterministic, credential-free, safe before CI secrets exist.
- **Found and fixed a real test-environment issue, not an app bug:** running the E2E suite fully
  parallel against a single `next start` process on this machine caused one test's button click
  to land before React had attached its handler (button existed in the DOM; hydration hadn't
  finished). Reproduced consistently under parallelism, passed cleanly every time serialized.
  Set `workers: 1` with a comment explaining why — revisit once a real CI runner exists.
- **Found 9 pre-existing lint errors** while wiring this up (`npm run lint`, not previously run
  in this depth) — none introduced by M-B. Flagged as a separate task rather than fixed inline;
  see KNOWN_ISSUES #25.

### M-C — Dark mode — NOT STARTED (unblocked, ready to start)
Token-driven dark theme across the app (`app/globals.css` already centralises the palette),
system-preference default + manual toggle with persistence. Required by spec
(`frontend.dark_mode`). **Needs no credentials.**

### M1 — Foundations: live Supabase — **TESTED & PRODUCTION VERIFIED** (2026-07-16)
- ✅ Supabase project `kgp-paws` provisioned (ap-south-1, free tier), schema + RLS applied,
  demo data seeded, keys wired into Vercel. Live at https://kgp-paws.vercel.app.
- ✅ RLS verified from the `anon` role; 9 bugs found and fixed (see CHANGELOG) including a
  privilege-escalation hole that would have let anyone self-approve an adoption application.
- ⚠️ **GitHub still outstanding** (dep #1): the GitHub CLI isn't installed on this machine and
  the GitHub MCP connector needs an OAuth flow that can't run in a non-interactive session.
  Work is committed **locally** (`b4644c8`, 135 files) so nothing is lost, but there is still
  no off-machine backup, no CI, and no PR previews. **Needs owner action.**
- ⏭️ `SUPABASE_SERVICE_ROLE_KEY` not yet set — not needed until the first server route (M2).
  Retrieve from Supabase dashboard → Project Settings → API when M2 starts.

### M2 — Google Sheets sync engine (Dogs tab only) — **SUPERSEDED** by M-CMS-1 through M-CMS-3
- ✅ Migration `0002`/`0005`, `/api/sync/run`, `/api/sync/status` shipped 2026-07-17.
- ⚠️ **This module's design is superseded by the CMS-first architecture** ([CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md)):
  single-tab, no-queue, no-conflict, no-retry sync is not the target. The route file is kept
  temporarily as a shim that enqueues into the new queue during M-CMS-1 rollout, then removed.

### M3 — Google Drive media pipeline + real-photography experience — **PARTIALLY COMPLETE / SUPERSEDED by M-CMS-3 for the pipeline** (real photos already shipped)
- ✅ **Real-photography experience shipped** — not via the Drive API (still blocked on dep #2),
  but via a one-time **local import** since the owner's Drive is mounted locally on this
  machine. 10 real photos optimized (sharp: EXIF/GPS-stripped, resized, re-encoded) and
  uploaded to Supabase Storage. Resulted in one new real animal (`/animal/dreamland`) and one
  new real story (`/stories/field-notes-2025`) — see CHANGELOG for why it wasn't a mapping onto
  the 8 fictional demo dogs.
- ✅ Illustrated portraits now correctly replaced by real cover photos **wherever a real photo
  exists** (`AnimalPortrait` accepts an optional `photoUrl`); the 8 fictional demo animals keep
  their illustrations by design (see PRD.md §5.A).
- ✅ Real-photo lightbox gallery (`components/media/PhotoGallery.tsx`) — used on both animal
  profiles and story pages.
- ✅ Floating image wall / scroll storytelling shipped as `components/home/RealFaces.tsx` — a
  React Three Fiber floating-photo-tile scene + GSAP ScrollTrigger horizontal caption scrub
  (GSAP + R3F rather than the originally-scoped GSAP + Lenis; Lenis wasn't needed once R3F
  handled the "floating" part). Renders nothing when there's no real content yet; static
  fallback under `prefers-reduced-motion`.
- ✅ `/api/media/ingest` built (Drive→Storage, `Dogs/<public_id>/{cover,gallery/,medical/}`
  convention) — same "code complete, credential-gated" status as M2's sync engine.
- ⏭️ Not done: automatic ingestion when a volunteer drops a NEW photo in Drive (needs dep #2);
  cover-image override via a Sheets column (Drive filename convention works, Sheets override
  doesn't yet); responsive AVIF/WebP ladder (current pipeline produces one optimized JPEG per
  photo — proportionate for a manual import, the automated pipeline should do more).
- Verify (once dep #2 arrives): drop a photo in the Drive folder → optimized variants appear on
  the live profile within one ingest cycle; Lighthouse image metrics stay green.

### M4 — Animal profile v2 + permanent ID + QR/PDF — **CODE COMPLETE** (2026-07-18)
- ✅ `public_id` (`DOG#####`) already live since M1 (all 9 animals have one, confirmed live).
- ✅ `/dog/[publicId]` route — resolves `animals.public_id`, redirects to `/animal/[slug]?via=qr`.
  `/p/[token]` retained as the revocable-tag fallback per plan.
- ✅ `/api/qr/generate` (admin-authenticated, issues/reuses a `qr_tags` row, PNG error-correction H).
- ✅ `/api/qr/print-sheet` — shipped as a printable HTML A4 sheet (2×4 grid, crop marks) instead
  of a `react-pdf` binary; every browser prints it at exact mm sizing without adding a PDF
  dependency. Functionally equivalent to the original "A4 PDF" goal.
- ⏭️ Weight/breed fields: the `Dogs` sync tab supports them (M-CMS-3); not yet confirmed
  surfaced in the `/animal/[slug]` profile UI itself — worth a follow-up check.
- ⚠️ Not yet verified end-to-end (generate QR → scan → profile → print sheet) — no live QR was
  actually printed and scanned this session.

### M5 — UPI donations rework — BLOCKED (dep #11); backend now code-complete, UI not started
- ✅ `donation_confirmations` table (migration `0010`, applied and confirmed live) + column-level
  RLS keeping donor phone/email out of the general read grant.
- ✅ `/api/donate/confirm` — public write route, Zod-validated.
- ❌ **Donate page UI not rewired.** `DonatePanel.tsx` still shows the old Razorpay-oriented demo
  flow, not a UPI QR + confirmation form. Genuinely blocked on dep #11 (UPI QR image, UPI ID,
  account holder name from the owner) — building a final UI without real assets would just be
  guessing, so this was correctly left alone rather than half-built.
- ❌ Admin approval queue UI, Recent Donors wall — not started.
- ❌ Razorpay-oriented `.env.example` entries not yet removed (see `NEXT_PUBLIC_UPI_ID` already
  present alongside legacy references — needs a cleanup pass once M5 UI work starts for real).

### M6 — Reports v2 + notifications — backend code-complete; provider integration BLOCKED (deps #9, #10)
- ✅ Report taxonomy already included `missing`/`deceased` (confirmed in the live enum) — no
  migration was needed for this item, contrary to the original plan's assumption.
- ✅ `/api/reports`, `/api/adopt/apply` — real route handlers replacing client-only demo writes.
- ✅ `notification_outbox` (migration `0011` — **had to be re-applied this session; see
  CHANGELOG 2026-07-18, it silently never landed the first time**) + `/api/notify/dispatch`
  (exponential-retry drainer, 5 attempts).
- ❌ **Email/WhatsApp provider integration is a stub — genuinely empty, not just untested.**
  `sendEmailStub`/`sendWhatsAppStub` in `/api/notify/dispatch` are literal no-ops (verified by
  reading the function bodies: they only `void` their arguments). Until
  `EMAIL_PROVIDER_API_KEY`/`WHATSAPP_PROVIDER_TOKEN` are unset, every queued notification is
  correctly marked `skipped` with an explicit reason. **Trap to flag for the owner**: setting
  those env vars alone will NOT make notifications start sending — the drainer will happily mark
  every row `sent` (no error occurs, because the stub succeeds by doing nothing) while no email
  or WhatsApp message is ever actually transmitted. Wiring a real Resend/Meta Cloud API call into
  these two functions is required work, not just a credentials drop-in.
- Verify (once providers are chosen): submit a report → admin receives email + WhatsApp within
  the cron interval; failure is retried and visible in the outbox status.

### M7 — Blog engine (Sheets-driven) — **SUPERSEDED by M-CMS-4** (Stories tab)

### M8 — Intelligent search — depends on M1 (and ideally M7 for blog content to search)
- `search_index` materialized view, FTS + trigram + light intent mapping.
- `/api/search` + search UI (command-palette style, on-brand).
- Verify: typo-tolerant query returns relevant dogs/blogs/pages; role-gated fields never leak
  to anonymous search.

### M9 — Dashboard v2 + dark mode — depends on M1–M6 (surfaces their data)
- System health panel (sync, media ingest, notification outbox at a glance).
- Dark mode across the whole app (Stripe/Linear/Vercel-grade), respecting the existing token
  system in `app/globals.css`.
- Verify: theme toggle persists per user; every existing page passes contrast checks in both modes.

### M10 — Performance/SEO/accessibility audit + domain launch — BLOCKED (dep #8); depends on all prior modules
- Lighthouse 100×4 pass across the key templates (home, animal profile, donate, stories, admin).
- Point `kgppaws.org` at Vercel; update `NEXT_PUBLIC_SITE_URL`, sitemap, QR base URL.
- Final security review (Turnstile, rate limits, RLS re-audit).

---

## CMS-first architecture roadmap (2026-07-17 →)

Anchor document: [CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md). These milestones supersede M2, M3
(pipeline portion only), and M7. Total estimated effort: 12–16 working days.

### M-CMS-1 — Sync foundations — NOT STARTED (unblocked)
**Verifiable outcome:** an empty sync job runs end-to-end; `sync_jobs` row transitions
`queued → running → succeeded`; `content_audit_log` records the run (with zero rows changed);
compat-shim call to `/api/sync/run` enqueues a job in the new queue.

- Migration `0006_cms_first_architecture.sql`:
  - New tables: `sync_jobs`, `sync_conflicts`, `content_audit_log`, `tab_config`,
    staging tables per content tab.
  - Rename `site_settings → content_settings`.
  - Rename existing sync-metadata columns to match the new naming
    (`synced_at → last_synced_at`, add `sync_status`, `last_sync_error`,
    `archived_at`, `public_id` on all content tables).
  - New content tables: `content_home`, `content_adoption`, `content_help`, `content_faq`,
    `content_events`, `content_navigation`, `content_footer`, `content_donate`,
    `volunteer_directory`, `animal_vaccinations`, `animal_sterilizations`.
  - Seed `tab_config` for all 18 editable tabs with categories + archival policies.
  - RLS policies per [CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md) §11.3.
  - `content_audit_log` immutability enforced via missing update/delete policies.
- New `lib/sync/` module:
  - `lib/sync/types.ts` — Zod schema per tab.
  - `lib/sync/tabs/registry.ts` — reads `tab_config`, dispatches to per-tab modules.
  - `lib/sync/tabs/<tab>.ts` — one file per tab: header spec, mapper, validator, apply logic.
    (M-CMS-1 ships the registry; per-tab files land in M-CMS-2 onward.)
  - `lib/sync/queue.ts` — enqueue, dedup, dequeue, heartbeat, retry, next-run-at scheduler.
  - `lib/sync/worker.ts` — the shared per-tab worker (§7.3 of CMS_ARCHITECTURE.md).
  - `lib/sync/incremental.ts` — incremental scan logic (§7.1). Reads `_updated_at` column,
    computes candidate set, batchGet full rows.
  - `lib/sync/audit.ts` — diff computation, `content_audit_log` writer.
  - Per-tab mutual exclusion lives in `queue.ts` as a heartbeat-guarded running-job lease —
    session-scoped `pg_advisory_lock` was rejected (leaks under PostgREST connection pooling).
- New API routes:
  - `POST /api/sync/enqueue` — admin-authenticated. Enqueues a job. Dedups on
    `(tab, direction, row_id)`.
  - `POST /api/sync/worker` — cron-secret-gated. Pulls the next queued job and runs it.
    Reentrant; safe to call in parallel.
  - `POST /api/sync/housekeeping` — cron-secret-gated. Marks expired heartbeats failed, retries,
    cleans succeeded jobs > 30d.
- **Compat-layer rewrites** (not deletions):
  - `/api/sync/run` becomes a shim that enqueues a `Dogs` full-scan job into the new queue
    and returns the enqueued jobId. Same request shape (`x-cron-secret` header). Logged as
    `triggered_by = 'compat_shim'` so we can see whether it's still being called before removal.
  - `/api/sync/status` becomes a thin wrapper over the new `sync_jobs` table, returning the
    same JSON shape it returned `sync_log` rows before.
- **No per-tab implementations in this milestone** — the registry allows registering tabs, but
  the tabs themselves land in M-CMS-2/3/4. M-CMS-1's job is the plumbing.

### M-CMS-2 — Content tabs batch 1 (Home, Settings, Navigation, Footer, FAQ, Help) — **CODE COMPLETE** (2026-07-17/18)
**Verifiable outcome:** change a Home hero title in Sheets → run sync → homepage renders new
title within one sync cycle. Change a nav item in Sheets → renders. Change a FAQ answer → renders.

- ✅ Six content tabs implemented (`lib/sync/tabs/home.ts`, `navigation.ts`, `footer.ts`,
  `faq.ts`, `help.ts`, `website-settings.ts`) on the shared `runSheetsToDb` apply engine.
- ✅ `app/layout.tsx`, `components/layout/{SiteChrome,Header,Footer}.tsx`, `app/faq/page.tsx`,
  `app/volunteer/page.tsx`, homepage sections (`Hero`, `Impact`, `MeetThePaws`, `HelpSection`,
  `CampusHome`) now read through `services/content.ts` instead of hardcoded JSX strings.
- ✅ `lib/demo/content.ts` centralizes built-in copy shown before the first Sheets sync.
- ⚠️ **Not yet live-verified** (still blocked on dep #2, Google service account) — the "change a
  cell in Sheets → renders" outcome above has not been observed against a real spreadsheet. What
  *is* verified: `npm run build` (61 routes, clean TypeScript), the fallback path renders
  correctly with an empty/unconfigured database, and `services/content.ts` correctly reads from
  `content_*` tables when populated (schema confirmed live).
- 🐛 **Found and fixed in this session's review**: `services/content.ts` used the cookie-bound
  `createServerSupabase()` client for fully public reads, forcing the entire app dynamic (static
  routes dropped to 3). Switched to `createStaticSupabase()`; static routes recovered to 19. See
  CHANGELOG 2026-07-18.

### M-CMS-3 — Content tabs batch 2 (Dogs, Medical, Vaccination, Sterilization) + media v2 — **CODE COMPLETE** (2026-07-17/18)
**Verifiable outcome:** add a new dog row in Sheets + drop 3 photos in `Dogs/<Public ID>/gallery/`
in Drive → both appear on site within one sync cycle with responsive images (AVIF/WebP × 4 sizes).

- ✅ Dogs, Medical History, Vaccination, Sterilization tabs implemented
  (`lib/sync/tabs/{dogs,medical-history,vaccination,sterilization}.ts`).
- ✅ `animal-mapper.ts` merges vaccination/sterilization records into the public medical timeline.
- ✅ Media pipeline v2 (`lib/media/pipeline.ts`, rewritten `/api/media/ingest`): variant ladder
  (3200/1600/800/400 × AVIF/WebP/JPEG), blurhash, checksum-based skip. Migration `0008` adds the
  supporting columns — **applied to live DB, confirmed via schema inspection**.
- ✅ Broken-image sweep (`/api/media/sweep`) — cross-references `animal_photos` against Storage,
  flags orphans via `broken_at` + `sync_conflicts`.
- ⚠️ `/api/sync/run` Dogs-only shim **not yet retired** — still the compat layer per its
  original design; retiring it is a documentation/cleanup task, not blocking.
- ⚠️ Frontend not yet switched to `next/image` srcset from the variant ladder — the ladder is
  produced and stored, but animal profile/gallery components still render the single canonical
  path. Follow-up item, not done this pass.
- ⚠️ Not yet live-verified against a real Drive folder (dep #2).

### M-CMS-4 — Content tabs batch 3 (Donate, Adoption, Stories, Volunteers, Events) — **CODE COMPLETE** (2026-07-17/18)
**Verifiable outcome:** publish a new story via Sheets → live on `/stories/[slug]` within one
sync cycle. Change a donation campaign goal in Sheets → homepage stat updates.

- ✅ Five tabs implemented (`lib/sync/tabs/{donate,adoption,stories,volunteers,events}.ts`).
- ✅ `donation_campaigns` sync-metadata columns added (migration 0006); `content_donate` for
  page-level copy.
- ✅ Stories markdown stored as a single markdown block in `blocks jsonb` at sync time.
- ⏭️ **Not done**: retire the in-app Story CMS admin panel (`app/admin/stories/page.tsx`) in
  favor of a read-only Sheets preview — still the original write-capable panel.
- ⏭️ **Not done**: donation campaign QR image auto-linkage from `Assets/donation-qr/` — the
  `Donate` tab's `QR Image` column is parsed but not yet resolved to a Storage URL at sync time.
- ⚠️ Not yet live-verified (dep #2).

### M-CMS-5 — Reverse sync (Supabase → Sheets) — **CODE COMPLETE** (2026-07-18)
**Verifiable outcome:** submit a report on the website → within one cycle, appears as a new row
in the Reports tab. Change status in Sheets → within one cycle, propagates to DB and appears in
dashboard.

- ✅ Migration `0009`: `AFTER INSERT/UPDATE` triggers on `adoption_applications`,
  `donation_confirmations`, `rescue_reports` enqueue a `db_to_sheets` job — **applied to live DB,
  trigger + function presence confirmed via schema inspection**.
- ✅ Migration `0010`: `donation_confirmations` table (public insert of donor-safe columns only,
  admin-only status transitions) — **applied and confirmed live**.
- ⚠️ **No tab handler is registered for `Adoption Applications` / `Donation Confirmations` /
  `Reports` at all** (confirmed by grepping `lib/sync/tabs/` — verified before writing this, not
  assumed). The trigger correctly enqueues a `db_to_sheets` job on every insert/update, and the
  worker correctly claims it — but with no handler registered for that tab name, the worker's
  no-handler path marks the job `succeeded` with a `no_handler_registered` note and does nothing.
  **Net effect: reverse sync is currently a silent no-op** — reports/applications/donations save
  correctly to Supabase, but nothing ever reaches the Sheet. This is the one concrete, scoped
  gap in an otherwise-complete milestone: three `applyDbToSheets` handlers (allowlisted columns
  per CMS_ARCHITECTURE.md §11.4, append-or-update-by-`_id` per §7.4) are the entire remaining
  scope.
- ⏭️ Workflow-field two-way conflict resolution (CMS_ARCHITECTURE.md §6.3) — the general
  conflict-detection path exists in `lib/sync/apply.ts`; not yet exercised by the reverse
  direction specifically.

### M-CMS-6 — Admin sync dashboard + Vercel Cron — **CODE COMPLETE** (2026-07-18)
**Verifiable outcome:** Cron runs every 10 min; admin sees jobs stream in without refresh;
manual "Sync Now" per tab works; conflicts appear and can be resolved.

- ✅ `/admin/sync` — health strip, per-tab status table, recent-job stream, conflict inbox with
  Keep Sheet / Keep DB / Dismiss actions.
- ✅ `/api/sync/enqueue-all`, `/api/sync/resolve` — admin-authenticated.
- ✅ `vercel.json` — 5 cron schedules wired (enqueue-all hourly, worker/5min, housekeeping/10min,
  media/15min, notify/1min).
- ⏭️ **Not done**: Supabase Realtime subscription — the dashboard currently requires a manual
  refresh (`router.refresh()` after each action) rather than streaming `sync_jobs` changes live.
  Functionally correct, just not "live" in the originally-scoped sense.
- ⚠️ Not yet exercised against live cron — Vercel Cron only fires on a deployed production
  instance; unverified in this local-only session.

### M-CMS-7 — Hardening, alerting, monitoring, load test — NOT STARTED
**Verifiable outcome:** kill the worker mid-run → housekeeping cron re-enqueues; kill the Sheets
API → job retries with backoff; alert fires on `header_mismatch`; a 10× load test passes.

- Alert routing: `header_mismatch`, `invariant_violation`, stale-tab (>1h no successful sync),
  conflict-count > 10, broken-media > 20 → outbox → email + WhatsApp.
- Metrics: sync latency p50/p95 per tab, API quota headroom, job success rate.
- Runbook in `docs/DEPLOYMENT.md`: how to inspect a failed job, how to force-sync a single row,
  how to rotate the service account key.
- Load test at 10× current row count (500 dogs, 5,000 medical events).
- Security audit of service account permissions and RLS on new tables.

---

## Working agreement (per module)

1. **Explain the plan** for the module before touching code (what changes, what's tested, what
   docs update).
2. **Implement.**
3. **Test** — manual E2E at minimum; note exact steps in TEST_REPORT.md.
4. **Update docs** — PRD.md status column, this file, CHANGELOG.md, TEST_REPORT.md, and
   KNOWN_ISSUES.md if anything new surfaces.
5. **Summarize** the change (commit if a repo is connected; otherwise a clear written summary).
6. Do not start the next module until the current one is verified stable.
