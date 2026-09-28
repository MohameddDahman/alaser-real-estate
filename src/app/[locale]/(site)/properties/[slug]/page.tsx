import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Bath,
  BedDouble,
  CalendarClock,
  Camera,
  Check,
  Compass,
  Layers,
  MapPin,
  MessageCircle,
  PaintRoller,
  Phone,
  Ruler,
  type LucideIcon,
} from "lucide-react";

import { routing, type Locale } from "@/i18n/routing";
import { PlanScroll } from "@/components/plan/PlanScroll";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Gallery } from "@/components/property/Gallery";
import { SpecTable } from "@/components/property/SpecTable";
import { StatusBadge } from "@/components/property/StatusBadge";
import { StickyEnquiry } from "@/components/property/StickyEnquiry";
import { EnquiryForm } from "@/components/property/EnquiryForm";
import { InstallmentCalculator } from "@/components/property/InstallmentCalculator";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Mark } from "@/components/brand/Mark";
import {
  getAllPropertySlugs,
  getPropertyBySlug,
  getRelated,
  planForProperty,
  planNetArea,
} from "@/lib/data";
import { brand, office } from "@/content/client-facts";
import { PHOTOS_ARE_PLACEHOLDERS } from "@/content/photos";
import { hasVerifiedContact, telHref, waHref } from "@/lib/contact";
import { getBusinessDetails } from "@/lib/data/site-settings";
import { listingMeta } from "@/lib/listing";
import { formatNumber } from "@/lib/utils";
import { SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const slugs = await getAllPropertySlugs();
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return {};

  const l = locale as Locale;
  const meta = listingMeta(property, l);
  const title = `${property.title[l]} — ${property.refCode}`;

  return {
    title,
    description: property.description[l].slice(0, 155),
    alternates: {
      canonical: `/${locale}/properties/${slug}`,
      languages: { en: `/en/properties/${slug}`, ar: `/ar/properties/${slug}` },
    },
    openGraph: {
      title,
      description: `${meta.areaName} · ${property.specs.builtUpArea} m²`,
      type: "article",
    },
  };
}

export default async function PropertyPage({ params }: Props) {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);

  const property = await getPropertyBySlug(slug);
  if (!property) notFound();

  const t = await getTranslations("property");
  const tl = await getTranslations("listings");
  const tn = await getTranslations("nav");
  const ts = await getTranslations("search");
  const tw = await getTranslations("whatsapp");
  const ta = await getTranslations("amenities");

  const related = await getRelated(property, 4);
  const meta = listingMeta(property, locale);
  const plan = planForProperty(property);
  const { specs } = property;

  const price = meta.price ?? t("priceOnRequest");
  const period = meta.period === "month" ? t("perMonth") : meta.period === "year" ? t("perYear") : null;

  const details = await getBusinessDetails();
  const waLink = waHref(details, tw("template", { ref: property.refCode, title: property.title[locale] }), locale);
  const external = waLink.startsWith("http");
  const street = property.location.street?.[locale];

  const floor =
    specs.floor === "G"
      ? t("groundFloor")
      : specs.floor && specs.totalFloors
        ? t("floorOf", { floor: specs.floor, total: specs.totalFloors })
        : specs.floor
          ? `${t("floor")} ${specs.floor}`
          : null;

  // The facts a buyer asks first, each with its own tile.
  const facts: Array<{ icon: LucideIcon; label: string; value: string }> = [
    ...(specs.bedrooms > 0
      ? [{ icon: BedDouble, label: t("bedroomsLabel"), value: formatNumber(specs.bedrooms, locale) }]
      : []),
    { icon: Bath, label: t("bathroomsLabel"), value: formatNumber(specs.bathrooms, locale) },
    { icon: Ruler, label: t("builtUpArea"), value: `${formatNumber(specs.builtUpArea, locale)} m²` },
    ...(floor ? [{ icon: Layers, label: t("floor"), value: floor }] : []),
    ...(specs.finishing
      ? [
          {
            icon: PaintRoller,
            label: t("finishing"),
            value: t(`finishingLevel.${specs.finishing}` as "finishingLevel.full"),
          },
        ]
      : []),
    ...(specs.orientation
      ? [
          {
            icon: Compass,
            label: t("orientation"),
            value: t(`orientationName.${specs.orientation}` as "orientationName.N"),
          },
        ]
      : []),
  ];

  const tabs = [
    { id: "overview", label: t("tabOverview") },
    { id: "details", label: t("tabDetails") },
    ...(plan ? [{ id: "plan", label: t("tabPlan") }] : []),
    ...(property.amenities.length ? [{ id: "facilities", label: t("tabFacilities") }] : []),
    { id: "location", label: t("tabLocation") },
    { id: "enquire", label: t("tabEnquire") },
  ];

  const canCalculate = !property.price.onRequest && Boolean(property.price.amount) && property.listingType === "sale";

  return (
    <>
      {/* pb reserves room for the phone's sticky bar so it never covers content */}
      <div className="shell pb-28 pt-5 lg:pb-20">
        <Breadcrumbs
          rtl={locale === "ar"}
          items={[
            { label: tn("home"), href: "/" },
            { label: tl("title"), href: "/properties" },
            { label: meta.areaName, href: `/properties?area=${property.location.area}` },
            { label: property.refCode },
          ]}
        />

        {/* Title row ---------------------------------------------------- */}
        <div className="mt-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="min-w-0 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-primary-soft px-2 py-1 text-xs font-semibold text-primary">
                {meta.typeName}
              </span>
              <span className="rounded-md bg-surface-2 px-2 py-1 text-xs font-semibold text-fg-muted">
                {property.listingType === "sale" ? ts("forSale") : ts("forRent")} · {meta.tenureName}
              </span>
              <StatusBadge status={property.status} />
            </div>
            <h1 className="mt-2.5 text-title font-bold text-fg">{property.title[locale]}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-sm text-fg-muted">
              <MapPin className="size-4 shrink-0 text-primary" strokeWidth={2} aria-hidden="true" />
              {street && <span>{street},</span>}
              <span>
                {meta.areaName}, {property.location.city[locale]}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {t("ref")} <span dir="ltr">{property.refCode}</span>
              </span>
            </p>
          </div>

          <div className="lg:text-end">
            <p className="text-2xl font-bold text-fg tabular-nums">
              {price}
              {period && <span className="text-base font-normal text-fg-muted"> {period}</span>}
            </p>
            {meta.perMeter && (
              <p className="text-sm text-fg-subtle">{t("pricePerMeter", { value: meta.perMeter })}</p>
            )}
          </div>
        </div>

        {(meta.isClosed || property.status === "reserved") && (
          <p
            className={
              property.status === "reserved"
                ? "mt-4 rounded-md border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning"
                : "mt-4 rounded-md border border-line bg-surface px-4 py-3 text-sm text-fg-muted"
            }
          >
            {t(`statusNote.${property.status}` as "statusNote.sold")}
          </p>
        )}

        {/* Photographs -------------------------------------------------- */}
        <div className="mt-5">
          <Gallery images={property.gallery} />
          {PHOTOS_ARE_PLACEHOLDERS && (
            <p className="mt-2 flex items-start gap-2 text-xs text-fg-subtle">
              <Camera className="mt-px size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
              {t("placeholderPhotos")}
            </p>
          )}
        </div>

        {/* In-page tabs -------------------------------------------------- */}
        <nav
          aria-label={t("tabsLabel")}
          className="sticky top-0 z-30 -mx-4 mt-6 border-b border-line bg-canvas/95 px-4 backdrop-blur sm:mx-0 sm:px-0"
        >
          <ul className="no-scrollbar flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <li key={tab.id} className="shrink-0">
                <a
                  href={`#${tab.id}`}
                  className="inline-flex h-12 items-center border-b-2 border-transparent px-3 text-sm font-medium text-fg-muted transition-colors hover:border-primary hover:text-primary"
                >
                  {tab.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
          <div className="min-w-0 space-y-12">
            {/* Overview ------------------------------------------------ */}
            <section id="overview" className="scroll-mt-16" aria-labelledby="overview-title">
              <h2 id="overview-title" className="text-heading font-bold text-fg">
                {t("sectionDescription")}
              </h2>
              <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {facts.map(({ icon: Icon, label, value }) => (
                  <li key={label} className="flex items-center gap-3 rounded-lg border border-line p-3">
                    <Icon className="size-5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block text-xs text-fg-subtle">{label}</span>
                      <span className="block truncate text-sm font-semibold text-fg">{value}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 max-w-3xl whitespace-pre-line leading-relaxed text-fg">
                {property.description[locale]}
              </p>
            </section>

            {/* Details ------------------------------------------------- */}
            <section id="details" className="scroll-mt-16" aria-labelledby="details-title">
              <h2 id="details-title" className="text-heading font-bold text-fg">
                {t("sectionSpecs")}
              </h2>
              <div className="mt-3">
                <SpecTable property={property} />
              </div>
            </section>

            {/* Plan ---------------------------------------------------- */}
            {plan && (
              <section id="plan" className="scroll-mt-16" aria-labelledby="plan-title">
                <h2 id="plan-title" className="text-heading font-bold text-fg">
                  {t("sectionPlan")}
                </h2>
                <p className="mt-1 text-sm text-fg-muted">{plan.label[locale]}</p>
                <div className="mt-4 rounded-lg border border-line bg-surface p-4 sm:p-8">
                  {/* Held to a readable width: a plan stretched edge to edge is a
                      diagram nobody can take in at a glance. */}
                  <div className="mx-auto max-w-2xl text-navy">
                    <PlanScroll plan={plan} locale={locale} />
                  </div>
                </div>
                <p className="mt-3 text-sm text-fg-muted">
                  {t("planNetArea", {
                    value: planNetArea(plan).toFixed(1),
                    built: specs.builtUpArea,
                  })}
                </p>
              </section>
            )}

            {/* Facilities ---------------------------------------------- */}
            {property.amenities.length > 0 && (
              <section id="facilities" className="scroll-mt-16" aria-labelledby="facilities-title">
                <h2 id="facilities-title" className="text-heading font-bold text-fg">
                  {t("sectionAmenities")}
                </h2>
                <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                  {property.amenities.map((amenity) => (
                    <li key={amenity} className="flex items-center gap-2.5 text-fg">
                      <Check className="size-4 shrink-0 text-success" strokeWidth={2.5} aria-hidden="true" />
                      {ta(amenity as "elevator")}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Location ------------------------------------------------ */}
            <section id="location" className="scroll-mt-16" aria-labelledby="location-title">
              <h2 id="location-title" className="text-heading font-bold text-fg">
                {t("sectionLocation")}
              </h2>
              <div className="mt-4 flex flex-wrap items-start gap-x-10 gap-y-3 rounded-lg border border-line p-5">
                <p className="flex gap-3">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
                  <span>
                    <span className="block font-semibold text-fg">{street ?? meta.areaName}</span>
                    <span className="block text-sm text-fg-muted">
                      {meta.areaName}, {property.location.city[locale]}
                    </span>
                  </span>
                </p>
                {property.location.plotRef && (
                  <p className="text-sm text-fg-muted">
                    <span className="block text-xs text-fg-subtle">{t("plotRefLabel")}</span>
                    <span className="font-semibold text-fg">
                      {t("plotRef", {
                        zone: property.location.plotRef.zone,
                        plot: property.location.plotRef.plot,
                      })}
                    </span>
                  </p>
                )}
              </div>
            </section>

            {/* Enquire ------------------------------------------------- */}
            <section id="enquire" className="scroll-mt-16" aria-labelledby="enquire-title">
              <h2 id="enquire-title" className="text-heading font-bold text-fg">
                {t("sectionEnquire")}
              </h2>
              <p className="mt-1 text-fg-muted">{t("enquiryIntro")}</p>
              <div className={canCalculate ? "mt-5 grid gap-6 xl:grid-cols-2" : "mt-5 max-w-xl"}>
                <div className="rounded-lg border border-line p-5 sm:p-6">
                  <EnquiryForm refCode={property.refCode} title={property.title[locale]} />
                </div>
                {canCalculate && (
                  <InstallmentCalculator
                    price={property.price.amount!}
                    currency={property.price.currency}
                    defaultDownPct={property.paymentPlan?.downPaymentPct ?? 20}
                    defaultYears={property.paymentPlan?.years ?? 5}
                  />
                )}
              </div>
            </section>
          </div>

          {/* The price box. Sticky on a desk; the phone has its own bar. */}
          <aside className="space-y-4 lg:sticky lg:top-16 lg:self-start">
            <div className="rounded-lg border border-line bg-canvas p-5 shadow-raised">
              <p className="text-sm text-fg-muted">
                {property.listingType === "sale" ? t("askingPrice") : t("rentLabel")}
              </p>
              <p className="mt-0.5 text-2xl font-bold text-fg tabular-nums">
                {price}
                {period && <span className="text-base font-normal text-fg-muted"> {period}</span>}
              </p>
              {meta.perMeter && (
                <p className="text-sm text-fg-subtle">{t("pricePerMeter", { value: meta.perMeter })}</p>
              )}
              {property.paymentPlan && (
                <p className="mt-3 flex items-center gap-2 rounded-md bg-success-soft px-3 py-2 text-sm font-medium text-success">
                  <Check className="size-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                  {t("downPayment", { pct: property.paymentPlan.downPaymentPct })}{" "}
                  {t("overYears", { years: property.paymentPlan.years })}
                </p>
              )}

              <div className="mt-5 grid gap-2">
                <a
                  href={waLink}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noreferrer" : undefined}
                  className="btn btn-whatsapp btn-lg w-full"
                >
                  <MessageCircle className="size-5" strokeWidth={2} aria-hidden="true" />
                  {t("whatsapp", { ref: property.refCode })}
                </a>
                <a href="#enquire" className="btn btn-outline btn-lg w-full">
                  <CalendarClock className="size-5" strokeWidth={1.75} aria-hidden="true" />
                  {t("requestViewing")}
                </a>
                {hasVerifiedContact && (
                  <a href={telHref(details, locale)} className="btn btn-quiet w-full">
                    <Phone className="size-4" strokeWidth={2} aria-hidden="true" />
                    {t("call")} <span dir="ltr" className="tabular-nums">{details.phone}</span>
                  </a>
                )}
              </div>
            </div>

            {property.highlights.length > 0 && (
              <div className="rounded-lg border border-line bg-surface p-5">
                <h2 className="font-bold text-fg">{t("highlightsTitle")}</h2>
                <ul className="mt-3 space-y-2.5">
                  {property.highlights.map((highlight) => (
                    <li key={highlight.en} className="flex gap-2.5 text-sm text-fg">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2.5} aria-hidden="true" />
                      {highlight[locale]}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3 rounded-lg border border-line p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-navy text-white">
                <Mark className="h-4 w-auto" />
              </span>
              <div className="min-w-0 text-sm">
                <p className="text-xs text-fg-subtle">{t("listedBy")}</p>
                <p className="font-semibold text-fg">{brand.legalName[locale]}</p>
                <p className="mt-1 text-fg-muted">{details.address[locale]}</p>
                <p className="mt-1 text-fg-muted">{t("agentReply")}</p>
              </div>
            </div>
          </aside>
        </div>

        {/* Similar ------------------------------------------------------- */}
        {related.length > 0 && (
          <section className="mt-16 border-t border-line pt-10" aria-labelledby="related-title">
            <h2 id="related-title" className="text-heading font-bold text-fg">
              {t("sectionRelated", { area: meta.areaName })}
            </h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <li key={item._id} className="flex">
                  <PropertyCard property={item} className="w-full" />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <StickyEnquiry refCode={property.refCode} title={property.title[locale]} price={price} period={period} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            name: property.title[locale],
            description: property.description[locale],
            url: `${SITE_URL}/${locale}/properties/${property.slug}`,
            image: property.gallery.slice(0, 5).map((g) => g.src),
            datePosted: property.publishedAt ? new Date(property.publishedAt).toISOString() : undefined,
            identifier: property.refCode,
            ...(property.price.onRequest
              ? {}
              : {
                  offers: {
                    "@type": "Offer",
                    price: property.price.amount,
                    priceCurrency: property.price.currency,
                    availability:
                      property.status === "available"
                        ? "https://schema.org/InStock"
                        : "https://schema.org/SoldOut",
                  },
                }),
            about: {
              "@type": "Residence",
              name: property.title[locale],
              numberOfRooms: specs.bedrooms,
              floorSize: {
                "@type": "QuantitativeValue",
                value: specs.builtUpArea,
                unitCode: "MTK",
              },
              address: {
                "@type": "PostalAddress",
                addressLocality: meta.areaName,
                addressRegion: office.city[locale],
                addressCountry: "EG",
              },
            },
          }),
        }}
      />
    </>
  );
}
