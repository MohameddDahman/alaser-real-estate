"use client";

import { useRef } from "react";
import { useScroll } from "motion/react";

import { PlanDrawing } from "./PlanDrawing";
import type { FloorPlan } from "@/lib/data/types";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Unit-page plan: it simply draws as you reach it. No tilt, no extras.
 * The 3D moment happens once, on the home page, and nowhere else - one
 * orchestrated moment beats eight scattered effects.
 */
export function PlanScroll({
  plan,
  locale,
  className,
}: {
  plan: FloorPlan;
  locale: Locale;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "end 0.55"],
  });

  return (
    <div ref={ref} className={cn("w-full", className)}>
      <PlanDrawing plan={plan} locale={locale} progress={scrollYProgress} />
    </div>
  );
}
