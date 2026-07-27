# Image Guide

Where every photograph on the site comes from, and where to drop a
replacement. The single source of truth for these paths is
[`lib/image-config.ts`](../lib/image-config.ts) — nothing in the codebase
should hardcode one of these folder names outside that file.

**To update a photo: replace the file in the matching folder below, keeping
the same filename (or the same stem before any `--caption` suffix). No code
change is needed** for any row marked ✅ Live. Rows marked ⏳ Reserved have a
folder ready but no page currently renders it — see the note under each.

## Section → folder map

| Website Section | Folder Location | Recommended Images | Status |
|-----------------|-----------------|--------------------|--------|
| Hero | `public/images/hero/` | Main hero photos | ✅ Live — **excluded from this refactor**, see below |
| Hero Grid | `public/images/hero-grid/` | 16 grid images (`grid-01.jpg` … `grid-16.jpg`, two may be `.mp4`) | ✅ Live — **excluded from this refactor**, see below |
| Adopt (per-animal identity photo) | `public/images/adopt/` | One photo per animal, named `<slug>.jpg` | ✅ Live |
| Featured Dogs (home carousel) | `public/images/featured-dogs/` | Optional override: `<slug>.jpg` to show a different photo of that animal here only | ✅ Live (override) |
| Compawnions (home "Com-Paw-Nions" grid) | `public/images/companions/` | Optional override: `<slug>.jpg`, same convention as Featured Dogs | ✅ Live (override) |
| Stories (Why Adoption Matters + /stories pool) | `public/images/stories/` | `story-01.jpg` … `story-12.jpg` | ✅ Live |
| Feeding campaign | `public/images/donation/feeding/` | Feeding-round photos | ✅ Live |
| Sterilization campaign | `public/images/donation/sterilization/` | Post-op / recovery photos | ✅ Live |
| Vaccination campaign | `public/images/donation/vaccination/` | Dogs being handled / vaccinated | ✅ Live |
| Medical Emergency Fund | `public/images/donation/medical/` | Treatment, X-ray, surgery-adjacent photos | ✅ Live |
| Individual rescue/recovery appeals | `public/images/donation/rescue/` | One specific animal's rescue-operation photos | ⏳ Reserved — no such campaign exists in the current data; wired but empty, see note below |
| Volunteer | `public/images/volunteer/` | Volunteers in action | ✅ Live — aggregated onto `/gallery` |
| Events | `public/images/events/` | Event/meetup photos | ✅ Live — aggregated onto `/gallery` |
| Gallery (general) | `public/images/gallery/` | Anything that doesn't fit another category | ✅ Live — aggregated onto `/gallery` |
| Shelter residents | `public/images/shelter-residents/` | Long-term campus residents | ✅ Live — aggregated onto `/gallery` |
| Transformation (before/after) | `public/images/transformation/` | Pairs named `<subject>--before.jpg` / `<subject>--after.jpg` | ✅ Live — home Transformations slider |
| Testimonials | `public/images/testimonials/` | Adoption success-story photos | ⏳ Reserved — no Testimonials UI exists yet |
| About | `public/images/about/` | Organization / team photos | ⏳ Reserved — `/about` is currently text-and-icons only |
| Campus | `public/images/campus/` | General IIT Kharagpur campus photography | ⏳ Reserved — no component renders this yet |
| Footer | `public/images/footer-dogs/` | The four peeking dog cutout PNGs | ✅ Live — **excluded from this refactor**, see below |
| UI | `public/images/ui/` | Decorative UI imagery, distinct from `icons/` (app icons) and `branding/` (logo) | ⏳ Reserved — no component renders this yet |

## The three excluded folders

`hero/`, `hero-grid/` and `footer-dogs/` are unchanged by this refactor —
per instructions, the Hero section, Hero Image Grid and Footer components
were not modified. Their paths are still listed in `IMAGE_FOLDERS` (as
`hero`, `heroGrid`, `footerDogs`) purely so other, in-scope pages that
happen to read the same folder (the `/gallery` aggregator) don't hardcode
the string a second time — but nothing about how those three folders work,
or the components that render them, changed.

`footer-dogs/pet-1.png` … `pet-4.png` are transparent-background cutout
PNGs, not plain photos — replacing them needs a background-removal step
first (see project history for why a plain JPG doesn't work there).

## Override folders: how `featured-dogs/` and `companions/` work

Every animal already has one canonical photo in `adopt/<slug>.jpg` — that's
what shows on their profile, their adoption card, and everywhere else by
default. `featured-dogs/` and `companions/` let you show a *different*
photo of the same animal in exactly one section, without touching or
duplicating the `adopt/` file:

- Drop `featured-dogs/bunti.jpg` → the home page's "Meet the Paws" /
  Featured Rescues carousel shows that photo for Bunti; his profile page,
  the adopt grid, and everywhere else still show `adopt/bunti.jpg`.
- Same convention for `companions/<slug>.jpg` and the "Com-Paw-Nions" grid.
- Leave a slug's override file absent (the normal case) and that section
  just falls back to `adopt/<slug>.jpg` — nothing breaks.

This is implemented in [`lib/animal-covers.ts`](../lib/animal-covers.ts).

## Donation campaign galleries

Each programme's gallery on `/donate` pulls only from its own
`donation/<programme>/` folder — see the stems it's keyed to in
[`lib/donate/editorial.ts`](../lib/donate/editorial.ts) (`gallery: [...]`).
Add more photos there using the same `<prefix>-04.jpg`, `-05.jpg` naming
and add the matching stem to that campaign's `gallery` array.

## Reserved folders — what "no code required" actually means here

`testimonials/`, `about/`, `campus/` and `ui/` are created and wired into
`lib/image-config.ts` so dropping files there is future-proofed, but **no
current page reads them yet** — `/about` has no photo slots today, and
there's no Testimonials component. Dropping a file into one of these four
folders alone will not make it appear anywhere until a component is built
to read it. Everything else on this page (marked ✅ Live) picks up a
replacement file with zero code changes, immediately on the next build.
