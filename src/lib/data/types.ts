import type { AreaSlug, I18nText, PropertyTypeSlug, TenureSlug } from "@/content/client-facts";

export type { I18nText, AreaSlug, PropertyTypeSlug, TenureSlug };

export type PropertyStatus =
  | "draft"
  | "available"
  | "reserved"
  | "sold"
  | "rented"
  | "archived";

export type ListingType = "sale" | "rent";
export type Finishing = "core-shell" | "semi" | "full" | "super-lux";
export type Orientation = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

export type GalleryImage = {
  /** Convex _storage id once wired; a public path while seeded. */
  src: string;
  alt: I18nText;
  room?: string;
  width: number;
  height: number;
  blurDataURL?: string;
  order: number;
};

/* --------------------------------------------------------------------------
   Floor plans.

   Stored as rectangles in centimetres rather than SVG path strings, for three
   reasons that all matter to this project:

     1. Room areas are DERIVED from the rectangle. The number printed on the
        plan is computed from the drawing, so the two can never disagree - the
        label is a measurement, not a caption someone typed.
     2. The renderer can stage the draw (envelope, then partitions, then
        dimension strings, then labels, then doors) because it knows what each
        primitive is. Opaque path data cannot be staged.
     3. The client edits numbers in admin. Nobody is hand-authoring SVG.

   100 units = 1 metre.
   -------------------------------------------------------------------------- */

export type RoomKind = "living" | "sleep" | "wet" | "service" | "circulation";

export type PlanRoom = {
  key: string;
  label: I18nText;
  /** centimetres, origin top-left of the envelope */
  x: number;
  y: number;
  w: number;
  h: number;
  kind: RoomKind;
  /** Door opening: which wall, and how far along it (cm from that wall's start). */
  door?: { edge: "top" | "bottom" | "left" | "right"; at: number; width?: number };
};

export type FloorPlan = {
  id: string;
  label: I18nText;
  /** envelope, centimetres */
  width: number;
  height: number;
  rooms: PlanRoom[];
  /** Degrees clockwise from up. Drives the north arrow, which is real. */
  north: number;
};

export type Property = {
  _id: string;
  refCode: string;
  slug: string;
  title: I18nText;

  status: PropertyStatus;
  listingType: ListingType;
  tenure: TenureSlug;
  propertyType: PropertyTypeSlug;

  price: {
    amount?: number;
    currency: "EGP" | "USD";
    period?: "month" | "year";
    onRequest: boolean;
  };
  paymentPlan?: {
    downPaymentPct: number;
    years: number;
    monthlyInstallment?: number;
  };

  location: {
    area: AreaSlug;
    street?: I18nText;
    /** Grid subdivisions only - Hadayek El-Ahram, 6 October. */
    plotRef?: { zone: string; plot: string };
    city: I18nText;
    governorate?: I18nText;
    lat?: number;
    lng?: number;
    hideExactLocation: boolean;
  };

  specs: {
    bedrooms: number;
    bathrooms: number;
    builtUpArea: number;
    landArea?: number;
    gardenArea?: number;
    floor?: string;
    totalFloors?: number;
    hasElevator?: boolean;
    finishing?: Finishing;
    furnished: boolean;
    orientation?: Orientation;
    view?: I18nText;
    deliveryDate?: string;
    yearBuilt?: number;
  };

  amenities: string[];
  description: I18nText;
  highlights: I18nText[];

  coverImage?: GalleryImage;
  gallery: GalleryImage[];
  floorPlans: FloorPlan[];
  videoUrl?: string;

  featured: boolean;
  featuredOrder?: number;
  views: number;
  publishedAt?: number;
};

/** Filter state. Mirrors the URL exactly - see useListingFilters. */
export type PropertyFilters = {
  q?: string;
  area?: AreaSlug[];
  type?: PropertyTypeSlug[];
  tenure?: TenureSlug[];
  listingType?: ListingType;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  minArea?: number;
  sort?: "newest" | "price-asc" | "price-desc" | "area-desc";
};

export type Inquiry = {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  propertyRefCode?: string;
  source: "form" | "whatsapp" | "call";
  locale: string;
};

/** Net internal area of a room, in m2, derived from its rectangle. */
export function roomArea(room: PlanRoom): number {
  return (room.w * room.h) / 10_000;
}

/** Sum of every room on a plan, in m2. Always less than built-up area. */
export function planNetArea(plan: FloorPlan): number {
  return plan.rooms.reduce((total, room) => total + roomArea(room), 0);
}
