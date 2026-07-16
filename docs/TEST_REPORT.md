# KGP PAWS — Test Report

Living document. Last updated **2026-07-16**. Records what was actually verified, how, and
when — not just "should work." Automated test suite does not exist yet (see
[KNOWN_ISSUES.md](KNOWN_ISSUES.md) #1); all entries below are manual/E2E verification performed
during development. Status legend matches PRD.md.

---

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
