import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import "../globals.css";
import { fontVariables } from "@/lib/fonts";
import { localeMeta, routing, type Locale } from "@/i18n/routing";
import { brand, office } from "@/content/client-facts";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "listings" });

  return {
    title: {
      default: brand.legalName[locale as Locale],
      template: `%s — ${locale === "ar" ? brand.arabic : brand.latin}`,
    },
    description: t("metaDescription"),
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://alaser.eg",
    ),
    alternates: { languages: { en: "/en", ar: "/ar" } },
    openGraph: {
      type: "website",
      locale: locale === "ar" ? "ar_EG" : "en_EG",
      siteName: brand.legalName[locale as Locale],
    },
  };
}

/**
 * Owns <html>, because `lang` and `dir` depend on the locale segment and have
 * to be right in the first byte - an RTL page that flips after hydration is a
 * visible failure.
 *
 * The public chrome lives in `(site)/layout.tsx` so `/admin` does not inherit
 * a marketing header and footer.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} dir={localeMeta[locale].dir} className={fontVariables} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
        </NextIntlClientProvider>

        {/* Organisation data. Only facts actually confirmed with the client. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "RealEstateAgent",
              name: brand.legalName[locale as Locale],
              alternateName: locale === "ar" ? brand.latin : brand.arabic,
              areaServed: ["Faisal", "Haram", "Hadayek El-Ahram", "6th of October", "Sheikh Zayed"],
              address: {
                "@type": "PostalAddress",
                streetAddress: office.address[locale as Locale],
                addressLocality: office.city[locale as Locale],
                addressCountry: "EG",
              },
            }),
          }}
        />
      </body>
    </html>
  );
}
