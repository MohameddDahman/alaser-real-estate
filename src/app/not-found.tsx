import Link from "next/link";

import "./globals.css";
import { fontVariables } from "@/lib/fonts";
import { routing } from "@/i18n/routing";

/**
 * Global 404 for paths the locale middleware could not route at all. Carries
 * its own html/body because the app's root layout lives under [locale].
 * In practice the middleware redirects almost everything into a locale, where
 * the translated 404 takes over.
 */
export default function GlobalNotFound() {
  return (
    <html lang={routing.defaultLocale} dir="ltr" className={fontVariables}>
      <body>
        <div className="shell flex min-h-dvh flex-col items-start justify-center">
          <p className="text-sm font-semibold text-fg-subtle">404</p>
          <h1 className="mt-1 text-title font-bold text-fg">This page is not here</h1>
          <p className="mt-3 text-fg-muted">The link may be wrong, or the page may have moved.</p>
          <Link href={`/${routing.defaultLocale}/properties`} className="btn btn-primary mt-8">
            Browse all properties
          </Link>
        </div>
      </body>
    </html>
  );
}
