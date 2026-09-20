"use client";

import Image from "next/image";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

import { PlanDrawing } from "./PlanDrawing";
import { envelopePath, partitionPath, planViewBox } from "@/lib/plan-geometry";
import { BLUR } from "@/content/photos";
import type { FloorPlan } from "@/lib/data/types";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * THE SIGNATURE.
 *
 * A pinned sequence in three beats:
 *
 *   1. THE ROOM   — the photograph, full frame.
 *   2. THE PLAN   — the plan draws itself over the photograph in survey ink,
 *                   then the photograph recedes and leaves the drawing alone.
 *   3. THE FLOOR  — the drawing tilts into isometric and the floors above and
 *                   below rise away from it.
 *
 * The first two beats are the brief's §6.5 exactly: a plan that draws itself
 * and then reconciles with the photographed room. It only became possible once
 * there was photography. The third is the only 3D on the site, and it earns
 * its place because an apartment IS one slab in a stack — "third floor of
 * nine" is the question straight after the price.
 *
 * Built from clip-path, opacity and transforms. No WebGL, no canvas, nothing
 * on the main thread but a compositor property.
 */
export function PlanDissolve({
  plan,
  locale,
  photoSrc,
  photoAlt,
  className,
  floorsAbove = 2,
  floorsBelow = 2,
}: {
  plan: FloorPlan;
  locale: Locale;
  photoSrc: string;
  photoAlt: string;
  className?: string;
  floorsAbove?: number;
  floorsBelow?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const t = useTranslations("home");

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // Beat 1 -> 2: the plan draws over the photograph.
  const draw = useTransform(scrollYProgress, [0.08, 0.44], [0, 1], { clamp: true });
  // The photograph recedes once the drawing can stand on its own.
  const photoOpacity = useTransform(scrollYProgress, [0.36, 0.56], [1, 0.06], { clamp: true });
  const photoScale = useTransform(scrollYProgress, [0, 0.56], [1.08, 1], { clamp: true });
  // Beat 3: the lift.
  const lift = useTransform(scrollYProgress, [0.64, 0.96], [0, 1], { clamp: true });
  const rotateX = useTransform(lift, [0, 1], [0, 54]);
  const rotateZ = useTransform(lift, [0, 1], [0, -22]);
  const scale = useTransform(lift, [0, 1], [1, 0.74]);
  const ghostOpacity = useTransform(lift, [0.15, 1], [0, 0.24], { clamp: true });
  const spread = useTransform(lift, [0, 1], [0, 1]);

  const stages = [t("dissolveStage1"), t("dissolveStage2"), t("dissolveStage3")];
  const stageIndex = useTransform(scrollYProgress, (v): number =>
    v < 0.36 ? 0 : v < 0.64 ? 1 : 2,
  );

  const above = Array.from({ length: floorsAbove }, (_, i) => i + 1);
  const below = Array.from({ length: floorsBelow }, (_, i) => -(i + 1));

  return (
    <div ref={ref} className={cn("relative h-[320vh]", className)}>
      <div className="sticky top-0 flex h-dvh flex-col items-center justify-center overflow-hidden px-4 sm:px-8">
        <div
          className="relative w-full max-w-4xl"
          style={{ perspective: "1600px", perspectiveOrigin: "50% 45%" }}
        >
          <motion.div
            className="relative"
            style={reduce ? undefined : { rotateX, rotateZ, scale, transformStyle: "preserve-3d" }}
          >
            {/* The room ------------------------------------------------- */}
            <motion.div
              className="absolute inset-0 overflow-hidden border border-navy-edge"
              style={reduce ? { opacity: 0.12 } : { opacity: photoOpacity, scale: photoScale }}
            >
              <Image
                src={photoSrc}
                alt={photoAlt}
                fill
                sizes="(max-width: 1024px) 92vw, 56rem"
                placeholder="blur"
                blurDataURL={BLUR}
                className="graded object-cover"
              />
              <div className="absolute inset-0 bg-navy/45" />
            </motion.div>

            {/* The floors above and below, once the stack lifts ---------- */}
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

            {/* The plan -------------------------------------------------- */}
            <div className="relative text-sheet" style={{ transform: "translateZ(0px)" }}>
              <PlanDrawing plan={plan} locale={locale} progress={draw} />
            </div>
          </motion.div>
        </div>

        {/* Where you are in the sequence. Three beats, and they are a real
            sequence, so numbering them is honest here. */}
        <div className="pointer-events-none mt-8 flex gap-6">
          {stages.map((label, i) => (
            <Stage key={label} label={label} index={i} current={stageIndex} reduce={!!reduce} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Stage({
  label,
  index,
  current,
  reduce,
}: {
  label: string;
  index: number;
  current: ReturnType<typeof useTransform<number, number>>;
  reduce: boolean;
}) {
  const opacity = useTransform(current, (v) => (v === index ? 1 : 0.32));

  return (
    <motion.span
      className="label flex items-center gap-2 text-giza"
      style={reduce ? { opacity: index === 0 ? 1 : 0.32 } : { opacity }}
    >
      <span className="font-data text-survey" dir="ltr">
        {String(index + 1).padStart(2, "0")}
      </span>
      {label}
    </motion.span>
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
