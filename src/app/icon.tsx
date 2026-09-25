import { ImageResponse } from "next/og";

import { BrandIcon } from "./brand-icon";

/**
 * The browser-tab icon: the logo's mark, in two sizes so it is crisp on
 * ordinary and high-density screens alike.
 */
export function generateImageMetadata() {
  return [32, 192].map((px) => ({
    id: String(px),
    size: { width: px, height: px },
    contentType: "image/png",
  }));
}

export default async function Icon({ id }: { id: string | Promise<string> }) {
  const px = Number(await id) || 32;
  return new ImageResponse(<BrandIcon size={px} radius={Math.round(px * 0.22)} />, {
    width: px,
    height: px,
  });
}
