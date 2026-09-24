import Image from "next/image";

import { BLUR } from "@/content/photos";
import { isOptimisable } from "@/lib/images";
import { cn } from "@/lib/utils";

/**
 * Every listing photograph renders through here: the shared placeholder, the
 * one colour treatment, and hosts the optimiser does not know rendered as-is
 * rather than as a broken box. It fills its parent, which sets the shape.
 */
export function Photo({
  src,
  alt,
  sizes,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      placeholder="blur"
      blurDataURL={BLUR}
      unoptimized={!isOptimisable(src)}
      className={cn("graded object-cover", className)}
    />
  );
}
