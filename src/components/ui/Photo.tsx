"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { HouseLoader } from "./HouseLoader";
import { isOptimisable } from "@/lib/images";
import { cn } from "@/lib/utils";

/**
 * Every listing photograph renders through here: the one colour treatment,
 * and hosts the optimiser does not know rendered as-is rather than as a
 * broken box. It fills its parent, which sets the shape.
 *
 * Until the photograph arrives its well shows the house loader, drawn
 * beneath the image so the image covers it the moment it paints - even
 * before this component's script has run. Once loaded, the loader is
 * removed; if the image fails, the houses stay, at rest.
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
  const ref = useRef<HTMLImageElement>(null);
  const [state, setState] = useState<"loading" | "loaded" | "failed">("loading");

  // An image that finished before this script ran never fires onLoad.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete) setState(img.naturalWidth ? "loaded" : "failed");
    else setState("loading");
  }, [src]);

  return (
    <>
      {state !== "loaded" && (
        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
          <HouseLoader
            still={state === "failed"}
            className="h-[16%] max-h-9 min-h-4 text-fg-subtle/60"
          />
        </span>
      )}
      <Image
        ref={ref}
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={!isOptimisable(src)}
        onLoad={() => setState("loaded")}
        onError={() => setState("failed")}
        className={cn("graded object-cover", className)}
      />
    </>
  );
}
