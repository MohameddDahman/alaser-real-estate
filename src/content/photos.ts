/**
 * PLACEHOLDER PHOTOGRAPHY.
 *
 * ── Read this before launch ────────────────────────────────────────────────
 * None of these images are the client's. They are licence-free Unsplash
 * photographs standing in so the client can see the finished design, and every
 * one of them must be replaced by a real shoot of the real unit before this
 * site goes live. Showing a stock interior on a listing for a specific flat at
 * a specific price implies it is that flat - which is both the "templated" tell
 * the brief warns about and a claim the agency cannot stand behind.
 *
 * `PHOTOS_ARE_PLACEHOLDERS` below drives a visible notice in admin and a badge
 * on listing pages, so nobody can forget. Flip it to false only when the
 * gallery arrays point at the client's own files.
 *
 * Replacement is mechanical: swap `src` for the Convex storage URL. Nothing
 * else changes - sizes, masks, the lightbox and the plan dissolve all read from
 * the same shape. Shot list: docs/shot-list.md
 * ───────────────────────────────────────────────────────────────────────────
 */

export const PHOTOS_ARE_PLACEHOLDERS = true;

const CDN = "https://images.unsplash.com/";

/** Unsplash serves any size from one id; next/image picks the width it needs. */
export function photo(id: string, width = 1600): string {
  return `${CDN}${id}?w=${width}&q=75&auto=format&fit=crop`;
}

/**
 * A single flat chip, the grey of an empty photo well. Every photograph
 * shares it, so nothing flashes while an image decodes.
 */
export const BLUR =
  "data:image/svg+xml;base64," +
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="6"><rect width="8" height="6" fill="#e6e9ef"/></svg>',
  ).toString("base64");

/* -------------------------------------------------------------------------
   The library, grouped by what the frame actually shows.
   ------------------------------------------------------------------------- */

export const LIB = {
  living: [
    "photo-1738168279272-c08d6dd22002",
    "photo-1666282167632-c613fbeb163c",
    "photo-1738168246881-40f35f8aba0a",
    "photo-1682184805271-11671b7ecf4c",
    "photo-1628592102751-ba83b0314276",
    "photo-1642976975710-1d8890dbf5ab",
    "photo-1647082550285-119acfd169f2",
    "photo-1603072845032-7b5bd641a82a",
    "photo-1737233459465-8eaf6c7d8856",
    "photo-1663756915304-40b7eda63e41",
    "photo-1758957701419-2c6e266f7988",
    "photo-1680416124510-5eae1beca412",
    "photo-1632119580908-ae947d4c7691",
    "photo-1649083048770-82e8ffd80431",
    "photo-1600210491741-a69593e43133",
    "photo-1631701601945-414a32dbef47",
  ],
  kitchen: [
    "photo-1502005097973-6a7082348e28",
    "photo-1512916194211-3f2b7f5f7de3",
    "photo-1663811396777-05505d999151",
    "photo-1671197244266-73129c97c096",
    "photo-1656402887556-e727ffe1f6d7",
    "photo-1635321350281-e2a91ecffd00",
    "photo-1759147960461-b74a7e9a75d4",
    "photo-1663811397261-916af74a9363",
    "photo-1643949915134-73a4c880f7c7",
    "photo-1643034738686-d69e7bc047e1",
    "photo-1592506119503-c0b18879bd5a",
    "photo-1610177534644-34d881503b83",
    "photo-1682662045815-9016c6225dd3",
    "photo-1725257928373-dc6d2ac7b145",
  ],
  bedroom: [
    "photo-1600210491305-7396500b5b31",
    "photo-1696762932825-2737db830bbe",
    "photo-1720420021124-4e18564e070f",
    "photo-1750420556288-d0e32a6f517b",
    "photo-1616594039964-ae9021a400a0",
    "photo-1644057501622-dfa7dd26dbfb",
    "photo-1757344454333-cc666252e596",
    "photo-1613685703237-6628de38ddb7",
    "photo-1662454419716-c4c504728811",
  ],
  view: [
    "photo-1688573484990-f805263ed6ad",
    "photo-1713799210416-593f9734af6a",
    "photo-1758092726610-f9faac2f62d1",
    "photo-1758792930399-72b6a7989891",
    "photo-1760119746975-14f419948d9c",
  ],
  city: [
    "photo-1572252009286-268acec5ca0a",
    "photo-1719659018185-8a239c35fb4a",
    "photo-1561778498-2d8ef2ade19e",
    "photo-1561714645-2b6505711ee0",
    "photo-1640956641338-5a07e5811ca6",
    "photo-1595979904086-471704dc0e81",
    "photo-1679238211153-546821b75f98",
    "photo-1724921812241-6554e4703ef0",
    "photo-1653140498578-efb4a8483928",
    "photo-1601411972811-a77044c3a428",
    "photo-1724921910233-002751d0d861",
    "photo-1686109896248-1f9908ed7f6d",
    "photo-1720400995876-506098f4c238",
  ],
  detail: ["photo-1614622350812-96b09c78af77"],
} as const;

export type LibKey = keyof typeof LIB;

/** The hero: Giza from above. The ground the whole business stands on. */
export const HERO_PHOTOS = [
  "photo-1679238211153-546821b75f98", // city with a pyramid on the horizon
  "photo-1640956641338-5a07e5811ca6", // dense urban cityscape
  "photo-1653140498578-efb4a8483928", // panorama from a tall building
] as const;

/** One image per area, used on /areas and the home schedule. */
export const AREA_PHOTOS: Record<string, string> = {
  faisal: "photo-1724921910233-002751d0d861",
  haram: "photo-1679238211153-546821b75f98",
  "hadayek-el-ahram": "photo-1601411972811-a77044c3a428",
  "6-october": "photo-1640956641338-5a07e5811ca6",
  "sheikh-zayed": "photo-1653140498578-efb4a8483928",
};

/**
 * Deterministic pick, so a given unit shows the same frames on every render
 * and between server and client. Never Math.random().
 */
function pick<T extends readonly string[]>(list: T, seed: number, offset = 0): string {
  return list[(seed + offset) % list.length];
}

export function seedFrom(key: string): number {
  let n = 0;
  for (let i = 0; i < key.length; i++) n = (n * 31 + key.charCodeAt(i)) >>> 0;
  return n;
}

export type PhotoSpec = { id: string; room: string };

/**
 * A gallery for one unit: the rooms the shot list asks for, in the order a
 * viewer walks through the flat. Commercial units get a different set.
 */
export function galleryFor(
  key: string,
  opts: { bedrooms: number; type: string },
): PhotoSpec[] {
  const s = seedFrom(key);

  if (opts.type === "shop" || opts.type === "cafe" || opts.type === "office") {
    return [
      { id: pick(LIB.living, s, 0), room: "floor" },
      { id: pick(LIB.living, s, 5), room: "floor" },
      { id: pick(LIB.kitchen, s, 2), room: "service" },
      { id: pick(LIB.city, s, 1), room: "street" },
    ];
  }

  const out: PhotoSpec[] = [
    { id: pick(LIB.living, s, 0), room: "reception" },
    { id: pick(LIB.living, s, 7), room: "reception" },
    { id: pick(LIB.kitchen, s, 0), room: "kitchen" },
  ];

  for (let i = 0; i < Math.min(Math.max(opts.bedrooms, 1), 3); i++) {
    out.push({ id: pick(LIB.bedroom, s, i * 3), room: i === 0 ? "master" : "bedroom" });
  }

  out.push({ id: pick(LIB.view, s, 0), room: "view" });
  out.push({ id: pick(LIB.city, s, 3), room: "exterior" });
  return out;
}

/**
 * The room vocabulary, shared by the alt-text generator and the admin photo
 * editor so the two can never drift. Controlled list, not free text - the
 * brief is explicit that these are a vocabulary.
 */
export const ROOM_KEYS = [
  "reception",
  "kitchen",
  "master",
  "bedroom",
  "view",
  "exterior",
  "floor",
  "service",
  "street",
] as const;

export type RoomKey = (typeof ROOM_KEYS)[number];

/** Room name in both languages. Drives alt text AND the admin room picker. */
export const ROOM_WORDS: Record<RoomKey, { en: string; ar: string }> = {
  reception: { en: "reception", ar: "الصالة" },
  kitchen: { en: "kitchen", ar: "المطبخ" },
  master: { en: "master bedroom", ar: "غرفة النوم الرئيسية" },
  bedroom: { en: "bedroom", ar: "غرفة النوم" },
  view: { en: "view from the balcony", ar: "الإطلالة من البلكونة" },
  exterior: { en: "building exterior", ar: "واجهة العمارة" },
  floor: { en: "shop floor", ar: "صالة العرض" },
  service: { en: "service area", ar: "منطقة الخدمات" },
  street: { en: "the street outside", ar: "الشارع بالخارج" },
};
