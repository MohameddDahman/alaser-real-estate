import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, ArrowLeft } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Hero } from "@/components/home/Hero";
import { QuickSearch } from "@/components/home/QuickSearch";
import { PlanStack } from "@/components/plan/PlanStack";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Reveal, RevealItem, RevealList } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/DimensionRule";
import { getAreaCounts, getFeatured, getProperties, planForProperty } from "@/lib/data";
import { areas } from "@/content/client-facts";
import { waHref } from "@/lib/contact";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const tw = await getTranslations("whatsapp");
  const [featured, all, counts] = await Promise.all([
    getFeatured(4),
    getProperties(),
    getAreaCounts(),
  ]);

  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const signaturePlan = planForProperty(featured[0] ?? all[0]);
  const waLink = waHref(tw("templateGeneral", { area: "Giza" }), locale);

  return (
    <>
      <Hero locale={locale} unitCount={all.length} />

      {/* The one thing a buyer wants, immediately under the fold. */}
      <section className="mx-auto w-full max-w-[92rem] px-4 pb-20 sm:px-6 lg:px-10 lg:pb-28">
        <Reveal>
          <h2 className="label text-giza-dim">{t("searchTitle")}</h2>
          <p className="mt-2 mb-5 text-giza">{t("searchSub")}</p>
          <QuickSearch locale={locale} />
        </Reveal>
      </section>

      {/* Featured -------------------------------------------------------- */}
      <section className="mx-auto w-full max-w-[92rem] px-4 pb-24 sm:px-6 lg:px-10 lg:pb-32">
        <Reveal className="flex flex-wrap items-end justify-between gap-6 text-sheet">
          <SectionHead eyebrow={t("featuredLabel")} title={t("featuredTitle")} />
          <Link
            href="/properties"
            className="group label inline-flex items-center gap-2.5 border-b border-giza-dim/50 pb-1.5 text-giza transition-colors duration-300 hover:border-survey hover:text-survey"
          >
            {t("featuredAll")}
            <Arrow
              className="size-3.5 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </Link>
        </Reveal>

        <RevealList className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((property, i) => (
            <RevealItem key={property._id}>
              <PropertyCard property={property} priority={i < 2} />
            </RevealItem>
          ))}
        </RevealList>
      </section>

      {/* How we list — three proofs, deliberately unnumbered. Three claims are
          not a sequence, so numbering them would be decoration. --------- */}
      <section className="on-sheet">
        <div className="mx-auto w-full max-w-[92rem] px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
          <Reveal>
            <SectionHead eyebrow={t("methodLabel")} title={t("methodTitle")} />
          </Reveal>

          <RevealList
            as="ul"
            className="mt-14 grid gap-px border-t border-sheet-edge bg-sheet-edge lg:grid-cols-3"
          >
            {(["1", "2", "3"] as const).map((n) => (
              <RevealItem as="li" key={n} className="bg-sheet pt-8 lg:px-8 lg:pt-10">
                <h3 className="text-d3">{t(`method${n}Title` as "method1Title")}</h3>
                <p className="measure mt-4 pb-8 text-ink/70">
                  {t(`method${n}Body` as "method1Body")}
                </p>
              </RevealItem>
            ))}
          </RevealList>
        </div>
      </section>

      {/* Areas, set as a schedule — the table every drawing set carries --- */}
      <section className="mx-auto w-full max-w-[92rem] px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
        <Reveal className="text-sheet">
          <SectionHead eyebrow={t("areasLabel")} title={t("areasTitle")} />
        </Reveal>

        <RevealList as="ul" className="mt-12 border-t border-navy-edge">
          {areas.map((area) => (
            <RevealItem as="li" key={area.slug}>
              <Link
                href={{ pathname: "/properties", query: { area: area.slug } }}
                className="group grid gap-x-6 gap-y-2 border-b border-navy-edge py-6 transition-colors duration-300 hover:bg-navy-lift/40 sm:grid-cols-[minmax(0,14rem)_1fr_auto] sm:items-baseline lg:py-7"
              >
                <h3 className="text-d3 text-sheet transition-colors duration-300 group-hover:text-survey">
                  {area.name[locale]}
                </h3>
                <p className="text-giza-dim">{area.character[locale]}</p>
                <p className="label whitespace-nowrap text-giza">
                  {t("areasUnits", { count: counts[area.slug] })}
                </p>
              </Link>
            </RevealItem>
          ))}
        </RevealList>
      </section>

      {/* THE SIGNATURE --------------------------------------------------- */}
      <section className="relative">
        <div className="mx-auto w-full max-w-[92rem] px-4 sm:px-6 lg:px-10">
          <Reveal className="text-sheet">
            <SectionHead
              eyebrow={t("planLabel")}
              title={t("planTitle")}
              body={t("planBody")}
              className="max-w-3xl"
            />
          </Reveal>
        </div>

        {signaturePlan && <PlanStack plan={signaturePlan} locale={locale} />}

        <div className="mx-auto w-full max-w-[92rem] px-4 pb-24 sm:px-6 lg:px-10 lg:pb-32">
          <Link
            href={`/properties/${(featured[0] ?? all[0]).slug}`}
            className="group label inline-flex items-center gap-2.5 border border-giza-dim/50 px-6 py-4 text-sheet transition-colors duration-300 hover:border-survey hover:text-survey"
          >
            {t("planCta")}
            <Arrow
              className="size-4 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </Link>
        </div>
      </section>

      {/* Close ----------------------------------------------------------- */}
      <section className="border-t border-navy-edge">
        <div className="mx-auto w-full max-w-[92rem] px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
          <Reveal className="text-sheet">
            <SectionHead
              eyebrow={t("closeLabel")}
              title={t("closeTitle")}
              body={t("closeBody")}
              className="max-w-2xl"
            />
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href={waLink}
                target={waLink.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="label inline-flex items-center gap-2.5 bg-survey-deep px-7 py-4 text-sheet transition-colors duration-200 hover:bg-survey hover:text-navy"
              >
                {locale === "ar" ? "واتساب" : "WhatsApp"}
              </a>
              <Link
                href="/properties"
                className="label inline-flex items-center gap-2.5 border border-giza-dim/50 px-7 py-4 text-sheet transition-colors duration-300 hover:border-survey hover:text-survey"
              >
                {t("featuredAll")}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
