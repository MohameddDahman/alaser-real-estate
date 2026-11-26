import { areas, propertyTypes } from "@/content/client-facts";
import type { Property, PropertyFilters } from "./types";

/* ==========================================================================
   THE LISTING QUERY

   One implementation, run in two places: on the server by `getProperties`,
   and in the browser by the listings page, which filters a static copy of the
   public list instead of asking a server function on every visit and click.

   It only ever receives rows that have already been through `toPublic`, so
   drafts, archived units and hidden locations are gone before it runs - the
   rule in ./index.ts still holds, and a search can no longer match a street
   that the unit has asked to keep private.
   ========================================================================== */

/** The fields a listing query reads. A full public row satisfies it, and so
 *  does the slim copy the browser receives. */
export type Filterable = Pick<
  Property,
  "title" | "refCode" | "propertyType" | "tenure" | "listingType" | "status" | "publishedAt"
> & {
  location: Pick<Property["location"], "area" | "street">;
  specs: Pick<Property["specs"], "bedrooms" | "builtUpArea">;
  price: Pick<Property["price"], "amount">;
};

/** What the listings page sends to the browser for each unit: enough to
 *  filter and sort it, and nothing else. */
export type ListingFacts = Filterable & { _id: string };

export function factsOf(property: Property): ListingFacts {
  return {
    _id: property._id,
    title: property.title,
    refCode: property.refCode,
    propertyType: property.propertyType,
    tenure: property.tenure,
    listingType: property.listingType,
    status: property.status,
    publishedAt: property.publishedAt,
    location: { area: property.location.area, street: property.location.street },
    specs: { bedrooms: property.specs.bedrooms, builtUpArea: property.specs.builtUpArea },
    price: { amount: property.price.amount },
  };
}

export function queryProperties<T extends Filterable>(
  source: readonly T[],
  filters: PropertyFilters = {},
): T[] {
  let rows = [...source];

  if (filters.q) {
    // One box answers the ways people actually ask: "ALS-0412", "Kaabish",
    // "Zayed", "villa" - in either language.
    const q = filters.q.trim().toLowerCase();
    rows = rows.filter((p) => {
      const area = areas.find((a) => a.slug === p.location.area);
      const type = propertyTypes.find((t) => t.slug === p.propertyType);
      return [
        p.title.en,
        p.title.ar,
        p.refCode,
        p.location.street?.en ?? "",
        p.location.street?.ar ?? "",
        area?.name.en ?? "",
        area?.name.ar ?? "",
        type?.name.en ?? "",
        type?.name.ar ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }
  if (filters.area?.length) rows = rows.filter((p) => filters.area!.includes(p.location.area));
  if (filters.type?.length) rows = rows.filter((p) => filters.type!.includes(p.propertyType));
  if (filters.tenure?.length) rows = rows.filter((p) => filters.tenure!.includes(p.tenure));
  if (filters.listingType) rows = rows.filter((p) => p.listingType === filters.listingType);
  if (filters.beds) rows = rows.filter((p) => p.specs.bedrooms >= filters.beds!);
  if (filters.minArea) rows = rows.filter((p) => p.specs.builtUpArea >= filters.minArea!);
  if (filters.minPrice)
    rows = rows.filter((p) => (p.price.amount ?? Infinity) >= filters.minPrice!);
  if (filters.maxPrice)
    rows = rows.filter((p) => (p.price.amount ?? 0) <= filters.maxPrice!);

  const sorted = rows.sort((a, b) => {
    switch (filters.sort) {
      case "price-asc":
        return (a.price.amount ?? Infinity) - (b.price.amount ?? Infinity);
      case "price-desc":
        return (b.price.amount ?? 0) - (a.price.amount ?? 0);
      case "area-desc":
        return b.specs.builtUpArea - a.specs.builtUpArea;
      default:
        return (b.publishedAt ?? 0) - (a.publishedAt ?? 0);
    }
  });

  // Available first within the chosen sort: a sold unit is useful context but
  // must never sit above something a visitor can actually buy.
  return sorted.sort(
    (a, b) => Number(b.status === "available") - Number(a.status === "available"),
  );
}
