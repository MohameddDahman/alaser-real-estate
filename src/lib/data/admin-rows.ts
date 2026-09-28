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

/** A unit waiting in Deleted items. */
export type DeletedUnitRow = {
  id: string;
  refCode: string;
  title: I18nText;
  cover?: string;
  deletedAt?: number;
  restoreStatus?: PropertyStatus;
};

/** A photograph taken off its unit, waiting in Deleted items. */
export type DeletedPhotoRow = {
  unitId: string;
  refCode: string;
  unitTitle: I18nText;
  src: string;
  blurDataURL?: string;
  removedAt: number;
};

export function deletedItems(units: Property[]): { units: DeletedUnitRow[]; photos: DeletedPhotoRow[] } {
  return {
    units: units
      .filter((unit) => unit.status === "archived")
      .sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0))
      .map((unit) => ({
        id: unit._id,
        refCode: unit.refCode,
        title: unit.title,
        cover: attachPhotos(unit).gallery[0]?.src,
        deletedAt: unit.deletedAt,
        restoreStatus: unit.restoreStatus,
      })),
    photos: units
      .flatMap((unit) =>
        (unit.removedPhotos ?? []).map((photo) => ({
          unitId: unit._id,
          refCode: unit.refCode,
          unitTitle: unit.title,
          src: photo.src,
          blurDataURL: photo.blurDataURL,
          removedAt: photo.removedAt,
        })),
      )
      .sort((a, b) => b.removedAt - a.removedAt),
  };
}

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
