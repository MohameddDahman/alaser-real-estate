/**
 * Which remote images Next's optimiser is allowed to fetch.
 *
 * `next/image` refuses any hostname that is not declared in next.config, so an
 * image the client pastes from their own Facebook page or Drive would render
 * as a broken box. Rather than open the optimiser to `**` - which turns it
 * into an open image proxy anyone can bill us for - anything off-list is
 * rendered unoptimised. It still displays; it simply is not resized for us.
 *
 * Once Convex storage is wired, every image lives on a convex host and this
 * function returns true for all of them.
 */
const OPTIMISED_HOSTS = [
  "images.unsplash.com",
  ".convex.cloud",
  ".convex.site",
];

export function isOptimisable(src: string): boolean {
  // Anything served by us is already optimal.
  if (src.startsWith("/")) return true;

  try {
    const { hostname } = new URL(src);
    return OPTIMISED_HOSTS.some((host) =>
      host.startsWith(".") ? hostname.endsWith(host) : hostname === host,
    );
  } catch {
    return false;
  }
}

/** A usable image URL: https, or a path we serve ourselves. */
export function isValidImageSrc(src: string): boolean {
  const value = src.trim();
  if (value.startsWith("/")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}
