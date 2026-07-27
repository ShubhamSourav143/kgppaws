import { listMedia } from "@/lib/media";
import type { Animal } from "@/types";

/**
 * Give each animal its filesystem cover photo from `public/images/adopt/`,
 * keyed by slug (`simba.jpg` → the animal whose slug is "simba").
 *
 * An animal that already has an uploaded photo keeps it — the CMS always wins.
 * This only fills the gap for animals the database knows about but has no
 * photography for, which is every animal until real galleries are uploaded.
 *
 * Without it those animals fall through to the illustrated SVG portrait in
 * `components/animals/Portrait.tsx`, which is how cartoon dogs ended up on the
 * home page, the campus map and the adoption form while real photographs sat
 * unused on disk. Every surface that renders an `AnimalPortrait` should pass
 * its animals through here first.
 */
export async function withCoverPhotos(animals: Animal[]): Promise<Animal[]> {
  const covers = await coverMap();
  return animals.map((a) => attachCover(a, covers));
}

/** Single-animal form, for the routes that load one profile. */
export async function withCoverPhoto(animal: Animal): Promise<Animal>;
export async function withCoverPhoto(animal: undefined): Promise<undefined>;
export async function withCoverPhoto(
  animal: Animal | undefined
): Promise<Animal | undefined>;
export async function withCoverPhoto(
  animal: Animal | undefined
): Promise<Animal | undefined> {
  if (!animal) return undefined;
  return attachCover(animal, await coverMap());
}

/** slug → `/images/adopt/<slug>.jpg`, ignoring any `--caption` suffix. */
export async function coverMap(): Promise<Record<string, string>> {
  const media = await listMedia("adopt");
  const covers: Record<string, string> = {};
  for (const m of media) {
    const file = m.src.split("/").pop() ?? "";
    const key = file.replace(/\.[^.]+$/, "").split("--")[0].toLowerCase();
    if (key && !(key in covers)) covers[key] = m.src;
  }
  return covers;
}

function attachCover(a: Animal, covers: Record<string, string>): Animal {
  if (a.photos.some((p) => p.url)) return a;
  const cover = covers[a.slug];
  if (!cover) return a;
  return {
    ...a,
    photos: [
      { id: `cover-${a.slug}`, caption: a.name, date: "", url: cover },
      ...a.photos,
    ],
  };
}
