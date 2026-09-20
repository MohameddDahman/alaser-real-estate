"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowRight, ArrowLeft } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Mark } from "@/components/brand/Mark";
import { SurveyGrid } from "./SurveyGrid";
import { TitleBlock } from "@/components/ui/TitleBlock";
import { RevealText, Magnetic } from "@/components/motion/primitives";
import { BLUR, HERO_PHOTOS, photo } from "@/content/photos";
import type { Locale } from "@/i18n/routing";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Hero.
 *
 * One orchestrated load sequence, once per session: the frame opens on Giza
 * from above, the survey grid draws itself across it in survey ink, the five
 * area names arrive one at a time, and the nav settles last.
 *
 * The grid over the photograph is the whole argument of the site in one image:
 * this agency sees the ground as a surveyed thing, at plot level, not as a
 * pretty picture. Neither layer would say that alone.
 *
 * On scroll the photograph drifts and scales while the type leaves faster,
 * which is what gives the opening depth rather than flatly sliding away.
 */
export function Hero({ locale, unitCount }: { locale: Locale; unitCount: number }) {
  const t = useTranslations("home");
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [intro, setIntro] = useState(false);
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.16]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const gridOpacity = useTransform(scrollYProgress, [0, 0.5], [0.42, 0]);

  useEffect(() => {
    if (reduce) return;
    try {
      if (sessionStorage.getItem("alaser:intro")) return;
      sessionStorage.setItem("alaser:intro", "1");
      setIntro(true);
    } catch {
      /* private mode: skip the card rather than replay it */
    }
  }, [reduce]);

  const base = intro ? 1.15 : 0.15;

  return (
    <section ref={ref} className="relative flex min-h-dvh flex-col justify-end overflow-hidden">
      {/* The photograph -------------------------------------------------- */}
      <motion.div
        className="absolute inset-0 -z-10"
        style={reduce ? undefined : { y: imageY, scale: imageScale }}
      >
        <motion.div
          className="absolute inset-0"
          initial={reduce ? false : { clipPath: "inset(14% 14% 14% 14%)" }}
          animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
          transition={{ duration: 1.6, delay: base - 0.1, ease: [0.65, 0, 0.35, 1] }}
        >
          <Image
            src={photo(HERO_PHOTOS[0], 2400)}
            alt={
              locale === "ar"
                ? "الجيزة من أعلى، والهرم في الأفق"
                : "Giza from above, with a pyramid on the horizon"
            }
            fill
            priority
            sizes="100vw"
            placeholder="blur"
            blurDataURL={BLUR}
            className="graded object-cover"
          />
        </motion.div>
      </motion.div>

      {/* The survey grid, drawn over the city it describes ---------------- */}
      <motion.div
        className="pointer-events-none absolute inset-0 -z-10 text-survey"
        style={reduce ? { opacity: 0.32 } : { opacity: gridOpacity }}
      >
        <SurveyGrid />
      </motion.div>

      {/* Grounding the type without flattening the photograph ------------- */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-navy via-navy/78 to-navy/25" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-navy/90 to-transparent" />

      <motion.div
        className="relative mx-auto w-full max-w-[92rem] px-4 pb-10 pt-32 sm:px-6 lg:px-10 lg:pb-14"
        style={reduce ? undefined : { y: contentY, opacity: contentOpacity }}
      >
        <motion.p
          className="label text-survey"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: base, duration: 0.7, ease: EASE }}
        >
          {t("heroEyebrow")}
        </motion.p>

        {/* Five area names, arriving one at a time — the stagger carries the
            fact that there are exactly five. */}
        <RevealText
          as="h1"
          lines={[t("heroLine1"), t("heroLine2")]}
          byWord
          delay={base + 0.15}
          stagger={0.075}
          className="mt-5 text-d1 text-sheet"
        />

        <motion.div
          className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: base + 0.75, duration: 0.8, ease: EASE }}
        >
          <p className="measure text-lead text-giza">{t("heroBody")}</p>

          <Magnetic>
            <Link
              href="/properties"
              className="group label inline-flex shrink-0 items-center gap-3 border border-giza-dim/50 bg-navy/30 px-7 py-4 text-sheet transition-colors duration-300 hover:border-survey hover:text-survey"
            >
              {t("heroCta")}
              <Arrow
                className="size-4 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </Link>
          </Magnetic>
        </motion.div>
      </motion.div>

      <motion.div
        className="relative mx-auto w-full max-w-[92rem] px-4 pb-8 text-giza sm:px-6 lg:px-10"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: base + 1, duration: 0.9 }}
        style={reduce ? undefined : { opacity: contentOpacity }}
      >
        <TitleBlock
          fields={[
            { label: locale === "ar" ? "المناطق" : "Areas", value: "05", numeric: true },
            {
              label: locale === "ar" ? "معروض" : "Listed",
              value: String(unitCount).padStart(2, "0"),
              numeric: true,
            },
            {
              label: locale === "ar" ? "المحافظة" : "Governorate",
              value: locale === "ar" ? "الجيزة" : "Giza",
            },
            {
              label: locale === "ar" ? "الحيازة" : "Tenure",
              value: locale === "ar" ? "تمليك / جديد" : "Freehold / new-law",
            },
          ]}
        />
      </motion.div>

      {/* Title card. Pure decoration — the page beneath is already rendered
          and already crawlable. */}
      {intro && !reduce && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-navy"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 1.05, duration: 0.6, ease: EASE }}
          onAnimationComplete={() => setIntro(false)}
          aria-hidden="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: [0, 1, 1], scale: [0.94, 1, 1] }}
            transition={{ duration: 1, times: [0, 0.4, 1], ease: EASE }}
            className="flex flex-col items-center text-sheet"
          >
            <Mark className="h-12 w-auto" />
            <span className="mt-4 font-display text-[0.9rem] leading-none tracking-[0.42em] [font-variation-settings:'wdth'_100,'wght'_500]">
              ALASER
            </span>
            <motion.span
              className="mt-6 block h-px bg-survey"
              initial={{ width: 0 }}
              animate={{ width: 120 }}
              transition={{ duration: 0.9, delay: 0.25, ease: EASE }}
            />
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}
