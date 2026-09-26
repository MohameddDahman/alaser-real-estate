import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  Check,
  Coffee,
  Crown,
  Footprints,
  House,
  LandPlot,
  Layers,
  ListChecks,
  MessageCircle,
  Phone,
  Receipt,
  Sofa,
  Store,
  type LucideIcon,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Logo } from "@/components/brand/Mark";
import { HomeSearch } from "@/components/home/HomeSearch";
import { PropertyCard } from "@/components/property/PropertyCard";
import { RefCodeSearch } from "@/components/property/RefCodeSearch";
import { Photo } from "@/components/ui/Photo";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getAreaCounts, getFeatured, getTypeCounts } from "@/lib/data";
import { areas, contact, office, propertyTypes, type PropertyTypeSlug } from "@/content/client-facts";
import { AREA_PHOTOS, LIB, photo } from "@/content/photos";
import { hasVerifiedContact, telHref, waHref } from "@/lib/contact";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<PropertyTypeSlug, LucideIcon> = {
  apartment: Building2,
  villa: House,
  duplex: Layers,
  penthouse: Crown,
  studio: Sofa,
  shop: Store,
  cafe: Coffee,
  office: Briefcase,
  land: LandPlot,
};

const WHY = [
  { key: "1", icon: Footprints },
  { key: "2", icon: ListChecks },
  { key: "3", icon: Receipt },
] as const;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const tp = await getTranslations("property");
  const tw = await getTranslations("whatsapp");
  const [featured, areaCounts, typeCounts] = await Promise.all([
    getFeatured(4),
    getAreaCounts(),
    getTypeCounts(),
  ]);

  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const waLink = waHref(tw("templateGeneral", { area: office.city[locale] }), locale);
  const external = waLink.startsWith("http");
  const types = propertyTypes.filter((type) => typeCounts[type.slug] > 0);

  return (
    <>
      {/* Hero: the brand navy runs on from the header, and the search box
          sits across its lower edge. ----------------------------------- */}
      <section className="relative">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 bottom-9 bg-navy" />
        <div className="shell relative pt-6 sm:pt-10">
          <Logo locale={locale} className="text-white" />
          <h1 className="mt-6 max-w-3xl text-display font-bold text-white sm:mt-8">{t("heroTitle")}</h1>
          <p className="mt-3 max-w-2xl text-white/80 sm:text-lg">{t("heroSub")}</p>
          <HomeSearch locale={locale} className="mt-7 sm:mt-9" />
        </div>
      </section>

      <div className="shell mt-6">
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-muted">
          {(["trust1", "trust2", "trust3"] as const).map((key) => (
            <li key={key} className="flex items-center gap-2">
              <Check className="size-4 shrink-0 text-success" strokeWidth={2.5} aria-hidden="true" />
              {t(key)}
            </li>
          ))}
        </ul>
      </div>

      {/* Browse by area ------------------------------------------------- */}
      <section className="shell mt-14 lg:mt-16" aria-labelledby="areas-title">
        <SectionHeader id="areas-title" title={t("areasTitle")} sub={t("areasSub")} />
        {/* Two large and three small, like a destinations board. */}
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
          {areas.map((area, i) => (
            <li
              key={area.slug}
              className={cn(
                i === 0 && "col-span-2 lg:col-span-3",
                i === 1 && "lg:col-span-3",
                i > 1 && "lg:col-span-2",
              )}
            >
              <Link
                href={{ pathname: "/properties", query: { area: area.slug } }}
                className={cn(
                  "group relative block overflow-hidden rounded-lg bg-surface-2",
                  i === 0 ? "h-48 sm:h-60 lg:h-64" : i === 1 ? "h-40 sm:h-60 lg:h-64" : "h-40 sm:h-52",
                )}
              >
                <Photo
                  src={photo(AREA_PHOTOS[area.slug], 1400)}
                  alt=""
                  sizes={i < 2 ? "(max-width: 1024px) 92vw, 36rem" : "(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 24rem"}
                  className="transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                />
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/15 to-transparent" />
                <span className="absolute inset-x-3 top-3 text-white sm:inset-x-4 sm:top-4">
                  <span className="block text-lg font-bold leading-snug drop-shadow-sm sm:text-2xl">{area.name[locale]}</span>
                  <span className="mt-0.5 block text-sm font-medium text-white/90">
                    {t("count", { count: areaCounts[area.slug] })}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Browse by type ------------------------------------------------- */}
      <section className="shell mt-14 lg:mt-16" aria-labelledby="types-title">
        <SectionHeader id="types-title" title={t("typesTitle")} sub={t("typesSub")} />
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {types.map((type) => {
            const Icon = TYPE_ICONS[type.slug];
            return (
              <li key={type.slug}>
                <Link
                  href={{ pathname: "/properties", query: { type: type.slug } }}
                  className="group flex h-full items-center gap-3 rounded-lg border border-line bg-canvas p-3.5 transition-[border-color,box-shadow] hover:border-primary hover:shadow-card sm:p-4"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-fg group-hover:text-primary">{type.name[locale]}</span>
                    <span className="block text-sm text-fg-subtle">{t("count", { count: typeCounts[type.slug] })}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Featured ------------------------------------------------------- */}
      {featured.length > 0 && (
        <section className="shell mt-14 lg:mt-16" aria-labelledby="featured-title">
          <SectionHeader
            id="featured-title"
            title={t("featuredTitle")}
            sub={t("featuredSub")}
            action={
              <Link href="/properties" className="link inline-flex items-center gap-1.5">
                {t("featuredAll")}
                <Arrow className="size-4" strokeWidth={2} aria-hidden="true" />
              </Link>
            }
          />
          {/* A swipeable rail on a phone, a row of four on a desk. */}
          <ul className="no-scrollbar -mx-4 mt-5 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
            {featured.map((property, i) => (
              <li key={property._id} className="flex w-[80%] max-w-80 shrink-0 snap-start sm:w-auto sm:max-w-none">
                <PropertyCard property={property} priority={i < 2} className="w-full" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Why us --------------------------------------------------------- */}
      <section className="mt-16 bg-surface py-14 lg:mt-20 lg:py-16" aria-labelledby="why-title">
        <div className="shell">
          <SectionHeader id="why-title" title={t("whyTitle")} sub={t("methodTitle")} />
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {WHY.map(({ key, icon: Icon }) => (
              <li key={key} className="rounded-lg border border-line bg-canvas p-6 shadow-card">
                <span className="flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-fg">
                  {t(`method${key}Title` as "method1Title")}
                </h3>
                <p className="mt-2 text-sm text-fg-muted">{t(`method${key}Body` as "method1Body")}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The portfolio -------------------------------------------------- */}
      <section className="shell mt-14 lg:mt-16" aria-labelledby="portfolio-title">
        <div className="grid overflow-hidden rounded-xl bg-navy text-white md:grid-cols-[1.1fr_1fr]">
          <div className="on-navy flex flex-col justify-center p-7 sm:p-10">
            <p className="flex items-center gap-2 text-sm font-semibold text-gold">
              <BookOpen className="size-4" strokeWidth={2} aria-hidden="true" />
              {t("portfolioLabel")}
            </p>
            <h2 id="portfolio-title" className="mt-3 text-heading font-bold">
              {t("portfolioTitle")}
            </h2>
            <p className="mt-3 max-w-lg text-white/80">{t("portfolioBody")}</p>
            <div className="mt-6">
              <Link href="/portfolio" className="btn bg-white text-navy hover:bg-white/90">
                {t("portfolioCta")}
                <Arrow className="size-4" strokeWidth={2} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="relative min-h-60 md:min-h-full">
            <Photo
              src={photo(LIB.living[3], 1400)}
              alt={
                locale === "ar"
                  ? "صالة وحدة معروضة، تصوير أثناء المعاينة"
                  : "A listed unit's reception, photographed at the viewing"
              }
              sizes="(max-width: 768px) 92vw, 34rem"
            />
          </div>
        </div>
      </section>

      {/* Ask ------------------------------------------------------------ */}
      <section className="shell mb-16 mt-14 lg:mb-20 lg:mt-16" aria-labelledby="ask-title">
        <div className="grid gap-8 rounded-xl border border-line p-6 shadow-card sm:p-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <h2 id="ask-title" className="text-heading font-bold text-fg">
              {t("closeTitle")}
            </h2>
            <p className="mt-2 max-w-xl text-fg-muted">{t("closeBody")}</p>
            <RefCodeSearch className="mt-5" />
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <a
              href={waLink}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
              className="btn btn-whatsapp btn-lg"
            >
              <MessageCircle className="size-5" strokeWidth={2} aria-hidden="true" />
              {tp("whatsappShort")}
            </a>
            {hasVerifiedContact && (
              <a href={telHref(locale)} className="btn btn-quiet btn-lg">
                <Phone className="size-5" strokeWidth={2} aria-hidden="true" />
                <span dir="ltr" className="tabular-nums">
                  {contact.phone}
                </span>
              </a>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
