import { readdir } from "fs/promises";
import path from "path";
import type { MediaCollection } from "@/lib/image-config";

/**
 * Lazily load sharp, tolerating a runtime where its native binary can't load.
 *
 * A top-level `import sharp from "sharp"` fails to even LOAD this module when
 * sharp's libvips native binary is missing — which is exactly what happens in a
 * Vercel serverless function (ERR_DLOPEN: libvips-cpp.so not found). Any DYNAMIC
 * page that transitively imports listMedia (e.g. /animal/[slug], which is
 * request-time rendered because it reads searchParams) then 500s. Sharp is only
 * needed to derive image dimensions and the blur placeholder, both of which are
 * nice-to-haves; deferring the import and returning null on failure lets those
 * pages render the photo without a blur-up instead of crashing. At build time,
 * where sharp loads fine, everything works exactly as before.
 */
type SharpModule = typeof import("sharp");
let sharpPromise: Promise<SharpModule["default"] | null> | undefined;
function loadSharp(): Promise<SharpModule["default"] | null> {
  if (!sharpPromise) {
    sharpPromise = import("sharp")
      .then((m) => m.default)
      .catch(() => null);
  }
  return sharpPromise;
}

/**
 * Filesystem-backed media manifest (server/build-time only).
 *
 * Drop images into `public/images/<collection>/` and every surface that
 * renders a collection picks them up on the next build — no code changes.
 * Filenames become captions: `simba--first-day-home.jpg` → "Simba — first day home".
 *
 * Every valid `collection` value is a path from `lib/image-config.ts` — that
 * file is the single source of truth for which folders exist and what each
 * one feeds; see docs/IMAGE_GUIDE.md for the full section-to-folder map.
 *
 * CMS media (Supabase `animal_photos`, story photos) is merged by the pages
 * themselves; this module only knows about static files.
 */

export type { MediaCollection };

export interface MediaAsset {
  src: string;
  alt: string;
  width: number;
  height: number;
  blurDataURL: string;
  collection: MediaCollection;
}

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const VIDEO_EXTENSIONS = new Set([".mp4"]);
const EXTENSIONS = new Set([...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]);
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

  const sharp = await loadSharp();

  const assets = await Promise.all(
    files.sort().map(async (file): Promise<MediaAsset | null> => {
      const ext = path.extname(file).toLowerCase();
      const src = `/images/${collection}/${file}`;
      const alt = captionFromFilename(file);

      if (VIDEO_EXTENSIONS.has(ext)) {
        return { src, alt, width: 1280, height: 720, blurDataURL: "", collection };
      }

      // Sharp unavailable at runtime (serverless): still surface the photo,
      // just without measured dimensions or a blur placeholder.
      if (!sharp) {
        return { src, alt, width: 1200, height: 800, blurDataURL: "", collection };
      }

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
          src,
          alt,
          width: meta.width ?? 1200,
          height: meta.height ?? 800,
          blurDataURL: `data:image/webp;base64,${tiny.toString("base64")}`,
          collection,
        };
      } catch {
        // A single unreadable file shouldn't drop the photo — surface it plain.
        return { src, alt, width: 1200, height: 800, blurDataURL: "", collection };
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
