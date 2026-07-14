import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "ifs-p-001.sitecorecontenthub.cloud" },
      { protocol: "https", hostname: "ifs-d-001.sitecorecontenthub.cloud" },
    ],
  },
};

export default nextConfig;
