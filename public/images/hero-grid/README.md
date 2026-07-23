# Home hero collage — TEMPORARY PLACEHOLDERS

`grid-01.jpg` … `grid-16.jpg` are the photos in the home-page hero collage
(the seamless full-viewport 4×4 grid). They are **temporary royalty-free
stock photos** of **generic** dogs and cats — **not** specific KGP PAWS
animals.

## Swapping in official photos (no code changes)

Overwrite any file, keeping the same name (`grid-01.jpg` … `grid-16.jpg`).
The hero reads this fixed list from `components/home/Hero.tsx` (`CELLS`).

- `grid-01…08` are the **right half** on desktop and the entire mobile
  collage — put your strongest photos here.
- `grid-09…16` sit **under the text overlay** on the left half (desktop
  only), dimmed by the gradient — good photos still help, but they read as
  texture.
- Square-ish crops ≥900px work best; cells are equal tiles at every
  breakpoint. Keep the `.jpg` name or update `CELLS` if you change the
  count/extension.
