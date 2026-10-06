import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Alaser data model.
 *
 * Every piece of visible content is bilingual by construction - `i18n` is not
 * optional anywhere a human reads it, because a half-translated listing is the
 * failure mode this client will actually hit.
 *
 * Two fields exist here that no international template has, and both came
 * straight off the client's own cover banner:
 *   - `tenure`   تمليك vs القانون الجديد. The first question an Egyptian buyer
 *                asks, and a top-level filter on the public site.
 *   - `plotRef`  Hadayek El-Ahram and 6 October are surveyed grid subdivisions.
 *                Units there have a zone and a plot number, and buyers search
 *                by them.
 *
 * NOTE: this file is the source of truth for shape. Until the client's Convex
 * account exists, `src/lib/data` serves identical types from a local seed, so
 * wiring Convex is a swap of one module and not a rewrite.
 */

const i18n = v.object({ en: v.string(), ar: v.string() });

const image = v.object({
  storageId: v.id("_storage"),
  alt: i18n, // required: accessibility and SEO, in both languages
  room: v.optional(v.string()),
  width: v.number(),
  height: v.number(),
  blurDataURL: v.string(),
  order: v.number(),
});

export default defineSchema({
  properties: defineTable({
    refCode: v.string(), // "ALS-0412" - immutable once published, used in wa.me deep-links
    slug: v.string(),
    title: i18n,

    status: v.union(
      v.literal("draft"),
      v.literal("available"),
      v.literal("reserved"),
      v.literal("sold"),
      v.literal("rented"),
      v.literal("archived"),
    ),
    listingType: v.union(v.literal("sale"), v.literal("rent")),
    tenure: v.union(v.literal("tamleek"), v.literal("new-law")),
    propertyType: v.string(), // apartment | villa | duplex | penthouse | studio | house | building | shop | cafe | office | land

    price: v.object({
      amount: v.optional(v.number()),
      currency: v.string(), // EGP | USD
      period: v.optional(v.string()), // month | year - rentals only
      onRequest: v.boolean(),
    }),
    paymentPlan: v.optional(
      v.object({
        downPaymentPct: v.number(),
        years: v.number(),
        monthlyInstallment: v.optional(v.number()),
      }),
    ),

    location: v.object({
      area: v.string(), // AreaSlug - faisal | haram | hadayek-el-ahram | 6-october | sheikh-zayed
      compoundId: v.optional(v.id("compounds")),
      street: v.optional(i18n),
      /** Grid subdivisions only: zone + plot, as the survey records them. */
      plotRef: v.optional(v.object({ zone: v.string(), plot: v.string() })),
      city: i18n,
      governorate: v.optional(i18n),
      lat: v.optional(v.number()),
      lng: v.optional(v.number()),
      hideExactLocation: v.boolean(), // owner privacy - district only
    }),

    specs: v.object({
      bedrooms: v.number(),
      bathrooms: v.number(),
      builtUpArea: v.number(),
      landArea: v.optional(v.number()),
      gardenArea: v.optional(v.number()),
      floor: v.optional(v.string()),
      totalFloors: v.optional(v.number()),
      hasElevator: v.optional(v.boolean()),
      finishing: v.optional(v.string()), // core-shell | semi | full | super-lux
      furnished: v.boolean(),
      /** Orientation drives the north arrow on the plan and matters to buyers. */
      orientation: v.optional(v.string()), // N | NE | E | SE | S | SW | W | NW
      view: v.optional(i18n),
      deliveryDate: v.optional(v.string()),
      yearBuilt: v.optional(v.number()),
    }),

    amenities: v.array(v.string()), // controlled vocabulary, never free text
    description: i18n,
    highlights: v.array(i18n), // 3-5 bullets, above the fold

    coverImage: v.optional(v.id("_storage")),
    gallery: v.array(image),
    nightShots: v.optional(
      v.array(v.object({ dayStorageId: v.id("_storage"), nightStorageId: v.id("_storage") })),
    ),
    floorPlans: v.array(
      v.object({
        storageId: v.optional(v.id("_storage")),
        label: i18n,
        area: v.optional(v.number()),
        /** Powers the plan that draws itself. Vector line art, not a raster. */
        svgPaths: v.optional(v.string()),
      }),
    ),
    videoUrl: v.optional(v.string()),

    agentId: v.optional(v.id("agents")),
    featured: v.boolean(),
    featuredOrder: v.optional(v.number()),
    views: v.number(),
    seo: v.optional(v.object({ title: i18n, description: i18n })),
    publishedAt: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_refCode", ["refCode"])
    .index("by_status", ["status"])
    .index("by_status_type", ["status", "listingType"])
    .index("by_status_area", ["status", "location.area"])
    .index("by_featured", ["featured", "featuredOrder"])
    .searchIndex("search_title_en", {
      searchField: "title.en",
      filterFields: ["status", "listingType", "tenure"],
    })
    .searchIndex("search_title_ar", {
      searchField: "title.ar",
      filterFields: ["status", "listingType", "tenure"],
    }),

  compounds: defineTable({
    name: i18n,
    slug: v.string(),
    developer: v.optional(i18n),
    area: v.string(),
    description: i18n,
    coverImage: v.optional(v.id("_storage")),
    gallery: v.array(image),
    amenities: v.array(v.string()),
    masterplanImage: v.optional(v.id("_storage")),
    masterplanSvg: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    published: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_area", ["area"]),

  agents: defineTable({
    name: i18n,
    role: i18n,
    photo: v.optional(v.id("_storage")),
    phone: v.string(),
    whatsapp: v.string(),
    email: v.optional(v.string()),
    bio: v.optional(i18n),
    languages: v.array(v.string()),
    order: v.number(),
    active: v.boolean(),
  }).index("by_active", ["active", "order"]),

  inquiries: defineTable({
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    message: v.optional(v.string()),
    propertyId: v.optional(v.id("properties")),
    propertyRefCode: v.optional(v.string()), // denormalised so the lead survives an archive
    source: v.union(v.literal("form"), v.literal("whatsapp"), v.literal("call")),
    locale: v.string(),
    status: v.union(
      v.literal("new"),
      v.literal("contacted"),
      v.literal("viewing_booked"),
      v.literal("won"),
      v.literal("lost"),
    ),
    notes: v.array(v.object({ body: v.string(), at: v.number(), by: v.string() })),
    assignedTo: v.optional(v.id("agents")),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"])
    .index("by_property", ["propertyId"]),

  testimonials: defineTable({
    author: v.string(),
    body: i18n,
    sourceLabel: i18n,
    sourceUrl: v.optional(v.string()),
    rating: v.optional(v.number()),
    screenshot: v.optional(v.id("_storage")),
    order: v.number(),
    published: v.boolean(),
  }).index("by_published", ["published", "order"]),

  settings: defineTable({
    singleton: v.literal("settings"),
    heroSlides: v.array(v.object({ storageId: v.id("_storage"), caption: v.optional(i18n) })),
    stats: v.object({
      yearsActive: v.optional(v.number()),
      unitsSold: v.optional(v.number()),
      teamSize: v.optional(v.number()),
      verified: v.boolean(),
    }),
    contact: v.object({
      whatsapp: v.string(),
      phone: v.string(),
      email: v.optional(v.string()),
      address: i18n,
      verified: v.boolean(),
    }),
    socialLinks: v.object({
      facebook: v.optional(v.string()),
      instagram: v.optional(v.string()),
      tiktok: v.optional(v.string()),
    }),
    /** {refCode} and {title} are substituted at click time. */
    whatsappTemplate: i18n,
    announcement: v.optional(v.object({ body: i18n, href: v.optional(v.string()), active: v.boolean() })),
    seo: v.object({ title: i18n, description: i18n }),
  }).index("by_singleton", ["singleton"]),

  auditLog: defineTable({
    userId: v.string(),
    action: v.string(),
    entity: v.string(),
    entityId: v.string(),
    summary: v.optional(v.string()),
    at: v.number(),
  }).index("by_at", ["at"]),
});
