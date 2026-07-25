# Adopt page images — TEMPORARY PLACEHOLDERS

⚠️ **The photos in this folder are temporary, royalty-free stock images from
the internet (Unsplash license + placedog.net / representative sources).**

They are **generic representative animals** — they are **NOT** Romi, Odin,
Muesli, Bunti, or any specific KGP PAWS animal. They exist only to make the
Adopt page visually engaging until official KGP PAWS photography is available.

## How to replace with official photos (no code changes needed)

Just overwrite the file, keeping the **same filename**. The Adopt page keys
every image slot by filename (see `app/adopt/page.tsx` → `covers`):

| File | Where it shows | Suggested shape |
|------|----------------|-----------------|
| `hero.jpg`   | Hero background            | wide / landscape |
| `why.jpg`    | (legacy) unused since the "Why Adoption Matters" redesign | portrait (4:5) |
| `simba.jpg`  | Simba's card + collage + "Why Adoption Matters" band 3 | portrait |
| `muesli.jpg` | Muesli's card + story + collage | portrait |
| `bunti.jpg`  | Bunti's card + story + collage  | portrait |
| `laika.jpg`  | Laika's card + collage     | portrait |
| `percy.jpg`  | Percy's card + collage     | portrait |
| `mishti.jpg` | Mishti's card + collage    | portrait |
| `romi.jpg`   | Romi's story card + collage | landscape (5:4) |
| `odin.jpg`   | Odin's story card + collage | landscape (5:4) |
| `step-1.jpg` … `step-4.jpg` | Adoption-process steps (optional; icons until added) | landscape (16:10) |

- Any format works: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`.
- Delete a file to fall back to the built-in illustration for that slot.
- Add `--caption`: `simba--first-day-home.jpg` keeps the slot and adds a caption.
- The "Why Adoption Matters" section (`components/adopt/WhyAdopt.tsx`) is an
  Instagram-Stories slideshow: four slides, each one photo beside its message,
  auto-advancing every 5s. It reuses `romi/odin/simba.jpg` here plus one photo
  from `public/images/hero-grid/`; see that component for the exact mapping.
- Each animal card cycles through the first **three** of that animal's photos
  that have a URL (5s each, with progress bars). Until real per-animal
  galleries are uploaded, the cover above is padded with two stills from
  `public/images/hero-grid/`, split by species via `lib/demo/photo-pool.ts` so
  a dog's card never shows a cat. Upload three real photos for an animal and
  that padding drops away automatically.
