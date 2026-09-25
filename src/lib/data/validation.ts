import type { GalleryImage, Property } from "./types";
import { BLUR, ROOM_KEYS, ROOM_WORDS, type RoomKey } from "@/content/photos";
import { isValidImageSrc } from "@/lib/images";

export const SITE_REQUIREMENTS = [
  "titleEn",
  "titleAr",
  "descriptionEn",
  "descriptionAr",
  "price",
] as const;
export type SiteRequirement = (typeof SITE_REQUIREMENTS)[number];

/**
 * What a unit still needs before visitors can see it: both languages, and a
 * price or "on request". The editor shows this as a checklist while the
 * client types, and the server refuses a visible status until it is empty -
 * a half-translated listing shows an Arabic visitor an empty page, which is
 * the failure this client would actually hit.
 *
 * Lives here rather than in the server-actions module because a `"use server"`
 * file may only export async functions, and the editor calls it too.
 */
export function missingForSite(
  unit: Pick<Property, "title" | "description" | "price">,
): SiteRequirement[] {
  const missing: SiteRequirement[] = [];
  if (!unit.title.en.trim()) missing.push("titleEn");
  if (!unit.title.ar.trim()) missing.push("titleAr");
  if (!unit.description.en.trim()) missing.push("descriptionEn");
  if (!unit.description.ar.trim()) missing.push("descriptionAr");
  if (!unit.price.onRequest && !unit.price.amount) missing.push("price");
  return missing;
}

/**
 * Turn what the photo editor submits into stored gallery rows.
 *
 * Runs on the server regardless of what the client checked. Two rules the
 * brief makes non-negotiable are enforced here rather than in the form:
 *
 *   - alt text exists in BOTH languages on every frame. If the client leaves
 *     one blank it is generated from the room and the unit, so a gallery can
 *     never ship with an empty alt.
 *   - `room` comes from the controlled vocabulary, never free text.
 *
 * Anything with an unusable src is dropped rather than saved broken.
 */
export function normaliseGallery(
  drafts: Array<{
    src?: string;
    altEn?: string;
    altAr?: string;
    room?: string;
    width?: number;
    height?: number;
    blurDataURL?: string;
  }>,
  ctx: { titleEn: string; titleAr: string; refCode: string },
): GalleryImage[] {
  return drafts
    .filter((d) => typeof d.src === "string" && isValidImageSrc(d.src))
    .slice(0, 40) // a sane ceiling; nobody shoots 200 frames of one flat
    .map((draft, order) => {
      const room = (ROOM_KEYS as readonly string[]).includes(draft.room ?? "")
        ? (draft.room as RoomKey)
        : undefined;
      const words = room ? ROOM_WORDS[room] : null;

      const fallbackEn = words
        ? `${words.en[0].toUpperCase()}${words.en.slice(1)} — ${ctx.titleEn}, ref ${ctx.refCode}`
        : `${ctx.titleEn}, ref ${ctx.refCode}`;
      const fallbackAr = words
        ? `${words.ar} — ${ctx.titleAr}، كود ${ctx.refCode}`
        : `${ctx.titleAr}، كود ${ctx.refCode}`;

      return {
        src: draft.src!.trim(),
        alt: {
          en: (draft.altEn ?? "").trim() || fallbackEn,
          ar: (draft.altAr ?? "").trim() || fallbackAr,
        },
        room,
        // An upload carries its real pixel size and a blur generated from the
        // photograph itself. A pasted URL carries neither, so it falls back to
        // a sane ratio and the shared navy chip - everything renders with
        // `fill` inside an aspect box, so the numbers only need to be sane.
        width: typeof draft.width === "number" && draft.width > 0
          ? Math.round(draft.width)
          : 1600,
        height: typeof draft.height === "number" && draft.height > 0
          ? Math.round(draft.height)
          : 1067,
        blurDataURL:
          typeof draft.blurDataURL === "string" && draft.blurDataURL.startsWith("data:image/")
            ? draft.blurDataURL
            : BLUR,
        order,
      } satisfies GalleryImage;
    });
}
