import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
