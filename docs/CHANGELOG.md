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
