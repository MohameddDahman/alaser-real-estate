import type { GalleryImage, Property } from "./types";
import { BLUR, ROOM_KEYS, ROOM_WORDS, type RoomKey } from "@/content/photos";
import { isValidImageSrc } from "@/lib/images";

/**
 * Which bilingual fields are still empty.
 *
 * Publishing is blocked on this list and the admin names the missing fields
 * rather than just refusing - a half-translated listing shows an Arabic
 * visitor an empty page, and that is the failure mode this client will
 * actually hit.
 *
 * Lives here rather than in the server-actions module because a `"use server"`
 * file may only export async functions, and this is a plain predicate that the
 * editor and the dashboard both want to call.
 */
export function missingBilingualFields(property: Property): string[] {
  const missing: string[] = [];
  if (!property.title.en.trim() || !property.title.ar.trim()) missing.push("title");
  if (!property.description.en.trim() || !property.description.ar.trim()) {
    missing.push("description");
  }
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
  drafts: Array<{ src?: string; altEn?: string; altAr?: string; room?: string }>,
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
        // Pasted URLs carry no intrinsic size. Everything renders with `fill`
        // inside an aspect box, so these only need to be a sane ratio.
        width: 1600,
        height: 1067,
        blurDataURL: BLUR,
        order,
      } satisfies GalleryImage;
    });
}
