import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // Convex serves listing media from its own storage origin. Kept here so the
    // swap from seed data to live Convex needs no config change.
    remotePatterns: [
      { protocol: "https", hostname: "*.convex.cloud" },
      { protocol: "https", hostname: "*.convex.site" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
  },
};

export default withNextIntl(nextConfig);
