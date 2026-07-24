import { readdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

/**
 * Filesystem-backed media manifest (server/build-time only).
 *
 * Drop images into `public/images/<collection>/` and every surface that
 * renders a collection picks them up on the next build — no code changes.
 * Filenames become captions: `simba--first-day-home.jpg` → "Simba — first day home".
 *
 * CMS media (Supabase `animal_photos`, story photos) is merged by the pages
 * themselves; this module only knows about static files.
 */

export type MediaCollection =
  | "branding"
  | "hero"
  | "hero-grid"
  | "gallery"
  | "stories"
  | "transformation"
  | "campus-compawnions"
  | "shelter-residents"
  | "adopt"
  | "donate"
  | "volunteer"
  | "events"
  | "backgrounds";

export interface MediaAsset {
  src: string;
  alt: string;
  width: number;
  height: number;
  blurDataURL: string;
  collection: MediaCollection;
}

const EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const cache = new Map<string, MediaAsset[]>();

function captionFromFilename(file: string): string {
  const base = file.replace(/\.[^.]+$/, "");
  const [subject, detail] = base.split("--");
  const clean = (s: string) =>
    s.replace(/[-_]+/g, " ").trim().replace(/^\w/, (c) => c.toUpperCase());
  return detail ? `${clean(subject)} — ${clean(detail)}` : clean(subject);
}

export async function listMedia(collection: MediaCollection): Promise<MediaAsset[]> {
  const hit = cache.get(collection);
  if (hit) return hit;

  const dir = path.join(process.cwd(), "public", "images", collection);
  let files: string[] = [];
  try {
    files = (await readdir(dir)).filter((f) =>
      EXTENSIONS.has(path.extname(f).toLowerCase())
    );
  } catch {
    return [];
  }

  const assets = await Promise.all(
    files.sort().map(async (file): Promise<MediaAsset | null> => {
      try {
        const abs = path.join(dir, file);
        const image = sharp(abs);
        const meta = await image.metadata();
        const tiny = await image
          .resize(14)
          .blur(1)
          .webp({ quality: 40 })
          .toBuffer();
        return {
          src: `/images/${collection}/${file}`,
          alt: captionFromFilename(file),
          width: meta.width ?? 1200,
          height: meta.height ?? 800,
          blurDataURL: `data:image/webp;base64,${tiny.toString("base64")}`,
          collection,
        };
      } catch {
        return null;
      }
    })
  );

  const list = assets.filter((a): a is MediaAsset => a !== null);
  cache.set(collection, list);
  return list;
}

export async function listAllMedia(
  collections: MediaCollection[]
): Promise<MediaAsset[]> {
  const lists = await Promise.all(collections.map(listMedia));
  return lists.flat();
}
