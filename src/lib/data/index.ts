import "server-only";

import { PLANS } from "./plans";
import { queryProperties } from "./query";
import { allProperties } from "./store";
import type {
  FloorPlan,
  ListingType,
  Orientation,
  Property,
  PropertyFilters,
} from "./types";
import { areas, propertyTypes, type AreaSlug, type PropertyTypeSlug } from "@/content/client-facts";
import { BLUR, galleryFor, photo, PHOTOS_ARE_PLACEHOLDERS, ROOM_WORDS, type RoomKey } from "@/content/photos";

/* ==========================================================================
   THE PUBLIC READ LAYER

   Everything visitor-facing reads through the functions below. When the
   client's Convex account exists, each body becomes a `fetchQuery(api.…)` call
   and nothing else in the app changes - the return types are already the ones
   Convex will produce.

   The rule that must survive the swap: drafts, archived units and exact
   coordinates on units with `hideExactLocation` are filtered HERE, server
   side. Never in a component.
   ========================================================================== */

const PUBLIC_STATUSES = new Set(["available", "reserved", "sold", "rented"]);

/** Bearing in degrees for each compass point, N = 0, clockwise. */
const BEARING: Record<Orientation, number> = {
  N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315,
};

/**
 * Where north sits on the drawing, given which way the unit's main facade
 * faces. The arrow on every plan is therefore real: a unit facing east has
 * north to its left, and the drawing says so.
 */
export function northAngleFor(orientation?: Orientation): number {
  if (!orientation) return 0;
  return (360 - BEARING[orientation]) % 360;
}

/**
 * Which plan template a unit draws. Assigned rather than authored per listing,
 * so the whole library stays consistent; a unit with its own surveyed plan
 * overrides this by carrying its own `floorPlans` entry.
 */
export function planForProperty(property: Property): FloorPlan | null {
  if (property.floorPlans.length > 0) return property.floorPlans[0];

  const { propertyType, specs } = property;
  let base: FloorPlan;

  // A whole building or a plot has no one floor plan to stand in for it;
  // showing a flat's plan would tell the buyer it is a flat.
  if (propertyType === "building" || propertyType === "land") return null;
  if (propertyType === "villa" || propertyType === "house") base = PLANS["villa-gf"];
  else if (propertyType === "shop" || propertyType === "cafe" || propertyType === "office")
    base = PLANS.shop;
  else if (specs.bedrooms >= 3) base = PLANS["apt-3br"];
  else base = PLANS["apt-2br"];

  return { ...base, north: northAngleFor(specs.orientation) };
}

/**
 * Attach photography when a listing carries none of its own.
 *
 * Alt text is written per frame in both languages rather than left to a
 * filename: "Reception of ALS-0412, three-bed on Kaabish" is what a screen
 * reader and a search engine both need, and the brief makes it non-negotiable.
 *
 * Exported because the admin needs it too: the dashboard must show what
 * visitors actually see, or its "live preview" is lying. Admin passes raw
 * store rows through this rather than through `toPublic`, because it is
 * entitled to drafts, archived units and owner-private location data.
 */
export function attachPhotos(property: Property): Property {
  return withPhotos(property);
}

function withPhotos(property: Property): Property {
  if (property.gallery.length > 0) return property;
  // Deleting every photograph must mean "no photographs", not "give me the
  // stand-ins back", once real photography is in use.
  if (!PHOTOS_ARE_PLACEHOLDERS) return property;

  const specs = galleryFor(property.slug, {
    bedrooms: property.specs.bedrooms,
    type: property.propertyType,
  });

  const gallery = specs.map((spec, order) => {
    const room = ROOM_WORDS[spec.room as RoomKey] ?? { en: spec.room, ar: spec.room };
    return {
      src: photo(spec.id),
      alt: {
        en: `${room.en[0].toUpperCase()}${room.en.slice(1)} — ${property.title.en}, ref ${property.refCode}`,
        ar: `${room.ar} — ${property.title.ar}، كود ${property.refCode}`,
      },
      room: spec.room,
      width: 1600,
      height: 1067,
      blurDataURL: BLUR,
      order,
    };
  });

  return { ...property, gallery, coverImage: gallery[0] };
}

/** Public projection. Strips anything a visitor must not receive. */
function toPublic(property: Property): Property {
  const next: Property = {
    ...withPhotos(property),
    floorPlans: property.floorPlans.length
      ? property.floorPlans
      : ([planForProperty(property)].filter(Boolean) as FloorPlan[]),
  };

  if (property.location.hideExactLocation) {
    next.location = { ...property.location, lat: undefined, lng: undefined, street: undefined };
  }
  return next;
}

function isPublic(property: Property): boolean {
  return PUBLIC_STATUSES.has(property.status);
}

async function publicRows(): Promise<Property[]> {
  return (await allProperties()).filter(isPublic);
}

/* -------------------------------------------------------------------------- */

/**
 * Every public unit, projected for visitors, in the store's own order. The
 * listings page filters this in the browser, and it has to be the same input
 * getProperties sorts: sorting keeps ties in the order it receives them, so a
 * pre-sorted copy would reorder units that share a price or a floor area.
 */
export async function getPublicProperties(): Promise<Property[]> {
  return (await publicRows()).map(toPublic);
}

export async function getProperties(filters: PropertyFilters = {}): Promise<Property[]> {
  // Projected before the query, not after, so a search can never match a
  // field the visitor is not allowed to see. See ./query.ts.
  return queryProperties(await getPublicProperties(), filters);
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  const found = (await publicRows()).find((p) => p.slug === slug);
  return found ? toPublic(found) : null;
}

export async function getAllPropertySlugs(): Promise<string[]> {
  return (await publicRows()).map((p) => p.slug);
}

/**
 * The home page's featured row: every unit the client switched on for the
 * home page, first, up to `max` - in their order, then newest first. With
 * fewer than `min` switched on, the newest units on the market fill the
 * row, so the home page is never left with one card and an empty shelf.
 */
export async function getFeatured(max = 8, min = 4): Promise<Property[]> {
  const rows = await publicRows();
  const newestFirst = (a: Property, b: Property) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0);

  const picked = rows
    .filter((p) => p.featured)
    .sort((a, b) => (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99) || newestFirst(a, b))
    .slice(0, max);
  const topUp =
    picked.length < min
      ? rows.filter((p) => !p.featured && p.status === "available").sort(newestFirst).slice(0, min - picked.length)
      : [];

  return [...picked, ...topUp].map(toPublic);
}

export async function getRelated(property: Property, limit = 3): Promise<Property[]> {
  const rows = await publicRows();
  const sameArea = rows.filter(
    (p) => p._id !== property._id && p.location.area === property.location.area,
  );
  const fallback = rows.filter(
    (p) => p._id !== property._id && p.propertyType === property.propertyType,
  );
  const seen = new Set<string>();
  return [...sameArea, ...fallback]
    .filter((p) => (seen.has(p._id) ? false : (seen.add(p._id), true)))
    .slice(0, limit)
    .map(toPublic);
}

/** Live counts per area, so the areas index never shows an empty promise. */
export async function getAreaCounts(): Promise<Record<AreaSlug, number>> {
  const counts = Object.fromEntries(areas.map((a) => [a.slug, 0])) as Record<AreaSlug, number>;
  for (const property of await publicRows()) counts[property.location.area] += 1;
  return counts;
}

/** Live counts per property type, for browsing by type. */
export async function getTypeCounts(): Promise<Record<PropertyTypeSlug, number>> {
  const counts = Object.fromEntries(propertyTypes.map((p) => [p.slug, 0])) as Record<
    PropertyTypeSlug,
    number
  >;
  for (const property of await publicRows()) counts[property.propertyType] += 1;
  return counts;
}

export async function getPriceBounds(): Promise<{ min: number; max: number }> {
  const amounts = (await publicRows())
    .filter((p) => p.listingType === "sale" && p.price.amount)
    .map((p) => p.price.amount!);
  return { min: Math.min(...amounts), max: Math.max(...amounts) };
}

export async function countByListingType(): Promise<Record<ListingType, number>> {
  const rows = await publicRows();
  return {
    sale: rows.filter((p) => p.listingType === "sale").length,
    rent: rows.filter((p) => p.listingType === "rent").length,
  };
}

export type { Property, PropertyFilters, FloorPlan } from "./types";
export { planNetArea, roomArea } from "./types";
export { PLANS } from "./plans";
