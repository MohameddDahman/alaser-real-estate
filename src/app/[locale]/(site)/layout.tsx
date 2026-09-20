import { getTranslations, setRequestLocale } from "next-intl/server";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

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
    <>
      <a
        href="#main"
        className="label sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[100] focus:bg-sheet focus:px-4 focus:py-3 focus:text-ink"
      >
        {t("skipToContent")}
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer />
    </>
  );
}
