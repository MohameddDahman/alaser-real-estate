"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Sun, Moon } from "lucide-react";

import { StatusBadge } from "./StatusBadge";
import { BLUR, dayNightFor, photo } from "@/content/photos";
import type { PropertyStatus } from "@/lib/data/types";
import { cn } from "@/lib/utils";

/**
 * Unit hero.
 *
 * A full-bleed frame of the unit that drifts and scales as the page moves,
 * with the reference code, status and title set over it.
 *
 * The day / evening toggle is the brief's Tier 2 item and it is here because
 * it is real-estate-honest: light is what people are actually buying, and
 * compounds in October and Zayed get visited after Maghrib. Both frames are of
 * the same room so the switch reads as the light changing, not as a different
 * flat. The control is a pair of real buttons, so it works on a keyboard and
 * announces which state is current.
 */
export function UnitHero({
  slug,
  refCode,
  title,
  status,
  areaName,
  tenure,
  coverSrc,
  coverAlt,
}: {
  slug: string;
  refCode: string;
  title: string;
  status: PropertyStatus;
  areaName: string;
  tenure: string;
  coverSrc: string;
  coverAlt: string;
}) {
  const t = useTranslations("property");
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"day" | "night">("day");

  const pair = dayNightFor(slug);
  const src = mode === "day" ? coverSrc : photo(pair.night, 2000);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <div ref={ref} className="relative h-[78vh] min-h-[32rem] overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={reduce ? undefined : { y, scale }}
      >
        <AnimatePresence mode="sync">
          <motion.div
            key={mode}
            className="absolute inset-0"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={src}
              alt={coverAlt}
              fill
              priority
              sizes="100vw"
              placeholder="blur"
              blurDataURL={BLUR}
              className={cn(
                "graded object-cover",
                // The evening frame is pushed cooler and darker so the toggle
                // reads as time of day rather than a different photograph.
                mode === "night" && "brightness-[0.62] saturate-[0.7] contrast-[1.12]",
              )}
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-navy/25" />

      <motion.div
        className="absolute inset-x-0 bottom-0"
        style={reduce ? undefined : { y: textY }}
      >
        <div className="mx-auto w-full max-w-[92rem] px-4 pb-10 sm:px-6 lg:px-10 lg:pb-14">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <StatusBadge status={status} />
            <span className="label bg-navy/60 px-2.5 py-1.5 text-giza" dir="ltr">
              {t("ref")} {refCode}
            </span>
            <span className="label text-giza">
              {areaName} · {tenure}
            </span>
          </div>

          <h1 className="mt-5 max-w-4xl text-d1 text-sheet">{title}</h1>
        </div>
      </motion.div>

      {/* Day / evening */}
      <div
        className="absolute end-4 top-24 flex flex-col gap-px border border-navy-edge bg-navy/85 sm:end-6 lg:end-10"
        role="group"
        aria-label={t("lightToggle")}
      >
        {(["day", "night"] as const).map((value) => {
          const Icon = value === "day" ? Sun : Moon;
          const active = mode === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              aria-pressed={active}
              className={cn(
                "flex size-12 items-center justify-center transition-colors duration-200",
                active ? "bg-survey text-navy" : "text-giza hover:text-sheet",
              )}
            >
              <span className="sr-only">
                {value === "day" ? t("daylight") : t("evening")}
              </span>
              <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
