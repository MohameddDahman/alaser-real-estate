import Image from "next/image";

import { PlanPlate } from "@/components/plan/PlanPlate";
import { BLUR } from "@/content/photos";
import type { FloorPlan, GalleryImage } from "@/lib/data/types";
import { isOptimisable } from "@/lib/images";
import { cn } from "@/lib/utils";

/**
 * Unit thumbnail for the dashboard.
 *
 * The client recognises a flat by the room, not by "ALS-0412", so every row
 * that names a unit shows one. Graded exactly as the public site grades it,
 * because an admin preview that does not match what publishes is worse than
 * no preview.
 *
 * Falls back to the unit's plan when there is no photograph at all, so the
 * cell is never an empty box.
 */
export function UnitThumb({
  image,
  plan,
  className,
  sizes = "6rem",
  count,
}: {
  image?: GalleryImage;
  plan?: FloorPlan | null;
  className?: string;
  sizes?: string;
  /** Shown as a badge so the client can see at a glance how many frames a
   *  unit has - the fastest way to spot a listing that is short on photos. */
  count?: number;
}) {
  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden border border-sheet-edge bg-navy",
        className,
      )}
    >
      {image ? (
        <Image
          src={image.src}
          alt=""
          fill
          sizes={sizes}
          placeholder="blur"
          blurDataURL={BLUR}
          unoptimized={!isOptimisable(image.src)}
          className="graded object-cover"
        />
      ) : plan ? (
        <span className="absolute inset-0 block p-1.5 text-survey/70">
          <PlanPlate plan={plan} />
        </span>
      ) : null}

      {count !== undefined && count > 0 && (
        <span
          className="absolute bottom-0 end-0 bg-navy/85 px-1.5 py-0.5 font-data text-[0.6rem] leading-none text-giza tabular-nums"
          dir="ltr"
        >
          {count}
        </span>
      )}
    </span>
  );
}
