import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "assets.cdntoyota.co.za" }],
  },
};

export default nextConfig;
