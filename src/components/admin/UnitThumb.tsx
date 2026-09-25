import Image from "next/image";

import { BLUR } from "@/content/photos";
import { isOptimisable } from "@/lib/images";
import { cn } from "@/lib/utils";

/**
 * Unit thumbnail for the dashboard.
 *
 * The client recognises a flat by the room, not by "ALS-0412", so every row
 * that names a unit shows one - graded exactly as the public site grades it,
 * because a dashboard picture that does not match what publishes is worse
 * than none. A unit with no photograph at all gets a quiet empty frame.
 */
export function UnitThumb({
  src,
  className,
  sizes = "6rem",
}: {
  src?: string;
  className?: string;
  sizes?: string;
}) {
  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-md bg-surface-2",
        className,
      )}
    >
      {src && (
        <Image
          src={src}
          alt=""
          fill
          sizes={sizes}
          placeholder="blur"
          blurDataURL={BLUR}
          unoptimized={!isOptimisable(src)}
          className="graded object-cover"
        />
      )}
    </span>
  );
}
