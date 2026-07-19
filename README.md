# KGP PAWS 🐾

**Animal Welfare Society, IIT Kharagpur** — a digital animal welfare platform:
a public identity for every campus animal, adoption discovery, 60-second
rescue reporting, transparent donations, and role-based operations dashboards.

> **Every Paw Has a Story.** Rescue. Heal. Protect. Remember.

The flagship feature is the **PAWS Digital Animal Identity**: campus dogs wear
a collar with a QR tag. Scanning it (`kgppaws.org/p/{token}`) opens that exact
animal's living profile — health record, personality, vaccination status, and
how to help.

---

## Runs instantly — no keys required

```bash
npm install
npm run dev        # → http://localhost:3000
```

With no environment variables the app runs in **demo mode**:

- All reads come from clearly-labelled fictional seed data (`lib/demo/`).
- User writes (reports, adoption applications, saved animals, donation
  pledges, demo sessions) persist to `localStorage`.
- Payments are disabled — nothing is ever faked as a successful donation.
- The login page offers instant **role switching** (User / Volunteer / Admin)
  so every dashboard is explorable.

Setting Supabase keys (below) flips the services layer to live queries.

## Architecture

```
app/                      # Next.js App Router (RSC-first)
  page.tsx                #   Home (cinematic hero → sections)
  adopt/                  #   Discovery + filters, apply/[slug] 6-step flow
  animal/[slug]/          #   Digital Animal Identity (the flagship page)
  p/[token]/route.ts      #   QR resolver → redirects to /animal/[slug]?via=qr
  scan-not-found/         #   Landing for retired/unknown QR tags
  donate/                 #   Campaigns + transparency ledger + panel
  stories/, stories/[slug]#   Editorial storytelling
  report/, report/[id]/   #   Mobile-first report flow + status tracker
  map/                    #   Stylized campus map (zone-level privacy)
  about/, volunteer/      #   Org story, policies, volunteer registration
  login/, signup/         #   Supabase auth w/ demo-mode role switcher
  dashboard/              #   User dashboard (+ /volunteer)
  admin/                  #   Operations: animals, reports, adoptions,
                          #   donations, stories CMS
  sitemap.ts, robots.ts   #   SEO
components/               # UI kit, home sections, feature components
  animals/Portrait.tsx    #   Illustrated portrait system (photo-ready CMS slots)
  qr/                     #   Real QR generation + 3D flip tag
  map/CampusMap.tsx       #   Interactive SVG map with paw markers
services/                 # Data access: Supabase when configured, demo otherwise
lib/
  demo/                   #   Labelled demo dataset (animals, stories, …)
  supabase/               #   Browser + server clients (null in demo mode)
  local-store.ts          #   Demo-mode client persistence
  config.ts               #   Env detection + site constants
types/                    # Domain types mirroring the SQL schema
supabase/
  migrations/0001_…sql    # Full schema: tables, indexes, RLS, audit triggers
  seed.sql                # Demo seed (all rows marked is_demo)
```

**Server components by default** — pages fetch via `services/*` on the
server; client components are used only where interaction demands it
(filters, forms, motion, dashboards).

## Design system

- **Palette**: Deep Forest `#173F35` · Warm Cream `#F7F1E7` · Terracotta
  `#C96745` · Soft Sand `#DCC9A3` · Charcoal `#202421` (Tailwind v4 tokens in
  `app/globals.css`).
- **Type**: Fraunces (editorial display) + Manrope (UI), via `next/font`.
- **Motion**: Framer Motion + CSS keyframes. Every animation respects
  `prefers-reduced-motion`.
- **Brand assets**: the official society seal (dark ink on cream) lives in
  `public/images/branding/` — `logo-source.jpg` (canonical source) plus derived
  `seal-ink.png` / `seal-ink-cream.png` (transparent, for light/dark surfaces)
  and `seal-badge.png` (cream disc). Favicon, PWA icons, `app/icon.png` and the
  OG card are all derived from it; regenerate with
  `node scripts/generate-brand-assets.mjs` (bump `VERSION` in `public/sw.js`
  afterwards — `/icons` is cached cache-first).
- **Animal portraits**: a parameterized SVG illustration system
  (`components/animals/Portrait.tsx`) gives every animal a cohesive branded
  portrait — including the PAWS collar — until real photos are uploaded via
  the CMS (`animal_photos` + Supabase Storage).

### 3D & the hero

The hero is a layered illustrated scene with idle animation (breathing,
blinking, ear/tail movement), cursor parallax with eye tracking, and a
scroll-driven "camera" that zooms to the QR collar tag before handing off to
the *One Scan. Their Entire Story* section. It costs no WebGL, works
everywhere, and degrades gracefully.

**R3F upgrade path**: mount a `<Canvas>` scene in place of `DogScene`
(`components/home/Hero.tsx`) behind a `dynamic(() => import(...), { ssr:
false })` boundary, keeping `DogScene` as the no-WebGL/reduced-motion
fallback. The scroll/pointer motion values are already isolated and can drive
a GLB model's bones directly. Add `three @react-three/fiber @react-three/drei`
when a production-quality dog model (not a procedural placeholder) is
available.

## Supabase setup (live mode)

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` → `.env.local`, fill `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API).
3. Apply the schema — either:
   ```bash
   npx supabase login && npx supabase link --project-ref <ref>
   npx supabase db push          # runs supabase/migrations
   ```
   or paste `supabase/migrations/0001_initial_schema.sql` into the SQL editor.
4. **Seed demo data** (optional): run `supabase/seed.sql`. Every seeded row
   is `is_demo = true`.
5. Storage: create buckets `animal-photos` and `story-media` (public read,
   authenticated write ≤ 8 MB images — mirror the client-side validation).

### Auth & roles

- Supabase Auth (email/password) powers `login`/`signup`; the demo role
  switcher disappears automatically in live mode.
- Roles live in `user_roles` (`user` < `volunteer` < `admin` < `super_admin`)
  and are granted by a `super_admin`:
  ```sql
  insert into user_roles (user_id, role) values ('<auth-user-uuid>', 'admin');
  ```
- **Authorization is enforced in the database.** Every table has Row Level
  Security; the `RequireRole` client guard is UX only. Key protections:
  - precise rescue coordinates (`lat`/`lng`) never pass a public policy;
    anonymous tracking goes through `get_report_status()` which returns
    safe fields only
  - donations are private (donor + admin), totals come from the
    `campaigns_with_totals` view over **verified** rows only
  - `internal_note`/`internal_notes` columns are revoked from client roles
  - admin mutations on sensitive tables fire the `audit_logs` trigger

## QR system

- Each animal has: internal UUID (never in QRs), public `paws_id`
  (`PAWS-KGP-DOG-0012`), public slug (`/animal/simba`), and an opaque
  `qr_tags.token`.
- Printed tags encode `${NEXT_PUBLIC_SITE_URL}/p/{token}`. The route handler
  resolves token → current profile, so lost tags can be deactivated and
  reissued without reprinting history (Admin → Animals → *Reissue*).
- Admin → Animals → *QR tag* downloads a 1024px print-ready PNG
  (error-correction level H for outdoor wear).
- Scan analytics (`qr_scans`) store timestamp, coarse device category and
  referrer — never scanner identity; location only with explicit consent.

## Payments (Razorpay / UPI)

The donate flow is architected for Indian payment rails:

1. Client requests a donation → server route creates a `donations` row
   (`status = 'created'`) and a Razorpay order (UPI intent covers
   PhonePe/Google Pay/any UPI app).
2. Gateway webhook (`RAZORPAY_WEBHOOK_SECRET`-verified signature) marks the
   row `verified` — **only then** does it count in campaign totals.
3. Recurring monthly support maps to UPI Autopay mandates where enabled.

Without keys, the UI shows a clearly-labelled non-functional demo intent and
records a `pending_verification` pledge. **No payment success is ever faked.**

## Map

The Campus Paws Map is a custom stylized SVG (`components/map/CampusMap.tsx`)
with zone-level markers, clustering counts, filters and mini-profiles — fully
functional offline. To upgrade to real tiles, set `NEXT_PUBLIC_MAPBOX_TOKEN`
and swap the SVG for a Mapbox GL layer; the privacy model (public = coarse
zones only) lives in the data layer, so it holds regardless of renderer.

## Trust & safety checklist

- Impact numbers are admin-editable config (`impact_metrics`), labelled when
  demo — never hardcoded claims.
- Public pages never expose volunteer/donor/reporter contact details.
- Upload validation: image type + 8 MB cap client-side, mirrored in Storage
  policies.
- Rate limiting: put `/report` and `/p/*` behind Vercel WAF rules or
  middleware token buckets; add Turnstile (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`)
  on public forms.
- Accessibility: semantic landmarks, labels + `role="alert"` errors, visible
  focus, keyboard-safe dialogs/carousels, `prefers-reduced-motion` respected,
  WCAG-AA contrast on the earthy palette.

## Deployment (Vercel)

1. Push to GitHub, import in Vercel (framework auto-detected).
2. Set env vars from `.env.example` (at minimum `NEXT_PUBLIC_SITE_URL`;
   Supabase + Razorpay for live mode).
3. `npm run build` locally to verify, then deploy. Add your domain and set
   `NEXT_PUBLIC_SITE_URL` to it so QR codes and sitemap URLs are canonical.

## Scripts

| command         | what it does                       |
| --------------- | ---------------------------------- |
| `npm run dev`   | dev server (Turbopack)             |
| `npm run build` | production build                   |
| `npm start`     | serve the production build         |
| `npm run lint`  | ESLint                             |

---

*Made with compassion for every paw that calls Kharagpur home.*
