# Home hero images

## `iit-kgp-main-building.jpg` — attribution required

The IIT Kharagpur Main Building photograph used as the home hero background is
a **real photo of the actual building**, used under a Creative Commons licence:

- **Photographer:** Biswarup Ganguly
- **Licence:** [CC BY 3.0](https://creativecommons.org/licenses/by/3.0)
- **Source:** [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Main_Building_-_Indian_Institute_of_Technology_-_Kharagpur_-_West_Midnapore_2013-01-26_3686.JPG)
- Resized to 2560px wide and re-encoded; otherwise unmodified.

⚠️ **CC BY requires attribution.** The credit is rendered in the hero (bottom
corner) by `components/home/Hero.tsx`. If you replace this file with an
official KGP PAWS photograph, remove that credit line too — see the
`PHOTO_CREDIT` constant in `Hero.tsx`.

## Swapping the background

Replace `iit-kgp-main-building.jpg` with any wide landscape image (same
filename) and the hero picks it up on the next build — no code changes.
Recommended: ≥2400px wide, landscape, with usable sky/negative space on the
left for the headline.

## Foreground animal photos

The floating dog/cat cards in the hero reuse the adopt covers from
`public/images/adopt/` (`simba.jpg`, `mishti.jpg`). Those are currently
**temporary royalty-free placeholders** — see `public/images/adopt/README.md`.
