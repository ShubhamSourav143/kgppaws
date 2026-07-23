# Home hero images

## `main-building.jpg` — the hero backdrop

A photograph of the IIT Kharagpur Main Building, **supplied by KGP PAWS**
(the society holds the rights). No third-party attribution is rendered.

⚠️ **Current file is low resolution: 413×275 px.** The hero is full-bleed, so
on a 1920–2560px display this is upscaled roughly 5–6×, which reads as soft
and makes the building's "INDIAN INSTITUTE OF TECHNOLOGY" lettering
illegible. A film-grain overlay in `Hero.tsx` disguises some of it.

**Please replace with the full-resolution original** — ideally **≥2400px wide**,
landscape. Same filename, no code changes needed.

## Swapping the background

Drop any wide landscape image in as `main-building.jpg` and the hero picks it
up on the next build. Recommended: ≥2400px wide, with usable sky/negative
space on the left for the headline.

If you add a **second** image to this folder, note that the hero uses the
first file alphabetically (`lib/media.ts` → `listMedia("hero")`).

### Attribution

If you ever swap in a Creative Commons photo, credit is required — add the
credit line back into `components/home/Hero.tsx`. (An earlier version used a
CC BY 3.0 photo by Biswarup Ganguly from Wikimedia Commons; it was removed
when the society's own photo replaced it.)

## Foreground animal photos

The floating dog/cat cards in the hero reuse the adopt covers from
`public/images/adopt/` (`simba.jpg`, `percy.jpg`). Those are currently
**temporary royalty-free placeholders** — see `public/images/adopt/README.md`.
