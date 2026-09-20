import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, ArrowRight, Camera, MapPin, MessageCircle } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { PlanScroll } from "@/components/plan/PlanScroll";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Gallery } from "@/components/property/Gallery";
import { UnitHero } from "@/components/property/UnitHero";
import { SpecTable } from "@/components/property/SpecTable";
import { StickyEnquiry } from "@/components/property/StickyEnquiry";
import { EnquiryForm } from "@/components/property/EnquiryForm";
import { InstallmentCalculator } from "@/components/property/InstallmentCalculator";
import { TitleBlock } from "@/components/ui/TitleBlock";
import { Reveal } from "@/components/ui/Reveal";
import { RevealText } from "@/components/motion/primitives";
import {
  getAllPropertySlugs,
  getPropertyBySlug,
  getRelated,
  planForProperty,
  planNetArea,
} from "@/lib/data";
import { areas, office } from "@/content/client-facts";
import { PHOTOS_ARE_PLACEHOLDERS } from "@/content/photos";
import { waHref } from "@/lib/contact";
import { formatNumber, formatPrice, pricePerMeter } from "@/lib/utils";
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
  const area = areas.find((a) => a.slug === property.location.area);
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
      description: `${area?.name[l]} · ${property.specs.builtUpArea} m²`,
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
  const tw = await getTranslations("whatsapp");
  const ta = await getTranslations("amenities");

  const related = await getRelated(property, 3);
  const area = areas.find((a) => a.slug === property.location.area);
  const plan = planForProperty(property);
  const cover = property.coverImage ?? property.gallery[0];
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const price = property.price.onRequest
    ? t("priceOnRequest")
    : formatPrice(property.price.amount!, locale, property.price.currency);
  const period =
    property.price.period === "month"
      ? t("perMonth")
      : property.price.period === "year"
        ? t("perYear")
        : null;

  const waLink = waHref(
    tw("template", { ref: property.refCode, title: property.title[locale] }),
    locale,
  );
  const external = waLink.startsWith("http");
  const isClosed = property.status === "sold" || property.status === "rented";

  return (
    <>
      {cover && (
        <UnitHero
          slug={property.slug}
          refCode={property.refCode}
          title={property.title[locale]}
          status={property.status}
          areaName={area?.name[locale] ?? ""}
          tenure={t(`tenure.${property.tenure}` as "tenure.tamleek")}
          coverSrc={cover.src}
          coverAlt={cover.alt[locale]}
        />
      )}

      {/* pb reserves room for the sticky bar so it never covers content */}
      <div className="pb-28 lg:pb-0">
        <div className="mx-auto w-full max-w-[92rem] px-4 sm:px-6 lg:px-10">
          <Link
            href="/properties"
            className="label mt-8 inline-flex items-center gap-2 text-giza-dim transition-colors duration-200 hover:text-survey"
          >
            <Arrow className="size-3.5 rotate-180" strokeWidth={1.75} aria-hidden="true" />
            {t("backToList")}
          </Link>

          {isClosed && (
            <p className="mt-6 max-w-xl border-s-2 border-sold ps-4 text-giza-dim">
              {t(`statusNote.${property.status}` as "statusNote.sold")}
            </p>
          )}
          {property.status === "reserved" && (
            <p className="mt-6 max-w-xl border-s-2 border-reserved ps-4 text-giza-dim">
              {t("statusNote.reserved")}
            </p>
          )}

          <div className="mt-10 grid gap-10 lg:grid-cols-[1.55fr_1fr] lg:gap-14">
            <div className="min-w-0">
              <Gallery images={property.gallery} />

              {PHOTOS_ARE_PLACEHOLDERS && (
                <p className="mt-4 flex items-start gap-2.5 border border-reserved/40 bg-reserved/5 px-4 py-3 text-[0.85rem] text-reserved">
                  <Camera className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  {t("placeholderPhotos")}
                </p>
              )}

              {property.highlights.length > 0 && (
                <ul className="mt-12 space-y-3">
                  {property.highlights.map((highlight) => (
                    <li key={highlight.en} className="flex gap-3 text-sheet">
                      <span aria-hidden="true" className="mt-2.5 block size-1 shrink-0 bg-survey" />
                      <span>{highlight[locale]}</span>
                    </li>
                  ))}
                </ul>
              )}

              <section className="mt-12">
                <h2 className="label text-giza-dim">{t("sectionDescription")}</h2>
                <p className="measure mt-4 whitespace-pre-line text-lead text-giza">
                  {property.description[locale]}
                </p>
              </section>
            </div>

            {/* Price rail. Sticky on desktop; the mobile equivalent is the
                bottom bar, so it is not duplicated here. */}
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="border border-navy-edge bg-navy-lift/70">
                <div className="border-b border-navy-edge px-6 py-6">
                  <p className="font-data text-[1.7rem] leading-none text-sheet tabular-nums" dir="ltr">
                    {price}
                  </p>
                  {period && <p className="mt-2 text-giza-dim">{period}</p>}

                  {!property.price.onRequest &&
                    property.price.amount &&
                    property.listingType === "sale" && (
                      <p className="mt-3 font-data text-data text-giza-dim tabular-nums" dir="ltr">
                        {pricePerMeter(property.price.amount, property.specs.builtUpArea, locale)} /m²
                      </p>
                    )}

                  {property.paymentPlan && (
                    <p className="mt-4 border-t border-navy-edge pt-4 text-giza">
                      {t("downPayment", { pct: property.paymentPlan.downPaymentPct })}{" "}
                      {t("overYears", { years: property.paymentPlan.years })}
                    </p>
                  )}
                </div>

                <div className="grid gap-px bg-navy-edge">
                  <a
                    href={waLink}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noreferrer" : undefined}
                    className="label flex min-h-14 items-center justify-center gap-2.5 bg-survey-deep px-6 text-sheet transition-colors duration-200 hover:bg-survey hover:text-navy"
                  >
                    <MessageCircle className="size-4" strokeWidth={1.75} aria-hidden="true" />
                    {t("whatsapp", { ref: property.refCode })}
                  </a>
                  <a
                    href="#enquire"
                    className="label flex min-h-14 items-center justify-center bg-navy px-6 text-sheet transition-colors duration-200 hover:text-survey"
                  >
                    {t("requestViewing")}
                  </a>
                </div>
              </div>

              <TitleBlock
                className="mt-6 text-giza"
                fields={[
                  { label: t("ref"), value: property.refCode, numeric: true },
                  {
                    label: t("builtUpArea"),
                    value: `${formatNumber(property.specs.builtUpArea, locale)} m²`,
                    numeric: true,
                  },
                  {
                    label: t("floor"),
                    value: property.specs.floor === "G" ? "GF" : (property.specs.floor ?? "—"),
                    numeric: true,
                  },
                  { label: t("orientation"), value: property.specs.orientation ?? "—", numeric: true },
                ]}
              />
            </aside>
          </div>

          <section className="mt-20 lg:mt-28">
            <Reveal>
              <h2 className="label text-giza-dim">{t("sectionSpecs")}</h2>
              <div className="mt-6">
                <SpecTable property={property} />
              </div>
            </Reveal>
          </section>
        </div>

        {/* THE PLAN ------------------------------------------------------- */}
        {plan && (
          <section className="mt-20 lg:mt-28">
            <div className="mx-auto w-full max-w-[92rem] px-4 sm:px-6 lg:px-10">
              <Reveal>
                <h2 className="label text-giza-dim">{t("sectionPlan")}</h2>
              </Reveal>
              <RevealText as="h3" lines={[plan.label[locale]]} className="mt-3 text-d3 text-sheet" />

              {/* Held to a readable width: a 14 m plan stretched across a
                  92rem page is a diagram nobody can take in at a glance. */}
              <div className="mx-auto mt-10 max-w-3xl text-survey">
                <PlanScroll plan={plan} locale={locale} />
              </div>

              <p className="measure mt-8 text-giza-dim">
                {t("planNetArea", {
                  value: planNetArea(plan).toFixed(1),
                  built: property.specs.builtUpArea,
                })}
              </p>
            </div>
          </section>
        )}

        <div className="mx-auto w-full max-w-[92rem] px-4 sm:px-6 lg:px-10">
          {property.amenities.length > 0 && (
            <section className="mt-20 lg:mt-28">
              <Reveal>
                <h2 className="label text-giza-dim">{t("sectionAmenities")}</h2>
                <ul className="mt-6 grid gap-x-8 gap-y-3 border-t border-navy-edge pt-5 sm:grid-cols-2 lg:grid-cols-3">
                  {property.amenities.map((amenity) => (
                    <li key={amenity} className="flex gap-3 text-sheet">
                      <span aria-hidden="true" className="mt-2.5 block size-1 shrink-0 bg-giza-dim" />
                      {ta(amenity as "elevator")}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </section>
          )}

          <section className="mt-20 lg:mt-28">
            <Reveal>
              <h2 className="label text-giza-dim">{t("sectionLocation")}</h2>
              <div className="mt-6 flex flex-wrap items-start gap-x-10 gap-y-4 border-t border-navy-edge pt-5">
                <p className="flex gap-3 text-sheet">
                  <MapPin className="mt-1 size-4 shrink-0 text-giza-dim" strokeWidth={1.5} aria-hidden="true" />
                  <span>
                    {property.location.street?.[locale] ?? area?.name[locale]}
                    <br />
                    <span className="text-giza-dim">
                      {area?.name[locale]}, {property.location.city[locale]}
                    </span>
                  </span>
                </p>
                {property.location.plotRef && (
                  <p className="font-data text-data text-giza tabular-nums" dir="ltr">
                    {t("plotRef", {
                      zone: property.location.plotRef.zone,
                      plot: property.location.plotRef.plot,
                    })}
                  </p>
                )}
              </div>
            </Reveal>
          </section>

          <section id="enquire" className="mt-20 scroll-mt-28 lg:mt-28">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <RevealText as="h2" lines={[t("sectionEnquire")]} className="text-d3 text-sheet" />
                <div className="mt-8">
                  <EnquiryForm refCode={property.refCode} title={property.title[locale]} />
                </div>
              </div>

              {!property.price.onRequest &&
                property.price.amount &&
                property.listingType === "sale" && (
                  <div className="lg:pt-14">
                    <InstallmentCalculator
                      price={property.price.amount}
                      currency={property.price.currency}
                      defaultDownPct={property.paymentPlan?.downPaymentPct ?? 20}
                      defaultYears={property.paymentPlan?.years ?? 5}
                    />
                  </div>
                )}
            </div>
          </section>

          {related.length > 0 && (
            <section className="mt-24 border-t border-navy-edge pt-16 lg:mt-32">
              <RevealText
                as="h2"
                lines={[t("sectionRelated", { area: area?.name[locale] ?? "" })]}
                className="text-d3 text-sheet"
              />
              <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <PropertyCard key={item._id} property={item} plan={planForProperty(item)} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <StickyEnquiry
        refCode={property.refCode}
        title={property.title[locale]}
        price={price}
        period={period}
      />

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
            datePosted: property.publishedAt
              ? new Date(property.publishedAt).toISOString()
              : undefined,
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
              numberOfRooms: property.specs.bedrooms,
              floorSize: {
                "@type": "QuantitativeValue",
                value: property.specs.builtUpArea,
                unitCode: "MTK",
              },
              address: {
                "@type": "PostalAddress",
                addressLocality: area?.name[locale],
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
