import "server-only";

import type { AreaSlug, I18nText, PropertyTypeSlug } from "@/content/client-facts";
import { PHOTOS_ARE_PLACEHOLDERS } from "@/content/photos";
import { attachPhotos } from "@/lib/data";
import type { ListingType, Property, PropertyStatus } from "./types";
import { missingForSite, type SiteRequirement } from "./validation";

/**
 * A unit as the dashboard lists it: only what a row shows, so a list of
 * every unit is small enough to hand to the browser for instant search.
 */
export type UnitRow = {
  id: string;
  refCode: string;
  slug: string;
  title: I18nText;
  status: PropertyStatus;
  listingType: ListingType;
  propertyType: PropertyTypeSlug;
  area: AreaSlug;
  price: Property["price"];
  beds: number;
  size: number;
  /** What visitors see first: the unit's own cover, or its stand-in. */
  cover?: string;
  /** The unit's own photographs - stand-ins not counted. */
  photos: number;
  standIn: boolean;
  missing: SiteRequirement[];
};

export function toUnitRow(unit: Property): UnitRow {
  const shown = attachPhotos(unit);
  return {
    id: unit._id,
    refCode: unit.refCode,
    slug: unit.slug,
    title: unit.title,
    status: unit.status,
    listingType: unit.listingType,
    propertyType: unit.propertyType,
    area: unit.location.area,
    price: unit.price,
    beds: unit.specs.bedrooms,
    size: unit.specs.builtUpArea,
    cover: (shown.coverImage ?? shown.gallery[0])?.src,
    photos: unit.gallery.length,
    standIn: unit.gallery.length === 0 && PHOTOS_ARE_PLACEHOLDERS,
    missing: missingForSite(unit),
  };
}
