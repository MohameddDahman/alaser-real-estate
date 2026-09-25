import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Header } from "@/components/layout/Header";
import { LanguageOffer } from "@/components/layout/LanguageOffer";
import { Footer } from "@/components/layout/Footer";
import { NavigationLoader } from "@/components/layout/NavigationLoader";

/** Public chrome. Everything a visitor sees; nothing the admin does. */
export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only rounded-md focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[100] focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-fg focus:shadow-pop"
      >
        {t("skipToContent")}
      </a>
      <LanguageOffer />
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <Footer />
      {/* Reads the search params, so it renders on the client only. */}
      <Suspense fallback={null}>
        <NavigationLoader />
      </Suspense>
    </div>
  );
}
