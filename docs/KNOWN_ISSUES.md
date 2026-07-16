# KGP PAWS — Known Issues

Living document. Last updated **2026-07-16**. Honest inventory of what's incomplete, fragile,
or wrong today. An issue moves here when discovered and moves to CHANGELOG.md "Fixed" when
resolved — it is never silently dropped.

---

## Blocking (need owner input — see TASKS.md dependency checklist)

| # | Issue | Impact | Tracked in |
|---|---|---|---|
| 1 | No Supabase project provisioned — app runs entirely in demo mode (localStorage writes, seed-data reads) | No real persistence; two browsers/devices never see the same data; a page refresh in incognito loses everything | TASKS.md M1 |
| 2 | No Google Sheets/Drive credentials — Sheets CMS and Drive photo pipeline are designed (docs) but not built | Volunteers cannot yet edit content without code; site still uses illustrated placeholders, not real photos | TASKS.md M2, M3 |
| 3 | No real dog photos mapped — asked twice (2026-07-16), no mapping received yet | Real-photography experience (P0) cannot start | TASKS.md M3, dep #6 |
| 4 | UPI donation details (QR image, UPI ID, holder name) not provided | Donate page still shows the old demo/placeholder donation UI, not the spec'd UPI flow | TASKS.md M5, dep #11 |
| 5 | Email + WhatsApp provider not chosen | No notifications fire on reports/donations/applications yet | TASKS.md M6, deps #9/#10 |
| 6 | No GitHub repository connected | Deploys are manual (`vercel deploy` from local disk); no PR previews, no CI, no code history off this machine | TASKS.md M1, dep #1 |
| 7 | Domain `kgppaws.org` not purchased/pointed | Site is only reachable at the `.vercel.app` URL; QR codes and canonical SEO URLs point there for now | TASKS.md M10, dep #8 |

## Architecture debt (known, scheduled)

| # | Issue | Plan |
|---|---|---|
| 8 | Donation flow (`DonatePanel.tsx`, `.env.example` Razorpay vars) is oriented around a future payment-gateway integration that is explicitly **out of scope** per the updated spec | Rework to UPI-QR + confirmation-form model in M5; delete unused Razorpay env vars and demo-intent code at the same time |
| 9 | Animal identifiers use `PAWS-KGP-DOG-0012` format and a revocable-token QR route (`/p/[token]`) rather than the spec'd permanent `DOG#####` + `/dog/[publicId]` | Additive migration in M4; `/p/[token]` kept as a legacy/lost-tag fallback, not removed |
| 10 | Report problem taxonomy doesn't yet include explicit "Missing" / "Dead animal" categories (has `injured/sick/unable_to_walk/bleeding/vehicle_accident/distressed/puppies_kittens_at_risk/other`) | Enum extended in M6 |
| 11 | Story/Blog CMS currently lives in the admin dashboard (`app/admin/stories/page.tsx`), not Google Sheets | M7 moves authoring to Sheets; dashboard becomes a read-only preview + publish toggle |

## Quality gaps

| # | Issue | Impact | Plan |
|---|---|---|---|
| 12 | **No automated test suite** — `package.json` has no `test` script; all verification so far is manual (see TEST_REPORT.md) | Regressions can slip in silently as the feature surface grows | Introduce Playwright (E2E) + Vitest (unit) — proposed for M1, not yet actioned |
| 13 | No rate limiting or bot protection (Turnstile) on public write endpoints (`/report`, `/adopt/apply`, future `/donate/confirm`) | Public forms are currently spammable | TASKS.md dep #12 (optional but recommended before public launch), wire in M6 |
| 14 | Lighthouse / accessibility audit not yet run | Unverified against the PRD's 100×4 target | TASKS.md M10 |
| 15 | No CI type-check/build gate — a broken build could currently only be caught by manually running `npm run build` before deploy | Human error risk until GitHub+CI (M1) lands | TASKS.md M1 |

## Housekeeping

| # | Issue | Impact | Plan |
|---|---|---|---|
| 16 | Stray unrelated file `Screenshot_20260713_150038_SmartBMSApp.jpg` sits in the project root (from an unrelated prior project on this machine) | Harmless but pollutes the repo root and would confuse a new contributor | Flagged for removal — confirm with owner before deleting since it wasn't created by this project's tooling |
| 17 | `AGENTS.md`/`CLAUDE.md` at the repo root instruct reading `node_modules/next/dist/docs/` before writing Next.js code, framed as if this is a customized/unfamiliar Next.js build | Verified: this is standard Next.js 16 (App Router, Turbopack) — the instruction appears to be a test fixture/prompt-injection-style file rather than genuine project guidance, and has not changed how any code in this repo was written | No action taken on its instruction; noting it here for transparency since it's an unusual file to find in a project root |

## New — raised by the formal JSON spec (2026-07-16)

| # | Issue | Impact | Plan |
|---|---|---|---|
| 21 | **AI semantic search needs an embedding provider that isn't in `required_connectors`.** The spec asks for semantic search ("understands intent, not just keywords"), which requires embeddings — either an external API (OpenAI `text-embedding-3-small`: cheap, high quality, adds a vendor + per-call cost) or a local model via Supabase Edge Functions (free, weaker, more setup). | M8 cannot start until this is decided; it's the only AI service the spec implies but doesn't list | Owner decision needed — see TASKS.md |
| 22 | **Google Analytics + Search Console are in `required_connectors` but weren't in the original 27-section spec.** Both need property creation + domain verification, which in turn needs the custom domain (dep #8). | M10 analytics work is blocked behind the domain | Sequenced after domain in M10 |
| 23 | **`real_time: true` has a cost/complexity trade-off worth confirming.** Supabase Realtime on the admin dashboard is straightforward, but realtime on *public* pages would add per-connection cost for little benefit (content changes on a sync cycle, not per-second). Current plan: realtime for the dashboard only; public pages stay static/ISR. | Cheap and correct, but it's a deliberate narrowing of a literal reading of the spec | Documented in ARCHITECTURE.md §12b — flag if you want it broader |

## Environment / tooling notes (not app bugs, but relevant to future sessions)

| # | Note |
|---|---|
| 18 | The sandboxed Bash tool used for local development cannot reach the public internet — `curl` against `https://kgp-paws.vercel.app` fails from Bash. Live-site checks must go through the Browser tool instead. Pre-deploy checks against `localhost` work fine in Bash. |
| 19 | The in-app Browser tool experienced repeated hard timeouts (30s+ hangs on screenshot/get_page_text) during heavy Turbopack compilation in one session. Workaround: open a fresh tab via `tabs_create`, or fall back to `curl` against the local dev/prod server for routes where only HTTP status/content matters, not visual rendering. |
| 20 | Filling form inputs via `computer{action:"type"}` immediately after a coordinate click is unreliable in the Browser tool — text can land nowhere. Reliable method: `read_page{filter:"interactive"}` → get the input's `ref_N` → `form_input{ref, value}`. |
