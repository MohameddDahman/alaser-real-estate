import { ImageResponse } from "next/og";

import { BrandIcon } from "./brand-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Saved to a phone's home screen. The phone rounds the corners itself. */
export default function AppleIcon() {
  return new ImageResponse(<BrandIcon size={180} radius={0} />, size);
}
