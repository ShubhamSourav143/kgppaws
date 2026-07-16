import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This project is its own workspace root (silences multi-lockfile inference)
  turbopack: { root: __dirname },
};

export default nextConfig;
