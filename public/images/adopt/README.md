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
| `why.jpg`    | Beside "Why Adoption Matters" | portrait (4:5) |
| `simba.jpg`  | Simba's card + collage     | portrait |
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
