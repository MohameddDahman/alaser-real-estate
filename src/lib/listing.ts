import type { Property } from "@/lib/data/types";
import type { Locale } from "@/i18n/routing";
import { areas, propertyTypes, tenures } from "@/content/client-facts";
import { formatPrice, pricePerMeter } from "@/lib/utils";

/**
 * What every card, row and listing page shows about a unit, worked out in
 * one place so the price on a card can never disagree with the price on the
 * page it opens.
 */
export function listingMeta(property: Property, locale: Locale) {
  const { price, specs } = property;
  const hasPrice = !price.onRequest && Boolean(price.amount);

  return {
    areaName: areas.find((a) => a.slug === property.location.area)?.name[locale] ?? "",
    typeName: propertyTypes.find((p) => p.slug === property.propertyType)?.name[locale] ?? "",
    tenureName: tenures.find((t) => t.slug === property.tenure)?.name[locale] ?? "",
    /** Null when the price is on request - say so in words, not with a zero. */
    price: hasPrice ? formatPrice(price.amount!, locale, price.currency) : null,
    period: price.period ?? null,
    /** Per built-up metre, for sales: the number buyers here compare on. */
    perMeter:
      hasPrice && property.listingType === "sale"
        ? pricePerMeter(price.amount!, specs.builtUpArea, locale)
        : null,
    cover: property.coverImage ?? property.gallery[0] ?? null,
    isClosed: property.status === "sold" || property.status === "rented",
    isResidential: specs.bedrooms > 0,
  };
}
