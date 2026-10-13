import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "assets.hospitable.com" }],
  },
};

export default nextConfig;
