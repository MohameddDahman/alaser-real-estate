import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Reveal, RevealItem, RevealList } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/DimensionRule";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "services" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

/**
 * Four services. Deliberately not numbered - buying, selling, leasing and
 * commercial are alternatives, not a sequence, so a numeral would be
 * decoration pretending to be structure.
 */
const SERVICES = ["buy", "sell", "rent", "commercial"] as const;

export default async function ServicesPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations("services");

  return (
    <div className="mx-auto w-full max-w-[92rem] px-4 pb-24 pt-32 sm:px-6 lg:px-10 lg:pb-32 lg:pt-40">
      <Reveal className="text-sheet">
        <SectionHead
          eyebrow={t("title")}
          title={t("metaTitle")}
          body={t("intro")}
          className="max-w-3xl"
        />
      </Reveal>

      <RevealList as="ul" className="mt-16 grid gap-px border-t border-navy-edge bg-navy-edge md:grid-cols-2">
        {SERVICES.map((key) => (
          <RevealItem as="li" key={key} className="bg-navy py-10 md:px-10">
            <h2 className="text-d3 text-sheet">{t(`${key}Title` as "buyTitle")}</h2>
            <p className="measure mt-5 text-giza">{t(`${key}Body` as "buyBody")}</p>
          </RevealItem>
        ))}
      </RevealList>

      <Reveal className="mt-16">
        <Link
          href="/contact"
          className="label inline-flex min-h-14 items-center border border-giza-dim/50 px-7 text-sheet transition-colors duration-300 hover:border-survey hover:text-survey"
        >
          {t("askCta")}
        </Link>
      </Reveal>
    </div>
  );
}
