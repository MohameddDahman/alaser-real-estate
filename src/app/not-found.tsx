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
        <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center px-6">
          <p className="label text-survey">404</p>
          <h1 className="mt-4 text-d2 text-sheet">This page is not here</h1>
          <p className="mt-6 text-lead text-giza">
            The link may be wrong, or the page may have moved.
          </p>
          <Link
            href={`/${routing.defaultLocale}/properties`}
            className="label mt-10 inline-flex w-fit min-h-12 items-center border border-giza-dim/50 px-6 text-sheet transition-colors duration-300 hover:border-survey hover:text-survey"
          >
            Browse all properties
          </Link>
        </div>
      </body>
    </html>
  );
}
