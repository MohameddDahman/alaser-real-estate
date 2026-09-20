"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

import { PlanDrawing } from "./PlanDrawing";
import { envelopePath, partitionPath, planViewBox } from "@/lib/plan-geometry";
import type { FloorPlan } from "@/lib/data/types";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * The 3D moment. Once, on the home page.
 *
 * The plan draws flat, then the sheet tilts into isometric and the floors above
 * and below rise away from it. That is not an effect looking for a reason: an
 * apartment IS one slab in a stack, and "third floor of nine" is the first
 * thing a buyer asks after the price. The drawing ends up saying it.
 *
 * Built from CSS `perspective` and `rotateX` on layered planes - no WebGL, no
 * canvas, nothing shipped to the main thread beyond a transform. It holds 60fps
 * on a Moto G and it is inert under prefers-reduced-motion.
 */
export function PlanStack({
  plan,
  locale,
  className,
  floorsAbove = 2,
  floorsBelow = 2,
}: {
  plan: FloorPlan;
  locale: Locale;
  className?: string;
  floorsAbove?: number;
  floorsBelow?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Draw, then a beat where the finished flat plan is readable, then lift.
  // Without that pause the labels arrive mid-tilt and nobody reads them.
  const draw = useTransform(scrollYProgress, [0.04, 0.52], [0, 1], { clamp: true });
  const lift = useTransform(scrollYProgress, [0.64, 0.96], [0, 1], { clamp: true });

  const rotateX = useTransform(lift, [0, 1], [0, 54]);
  const rotateZ = useTransform(lift, [0, 1], [0, -22]);
  const scale = useTransform(lift, [0, 1], [1, 0.76]);
  const ghostOpacity = useTransform(lift, [0.15, 1], [0, 0.26], { clamp: true });
  const spread = useTransform(lift, [0, 1], [0, 1]);

  const above = Array.from({ length: floorsAbove }, (_, i) => i + 1);
  const below = Array.from({ length: floorsBelow }, (_, i) => -(i + 1));

  return (
    <div ref={ref} className={cn("relative h-[260vh]", className)}>
      <div className="sticky top-0 flex h-dvh items-center justify-center px-4 sm:px-8">
        <div
          className="relative w-full max-w-4xl"
          style={{ perspective: "1600px", perspectiveOrigin: "50% 45%" }}
        >
          <motion.div
            className="relative"
            style={
              reduce
                ? undefined
                : { rotateX, rotateZ, scale, transformStyle: "preserve-3d" }
            }
          >
            {/* Floors below and above, as ghost slabs. They only exist once the
                stack lifts, so the flat drawing stays clean while it is read. */}
            {[...below, ...above].map((offset) => (
              <GhostFloor
                key={offset}
                plan={plan}
                offset={offset}
                spread={spread}
                opacity={ghostOpacity}
                reduce={!!reduce}
              />
            ))}

            {/* The unit itself */}
            <div className="relative text-sheet" style={{ transform: "translateZ(0px)" }}>
              <PlanDrawing plan={plan} locale={locale} progress={draw} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function GhostFloor({
  plan,
  offset,
  spread,
  opacity,
  reduce,
}: {
  plan: FloorPlan;
  offset: number;
  spread: ReturnType<typeof useTransform<number, number>>;
  opacity: ReturnType<typeof useTransform<number, number>>;
  reduce: boolean;
}) {
  const z = useTransform(spread, [0, 1], [0, offset * 150]);

  return (
    <motion.svg
      viewBox={planViewBox(plan)}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-auto w-full overflow-visible text-survey"
      style={reduce ? { opacity: 0 } : { opacity, z }}
    >
      <path d={envelopePath(plan)} fill="none" stroke="currentColor" strokeWidth={14} />
      <path
        d={partitionPath(plan)}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.5}
        strokeWidth={7}
      />
    </motion.svg>
  );
}
