import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // The client's photographs, in Convex file storage: this project's two
    // deployments only (production, then development and previews), so the
    // optimiser cannot be used to resize anyone else's files on our bill.
    remotePatterns: [
      { protocol: "https", hostname: "accurate-leopard-183.convex.cloud", pathname: "/api/storage/**" },
      { protocol: "https", hostname: "rightful-lyrebird-844.convex.cloud", pathname: "/api/storage/**" },
      // Placeholder photography only - see src/content/photos.ts. Removed
      // once the client's own shoots are in Convex storage.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
  },
};

export default withNextIntl(nextConfig);
