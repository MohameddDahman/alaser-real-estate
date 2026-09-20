"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { areas } from "@/content/client-facts";
import { AREA_PHOTOS, BLUR, photo } from "@/content/photos";
import type { Locale } from "@/i18n/routing";
import type { AreaSlug } from "@/content/client-facts";

/**
 * The five areas, set as a schedule — the table every drawing set carries.
 *
 * On a pointer device, hovering a row summons that area's photograph and it
 * tracks the cursor. It is the one purely pleasurable effect on the site, and
 * it earns its place: it lets someone scan five areas as text while still
 * seeing each one, without five images competing for the same page.
 *
 * Touch gets a thumbnail in the row instead, because there is no hover to
 * depend on and a row that does nothing is a broken row.
 */
export function AreaShowcase({ counts }: { counts: Record<AreaSlug, number> }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("home");
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 30, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 260, damping: 30, mass: 0.5 });

  return (
    <div
      ref={wrapRef}
      className="relative"
      onPointerMove={(event) => {
        if (reduce || event.pointerType !== "mouse" || !wrapRef.current) return;
        const rect = wrapRef.current.getBoundingClientRect();
        x.set(event.clientX - rect.left);
        y.set(event.clientY - rect.top);
      }}
      onPointerLeave={() => setActive(null)}
    >
      {/* The follower. Pointer devices only. */}
      {!reduce && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 z-20 hidden lg:block"
          style={{ x: sx, y: sy }}
        >
          <AnimatePresence>
            {active && (
              <motion.div
                key={active}
                initial={{ opacity: 0, scale: 0.88, rotate: -3 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.92, rotate: 2 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                className="relative -ms-[13rem] -mt-[8rem] h-[16rem] w-[26rem] overflow-hidden border border-navy-edge"
              >
                <Image
                  src={photo(AREA_PHOTOS[active], 900)}
                  alt=""
                  fill
                  sizes="26rem"
                  placeholder="blur"
                  blurDataURL={BLUR}
                  className="graded object-cover"
                />
                <div className="absolute inset-0 bg-navy/25" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <ul className="relative border-t border-navy-edge">
        {areas.map((area) => (
          <li key={area.slug}>
            <Link
              href={{ pathname: "/properties", query: { area: area.slug } }}
              onPointerEnter={() => setActive(area.slug)}
              onFocus={() => setActive(area.slug)}
              className="group relative grid gap-x-6 gap-y-3 border-b border-navy-edge py-6 transition-colors duration-500 hover:bg-navy-lift/30 sm:grid-cols-[6rem_minmax(0,14rem)_1fr_auto] sm:items-center lg:py-8"
            >
              {/* Touch thumbnail — the row must never be dead on a phone. */}
              <span className="relative block h-16 w-24 overflow-hidden border border-navy-edge sm:h-14 sm:w-20 lg:hidden">
                <Image
                  src={photo(AREA_PHOTOS[area.slug], 320)}
                  alt=""
                  fill
                  sizes="6rem"
                  placeholder="blur"
                  blurDataURL={BLUR}
                  className="graded object-cover"
                />
              </span>
              <span className="hidden sm:block lg:block" aria-hidden="true" />

              <h3 className="text-d3 text-sheet transition-colors duration-300 group-hover:text-survey">
                {area.name[locale]}
              </h3>

              <p className="text-giza-dim">{area.character[locale]}</p>

              <p className="label flex items-center gap-3 whitespace-nowrap text-giza">
                {t("areasUnits", { count: counts[area.slug] })}
                <Arrow
                  className="size-3.5 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 rtl:group-hover:-translate-x-1"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
