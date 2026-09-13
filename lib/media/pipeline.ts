/**
 * Media processing pipeline v2.
 *
 * Turn one original image into a responsive ladder:
 *   original (up to 3200px) / 1600 / 800 / 400 — each in AVIF + WebP + JPEG.
 * Plus a blurhash placeholder for the LQIP.
 *
 * All variants are named deterministically so a re-run is idempotent:
 *   <basename>-<size>.<ext>
 *
 * EXIF/GPS is stripped by sharp on load — nothing sensitive survives.
 */

import type { Sharp } from "sharp";
import { encode as encodeBlurhash } from "blurhash";

// sharp is imported lazily (inside processImage) rather than at module top:
// this module is pulled into the single /api serverless function, and a
// top-level import of sharp fails to LOAD when its native binary is missing at
// runtime (ERR_DLOPEN), which would 500 every API route. Media ingest — the
// only caller — genuinely needs sharp, so loading it there surfaces a clear
// failure only for that cron path instead of breaking the whole function.

export const VARIANT_SIZES = [3200, 1600, 800, 400] as const;
export const VARIANT_FORMATS = ["avif", "webp", "jpeg"] as const;
export type VariantSize = (typeof VARIANT_SIZES)[number];
export type VariantFormat = (typeof VARIANT_FORMATS)[number];

export interface Variant {
  size: VariantSize;
  format: VariantFormat;
  buffer: Buffer;
  contentType: string;
  storagePath: string;
}

export interface PipelineResult {
  variants: Variant[];
  blurhash: string;
  originalWidth: number;
  originalHeight: number;
}

const FORMAT_TO_MIME: Record<VariantFormat, string> = {
  avif: "image/avif",
  webp: "image/webp",
  jpeg: "image/jpeg",
};

const FORMAT_TO_EXT: Record<VariantFormat, string> = {
  avif: "avif",
  webp: "webp",
  jpeg: "jpg",
};

/**
 * Given a folder + basename (no extension), produce the storage_path for a
 * variant. Example: buildStoragePath("DOG00023", "cover", 800, "webp")
 *                     → "DOG00023/cover-800.webp"
 */
export function buildStoragePath(
  folder: string,
  basename: string,
  size: VariantSize,
  format: VariantFormat
): string {
  return `${folder}/${basename}-${size}.${FORMAT_TO_EXT[format]}`;
}

/**
 * Process an original image into the full variant ladder + blurhash.
 *
 * Very small originals (< 800px on the long edge) still get processed so the
 * output shape stays uniform; sharp's `withoutEnlargement: true` prevents
 * upscaling, so a 500px original produces smaller ladder entries.
 */
export async function processImage(args: {
  buffer: Buffer;
  folder: string;
  basename: string;
}): Promise<PipelineResult> {
  const sharp = (await import("sharp")).default;
  const rotated = sharp(args.buffer).rotate();
  const meta = await rotated.metadata();
  const originalWidth = meta.width ?? 0;
  const originalHeight = meta.height ?? 0;

  const variants: Variant[] = [];
  for (const size of VARIANT_SIZES) {
    for (const format of VARIANT_FORMATS) {
      const pipeline = sharp(args.buffer)
        .rotate()
        .resize({ width: size, height: size, fit: "inside", withoutEnlargement: true });
      let output: Sharp;
      if (format === "avif") output = pipeline.avif({ quality: 55, effort: 4 });
      else if (format === "webp") output = pipeline.webp({ quality: 75 });
      else output = pipeline.jpeg({ quality: 82, progressive: true, mozjpeg: true });
      const buffer = await output.toBuffer();
      variants.push({
        size,
        format,
        buffer,
        contentType: FORMAT_TO_MIME[format],
        storagePath: buildStoragePath(args.folder, args.basename, size, format),
      });
    }
  }

  // Blurhash — 32x32 grayscale-ish raw pixels is enough.
  const blurRaw = await sharp(args.buffer)
    .rotate()
    .resize(32, 32, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const bh = encodeBlurhash(
    new Uint8ClampedArray(blurRaw.data),
    blurRaw.info.width,
    blurRaw.info.height,
    4,
    3
  );

  return {
    variants,
    blurhash: bh,
    originalWidth,
    originalHeight,
  };
}

/**
 * Compact JSONB representation of the variant set for storage in
 * `drive_assets.variants` and `animal_photos.variants` (added by a future
 * migration; the shape is already agreed here).
 */
export interface VariantsMetadata {
  base: string; // "DOG00023/cover" — same prefix as buildStoragePath but no size/ext
  sizes: VariantSize[];
  formats: VariantFormat[];
  width: number;
  height: number;
  blurhash: string;
}

export function variantsMetadata(args: {
  folder: string;
  basename: string;
  width: number;
  height: number;
  blurhash: string;
}): VariantsMetadata {
  return {
    base: `${args.folder}/${args.basename}`,
    sizes: [...VARIANT_SIZES],
    formats: [...VARIANT_FORMATS],
    width: args.width,
    height: args.height,
    blurhash: args.blurhash,
  };
}
