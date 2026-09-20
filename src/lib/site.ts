/**
 * Canonical origin. Set NEXT_PUBLIC_SITE_URL in the deploy environment; the
 * fallback is only so local builds produce valid absolute URLs.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://alaser.eg";
