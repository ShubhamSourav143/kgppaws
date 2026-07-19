/**
 * Regenerates every derived brand asset from the official society seal
 * (public/images/branding/logo-source.jpg — dark ink on cream paper).
 *
 *   node scripts/generate-brand-assets.mjs
 *
 * Outputs
 *   public/images/branding/seal-ink.png        1024px, charcoal ink, transparent bg (light surfaces)
 *   public/images/branding/seal-ink-cream.png  1024px, cream ink, transparent bg (dark surfaces)
 *   public/images/branding/seal-badge.png      1024px cream disc + seal (any surface, OG card, print)
 *   public/icons/icon-{192,512}.png            PWA icons (cream square)
 *   public/icons/icon-maskable-512.png         PWA maskable (art within 80% safe zone)
 *   public/icons/apple-touch-icon.png          180px (kept for any hard-coded references)
 *   app/icon.png                               192px favicon for modern browsers
 *   app/apple-icon.png                         180px (file convention → <link rel="apple-touch-icon">)
 *   app/favicon.ico                            16/32/48 32-bit BMP entries
 *
 * app/opengraph-image.png is a separate hand-designed card (seal-badge + brand
 * type on the cream palette) — regenerate it by hand if the seal changes.
 *
 * After changing icons, bump VERSION in public/sw.js — /icons is cache-first.
 */
import sharp from "sharp";
import { writeFile, copyFile } from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "public/images/branding/logo-source.jpg");
const BRAND = path.join(ROOT, "public/images/branding");
const ICONS = path.join(ROOT, "public/icons");

const CREAM = { r: 0xf7, g: 0xf1, b: 0xe7 }; // --color-cream
const INK = { r: 0x20, g: 0x24, b: 0x21 };   // --color-charcoal

const { width: W, height: H } = await sharp(SRC).metadata();

// Ink alpha mask: dark ink -> opaque, cream paper -> transparent.
const mask = await sharp(SRC)
  .grayscale()
  .negate()
  .linear(1.5, -45) // paper (negated lum ~15) -> 0, ink (~220) -> 255
  .toColourspace("b-w")
  .png()
  .toBuffer();

const inkFull = (rgb) =>
  sharp({ create: { width: W, height: H, channels: 3, background: rgb } })
    .joinChannel(mask)
    .png()
    .toBuffer();

const inkDarkFull = await inkFull(INK);
const inkCreamFull = await inkFull(CREAM);

await writeFile(path.join(BRAND, "seal-ink.png"), await sharp(inkDarkFull).resize(1024, 1024).png().toBuffer());
await writeFile(path.join(BRAND, "seal-ink-cream.png"), await sharp(inkCreamFull).resize(1024, 1024).png().toBuffer());

const disc = Buffer.from(
  `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg"><circle cx="512" cy="512" r="510" fill="#F7F1E7"/></svg>`
);
await writeFile(
  path.join(BRAND, "seal-badge.png"),
  await sharp(disc)
    .composite([{ input: await sharp(inkDarkFull).resize(900, 900).png().toBuffer(), gravity: "centre" }])
    .png()
    .toBuffer()
);

// Icons: full-bleed cream square, seal art inset by ratio.
const square = async (size, artRatio) => {
  const art = await sharp(inkDarkFull)
    .resize(Math.round(size * artRatio), Math.round(size * artRatio))
    .png()
    .toBuffer();
  return sharp({ create: { width: size, height: size, channels: 3, background: CREAM } })
    .composite([{ input: art, gravity: "centre" }])
    .png()
    .toBuffer();
};

const icon512 = await square(512, 0.86);
await writeFile(path.join(ICONS, "icon-512.png"), icon512);
await writeFile(path.join(ICONS, "icon-192.png"), await sharp(icon512).resize(192, 192).png().toBuffer());
await writeFile(path.join(ICONS, "icon-maskable-512.png"), await square(512, 0.72));
await writeFile(path.join(ICONS, "apple-touch-icon.png"), await square(180, 0.84));
await copyFile(path.join(ICONS, "icon-192.png"), path.join(ROOT, "app/icon.png"));
await copyFile(path.join(ICONS, "apple-touch-icon.png"), path.join(ROOT, "app/apple-icon.png"));

// favicon.ico: 16/32/48 uncompressed 32-bit BMP entries.
const entries = [];
for (const s of [16, 32, 48]) {
  const { data } = await sharp(await square(s, 0.96)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  entries.push({ size: s, body: bmpEntry(data, s, s) });
}
await writeFile(path.join(ROOT, "app/favicon.ico"), packIco(entries));
console.log("brand assets regenerated");

function bmpEntry(rgba, w, h) {
  const header = Buffer.alloc(40);
  const andRow = Math.ceil(w / 32) * 4;
  const xorSize = w * h * 4;
  header.writeUInt32LE(40, 0);
  header.writeInt32LE(w, 4);
  header.writeInt32LE(h * 2, 8); // XOR + AND mask height
  header.writeUInt16LE(1, 12);
  header.writeUInt16LE(32, 14);
  header.writeUInt32LE(0, 16);
  header.writeUInt32LE(xorSize + andRow * h, 20);
  const xor = Buffer.alloc(xorSize);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = ((h - 1 - y) * w + x) * 4; // rows are bottom-up, BGRA
      const di = (y * w + x) * 4;
      xor[di] = rgba[si + 2];
      xor[di + 1] = rgba[si + 1];
      xor[di + 2] = rgba[si];
      xor[di + 3] = rgba[si + 3];
    }
  }
  return Buffer.concat([header, xor, Buffer.alloc(andRow * h)]);
}

function packIco(entries) {
  const dir = Buffer.alloc(6);
  dir.writeUInt16LE(1, 2); // type: ICO
  dir.writeUInt16LE(entries.length, 4);
  const dirEntries = [];
  let offset = 6 + entries.length * 16;
  for (const { size, body } of entries) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(body.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += body.length;
    dirEntries.push(e);
  }
  return Buffer.concat([dir, ...dirEntries, ...entries.map((e) => e.body)]);
}
