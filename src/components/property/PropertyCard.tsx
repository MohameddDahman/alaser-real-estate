import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { PlanPlate } from "@/components/plan/PlanPlate";
import { StatusBadge } from "./StatusBadge";
import { planForProperty } from "@/lib/data";
import type { Property } from "@/lib/data/types";
import { areas } from "@/content/client-facts";
import { cn, formatPrice, pricePerMeter } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

/**
 * Listing card.
 *
 * Hover is CSS-only so this stays a server component with zero client JS: the
 * plate scales inside a fixed mask, and the price crossfades to "View unit".
 * Touch never fires hover, so it keeps the price and gets a pressed state
 * instead — a dead card on mobile is not acceptable when mobile is the primary
 * target.
 */
export async function PropertyCard({
  property,
  priority = false,
  className,
}: {
  property: Property;
  priority?: boolean;
  className?: string;
}) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("property");
  const tc = await getTranslations("common");

  const area = areas.find((a) => a.slug === property.location.area);
  const plan = planForProperty(property);
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
        {/* Fixed mask. Whatever fills it — plan today, photograph tomorrow —
            occupies exactly this box, so nothing shifts when photos land. */}
        <div
          className={cn(
            "relative aspect-[4/3] overflow-hidden border border-navy-edge bg-navy-lift",
            isClosed && "opacity-70",
          )}
        >
          <div className="absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:scale-[1.04] group-active/card:scale-[1.02]">
            {cover ? (
              <Image
                src={cover.src}
                alt={cover.alt[locale]}
                fill
                priority={priority}
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
                placeholder={cover.blurDataURL ? "blur" : undefined}
                blurDataURL={cover.blurDataURL}
                className="rounded-[--radius-photo] object-cover"
              />
            ) : plan ? (
              <div className="absolute inset-0 p-5 text-survey/80 sm:p-6">
                <PlanPlate plan={plan} />
              </div>
            ) : null}
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
            <StatusBadge status={property.status} />
            <span className="label bg-navy/70 px-2 py-1 text-giza backdrop-blur-[2px]" dir="ltr">
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

          {/* Price crossfades to the action on pointer devices. */}
          <div className="relative mt-4 grid border-t border-navy-edge pt-3">
            <p className="col-start-1 row-start-1 font-data text-[0.95rem] text-sheet tabular-nums transition-opacity duration-300 group-hover/card:opacity-0 motion-reduce:group-hover/card:opacity-100">
              <span dir="ltr">{price}</span>
              {period && <span className="ms-1.5 text-giza-dim">{period}</span>}
            </p>
            <p
              aria-hidden="true"
              className="label col-start-1 row-start-1 self-center text-survey opacity-0 transition-opacity duration-300 group-hover/card:opacity-100 motion-reduce:hidden"
            >
              {tc("viewUnit")}
            </p>
          </div>

          {/* Price per metre — the figure buyers here actually compare on. */}
          {perMeter && (
            <p className="mt-1 font-data text-data text-giza-dim tabular-nums" dir="ltr">
              {perMeter} /m²
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
