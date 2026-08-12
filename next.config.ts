import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This project is its own workspace root (silences multi-lockfile inference)
  turbopack: { root: __dirname },
  images: {
    // AVIF first, then WebP fallback. The site is photo-heavy (rescue photos,
    // the 16-tile hero collage, story galleries) and AVIF is materially smaller
    // than WebP/JPEG at the same quality — the single biggest transfer win on
    // mobile. Next negotiates by Accept header, so old browsers still get WebP/JPEG.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
