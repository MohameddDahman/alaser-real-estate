/**
 * ALASER - client facts.
 *
 * Single source of truth for everything about the real business. Nothing in
 * this file is invented: values under CONFIRMED were read off the client's own
 * Facebook page. Everything still outstanding is listed in OPEN_QUESTIONS and
 * rendered on /admin and /admin/settings, so it cannot quietly ship as a
 * placeholder.
 *
 * Do not scatter these values through components. Import from here.
 */

export type I18nText = { en: string; ar: string };

/* -------------------------------------------------------------------------
   CONFIRMED - read from facebook.com/<the agency's page>, Sept 2026
   ------------------------------------------------------------------------- */

export const brand = {
  /** Exactly as it is set in their own logo. */
  latin: "ALASER",
  /** Exactly as their page is titled. */
  arabic: "الأسر",
  legalName: {
    en: "Alaser Real Estate Marketing",
    ar: "شركة الأسر للتسويق العقاري",
  } satisfies I18nText,
  /** The line under the mark in their logo. */
  descriptor: {
    en: "Real Estate Marketing",
    ar: "للتسويق العقاري",
  } satisfies I18nText,
} as const;

/**
 * Their own strapline, verbatim:
 * "شركة الأسر هى شركة للتسويق العقارى بفيصل والهرم والحدائق بأكتوبر وزايد
 *  للبيع والشراء من خلالنا"
 */
export const strapline = {
  en: "Buying and selling in Faisal, Haram, Hadayek El-Ahram, 6 October and Sheikh Zayed.",
  ar: "للبيع والشراء بفيصل والهرم والحدائق وأكتوبر وزايد.",
} satisfies I18nText;

/**
 * The five areas they actually work, in the order their own description lists
 * them. This array drives the areas index, the filter facets and the local SEO
 * pages. Adding a sixth area here is all it takes.
 */
export const areas = [
  {
    slug: "faisal",
    name: { en: "Faisal", ar: "فيصل" },
    governorate: { en: "Giza", ar: "الجيزة" },
    /** Dense walk-up apartment stock either side of Faisal Street. */
    character: {
      en: "Dense apartment stock either side of Faisal Street, sold by floor and finish.",
      ar: "عمارات سكنية على جانبي شارع فيصل، تُباع بالدور ومستوى التشطيب.",
    },
    isHome: true,
  },
  {
    slug: "haram",
    name: { en: "Haram", ar: "الهرم" },
    governorate: { en: "Giza", ar: "الجيزة" },
    character: {
      en: "Haram Street and the roads behind it - older buildings, larger floor areas.",
      ar: "شارع الهرم والشوارع خلفه ــ عمارات أقدم ومساحات أكبر.",
    },
  },
  {
    slug: "hadayek-el-ahram",
    name: { en: "Hadayek El-Ahram", ar: "حدائق الأهرام" },
    governorate: { en: "Giza", ar: "الجيزة" },
    /** A surveyed grid subdivision: numbered zones, numbered plots. */
    character: {
      en: "A surveyed grid: numbered zones, numbered plots, villas and low-rise.",
      ar: "تقسيم مساحي منتظم: مناطق مرقّمة وقطع مرقّمة، فيلات ومبانٍ منخفضة.",
    },
    isGrid: true,
  },
  {
    slug: "6-october",
    name: { en: "6th of October", ar: "السادس من أكتوبر" },
    governorate: { en: "Giza", ar: "الجيزة" },
    character: {
      en: "Districts and compounds, from resale apartments to standalone villas.",
      ar: "أحياء وكمبوندات، من شقق إعادة البيع إلى الفيلات المستقلة.",
    },
    isGrid: true,
  },
  {
    slug: "sheikh-zayed",
    name: { en: "Sheikh Zayed", ar: "الشيخ زايد" },
    governorate: { en: "Giza", ar: "الجيزة" },
    character: {
      en: "Compound stock and villas, the top of the price range they handle.",
      ar: "كمبوندات وفيلات، وهي أعلى شريحة سعرية تتعامل فيها الشركة.",
    },
  },
] as const;

export type AreaSlug = (typeof areas)[number]["slug"];

/**
 * From their cover banner: "شقق - فيلات - محلات - كافيهات".
 * Shops and cafes mean this is not a residential-only brokerage, so commercial
 * is a first-class filter rather than an afterthought.
 *
 * بيت and عمارة were added when the client listed one and had to call it a
 * villa: a بيت is a family house, often a few floors; a عمارة is a whole
 * block of flats sold as one. Buyers in Giza ask for them by those names.
 */
export const propertyTypes = [
  { slug: "apartment", name: { en: "Apartment", ar: "شقة" } },
  { slug: "villa", name: { en: "Villa", ar: "فيلا" } },
  { slug: "duplex", name: { en: "Duplex", ar: "دوبلكس" } },
  { slug: "penthouse", name: { en: "Penthouse", ar: "بنتهاوس" } },
  { slug: "studio", name: { en: "Studio", ar: "استوديو" } },
  { slug: "house", name: { en: "House", ar: "بيت" } },
  { slug: "building", name: { en: "Building", ar: "عمارة" } },
  { slug: "shop", name: { en: "Shop", ar: "محل" } },
  { slug: "cafe", name: { en: "Cafe", ar: "كافيه" } },
  { slug: "office", name: { en: "Office", ar: "مكتب" } },
  { slug: "land", name: { en: "Land", ar: "أرض" } },
] as const;

export type PropertyTypeSlug = (typeof propertyTypes)[number]["slug"];

/**
 * Also from the cover banner: "للتمليك والقانون الجديد".
 * Tenure is the first question an Egyptian buyer asks and no international
 * template has a field for it. It is a top-level filter on this site.
 */
export const tenures = [
  {
    slug: "tamleek",
    name: { en: "Freehold", ar: "تمليك" },
    note: {
      en: "Registered ownership. The unit is yours.",
      ar: "ملكية مسجّلة. الوحدة تصبح ملكك.",
    },
  },
  {
    slug: "new-law",
    name: { en: "New-law rent", ar: "إيجار قانون جديد" },
    note: {
      en: "Fixed-term lease under the new rent law, renewable by agreement.",
      ar: "عقد إيجار محدد المدة بالقانون الجديد، يُجدد بالاتفاق.",
    },
  },
  /** Added Oct 2026 at the client's request: they also handle old-law units. */
  {
    slug: "old-law",
    name: { en: "Old-law rent", ar: "إيجار قديم" },
    note: {
      en: "A lease under the old rent law, as it stands on the unit.",
      ar: "عقد إيجار بالقانون القديم كما هو قائم على الوحدة.",
    },
  },
] as const;

export type TenureSlug = (typeof tenures)[number]["slug"];

export const office = {
  /** From "Personal details" on their page. */
  address: {
    en: "Kaabish, El-Tawabeq, Faisal, Giza",
    ar: "كعابيش، الطوابق، فيصل، الجيزة",
  } satisfies I18nText,
  city: { en: "Giza", ar: "الجيزة" } satisfies I18nText,
  country: { en: "Egypt", ar: "مصر" } satisfies I18nText,
} as const;

export const social = {
  /**
   * Live since at least 21 Jan 2023. 878 followers, 292 posts.
   * Stored as the canonical profile URL rather than the /share/ link the
   * client sent: share links carry tracking parameters and expire, this one
   * does not. Resolved from https://www.facebook.com/share/1cJZfMgyWR/
   */
  facebook: "https://www.facebook.com/profile.php?id=100054555335500",
} as const;

/**
 * CONFIRMED by the client, Sept 2026.
 *
 * `whatsapp` is stored in the international form wa.me needs - country code,
 * no plus, no spaces. 01095115184 -> 201095115184.
 */
export const contact = {
  verified: true,
  whatsapp: "201095115184",
  phone: "+20 109 511 5184",
  /** As the client writes it locally, for the tel: link and print. */
  phoneLocal: "01095115184",
  email: "",
} as const;

/* -------------------------------------------------------------------------
   UNCONFIRMED - placeholders. Every one of these is listed in OPEN_QUESTIONS
   and must be replaced before launch. Nothing here is rendered as a factual
   claim anywhere on the site until `verified` flips to true.
   ------------------------------------------------------------------------- */

/**
 * The credibility strip on the home page renders ONLY the entries where
 * `verified` is true. An unverified number is never shown - inventing "500+
 * happy clients" is exactly the tell this project is paying to avoid.
 */
export const stats = {
  verified: false,
  yearsActive: null as number | null,
  unitsSold: null as number | null,
  teamSize: null as number | null,
  areasCovered: areas.length, // this one is real - it is the list above
} as const;

export const team: Array<{
  name: I18nText;
  role: I18nText;
  phone?: string;
  whatsapp?: string;
  photo?: string;
}> = []; // TODO: real faces. Real estate is a trust business.

export const testimonials: Array<{
  author: string;
  body: I18nText;
  sourceLabel: I18nText;
  sourceUrl?: string;
}> = []; // Their page shows "Not yet rated (0 reviews)" - nothing to quote yet.

/* -------------------------------------------------------------------------
   The nag list. Rendered on /admin and by `npm run facts`.
   ------------------------------------------------------------------------- */

export const OPEN_QUESTIONS = [
  {
    id: "photos",
    blocking: true,
    q: "Photography. Until real shoots land, unphotographed units render their own plan in survey ink rather than stock. Shot list is in docs/shot-list.md.",
  },
  {
    id: "brand-meaning",
    blocking: false,
    q: 'Does "الأسر" read as "the families"? If so the copy can lean on it honestly - they sell homes to families, not units to speculators. Confirm before it goes in the About page.',
  },
  {
    id: "rentals",
    blocking: true,
    q: 'The description says "للبيع والشراء" (sale and purchase) but the cover says "القانون الجديد" (new rent law). Do they list rentals, or only sales?',
  },
  { id: "years", blocking: false, q: "Year founded. Page is live since Jan 2023 - is the company older?" },
  { id: "units-sold", blocking: false, q: "Units sold to date, and average days to close, if they track it." },
  { id: "team", blocking: false, q: "Team names, roles and photographs." },
  { id: "social", blocking: false, q: "Instagram and TikTok, if they exist. Facebook is confirmed." },
  { id: "email", blocking: false, q: "A business email address, if they want one shown alongside WhatsApp." },
  { id: "logo", blocking: true, q: "Vector logo (SVG/AI/EPS). Currently redrawn from a screenshot - see components/brand/Mark.tsx." },
  { id: "testimonials", blocking: false, q: "Any written recommendations. Facebook shows 0 reviews; screenshots from WhatsApp or Messenger would work." },
] as const;
