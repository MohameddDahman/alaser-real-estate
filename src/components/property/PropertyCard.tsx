"use client";

import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Frame } from "@/components/motion/Frame";
import { PlanPlate } from "@/components/plan/PlanPlate";
import { StatusBadge } from "./StatusBadge";
import type { FloorPlan, Property } from "@/lib/data/types";
import { areas } from "@/content/client-facts";
import { cn, formatPrice, pricePerMeter } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

/**
 * Listing card.
 *
 * The photograph sits in a fixed mask and drifts slightly against it on
 * scroll; on hover it scales inside that mask while the unit's own floor plan
 * fades in over it in survey ink. That plan overlay is the card's signature -
 * it is the thing no other agency's card does, and it tells the buyer
 * something real about the unit before they have clicked.
 *
 * Touch never fires hover, so phones get a pressed state and keep the price
 * visible instead. A dead card on mobile is not acceptable when mobile is the
 * primary target.
 */
export function PropertyCard({
  property,
  plan,
  priority = false,
  className,
  sizes,
}: {
  property: Property;
  plan: FloorPlan | null;
  priority?: boolean;
  className?: string;
  sizes?: string;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("property");
  const tc = useTranslations("common");

  const area = areas.find((a) => a.slug === property.location.area);
  const cover = property.coverImage ?? property.gallery[0];
  const isClosed = property.status === "sold" || property.status === "rented";

  const price = property.price.onRequest
    ? t("priceOnRequest")
    : formatPrice(property.price.amount!, locale, property.price.currency);
  const period =
    property.price.period === "month"
      ? t("perMonth")
      : property.price.period === "year"
        ? t("perYear")
        : null;

  const perMeter =
    !property.price.onRequest && property.price.amount && property.listingType === "sale"
      ? pricePerMeter(property.price.amount, property.specs.builtUpArea, locale)
      : null;

  return (
    <article className={cn("group/card", className)}>
      <Link
        href={`/properties/${property.slug}`}
        className="block focus-visible:outline-offset-4"
      >
        <div
          className={cn(
            "relative aspect-[4/3] overflow-hidden border border-navy-edge bg-navy-lift",
            isClosed && "opacity-75 saturate-50",
          )}
        >
          {cover && (
            <Frame
              src={cover.src}
              alt={cover.alt[locale]}
              priority={priority}
              sizes={sizes ?? "(max-width: 640px) 92vw, (max-width: 1024px) 48vw, 32vw"}
              parallax={0.05}
              className="absolute inset-0"
              imageClassName="transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:scale-[1.07] group-active/card:scale-[1.03]"
            />
          )}

          {/* The plan, over its own photograph, on hover. */}
          {plan && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center justify-center bg-navy/70 p-7 text-survey opacity-0 transition-opacity duration-500 group-hover/card:opacity-100 motion-reduce:hidden"
            >
              <PlanPlate plan={plan} />
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
            <StatusBadge status={property.status} />
            <span
              className="label bg-navy/60 px-2.5 py-1.5 text-giza"
              dir="ltr"
            >
              {property.refCode}
            </span>
          </div>
        </div>

        <div className="pt-4">
          <p className="label text-giza-dim">
            {area?.name[locale]} · {t(`tenure.${property.tenure}` as "tenure.tamleek")}
          </p>

          <h3 className="mt-2 text-d3 text-sheet transition-colors duration-300 group-hover/card:text-survey">
            {property.title[locale]}
          </h3>

          <p className="mt-2 text-giza-dim">
            {t("bedrooms", { count: property.specs.bedrooms })} ·{" "}
            <span className="font-data tabular-nums" dir="ltr">
              {property.specs.builtUpArea}
            </span>{" "}
            {tc("sqm")}
          </p>

          <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-navy-edge pt-3">
            <p className="font-data text-[0.95rem] text-sheet tabular-nums">
              <span dir="ltr">{price}</span>
              {period && <span className="ms-1.5 text-giza-dim">{period}</span>}
            </p>
            {perMeter && (
              <p className="font-data text-data text-giza-dim tabular-nums" dir="ltr">
                {perMeter} /m²
              </p>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
