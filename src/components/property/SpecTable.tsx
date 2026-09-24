import { getLocale, getTranslations } from "next-intl/server";

import type { Property } from "@/lib/data/types";
import { formatDeliveryDate, formatNumber, pricePerMeter } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

/**
 * Everything measured about the unit, as label and value. Every row is a
 * quantity or a fact, not a claim.
 */
export async function SpecTable({ property }: { property: Property }) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("property");
  const { specs, price, location } = property;

  const rows: Array<{ label: string; value: string } | null> = [
    { label: t("builtUpArea"), value: `${formatNumber(specs.builtUpArea, locale)} m²` },
    specs.landArea
      ? { label: t("landArea"), value: `${formatNumber(specs.landArea, locale)} m²` }
      : null,
    specs.gardenArea
      ? { label: t("gardenArea"), value: `${formatNumber(specs.gardenArea, locale)} m²` }
      : null,
    specs.bedrooms > 0
      ? { label: t("bedroomsLabel"), value: formatNumber(specs.bedrooms, locale) }
      : null,
    { label: t("bathroomsLabel"), value: formatNumber(specs.bathrooms, locale) },
    specs.floor
      ? {
          label: t("floor"),
          value:
            specs.floor === "G"
              ? t("groundFloor")
              : specs.totalFloors
                ? t("floorOf", { floor: specs.floor, total: specs.totalFloors })
                : specs.floor,
        }
      : null,
    specs.finishing
      ? { label: t("finishing"), value: t(`finishingLevel.${specs.finishing}` as "finishingLevel.full") }
      : null,
    specs.orientation
      ? { label: t("orientation"), value: t(`orientationName.${specs.orientation}` as "orientationName.N") }
      : null,
    specs.deliveryDate
      ? { label: t("delivery"), value: formatDeliveryDate(specs.deliveryDate, locale) }
      : null,
    specs.yearBuilt
      ? { label: t("yearBuilt"), value: formatNumber(specs.yearBuilt, locale) }
      : null,
    { label: t("furnished"), value: specs.furnished ? t("furnished") : t("unfurnished") },
    specs.hasElevator !== undefined
      ? { label: t("elevator"), value: specs.hasElevator ? t("elevator") : t("noElevator") }
      : null,
    location.plotRef
      ? {
          label: t("plotRefLabel"),
          value: t("plotRef", { zone: location.plotRef.zone, plot: location.plotRef.plot }),
        }
      : null,
    // The number Egyptian buyers actually compare on.
    !price.onRequest && price.amount && property.listingType === "sale"
      ? {
          label: t("pricePerMeterLabel"),
          value: pricePerMeter(price.amount, specs.builtUpArea, locale) ?? "—",
        }
      : null,
  ];

  const visible = rows.filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <dl className="grid gap-x-8 sm:grid-cols-2">
      {visible.map((row) => (
        <div
          key={row.label + row.value}
          className="flex items-baseline justify-between gap-4 border-b border-line py-3 text-sm"
        >
          <dt className="text-fg-muted">{row.label}</dt>
          <dd className="text-end font-medium text-fg tabular-nums">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
