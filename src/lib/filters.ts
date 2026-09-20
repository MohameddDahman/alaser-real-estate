import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

import { areas, propertyTypes, tenures } from "@/content/client-facts";
import type { PropertyFilters } from "./data/types";

/**
 * Filter state lives in the URL and nowhere else.
 *
 * That makes every result set shareable and linkable - a broker sends "three
 * bedrooms in Faisal under 3M" as a link, and the back button restores it
 * exactly. The same parsers run on the server (to fetch) and in the client (to
 * update), so the two can never drift.
 */

const areaSlugs = areas.map((a) => a.slug);
const typeSlugs = propertyTypes.map((p) => p.slug);
const tenureSlugs = tenures.map((t) => t.slug);

export const SORTS = ["newest", "price-asc", "price-desc", "area-desc"] as const;

export const filterParsers = {
  q: parseAsString.withDefault(""),
  area: parseAsArrayOf(parseAsStringLiteral(areaSlugs)).withDefault([]),
  type: parseAsArrayOf(parseAsStringLiteral(typeSlugs)).withDefault([]),
  tenure: parseAsArrayOf(parseAsStringLiteral(tenureSlugs)).withDefault([]),
  listingType: parseAsStringLiteral(["sale", "rent"] as const),
  minPrice: parseAsInteger,
  maxPrice: parseAsInteger,
  beds: parseAsInteger,
  sort: parseAsStringLiteral(SORTS).withDefault("newest"),
};

export type RawFilters = {
  q: string;
  area: string[];
  type: string[];
  tenure: string[];
  listingType: "sale" | "rent" | null;
  minPrice: number | null;
  maxPrice: number | null;
  beds: number | null;
  sort: (typeof SORTS)[number];
};

/** URL shape -> the shape the data layer expects. */
export function toPropertyFilters(raw: RawFilters): PropertyFilters {
  return {
    q: raw.q || undefined,
    area: raw.area.length ? (raw.area as PropertyFilters["area"]) : undefined,
    type: raw.type.length ? (raw.type as PropertyFilters["type"]) : undefined,
    tenure: raw.tenure.length ? (raw.tenure as PropertyFilters["tenure"]) : undefined,
    listingType: raw.listingType ?? undefined,
    minPrice: raw.minPrice ?? undefined,
    maxPrice: raw.maxPrice ?? undefined,
    beds: raw.beds ?? undefined,
    sort: raw.sort,
  };
}

/** How many filters are on, for the mobile button's badge. */
export function activeFilterCount(raw: RawFilters): number {
  return (
    raw.area.length +
    raw.type.length +
    raw.tenure.length +
    (raw.listingType ? 1 : 0) +
    (raw.minPrice ? 1 : 0) +
    (raw.maxPrice ? 1 : 0) +
    (raw.beds ? 1 : 0) +
    (raw.q ? 1 : 0)
  );
}
