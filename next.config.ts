import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This project is its own workspace root (silences multi-lockfile inference)
  turbopack: { root: __dirname },
  images: {
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
