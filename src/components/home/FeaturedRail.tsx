"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";

import { PropertyCard } from "@/components/property/PropertyCard";
import type { FloorPlan, Property } from "@/lib/data/types";
import type { Locale } from "@/i18n/routing";

export type RailItem = { property: Property; plan: FloorPlan | null };

/**
 * Featured units as a pinned horizontal rail: the page pins, and vertical
 * scroll drives the units sideways.
 *
 * Two deliberate limits. It is used ONCE - the brief's "use once, not three
 * times" - and it is desktop only. Pinning fights native scroll on a phone,
 * so mobile gets a real swipeable rail with snap points instead, which is what
 * a thumb actually wants. Both render the same card.
 *
 * The travel distance is measured rather than guessed, so the last card always
 * lands flush against the right edge whatever the viewport or the card count.
 */
export function FeaturedRail({ items }: { items: RailItem[] }) {
  return (
    <>
      <PinnedRail items={items} />
      <SwipeRail items={items} />
    </>
  );
}

function PinnedRail({ items }: { items: RailItem[] }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("home");
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const rtl = locale === "ar";

  // Measure how far the track actually has to travel.
  useLayoutEffect(() => {
    const measure = () => {
      if (!trackRef.current) return;
      const overflow = trackRef.current.scrollWidth - window.innerWidth;
      setDistance(Math.max(overflow, 0));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [items.length]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 });
  // Under RTL the rail travels the other way, because "forward" is the other way.
  const x = useTransform(smooth, [0, 1], [0, rtl ? distance : -distance]);
  const progress = useTransform(smooth, [0, 1], ["0%", "100%"]);

  return (
    <div
      ref={sectionRef}
      className="relative hidden lg:block"
      style={{ height: `${Math.max(220, 120 + items.length * 46)}vh` }}
    >
      <div className="sticky top-0 flex h-dvh flex-col justify-center overflow-hidden">
        <div className="mx-auto mb-10 flex w-full max-w-[92rem] items-end justify-between gap-6 px-10">
          <div>
            <p className="label text-survey">{t("featuredLabel")}</p>
            <h2 className="mt-3 text-d2 text-sheet">{t("featuredTitle")}</h2>
          </div>
          <p className="label text-giza-dim">
            {t("railHint")}
          </p>
        </div>

        <motion.div
          ref={trackRef}
          className="flex w-max gap-8 px-10"
          style={reduce ? undefined : { x }}
        >
          {items.map(({ property, plan }, i) => (
            <div key={property._id} className="w-[34vw] max-w-[30rem] shrink-0">
              <PropertyCard
                property={property}
                plan={plan}
                priority={i < 2}
                sizes="34vw"
              />
            </div>
          ))}
        </motion.div>

        {/* Progress, as a dimension line. Same device as everything else. */}
        <div className="mx-auto mt-10 w-full max-w-[92rem] px-10">
          <div className="relative h-px w-full bg-navy-edge">
            <motion.div
              className="absolute inset-y-0 start-0 bg-survey"
              style={reduce ? { width: "100%" } : { width: progress }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mobile: a real rail your thumb can throw, with snap points. */
function SwipeRail({ items }: { items: RailItem[] }) {
  const t = useTranslations("home");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth;
      setProgress(max > 0 ? Math.abs(el.scrollLeft) / max : 0);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="lg:hidden">
      <div className="mx-auto w-full max-w-[92rem] px-4 sm:px-6">
        <p className="label text-survey">{t("featuredLabel")}</p>
        <h2 className="mt-3 text-d2 text-sheet">{t("featuredTitle")}</h2>
      </div>

      <div
        ref={scrollerRef}
        className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 sm:px-6"
      >
        {items.map(({ property, plan }, i) => (
          <div key={property._id} className="w-[82vw] max-w-sm shrink-0 snap-start">
            <PropertyCard property={property} plan={plan} priority={i === 0} sizes="82vw" />
          </div>
        ))}
      </div>

      <div className="mx-auto mt-6 w-full max-w-[92rem] px-4 sm:px-6">
        <div className="relative h-px w-full bg-navy-edge">
          <div
            className="absolute inset-y-0 start-0 bg-survey transition-[width] duration-150"
            style={{ width: `${Math.max(progress * 100, 8)}%` }}
          />
        </div>
      </div>
    </section>
  );
}
