# KGP PAWS — Test Report

Living document. Last updated **2026-07-18**. Records what was actually verified, how, and
when — not just "should work." `npm test` (Vitest) and `npm run test:e2e` (Playwright) cover
the demo-mode core flows (see Module M-B below); everything else here is manual/direct-SQL
verification performed during development. Status legend matches PRD.md.

---

## 2026-07-18 — Production-readiness review: verify claims against code, not documentation

A full-repository review requested explicitly to distrust prior-session documentation and
verify everything against actual running code. Two other work streams had landed since the
last recorded TEST_REPORT entry — this session's own M-CMS-1 rollout, and a separate agent
session ("Antigravity," see `docs/ANTIGRAVITY_WORK.md`) that migrated content off hardcoded
strings — and both were checked, not trusted.

### Ground-truth commands, run directly rather than inferred from docs

| Command | Result |
|---|---|
| `npm run build` (before fixes) | ✅ 61 routes, clean TypeScript — but only **3 routes static** (`/_not-found`, `/manifest.webmanifest`, `/robots.txt`); everything else forced dynamic, a real regression caught below |
| `npm run lint` | ✅ 0 errors, 3 warnings (see below) |
| `npm test` | ✅ 45 passed, 5 skipped (1 whole file) — see below for why the skip is correct |
| `npm run build` (after fixes) | ✅ 61 routes, clean TypeScript, **19 routes static** — confirms the rendering fix actually worked, not just compiled |

### Real bugs found by direct code inspection (not by trusting ANTIGRAVITY_WORK.md's "verified" claims)

**1. Fictional demo data could have appeared on a live production database.**
`services/animals.ts`, `campaigns.ts`, `stories.ts` had all been changed from
`if (!error && data) return data.map(...)` to `if (!error && data && data.length > 0) return
data.map(...)`. Traced the consequence: a legitimately empty result from a *connected* Supabase
project (e.g., after the demo-row purge that KNOWN_ISSUES #24 explicitly plans for launch) would
silently render `DEMO_ANIMALS`/`DEMO_CAMPAIGNS`/`DEMO_STORIES` — fictional dogs and campaigns —
as if they were real, on the actual production site. Confirmed the pattern's origin (correctly
copied from `services/content.ts`, where it's the *right* behavior for CMS marketing copy, then
incorrectly reapplied to core domain data). Grepped the whole repo for the same `.length > 0`
pattern to confirm no other instance existed outside `services/content.ts` (where it belongs).
Fixed: reverted the three files to the original check.

**2. Every route in the app had silently lost static rendering.**
Not something a docs review would catch — required actually running `npm run build` and reading
the route table, which showed `ƒ` (dynamic) next to routes with zero personalized content
(`/faq`, `/offline`, `/login`, `/scan-not-found`, the entire `/about` and `/admin/*` tree).
Traced to `app/layout.tsx`'s new `generateMetadata()` and `components/layout/SiteChrome.tsx`
(both added this CMS-migration pass) calling `createServerSupabase()`, which invokes Next's
`cookies()` unconditionally — a dynamic API that forces the whole route dynamic regardless of
whether the data it fetches is actually personalized. Confirmed `content_*` tables are fully
public-read (checked their RLS policies) and confirmed a purpose-built cookie-less client
(`createStaticSupabase()`) already existed in the codebase for exactly this case. Switched
`services/content.ts` to it; re-ran `npm run build` to confirm the fix actually worked (static
routes 3 → 19) rather than assuming the change was sufficient. Separately confirmed `/admin/*`'s
static-ness is **not** a security regression: its authorization is enforced client-side
(`RequireRole` in `AdminShell.tsx`) plus Postgres RLS at the data layer, and `app/admin/page.tsx`
reads exclusively from demo/localStorage data today (a pre-existing, documented gap, not
something this session touched) — so there is no live data exposed by the static shell.

**3. Migration `0011_notification_outbox` had never actually applied to the live database.**
`ANTIGRAVITY_WORK.md`/the prior session's own narration implied the sync/notification
infrastructure was complete. Cross-checked against the live Supabase project via direct schema
query (`select count(*) from information_schema.tables where table_name='notification_outbox'`)
rather than trusting the claim — result was `0`. Traced through the actual tool-call history: a
prior attempt to apply this migration hit a "classifier temporarily unavailable" error twice,
and the session moved on without confirming success or retrying again. Re-applied the migration
for real this session; re-verified via the same schema query (now `1`) plus RLS-policy presence.
Until this was caught, `/api/notify/dispatch` would have returned HTTP 500 in production, and
`/api/reports`/`/api/adopt/apply`/`/api/donate/confirm` would have silently failed to queue any
notification (their `.insert()` calls don't check the returned `error`).

**4. `notification_outbox`'s send functions are empty stubs, not "credential-gated" code.**
Read the actual function bodies (`sendEmailStub`/`sendWhatsAppStub` in
`/api/notify/dispatch/route.ts`) rather than assuming "stub" meant "works once credentials
exist." Confirmed they only `void` their arguments — genuinely do nothing. This means setting
`EMAIL_PROVIDER_API_KEY`/`WHATSAPP_PROVIDER_TOKEN` alone will make the outbox mark every row
`sent` without any message actually being transmitted, since the stub "succeeds" trivially.
Documented as a trap in KNOWN_ISSUES #5 rather than left implicit.

**5. Reverse sync (M-CMS-5) is a silent no-op.**
Grepped `lib/sync/tabs/` for `applyDbToSheets` and for handler registrations matching `Reports`
/ `Adoption Applications` / `Donation Confirmations` — zero matches for all three. The DB
triggers (migration 0009, confirmed live) correctly enqueue a job on every insert/update; the
worker's no-handler path (by design, from M-CMS-1) marks the job `succeeded` with a
`no_handler_registered` note rather than failing loudly. Net effect: data saves correctly to
Supabase, nothing ever reaches the Sheet, and the job history shows false-positive
"succeeded" jobs. Documented as KNOWN_ISSUES #31 with the exact scope of the fix needed.

### Confirmed correct (checked, not assumed)

- `npm run lint`'s 0-errors result is real, not a suppressed rule: diffed `eslint.config.mjs`
  against its prior state (unchanged) and grepped `SaveButton.tsx` for the `useEffect`+`setState`
  pattern KNOWN_ISSUES #25 originally described (not present — genuinely fixed at some point,
  just never reflected in the doc). Closed #25 as resolved rather than leaving it stale.
- `npm test`'s 5 skipped tests (`lib/sync/queue.test.ts`) are correctly gated behind
  `SUPABASE_SERVICE_ROLE_KEY` presence via `describe.runIf` — confirmed the env var is genuinely
  absent from `.env.local` (checked variable *names* only, never read a secret value), so the
  skip is the intended, correct behavior for this environment, not a masked failure.
- `app/volunteer/page.tsx`'s CMS wiring (`getHelpContent()` → `DEMO_HELP_CONTENT` fallback) is
  legitimate marketing-copy fallback, not domain-data fallback — read the full diff and the
  demo-content source to confirm this doesn't share the animals.ts/campaigns.ts/stories.ts bug.
- Migrations 0006–0010 (everything except the already-covered 0011 gap) were live-confirmed via
  direct schema queries: `tab_config` (18 rows), `sync_jobs`, `content_audit_log`, 16 staging
  tables, `donation_confirmations`, `animal_photos.blurhash`, the `tr_rescue_reports_sync`
  trigger and its function, and `next_animal_public_id`'s `search_path=public` hardening
  (migration 0007) all present and correct.
- `vercel.json`'s 5 cron schedules reference routes that all exist and build successfully
  (`enqueue-all`, `worker`, `housekeeping`, `media/ingest`, `notify/dispatch`).

### Housekeeping fixed alongside the review
- `Downloads.npm-cache-e/` (a 49 MB local npm-cache redirect target, workaround for a full `C:`
  drive — KNOWN_ISSUES #26) was untracked but not gitignored; would have been committed by a
  broad `git add -A`. Added to `.gitignore` before any commit this session.
- `.env.example` was missing `EMAIL_PROVIDER_API_KEY`/`WHATSAPP_PROVIDER_TOKEN`, both referenced
  by `/api/notify/dispatch`. Added with explanatory comments.
- Consolidated two separate `import ... from "@/lib/demo/content"` statements in
  `services/content.ts` into one (harmless due to import hoisting, but untidy).

---

## 2026-07-17 — CMS milestone: real photos, gallery, R3F/GSAP, sync engine

### Real-photo pipeline — verified end-to-end, not assumed

| Check | Method | Result |
|---|---|---|
| Public Storage URL serves the uploaded file directly | `curl` the `.../storage/v1/object/public/animal-photos/dreamland/on-lead-2025.jpg` URL | ✅ 200, `image/jpeg`, correct size |
| Next Image Optimizer proxies the same file | `curl` `/_next/image?url=<encoded storage URL>&w=640&q=75` on the local prod server | ✅ 200, `image/jpeg` — confirms `next.config.ts`'s `remotePatterns` allowlist works |
| `/animal/dreamland` renders the real hero photo, not the illustration | DOM inspection (`querySelector('header img')`) — screenshot tool was unreliable this session (see KNOWN_ISSUES #19), used `alt` text + `src` instead | ✅ `alt="Photo of Dreamland"`, `src` points at the real Storage URL |
| `/stories/field-notes-2025` renders all 8 real photos | DOM inspection, counted `<img>` tags matching `field-notes` in `src` | ✅ 8/8 |
| No regression to the 8 fictional demo animals | `/adopt` page: counted illustrated-portrait `<svg>`s vs. real-photo `<img>`s | ✅ exactly 8 illustrated (unchanged demo set) + 1 real photo (`Dreamland`) — "9 paws found" |
| Photo date fallback bug (found, then fixed — see CHANGELOG) | Read the actual rendered page text before and after the fix | ❌→✅ "17 Jul 2026" (wrong, row-insertion time) → no date shown for the undated poster photo, "13 Sept 2025" for the dated one |

### Photo import — real run, not a dry run

10 of 12 source photos successfully optimized (`sharp`: `.rotate()` for EXIF orientation, default
metadata stripping for GPS, resized to 1920px max, JPEG q82) and uploaded to the `animal-photos`
Storage bucket. 2 failed with `ENOSPC` reading from the source path (`G:\My Drive\...`) —
confirmed via `df -h` that the local Drive cache was genuinely at 100% capacity (104 MB free of
232 GB) before concluding it wasn't a transient error worth retrying further.

### Storage security — verified the right policy shape, not just "a" policy

- Confirmed (before building anything) that no Google Sheets/Drive/Cloud MCP connector exists in
  this environment (`ToolSearch` for "google sheets drive" / "google cloud workspace" returned
  no matches) — informed the decision to build credential-gated application code rather than
  expect to configure Google services directly from this session.
- A first attempt at enabling local photo uploads (`create policy ... for insert to anon`) was
  **blocked by the session's own safety classifier** as a public-write security concern — correct
  behaviour, not worked around. Replaced with a permanent, properly-scoped policy (`for insert
  to authenticated ... with check (has_role(admin))`) plus a real admin auth account.
- Verified the real admin account (`shubhamsourav055+kgppawsadmin@gmail.com`) has exactly the
  `admin` role and a confirmed email (direct SQL check), before using it to authenticate the
  upload script.

### Code review in place of a blocked build

A large stretch of this session had Bash and the Supabase MCP's write tools intermittently
returning "claude-sonnet-5 is temporarily unavailable" (a classifier outage, not a code issue).
Rather than guess at correctness, reviewed the `googleapis` v173 type definitions directly
(`node_modules/googleapis/build/src/apis/drive/v3.d.ts` and `googleapis-common`'s `GlobalOptions`)
to confirm:
- `google.sheets()`/`google.drive()` accept a `GoogleAuth` instance directly as `auth` (confirmed
  via `GlobalOptions.auth: GoogleAuth | OAuth2Client | BaseExternalAccountClient | string`).
- `drive.files.list()` responses are `GaxiosResponse<Schema$FileList>` — i.e. always accessed via
  `.data.files`, never `.files` directly on the raw response. Found and fixed one spot where a
  defensive-but-misleading `animalFolders.data?.files ?? animalFolders.files` fallback chain
  worked at runtime (because `.data` was already destructured earlier) but was confusing; simplified.
- `drive.files.get({alt:"media"}, {responseType:"arraybuffer"})` doesn't have a clean overload
  for binary downloads — the types resolve to `Schema$File`, not binary data, even though the
  documented runtime behaviour really does return raw bytes in `.data`. Used an explicit
  `as unknown as ArrayBuffer` cast with a comment explaining why, rather than a bare cast that
  might not compile if TypeScript considers the types insufficiently overlapping.

### Build — found and fixed a real regression before it shipped

First production build attempt after all of today's changes failed:
`Export isPaymentConfigured doesn't exist in target module` (`components/donate/DonatePanel.tsx`).
Caused by an earlier edit to `lib/config.ts` in this same session (adding `isGoogleConfigured`/
`storagePublicUrl`) that dropped the existing `isPaymentConfigured` export. Cross-checked every
`from "@/lib/config"` import site (`grep`) against the file's actual exports before concluding
the fix was complete, rather than patching the one error the build happened to surface first.
Restored `isPaymentConfigured` exactly as it was (reworking it is explicitly out of scope here —
see KNOWN_ISSUES #8, that's M5's job).

**Second build attempt** (after the fix above) got further — compiled successfully — then the
TypeScript-checking phase crashed with `FATAL ERROR: Ineffective mark-compacts near heap limit
Allocation failed - JavaScript heap out of memory`. Not assumed to be a real type error: retried
with `NODE_OPTIONS=--max-old-space-size=6144`, which completed TypeScript checking in 2.9–3.9 min
across two runs — confirming it was purely a memory ceiling (Three.js/R3F/drei's large type
definitions), not a code defect. Made the fix permanent rather than a one-off command: added
`cross-env`, changed `package.json`'s `build` script accordingly, then **re-verified using the
plain `npm run build` command** (no manual env var) to confirm the fix actually lives in the
script and isn't just something that happened to work once by accident.

**Final result: 48 routes** (45 + `/api/sync/run`, `/api/sync/status`, `/api/media/ingest`),
clean TypeScript, all static pages generated, using the exact command (`npm run build`) a
fresh clone or Vercel would run.

### Environment issues hit mid-session (not app bugs — see KNOWN_ISSUES #26–28)

- `npm install` failed with `ENOSPC` even though the install target (`E:`) had 171 GB free,
  because npm's cache lives on `C:`, which was completely full. Fixed by redirecting the cache
  to a folder on `E:` for this install, without touching anything on the user's `C:` drive.
- Bash's coreutils (`cat`, `ls`, `which`, `tail`) started failing with "command not found"
  partway through the session — traced to the same `C:` drive pressure (Git Bash's `mingw64/bin`
  lives on `C:`). Confirmed via `PowerShell`'s `Get-PSDrive` (a separate tool, unaffected) that
  free space had recovered to ~9.6 GB by the time this was investigated. Switched to PowerShell
  for build commands for the remainder of the session as a result.

## 2026-07-16 — Module M-B: Automated test suite

**62 automated tests, all passing.** `npm test` (Vitest) and `npm run test:e2e` (Playwright).

### Unit tests — Vitest, 45 tests across 3 files

| File | Tests | Focus |
|---|---|---|
| `lib/utils.test.ts` | 18 | `formatINR` (incl. Indian lakh/crore grouping), `formatDate`, `pct` (clamping at 100 — direct regression for the M1 "153% funded" bug), `ageInYears`, `hashSeed`, `cn` |
| `lib/local-store.test.ts` | 14 | Saved-animal toggling, report/application ID sequencing (continuing from the seed data's last code), demo session round-trips — jsdom environment for real `localStorage` |
| `services/animal-mapper.test.ts` | 13 | **Direct regression tests for the M1 bugs**: active-vs-inactive QR tag selection, missing `qr_tags`, medical-timeline/sightings newest-first sort, default fallbacks for every optional column |

All 45 passed on the first real run (11.5s). `mapAnimalRow` was extracted from `services/animals.ts`
into `services/animal-mapper.ts` (zero Next.js imports) specifically so it could be unit-tested
without evaluating `next/headers` outside a request context.

### E2E tests — Playwright, 17 tests across 6 files, against a forced demo-mode server

| File | Tests | Covers |
|---|---|---|
| `homepage.spec.ts` | 2 | Hero/CTAs render; header report link navigates |
| `adopt.spec.ts` | 3 | Full list, search narrows to 1 result, no-match empty state |
| `qr-scan.spec.ts` | 3 | Valid token → profile + scan greeting; direct visit skips greeting; unknown token → scan-not-found |
| `report-and-track.spec.ts` | 3 | Full submit → code → tracker flow; unknown code → not-found state; seeded demo report tracks correctly |
| `admin-dashboard.spec.ts` | 4 | Demo-mode banner present; admin/volunteer demo login → correct dashboard; unauthenticated `/admin` is challenged |
| `pwa-offline.spec.ts` | 2 | **Automates the exact manual check that caught the M-A SW bug**: visit a profile, go fully offline, confirm it still renders from cache; visit an unvisited page offline, confirm `/offline` fallback; manifest + all icons reachable |

All 17 passed (3.7 min) after two rounds of fixes:

**Round 1 — 7 failures, all real findings:**
- 6 were genuine strict-mode locator ambiguity: a value legitimately renders twice on the same
  page (status in both a summary chip and a stepper; PAWS ID in both the header and the QR tag
  flip-card; "Demo mode" in both the login banner and an unrelated footer badge). Fixed with
  `.first()` / `exact: true` — not app bugs, test-locator specificity issues.
- 1 was a **real environment finding**: the "exploring as volunteer" test's button click
  completed but no navigation followed, landing back on `/login`. Hypothesis: React hydration
  race under parallel-worker resource contention (button existed in the DOM before its `onClick`
  was attached). **Verified rather than assumed** — re-ran the same spec file in isolation with
  `--workers=1`: all 4 tests passed cleanly (3.0 min). This confirms contention, not a defect;
  `workers: 1` is now set in `playwright.config.ts` with a comment explaining why.

**Round 2 — clean run, 17/17 passed.**

### Lint, run as part of this pass

`npm run lint` surfaced 13 problems (9 errors, 4 warnings). Checked `git diff HEAD` against every
flagged file first: none were touched by this module. Fixed the one in scope (an `any` cast in
`services/animals.ts`, already open for the mapper refactor) and the one warning in my own new
`e2e/pwa-offline.spec.ts` (unused `page` param). The remaining 9 errors are pre-existing
`react-hooks/set-state-in-effect` findings across `SaveButton.tsx`, `Header.tsx`, `Counter.tsx`,
`ReportTracker.tsx`, and four admin pages, plus one `react-hooks/immutability` error in
`AuthCard.tsx` — flagged as a separate task (KNOWN_ISSUES #25) rather than fixed here, since the
mechanical fix touches 9 files and is out of scope for "add tests."

## 2026-07-16 — Module M1: Live Supabase (SQL-level + local + live production)

### RLS verification, executed as the `anon` role (`set local role anon`)

Testing as the actual anonymous PostgREST role, not as an admin assuming the policies work:

| Check | Expected | Result |
|---|---|---|
| Public animals readable | 8 | ✅ 8 |
| `get_report_status('PAWS-RESCUE-2026-00124')` (anonymous tracking) | returns status | ✅ `treatment_started` |
| Anon sees `donations` rows | **0** (private table, 15 rows exist) | ✅ 0 |
| Anon sees `rescue_reports` rows | **0** (precise lat/lng must never leak) | ✅ 0 |
| Campaign totals visible to anon | non-zero | ❌→✅ **initially 0** — real bug, see below |

### Column-grant verification (privilege escalation)

| Column | Public can INSERT? | Result |
|---|---|---|
| `adoption_applications.status` | must be **no** (self-approval) | ❌→✅ initially **yes**, now no |
| `adoption_applications.internal_notes` | no | ❌→✅ now no |
| `rescue_reports.status` / `is_demo` / `linked_animal` | no | ✅ no |
| `volunteers.status` | no (self-activation) | ✅ no |
| `adoption_applications.motivation`, `rescue_reports.description`, `volunteers.full_name` | **yes** (legitimate submissions must still work) | ✅ yes |

| `log_audit()` executable by anon | no | ✅ false — **and** audit trigger still fires (9 rows) |

### Live production (https://kgp-paws.vercel.app, reading real Postgres)

| Check | Result |
|---|---|
| QR scan `/p/t7kd2mqx` → profile via DB lookup | ✅ "You just met Simba 🐾", PAWS-KGP-DOG-0012 |
| Donate page campaign totals | ✅ ₹18,400 of ₹30,000 (61%) — not ₹0 |
| Login page mode | ✅ real credential form; demo role switcher correctly gone |
| Adopt page | ✅ "8 paws found" from DB |
| Build against live DB | ✅ 43 static pages generated |

### Bugs found by this test pass (all fixed — see CHANGELOG)

1. **`has_role()` declared before `user_roles`** — migration was unrunnable as written.
2. **Privilege escalation**: anyone could submit an adoption application pre-set to
   `approved`. My first fix (column-level `REVOKE`) was **ineffective** — Postgres ignores it
   when a table-level grant exists. Only caught because I re-queried the grants instead of
   trusting the migration's `{"success":true}`.
3. **Every campaign showed ₹0 raised** to anonymous visitors (`security_invoker` view over a
   private table).
4. **`supporter_count` always 0** for guest/UPI donations (`count(distinct donor_id)`, NULL for guests).
5. **`log_audit` RPC-callable** — revoke had to target `PUBLIC`, not `anon`/`authenticated`.
6. **QR tokens would render empty in live mode** — service read a non-existent
   `animals.qr_token` column.
7. **Build broke once credentials existed** — `generateStaticParams` → `cookies()`.
8. **Seed showed 153% funded** on Simba's campaign.
9. **`.gitignore` excluded `.env.example`**.

Every one of these was invisible in demo mode and would have reached users.

## 2026-07-16 — Module M-A: PWA (local production build + live production)

**Method:** `npm run build && npm start` (SW registers in production builds only), then live
verification against https://kgp-paws.vercel.app after deploy.

| Check | Method | Result |
|---|---|---|
| `/manifest.webmanifest` serves valid JSON | curl | ✅ Pass — name/short_name/theme/3 icons/2 shortcuts correct |
| `/sw.js` serves | curl | ✅ 200 |
| `/offline` page renders | curl + browser | ✅ 200 |
| All 4 icons serve (192, 512, maskable-512, apple-touch) | curl | ✅ 200 each; 512 visually inspected — brand paw on forest tile, correct |
| SW registers + activates | `navigator.serviceWorker.getRegistrations()` in-browser | ❌→✅ **Initially FAILED** ("NO SW REGISTERED") — see Fixed note below. After fix: `state: "activated"`, scope `/`, caches `kgppaws-pages-v1` + `kgppaws-assets-v1` created, `/offline` precached |
| **Offline: previously-viewed profile still works** | Visited `/animal/simba`, stopped the server entirely, re-navigated | ✅ **Pass** — full profile served from cache with server down: name, PAWS ID, "Available for Adoption", Vaccinated, Sterilized, age/sex/species/zone, personality all intact |
| **Offline: never-visited page falls back** | Navigated `/animal/percy` (never opened) with server down | ✅ Pass — served the offline shell ("You're offline… Pages you've already opened still work") |
| **Production: SW active on live domain** | in-browser check at https://kgp-paws.vercel.app | ✅ Pass — `swRegistered: true`, `state: "activated"`, manifest serving 3 icons |

**Bug found and fixed during this test pass:** the service worker never registered. The
registration effect listened for `window`'s `load` event, but `useEffect` runs after
hydration — `load` had already fired, so the listener never executed. This would have shipped
a silently non-functional PWA had registration state not been asserted directly rather than
inferred from "the code looks right". Fixed by checking `document.readyState === "complete"`.

## 2026-07-16 — Production deployment verification

**Environment:** https://kgp-paws.vercel.app (production, demo mode — no Supabase configured)

| Check | Method | Result |
|---|---|---|
| Homepage loads, hero + all 11 sections render | Browser, page text extraction | ✅ Pass — title "KGP PAWS — Every Paw Has a Story" confirmed, hero copy present |
| QR resolver: `/p/t7kd2mqx` → Simba's profile | Browser navigation, confirmed final URL `/animal/simba?via=qr` | ✅ Pass — "You just met Simba 🐾" scan greeting rendered |
| `sitemap.xml` valid + reachable | Browser navigate | ✅ Pass (also checked pre-deploy via curl, see below) |
| `robots.txt` reachable | HTTP check pre-deploy | ✅ Pass |
| 404 page for unknown routes | HTTP check pre-deploy (`/nonexistent` → 404) | ✅ Pass |

**Note on tooling:** the sandboxed shell (Bash tool) cannot make outbound requests to the
public internet, so live-site route checks after deploy were done via the Browser tool
(get_page_text / navigate), not curl. Pre-deploy checks against the local production server
(`npm start`, localhost:3000) used curl freely — see below.

## 2026-07-16 — Local production server, full route sweep (pre-deploy)

**Method:** `npm run build && npm start`, then `curl -o /dev/null -w "%{http_code}"` per route.

| Route | Expected | Result |
|---|---|---|
| `/` | 200 | ✅ 200 |
| `/adopt` | 200 | ✅ 200 |
| `/animal/simba` | 200 | ✅ 200 |
| `/donate` | 200 | ✅ 200 |
| `/map` | 200 | ✅ 200 |
| `/about` | 200 | ✅ 200 |
| `/volunteer` | 200 | ✅ 200 |
| `/adopt/apply/simba` | 200 | ✅ 200 |
| `/stories` | 200 | ✅ 200 |
| `/stories/simba-waits-every-evening` | 200 | ✅ 200 |
| `/report` | 200 | ✅ 200 |
| `/scan-not-found` | 200 | ✅ 200 |
| `/sitemap.xml` | 200, valid XML with all animal/story URLs | ✅ 200, spot-checked content |
| `/robots.txt` | 200 | ✅ 200 |
| `/nonexistent-page` | 404 | ✅ 404 |
| `/p/t7kd2mqx` | 307 → `/animal/simba?via=qr` | ✅ 307, correct redirect target |

## 2026-07-13 — Manual E2E pass (dev server, demo mode)

| Flow | Steps | Result |
|---|---|---|
| **Animal profile + medical timeline** | Navigate `/animal/simba?via=qr` → scroll through About/Personality/Medical Timeline sections | ✅ Pass — 4 medical events rendered in correct chronological order (Vaccination → Injury → Treatment → Recovery) with correct icons/colors per event type |
| **Adopt search/filter** | Navigate `/adopt` → type "biscuit" into search box (via `form_input` on the actual textbox ref, not a raw click-coordinate) → verify result count | ✅ Pass — "8 paws found" → "1 paw found" (Simba only, matched on tagline text) |
| **Report submission → tracking** | Navigate `/report` → select Dog → Injured → Urgent → Technology Market → fill description → submit | ✅ Pass — received `PAWS-RESCUE-2026-00127`; navigated to `/report/PAWS-RESCUE-2026-00127` → full status stepper shown with the submitted description and "Reported" step timestamped |
| **Demo login → admin dashboard** | `/login` → "Explore as Admin" → lands on `/admin` | ✅ Pass — Overview shows live counts (4 open reports incl. the just-submitted one, 2 urgent/emergency, 2 animals in care, 2 applications, 5 campaigns, 0 pledges), campaign progress bars, activity feed |
| **QR + medical timeline visual check** | Screenshot at each scroll position | ✅ Pass — portrait, collar/QR tag, chips, and timeline all rendered correctly with no layout breaks |

### Tooling notes from this session (useful for future test passes)

- The in-app Browser tool's `computer{action:"type"}` does **not** reliably focus a specific
  input by coordinate click alone in this environment — text typed after a coordinate click
  landed nowhere on the first attempt. Fix: use `read_page{filter:"interactive"}` to get a
  `ref_N` for the actual input element, then `form_input{ref, value}`. This is now the standard
  method for filling fields in this project's test passes.
- The Browser pane experienced multiple hard timeouts mid-session (screenshot/get_page_text
  hanging 30s+) after heavy Turbopack compilation load. Workaround used: open a fresh tab
  (`tabs_create`) rather than fight the stuck one, or fall back to `curl` against the local
  server when only HTTP status/content (not visual rendering) needs verification.

## Outstanding test coverage (not yet performed)

These are gaps, not failures — features are either not built yet (see PRD.md status column)
or were built but not yet put through a dedicated test pass:

| Area | Why untested | Tracked in |
|---|---|---|
| Adoption application 6-step flow, full submit | Built, spot-checked structurally, not run end-to-end with a final submit | TASKS.md M4 (profile v2 pass will re-verify) |
| Admin animal QR download / reissue | UI verified visually; PNG download not opened/inspected | TASKS.md M4 |
| Volunteer dashboard task toggling | Built; not clicked through in a test pass | next test pass |
| Cross-browser / mobile viewport pass | Only desktop viewport tested so far | TASKS.md M10 |
| RLS policies against a live Supabase project | Migration written; no live project to test against yet | TASKS.md M1 |
| Accessibility audit (screen reader, keyboard-only) | Not performed | TASKS.md M10 |
| Lighthouse scores | Not run | TASKS.md M10 |

## Automated testing (none yet — see KNOWN_ISSUES.md #1)

No unit/integration/E2E test suite exists in the repo yet. Recommendation for M1: introduce
Playwright for E2E (mirrors the manual flows above) and Vitest for `lib/` utility functions
before the feature surface grows further. Not yet actioned — raised here for visibility, not
silently deferred.
