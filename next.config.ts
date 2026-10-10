import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "@hugeicons/core-free-icons",
      "@hugeicons/react",
      "motion",
      "radix-ui",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.duevy.app",
      },
      {
        protocol: "https",
        hostname: "duevy-be.onrender.com",
      },
    ],
  },
};

export default nextConfig;
