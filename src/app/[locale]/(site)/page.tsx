import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, ArrowLeft } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Hero } from "@/components/home/Hero";
import { QuickSearch } from "@/components/home/QuickSearch";
import { FeaturedRail } from "@/components/home/FeaturedRail";
import { AreaShowcase } from "@/components/home/AreaShowcase";
import { PlanDissolve } from "@/components/plan/PlanDissolve";
import { Frame } from "@/components/motion/Frame";
import { Counter, Magnetic, Marquee, RevealText } from "@/components/motion/primitives";
import { Reveal, RevealItem, RevealList } from "@/components/ui/Reveal";
import { getAreaCounts, getFeatured, getProperties, planForProperty } from "@/lib/data";
import { areas, office, propertyTypes, tenures } from "@/content/client-facts";
import { LIB, photo } from "@/content/photos";
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
    getFeatured(5),
    getProperties(),
    getAreaCounts(),
  ]);

  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const railItems = featured.map((property) => ({
    property,
    plan: planForProperty(property),
  }));

  const signature = featured[0] ?? all[0];
  const signaturePlan = planForProperty(signature);
  const signaturePhoto = signature.gallery[0];
  const waLink = waHref(tw("templateGeneral", { area: office.city[locale] }), locale);

  return (
    <>
      <Hero locale={locale} unitCount={all.length} />

      {/* The one thing a buyer wants, immediately under the fold. */}
      <section className="relative z-10 mx-auto w-full max-w-[92rem] bg-navy px-4 pb-24 pt-16 sm:px-6 lg:px-10 lg:pb-32">
        <Reveal>
          <h2 className="label text-giza-dim">{t("searchTitle")}</h2>
          <p className="mt-2 mb-5 text-giza">{t("searchSub")}</p>
          <QuickSearch locale={locale} />
        </Reveal>
      </section>

      {/* Featured — pinned rail on desktop, swipe rail on a phone --------- */}
      <FeaturedRail items={railItems} />

      <div className="mx-auto w-full max-w-[92rem] px-4 pb-24 pt-12 sm:px-6 lg:px-10 lg:pb-32">
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
      </div>

      {/* How we list — three proofs, deliberately unnumbered. Three claims
          are not a sequence, so numbering them would be decoration. ------ */}
      <section className="on-sheet overflow-hidden">
        <div className="mx-auto w-full max-w-[92rem] px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
          <div className="grid gap-14 lg:grid-cols-[1fr_0.85fr] lg:items-start lg:gap-20">
            <div>
              <Reveal>
                <p className="label text-ink/55">{t("methodLabel")}</p>
              </Reveal>
              <RevealText
                as="h2"
                lines={[t("methodTitle")]}
                className="mt-3 text-d2"
                delay={0.05}
              />

              <RevealList as="ul" className="mt-12 border-t border-sheet-edge">
                {(["1", "2", "3"] as const).map((n) => (
                  <RevealItem as="li" key={n} className="border-b border-sheet-edge py-7">
                    <h3 className="text-d3">{t(`method${n}Title` as "method1Title")}</h3>
                    <p className="measure mt-3 text-ink/70">
                      {t(`method${n}Body` as "method1Body")}
                    </p>
                  </RevealItem>
                ))}
              </RevealList>
            </div>

            <Frame
              src={photo(LIB.living[3], 1400)}
              alt={
                locale === "ar"
                  ? "صالة وحدة معروضة، تصوير أثناء المعاينة"
                  : "A listed unit's reception, photographed at the viewing"
              }
              sizes="(max-width: 1024px) 92vw, 40vw"
              parallax={0.08}
              className="aspect-[4/5] w-full lg:sticky lg:top-28"
            />
          </div>
        </div>
      </section>

      {/* The five areas ------------------------------------------------- */}
      <section className="mx-auto w-full max-w-[92rem] px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
        <Reveal className="text-sheet">
          <p className="label text-survey">{t("areasLabel")}</p>
        </Reveal>
        <RevealText
          as="h2"
          lines={[t("areasTitle")]}
          className="mt-3 text-d2 text-sheet"
        />
        <div className="mt-14">
          <AreaShowcase counts={counts} />
        </div>
      </section>

      {/* THE SIGNATURE --------------------------------------------------- */}
      <section className="relative">
        <div className="mx-auto w-full max-w-[92rem] px-4 sm:px-6 lg:px-10">
          <Reveal className="text-sheet">
            <p className="label text-survey">{t("planLabel")}</p>
          </Reveal>
          <RevealText
            as="h2"
            lines={[t("planTitle")]}
            className="mt-3 max-w-3xl text-d2 text-sheet"
          />
          <Reveal delay={0.1}>
            <p className="measure mt-6 text-lead text-giza">{t("planBody")}</p>
          </Reveal>
        </div>

        {signaturePlan && signaturePhoto && (
          <PlanDissolve
            plan={signaturePlan}
            locale={locale}
            photoSrc={signaturePhoto.src}
            photoAlt={signaturePhoto.alt[locale]}
          />
        )}

        <div className="mx-auto w-full max-w-[92rem] px-4 pb-24 sm:px-6 lg:px-10 lg:pb-32">
          <Magnetic>
            <Link
              href={`/properties/${signature.slug}`}
              className="group label inline-flex items-center gap-2.5 border border-giza-dim/50 px-7 py-4 text-sheet transition-colors duration-300 hover:border-survey hover:text-survey"
            >
              {t("planCta")}
              <Arrow
                className="size-4 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </Link>
          </Magnetic>
        </div>
      </section>

      {/* Numbers. Only figures this site can actually prove. ------------- */}
      <section className="border-y border-navy-edge">
        <div className="mx-auto w-full max-w-[92rem] px-4 py-20 sm:px-6 lg:px-10 lg:py-24">
          <Reveal>
            <p className="label text-survey">{t("statsLabel")}</p>
            <h2 className="mt-3 text-d3 text-sheet">{t("statsTitle")}</h2>
          </Reveal>

          <RevealList className="mt-12 grid grid-cols-2 gap-px border-s border-t border-navy-edge lg:grid-cols-4">
            {[
              { value: areas.length, label: t("statAreas") },
              { value: all.length, label: t("statUnits") },
              { value: propertyTypes.length, label: t("statTypes") },
              { value: tenures.length, label: t("statTenure") },
            ].map((stat) => (
              <RevealItem
                key={stat.label}
                className="border-b border-e border-navy-edge px-5 py-8"
              >
                <p className="font-data text-[2.6rem] leading-none text-sheet lg:text-[3.4rem]">
                  <Counter to={stat.value} />
                </p>
                <p className="label mt-4 text-giza-dim">{stat.label}</p>
              </RevealItem>
            ))}
          </RevealList>

          <Reveal delay={0.1}>
            <p className="measure mt-8 text-[0.9rem] text-giza-dim">{t("statsNote")}</p>
          </Reveal>
        </div>
      </section>

      {/* Close ----------------------------------------------------------- */}
      <section className="relative overflow-hidden">
        <Frame
          src={photo(LIB.city[4], 2000)}
          alt=""
          sizes="100vw"
          parallax={0.12}
          className="absolute inset-0 -z-10"
        />
        <div className="absolute inset-0 -z-10 bg-navy/82" />

        <div className="mx-auto w-full max-w-[92rem] px-4 py-28 sm:px-6 lg:px-10 lg:py-36">
          <Reveal className="text-sheet">
            <p className="label text-survey">{t("closeLabel")}</p>
          </Reveal>
          <RevealText
            as="h2"
            lines={[t("closeTitle")]}
            className="mt-3 max-w-2xl text-d2 text-sheet"
          />
          <Reveal delay={0.1}>
            <p className="measure mt-6 text-lead text-giza">{t("closeBody")}</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Magnetic>
                <a
                  href={waLink}
                  target={waLink.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="label inline-flex items-center gap-2.5 bg-survey-deep px-8 py-4 text-sheet transition-colors duration-200 hover:bg-survey hover:text-navy"
                >
                  {locale === "ar" ? "واتساب" : "WhatsApp"}
                </a>
              </Magnetic>
              <Link
                href="/properties"
                className="label inline-flex items-center gap-2.5 border border-giza-dim/50 px-8 py-4 text-sheet transition-colors duration-300 hover:border-survey hover:text-survey"
              >
                {t("featuredAll")}
              </Link>
            </div>
          </Reveal>
        </div>

        {/* One marquee on the whole site. Three would be none. */}
        <div className="border-t border-navy-edge py-5">
          <Marquee speed={44}>
            {areas.map((area) => (
              <span key={area.slug} className="label flex items-center gap-10 text-giza-dim">
                {area.name[locale]}
                <span aria-hidden="true" className="block size-1 bg-survey" />
              </span>
            ))}
          </Marquee>
        </div>
      </section>
    </>
  );
}
