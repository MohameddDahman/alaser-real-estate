import { useLocale, useTranslations } from "next-intl";
import { Bath, BedDouble, Check, ChevronLeft, ChevronRight, Layers, MapPin, Ruler } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Photo } from "@/components/ui/Photo";
import { StatusBadge } from "./StatusBadge";
import type { Property } from "@/lib/data/types";
import type { Locale } from "@/i18n/routing";
import { listingMeta } from "@/lib/listing";
import { cn, formatNumber } from "@/lib/utils";

/**
 * The two ways a listing appears in a list.
 *
 * `PropertyCard` is the compact card for rails and grids; `PropertyRow` is the
 * wide result row of the search page, with the facts in the middle and the
 * price and the way in on the far side - the layout visitors already know how
 * to scan from every booking site.
 *
 * Both are one link: the title stretches over the whole card, so the card is
 * a single stop for a keyboard and a screen reader rather than five.
 */

const cardShell =
  "group relative overflow-hidden rounded-lg border border-line bg-canvas shadow-card transition-shadow duration-200 hover:shadow-raised has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-primary";

const stretched = "after:absolute after:inset-0 focus-visible:outline-none";

export function PropertyCard({
  property,
  priority = false,
  sizes = "(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 23rem",
  className,
}: {
  property: Property;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  const locale = useLocale() as Locale;
  const ts = useTranslations("search");
  const meta = listingMeta(property, locale);

  return (
    <article className={cn(cardShell, "flex flex-col", className)}>
      <div className={cn("relative aspect-[4/3] overflow-hidden bg-surface-2", meta.isClosed && "grayscale-[60%]")}>
        {meta.cover && (
          <Photo
            src={meta.cover.src}
            alt={meta.cover.alt[locale]}
            sizes={sizes}
            priority={priority}
            className="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        )}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <span className="rounded-md bg-white/95 px-2 py-1 text-xs font-semibold text-fg shadow-card">
            {property.listingType === "sale" ? ts("forSale") : ts("forRent")}
          </span>
          {property.status !== "available" && <StatusBadge status={property.status} className="shadow-card" />}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="flex items-baseline justify-between gap-2 text-xs font-medium text-fg-subtle">
          <span className="truncate">
            {meta.typeName} · {meta.areaName}
          </span>
          <span dir="ltr" className="shrink-0 tabular-nums">
            {property.refCode}
          </span>
        </p>
        <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-snug text-fg transition-colors group-hover:text-primary">
          <Link href={`/properties/${property.slug}`} className={stretched}>
            {property.title[locale]}
          </Link>
        </h3>

        <KeyFacts property={property} className="mt-3" />

        <div className="mt-auto pt-4">
          <Price property={property} />
        </div>
      </div>
    </article>
  );
}

export function PropertyRow({
  property,
  priority = false,
}: {
  property: Property;
  priority?: boolean;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("property");
  const ts = useTranslations("search");
  const tl = useTranslations("listings");
  const meta = listingMeta(property, locale);
  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;

  const street = property.location.street?.[locale];

  return (
    <article className={cn(cardShell, "grid grid-cols-[7rem_minmax(0,1fr)] gap-3 p-3 sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-4 sm:p-4 xl:grid-cols-[15.5rem_minmax(0,1fr)_12.5rem]")}>
      <div
        className={cn(
          "relative min-h-32 overflow-hidden rounded-md bg-surface-2 sm:min-h-[12.5rem]",
          meta.isClosed && "grayscale-[60%]",
        )}
      >
        {meta.cover && (
          <Photo
            src={meta.cover.src}
            alt={meta.cover.alt[locale]}
            sizes="(max-width: 640px) 7rem, 16rem"
            priority={priority}
            className="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        )}
        <span className="absolute start-1.5 top-1.5 rounded bg-white/95 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-fg shadow-card sm:start-2.5 sm:top-2.5 sm:rounded-md sm:px-2 sm:py-1 sm:text-xs">
          {property.listingType === "sale" ? ts("forSale") : ts("forRent")}
        </span>
      </div>

      <div className="min-w-0">
        <h3 className="text-base font-bold leading-snug text-primary sm:text-lg">
          <Link href={`/properties/${property.slug}`} className={cn(stretched, "group-hover:underline")}>
            {property.title[locale]}
          </Link>
        </h3>

        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-fg-muted">
          <MapPin className="size-3.5 shrink-0 text-fg-subtle" strokeWidth={2} aria-hidden="true" />
          <span className="font-medium text-fg">{meta.areaName}</span>
          {street && <span className="truncate">· {street}</span>}
        </p>

        <p className="mt-2 text-sm text-fg-muted sm:mt-3">
          <span className="font-medium text-fg">{meta.typeName}</span>
          {" · "}
          {meta.tenureName}
          {property.specs.finishing && (
            <>
              {" · "}
              {t(`finishingLevel.${property.specs.finishing}` as "finishingLevel.full")}
            </>
          )}
        </p>

        <KeyFacts property={property} withFloor className="mt-2" />

        {property.highlights.length > 0 && (
          <ul className="mt-3 hidden space-y-1 text-sm text-success sm:block">
            {property.highlights.slice(0, 2).map((highlight) => (
              <li key={highlight.en} className="flex gap-1.5">
                <Check className="mt-0.5 size-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
                <span className="font-medium">{highlight[locale]}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="col-span-2 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-3 xl:col-span-1 xl:flex-col xl:flex-nowrap xl:items-end xl:border-s xl:border-t-0 xl:ps-4 xl:pt-0 xl:text-end">
        <div className="flex flex-col gap-1 xl:items-end">
          {property.status !== "available" && <StatusBadge status={property.status} className="mb-1 self-start xl:self-end" />}
          <p className="text-xs text-fg-subtle">
            {property.listingType === "sale" ? t("askingPrice") : t("rentLabel")}
          </p>
          <Price property={property} large />
          {property.paymentPlan && (
            <p className="text-xs font-medium text-success">
              {t("downPayment", { pct: property.paymentPlan.downPaymentPct })}{" "}
              {t("overYears", { years: property.paymentPlan.years })}
            </p>
          )}
          <p className="text-xs text-fg-subtle tabular-nums xl:mt-1">
            <span dir="ltr">{property.refCode}</span>
          </p>
        </div>

        {/* Presentational: the title link already covers the whole card. */}
        <span aria-hidden="true" className="btn btn-primary btn-sm">
          {tl("seeDetails")}
          <Chevron className="size-4" strokeWidth={2} />
        </span>
      </div>
    </article>
  );
}

/** Bedrooms, bathrooms and built-up area - and the floor, where there is room. */
export function KeyFacts({
  property,
  withFloor = false,
  className,
}: {
  property: Property;
  withFloor?: boolean;
  className?: string;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("property");
  const { specs } = property;

  const floor =
    specs.floor === "G"
      ? t("groundFloor")
      : specs.floor && specs.totalFloors
        ? t("floorOf", { floor: specs.floor, total: specs.totalFloors })
        : specs.floor
          ? `${t("floor")} ${specs.floor}`
          : null;

  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-fg-muted", className)}>
      {specs.bedrooms > 0 && (
        <li className="flex items-center gap-1.5">
          <BedDouble className="size-4 shrink-0 text-fg-subtle" strokeWidth={1.75} aria-hidden="true" />
          {t("bedrooms", { count: specs.bedrooms })}
        </li>
      )}
      {/* A whole building, a shop or a plot has no count to give - "0 bathrooms" says nothing. */}
      {specs.bathrooms > 0 && (
        <li className="flex items-center gap-1.5">
          <Bath className="size-4 shrink-0 text-fg-subtle" strokeWidth={1.75} aria-hidden="true" />
          {t("bathrooms", { count: specs.bathrooms })}
        </li>
      )}
      <li className="flex items-center gap-1.5">
        <Ruler className="size-4 shrink-0 text-fg-subtle" strokeWidth={1.75} aria-hidden="true" />
        <span dir="ltr" className="tabular-nums">
          {formatNumber(specs.builtUpArea, locale)} m²
        </span>
      </li>
      {withFloor && floor && (
        <li className="flex items-center gap-1.5">
          <Layers className="size-4 shrink-0 text-fg-subtle" strokeWidth={1.75} aria-hidden="true" />
          {floor}
        </li>
      )}
    </ul>
  );
}

function Price({ property, large = false }: { property: Property; large?: boolean }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("property");
  const meta = listingMeta(property, locale);

  if (!meta.price) {
    return <p className={cn("font-bold text-fg", large ? "text-lg" : "text-base")}>{t("priceOnRequest")}</p>;
  }

  return (
    <div>
      <p className={cn("whitespace-nowrap font-bold leading-tight text-fg tabular-nums", large ? "text-xl" : "text-lg")}>
        {meta.price}
      </p>
      {meta.period ? (
        <p className="text-xs text-fg-subtle">{meta.period === "month" ? t("perMonth") : t("perYear")}</p>
      ) : meta.perMeter ? (
        <p className="text-xs text-fg-subtle">
          {t("pricePerMeter", { value: meta.perMeter })}
        </p>
      ) : null}
    </div>
  );
}
