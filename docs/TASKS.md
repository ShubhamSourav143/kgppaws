# KGP PAWS — Task Plan & Dependency Checklist

Living document. Last updated **2026-07-16**. This is the execution plan referenced by
PRD.md §6. Work proceeds **module by module**: plan → implement → test → update docs → mark
PRD status → summarize changes. No module starts before the previous one is stable, except
where explicitly parallelizable (noted below).

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
| 6 | **Photo → animal mapping** for the 8 seed dogs (or a fresh list of real animals to replace the demo set) + which photo is the homepage hero | Real-photography experience (M3) | A simple list: "IMG-...WA0001 = Simba", etc. | ❌ not provided (asked twice, unanswered) |
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

### M-B — Automated test suite — NOT STARTED (unblocked, ready to start)
Vitest (unit, for `lib/*`) + Playwright (E2E, mirroring the manual flows already recorded in
TEST_REPORT.md: report→track, adopt search, QR scan→profile, offline). Required by the spec
(`testing.unit_tests`, `testing.integration_tests`) and closes KNOWN_ISSUES #12. **Needs no
credentials** — can start immediately on approval.

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

### M2 — Google Sheets sync engine — BLOCKED (deps #2, #3); can start schema/engine code against a scratch Sheet in parallel with M1
- Build `/api/sync/run`, `/api/sync/status`, `/api/sync/resolve`.
- Migration `0002` sync columns + `sync_log` table.
- Admin dashboard sync-health panel.
- Verify: edit a row in Sheets → appears on site within one cron cycle; edit in dashboard →
  appears in Sheets; deliberately conflict a row → both sides show `CONFLICT`, resolvable.

### M3 — Google Drive media pipeline + real-photography experience — BLOCKED (deps #2, #4, #6)
- Build `/api/media/ingest`, `drive_assets` table, sharp optimization pipeline.
- Replace illustrated portraits with real photos across cards, profile, gallery.
- Build floating image walls / scroll storytelling with GSAP + Lenis using real photos.
- Verify: drop a photo in the Drive folder → optimized variants appear on the live profile
  within one ingest cycle; Lighthouse image metrics stay green (no CLS, lazy-loaded).

### M4 — Animal profile v2 + permanent ID + QR/PDF — depends on M1; independent of M2/M3 schema-wise
- `public_id` (`DOG#####`) migration + `/dog/[publicId]` route.
- Weight/breed fields surfaced in UI (schema already supports via Sheets Dogs tab, M2).
- `/api/qr/generate`, `/api/qr/print-sheet` (A4 PDF, react-pdf).
- Verify: generate QR for a new dog → scan resolves to profile → print sheet renders correctly
  at A4 in a PDF viewer.

### M5 — UPI donations rework — BLOCKED (dep #11); depends on M1
- `donation_confirmations` + `site_settings` tables (migration `0002`).
- Donate page: QR image(s) + UPI ID/name display, confirmation form, thank-you flow.
- Admin approval queue → Recent Donors wall.
- Remove legacy Razorpay-oriented demo intent code and `.env.example` entries.
- Verify: submit a confirmation → appears in admin queue → approve → appears on Recent Donors
  (only if `Show Publicly`); Sheets sync reflects the same row (needs M2).

### M6 — Reports v2 + notifications — BLOCKED (deps #9, #10); depends on M1, M2
- Report taxonomy update (Missing/Dead animal categories).
- Real `/api/reports`, `/api/adopt/apply` route handlers (replacing client-only demo writes).
- `notification_outbox` + `/api/notify/dispatch`; wire Email + WhatsApp.
- Verify: submit a report → admin receives email + WhatsApp within the cron interval; failure
  is retried and visible in the outbox status.

### M7 — Blog engine (Sheets-driven) — depends on M2, M3
- Render `Blogs` tab rows as story pages (markdown → rich blocks, images from Drive).
- Retire the in-app Story CMS admin panel in favor of the Sheet as source of truth (dashboard
  keeps a read-only preview + publish/schedule toggle that writes back to the Sheet).
- Verify: write a post in Sheets → live on `/stories/[slug]` within one sync cycle, correct SEO
  meta, reading time, related articles.

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

## Working agreement (per module)

1. **Explain the plan** for the module before touching code (what changes, what's tested, what
   docs update).
2. **Implement.**
3. **Test** — manual E2E at minimum; note exact steps in TEST_REPORT.md.
4. **Update docs** — PRD.md status column, this file, CHANGELOG.md, TEST_REPORT.md, and
   KNOWN_ISSUES.md if anything new surfaces.
5. **Summarize** the change (commit if a repo is connected; otherwise a clear written summary).
6. Do not start the next module until the current one is verified stable.
