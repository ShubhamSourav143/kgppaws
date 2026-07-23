# Home hero mosaic — TEMPORARY PLACEHOLDERS

`grid-01.jpg` … `grid-08.jpg` are the photos in the home-page hero mosaic
(the grid beside the headline). They are **temporary royalty-free stock
photos** of **generic** dogs and cats — **not** specific KGP PAWS animals.

## Swapping in official photos (no code changes)

Overwrite any file, keeping the same name (`grid-01.jpg` … `grid-08.jpg`).
The hero reads this fixed list from `components/home/Hero.tsx` (`GRID_PHOTOS`).

- Square-ish crops work best (cells render as squares on mobile, and as a
  4-row column on desktop). Aim for ≥900px.
- Any format works, but keep the `.jpg` name — or update `GRID_PHOTOS` if you
  change the count/extension.

Current layout: 5 dogs + 3 cats. Order is interleaved for visual variety.
