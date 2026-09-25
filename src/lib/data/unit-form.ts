import "server-only";

import { areas, propertyTypes, tenures } from "@/content/client-facts";
import en from "@/messages/en.json";
import { slugify, toLatinDigits } from "@/lib/utils";
import { normaliseGallery } from "./validation";
import type { Finishing, Orientation, Property, PropertyStatus } from "./types";

/**
 * What the unit editor submits, turned into stored fields.
 *
 * Runs on the server whatever the browser checked: every choice must be one
 * the site knows, numbers typed on an Arabic keyboard still count, and
 * anything the editor does not show - coordinates, plot references, plans -
 * is carried over from the stored unit untouched.
 */

export const UNIT_STATUSES: readonly PropertyStatus[] = [
  "available",
  "reserved",
  "sold",
  "rented",
  "draft",
  "archived",
];
const FINISHINGS: readonly Finishing[] = ["core-shell", "semi", "full", "super-lux"];
const ORIENTATIONS: readonly Orientation[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const AREA_SLUGS = areas.map((a) => a.slug);
const TYPE_SLUGS = propertyTypes.map((p) => p.slug);
const TENURE_SLUGS = tenures.map((x) => x.slug);
const AMENITY_KEYS = Object.keys(en.amenities);

export type UnitFields = Pick<
  Property,
  | "status"
  | "listingType"
  | "propertyType"
  | "tenure"
  | "price"
  | "paymentPlan"
  | "location"
  | "specs"
  | "amenities"
  | "title"
  | "description"
  | "highlights"
  | "featured"
  | "gallery"
  | "coverImage"
>;

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const checked = (form: FormData, key: string) => form.get(key) === "on";

/** A whole number from what was typed, or undefined when nothing was. */
function count(form: FormData, key: string, max: number): number | undefined {
  const digits = toLatinDigits(text(form, key)).replace(/[^\d]/g, "");
  if (!digits) return undefined;
  return Math.min(max, Number(digits));
}

function oneOf<T extends string>(value: string, allowed: readonly T[]): T | undefined {
  return (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

function json(form: FormData, key: string): unknown[] {
  try {
    const value = JSON.parse(text(form, key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function readUnitForm(form: FormData, existing: Property | null, refCode: string): UnitFields {
  const listingType = oneOf(text(form, "listingType"), ["sale", "rent"] as const) ?? existing?.listingType ?? "sale";
  const areaSlug = oneOf(text(form, "area"), AREA_SLUGS) ?? existing?.location.area ?? "faisal";
  const area = areas.find((a) => a.slug === areaSlug)!;

  const title = { en: text(form, "title.en"), ar: text(form, "title.ar") };
  const street = { en: text(form, "street.en"), ar: text(form, "street.ar") };
  const down = count(form, "downPaymentPct", 100);
  const years = count(form, "years", 30);

  const highlights = json(form, "highlights")
    .map((h) => h as { en?: unknown; ar?: unknown })
    .map((h) => ({ en: String(h.en ?? "").trim(), ar: String(h.ar ?? "").trim() }))
    .filter((h) => h.en || h.ar)
    .slice(0, 6);

  const gallery = normaliseGallery(json(form, "gallery") as Parameters<typeof normaliseGallery>[0], {
    titleEn: title.en,
    titleAr: title.ar,
    refCode,
  });

  const deliveryDate = text(form, "deliveryDate");
  const yearBuilt = count(form, "yearBuilt", 2100);

  return {
    status: oneOf(text(form, "status"), UNIT_STATUSES) ?? existing?.status ?? "draft",
    listingType,
    propertyType: oneOf(text(form, "propertyType"), TYPE_SLUGS) ?? existing?.propertyType ?? "apartment",
    tenure: oneOf(text(form, "tenure"), TENURE_SLUGS) ?? existing?.tenure ?? "tamleek",
    price: {
      amount: count(form, "price", 1e12),
      currency: oneOf(text(form, "currency"), ["EGP", "USD"] as const) ?? existing?.price.currency ?? "EGP",
      period: listingType === "rent" ? (oneOf(text(form, "period"), ["month", "year"] as const) ?? "month") : undefined,
      onRequest: checked(form, "priceOnRequest"),
    },
    paymentPlan:
      down !== undefined && years
        ? { downPaymentPct: down, years, monthlyInstallment: count(form, "monthlyInstallment", 1e10) || undefined }
        : undefined,
    location: {
      ...existing?.location,
      area: areaSlug,
      street: street.en || street.ar ? street : undefined,
      city: existing?.location.city ?? area.governorate,
      governorate: existing?.location.governorate ?? area.governorate,
      hideExactLocation: checked(form, "hideExactLocation"),
    },
    specs: {
      ...existing?.specs,
      bedrooms: count(form, "bedrooms", 50) ?? 0,
      bathrooms: count(form, "bathrooms", 50) ?? 0,
      builtUpArea: count(form, "builtUpArea", 1e6) ?? 0,
      landArea: count(form, "landArea", 1e7),
      gardenArea: count(form, "gardenArea", 1e7),
      floor: toLatinDigits(text(form, "floor")) || undefined,
      totalFloors: count(form, "totalFloors", 200),
      hasElevator: checked(form, "hasElevator"),
      finishing: oneOf(text(form, "finishing"), FINISHINGS),
      furnished: checked(form, "furnished"),
      orientation: oneOf(text(form, "orientation"), ORIENTATIONS),
      deliveryDate: /^\d{4}-(0[1-9]|1[0-2])$/.test(deliveryDate) ? deliveryDate : undefined,
      yearBuilt: yearBuilt && yearBuilt >= 1900 ? yearBuilt : undefined,
    },
    amenities: form
      .getAll("amenities")
      .map(String)
      .filter((key, i, all) => AMENITY_KEYS.includes(key) && all.indexOf(key) === i),
    title,
    description: { en: text(form, "description.en"), ar: text(form, "description.ar") },
    highlights,
    featured: checked(form, "featured"),
    gallery,
    coverImage: gallery[0],
  };
}

/** Readable and unique: "faisal-3br-142m-0431". Set once, so links never break. */
export function unitSlug(fields: UnitFields, refCode: string): string {
  const { bedrooms, builtUpArea } = fields.specs;
  return slugify(
    [
      fields.location.area,
      bedrooms ? `${bedrooms}br` : fields.propertyType,
      builtUpArea ? `${builtUpArea}m` : "",
      refCode.replace(/\D/g, ""),
    ]
      .filter(Boolean)
      .join("-"),
  );
}
