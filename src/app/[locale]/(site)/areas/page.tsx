import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Reveal, RevealItem, RevealList } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/DimensionRule";
import { SurveyGrid } from "@/components/home/SurveyGrid";
import { areas } from "@/content/client-facts";
import { getAreaCounts } from "@/lib/data";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "areasPage" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function AreasPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations("areasPage");
  const counts = await getAreaCounts();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

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

      <RevealList as="ul" className="mt-16 border-t border-navy-edge">
        {areas.map((area) => (
          <RevealItem as="li" key={area.slug}>
            <Link
              href={{ pathname: "/properties", query: { area: area.slug } }}
              className="group relative grid gap-x-10 gap-y-4 overflow-hidden border-b border-navy-edge py-10 transition-colors duration-300 hover:bg-navy-lift/40 lg:grid-cols-[minmax(0,20rem)_1fr_auto] lg:items-start lg:py-12"
            >
              {/* Grid subdivisions get the grid itself, faintly, behind them.
                  Faisal and Haram are not laid out this way, so they do not. */}
              {"isGrid" in area && area.isGrid && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 end-0 hidden w-1/3 text-survey opacity-[0.10] transition-opacity duration-500 group-hover:opacity-[0.18] lg:block"
                >
                  <SurveyGrid />
                </span>
              )}

              <div className="relative">
                <h2 className="text-d3 text-sheet transition-colors duration-300 group-hover:text-survey">
                  {area.name[locale]}
                </h2>
                <p className="label mt-2 text-giza-dim">{area.governorate[locale]}</p>
              </div>

              <div className="relative">
                <p className="measure text-lead text-giza">{area.character[locale]}</p>
                {"isGrid" in area && area.isGrid && (
                  <p className="label mt-4 text-survey">{t("gridNote")}</p>
                )}
              </div>

              <div className="relative flex items-center gap-4 lg:flex-col lg:items-end lg:gap-3">
                <p className="label whitespace-nowrap text-giza">
                  {t("unitsHere", { count: counts[area.slug] })}
                </p>
                <span className="label inline-flex items-center gap-2 text-survey">
                  {t("viewUnits", { area: area.name[locale] })}
                  <Arrow
                    className="size-3.5 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </span>
              </div>
            </Link>
          </RevealItem>
        ))}
      </RevealList>
    </div>
  );
}
