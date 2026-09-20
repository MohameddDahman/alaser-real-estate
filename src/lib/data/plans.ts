import type { FloorPlan } from "./types";

/**
 * Plan templates.
 *
 * These are schematic but honest: the proportions are the ones this stock
 * actually has - a dominant صالة, a kitchen and guest WC off it, bedrooms
 * behind a short corridor. Rooms deliberately do not tile the envelope; the
 * leftover IS the circulation, which is how a plan reads on paper.
 *
 * 100 units = 1 metre. Areas are computed by roomArea(), never typed by hand.
 */

export const PLAN_APT_3BR: FloorPlan = {
  id: "apt-3br",
  label: { en: "Floor plan", ar: "مخطط الوحدة" },
  width: 1400,
  height: 1100,
  north: 0,
  rooms: [
    {
      key: "reception",
      label: { en: "Reception", ar: "صالة" },
      x: 20, y: 20, w: 660, h: 520,
      kind: "living",
      door: { edge: "right", at: 340 },
    },
    {
      key: "kitchen",
      label: { en: "Kitchen", ar: "مطبخ" },
      x: 700, y: 20, w: 340, h: 320,
      kind: "service",
      door: { edge: "bottom", at: 120 },
    },
    {
      key: "guest-wc",
      label: { en: "Guest WC", ar: "حمام ضيوف" },
      x: 1060, y: 20, w: 320, h: 320,
      kind: "wet",
      door: { edge: "bottom", at: 90 },
    },
    {
      key: "bed-2",
      label: { en: "Bedroom 2", ar: "غرفة نوم ٢" },
      x: 20, y: 660, w: 320, h: 420,
      kind: "sleep",
      door: { edge: "top", at: 110 },
    },
    {
      key: "bed-3",
      label: { en: "Bedroom 3", ar: "غرفة نوم ٣" },
      x: 360, y: 660, w: 320, h: 420,
      kind: "sleep",
      door: { edge: "top", at: 110 },
    },
    {
      key: "master",
      label: { en: "Master bedroom", ar: "غرفة النوم الرئيسية" },
      x: 700, y: 660, w: 420, h: 420,
      kind: "sleep",
      door: { edge: "top", at: 140 },
    },
    {
      key: "en-suite",
      label: { en: "En-suite", ar: "حمام رئيسي" },
      x: 1140, y: 660, w: 240, h: 420,
      kind: "wet",
      door: { edge: "left", at: 120 },
    },
  ],
};

export const PLAN_APT_2BR: FloorPlan = {
  id: "apt-2br",
  label: { en: "Floor plan", ar: "مخطط الوحدة" },
  width: 1200,
  height: 900,
  north: 45,
  rooms: [
    {
      key: "reception",
      label: { en: "Reception", ar: "صالة" },
      x: 20, y: 20, w: 560, h: 440,
      kind: "living",
      door: { edge: "right", at: 280 },
    },
    {
      key: "kitchen",
      label: { en: "Kitchen", ar: "مطبخ" },
      x: 620, y: 20, w: 300, h: 280,
      kind: "service",
      door: { edge: "bottom", at: 100 },
    },
    {
      key: "bath",
      label: { en: "Bathroom", ar: "حمام" },
      x: 940, y: 20, w: 240, h: 280,
      kind: "wet",
      door: { edge: "bottom", at: 80 },
    },
    {
      key: "bed-2",
      label: { en: "Bedroom 2", ar: "غرفة نوم ٢" },
      x: 20, y: 560, w: 350, h: 320,
      kind: "sleep",
      door: { edge: "top", at: 120 },
    },
    {
      key: "master",
      label: { en: "Master bedroom", ar: "غرفة النوم الرئيسية" },
      x: 620, y: 560, w: 340, h: 320,
      kind: "sleep",
      door: { edge: "top", at: 130 },
    },
    {
      key: "bath-2",
      label: { en: "En-suite", ar: "حمام رئيسي" },
      x: 980, y: 560, w: 200, h: 320,
      kind: "wet",
      door: { edge: "left", at: 100 },
    },
  ],
};

export const PLAN_VILLA_GF: FloorPlan = {
  id: "villa-gf",
  label: { en: "Ground floor", ar: "الدور الأرضي" },
  width: 1500,
  height: 1200,
  north: 315,
  rooms: [
    {
      key: "reception",
      label: { en: "Reception", ar: "ريسبشن" },
      x: 20, y: 20, w: 700, h: 560,
      kind: "living",
      door: { edge: "right", at: 360 },
    },
    {
      key: "dining",
      label: { en: "Dining", ar: "غرفة طعام" },
      x: 760, y: 20, w: 380, h: 340,
      kind: "living",
      door: { edge: "bottom", at: 140 },
    },
    {
      key: "kitchen",
      label: { en: "Kitchen", ar: "مطبخ" },
      x: 1180, y: 20, w: 300, h: 340,
      kind: "service",
      door: { edge: "bottom", at: 110 },
    },
    {
      key: "study",
      label: { en: "Study", ar: "مكتب" },
      x: 760, y: 400, w: 380, h: 180,
      kind: "living",
      door: { edge: "bottom", at: 140 },
    },
    {
      key: "guest-wc",
      label: { en: "Guest WC", ar: "حمام ضيوف" },
      x: 1180, y: 400, w: 300, h: 180,
      kind: "wet",
      door: { edge: "left", at: 60 },
    },
    {
      key: "bed-1",
      label: { en: "Bedroom 1", ar: "غرفة نوم ١" },
      x: 20, y: 700, w: 420, h: 480,
      kind: "sleep",
      door: { edge: "top", at: 150 },
    },
    {
      key: "bath",
      label: { en: "Bathroom", ar: "حمام" },
      x: 480, y: 700, w: 240, h: 480,
      kind: "wet",
      door: { edge: "top", at: 90 },
    },
    {
      key: "bed-2",
      label: { en: "Bedroom 2", ar: "غرفة نوم ٢" },
      x: 760, y: 700, w: 420, h: 480,
      kind: "sleep",
      door: { edge: "top", at: 150 },
    },
    {
      key: "stair",
      label: { en: "Stair", ar: "سلم" },
      x: 1220, y: 700, w: 260, h: 480,
      kind: "circulation",
    },
  ],
};

export const PLAN_SHOP: FloorPlan = {
  id: "shop",
  label: { en: "Unit plan", ar: "مخطط المحل" },
  width: 700,
  height: 900,
  north: 90,
  rooms: [
    {
      key: "floor",
      label: { en: "Shop floor", ar: "صالة العرض" },
      x: 20, y: 20, w: 660, h: 620,
      kind: "living",
      door: { edge: "top", at: 260 },
    },
    {
      key: "store",
      label: { en: "Storage", ar: "مخزن" },
      x: 20, y: 700, w: 400, h: 180,
      kind: "service",
      door: { edge: "top", at: 150 },
    },
    {
      key: "wc",
      label: { en: "WC", ar: "دورة مياه" },
      x: 460, y: 700, w: 220, h: 180,
      kind: "wet",
      door: { edge: "top", at: 70 },
    },
  ],
};

export const PLANS = {
  "apt-3br": PLAN_APT_3BR,
  "apt-2br": PLAN_APT_2BR,
  "villa-gf": PLAN_VILLA_GF,
  shop: PLAN_SHOP,
} as const;

export type PlanId = keyof typeof PLANS;
