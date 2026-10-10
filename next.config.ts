import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.46", "localhost", "127.0.0.1"],
  experimental: {
    // Homework submissions can carry several files (up to 30 MB in total).
    proxyClientMaxBodySize: "32mb",
  },
};

export default nextConfig;
