import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { getAllPropertySlugs } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

const STATIC_PATHS = ["", "/properties", "/areas", "/services", "/about", "/contact"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllPropertySlugs();
  const paths = [...STATIC_PATHS, ...slugs.map((slug) => `/properties/${slug}`)];

  return paths.map((path) => ({
    url: `${SITE_URL}/${routing.defaultLocale}${path}`,
    lastModified: new Date(),
    changeFrequency: path.startsWith("/properties/") ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.startsWith("/properties/") ? 0.8 : 0.6,
    // Both locales are equal citizens, so every entry declares both.
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((locale) => [locale, `${SITE_URL}/${locale}${path}`]),
      ),
    },
  }));
}
