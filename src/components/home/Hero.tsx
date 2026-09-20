"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowLeft } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Mark } from "@/components/brand/Mark";
import { SurveyGrid } from "./SurveyGrid";
import { TitleBlock } from "@/components/ui/TitleBlock";
import type { Locale } from "@/i18n/routing";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Hero entrance: one orchestrated sequence, once per session.
 *
 * The grid draws, the five area names arrive one at a time — five names for the
 * five areas, so even the stagger is carrying a fact — and the nav settles
 * last. Under 1.8s end to end. It reads as a title card, not a loading screen.
 *
 * The content itself is always in the DOM and always visible to a crawler; the
 * title card is an overlay on top, so nothing here costs LCP or SEO.
 */
export function Hero({ locale, unitCount }: { locale: Locale; unitCount: number }) {
  const t = useTranslations("home");
  const reduce = useReducedMotion();
  const [intro, setIntro] = useState(false);
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  useEffect(() => {
    if (reduce) return;
    try {
      if (sessionStorage.getItem("alaser:intro")) return;
      sessionStorage.setItem("alaser:intro", "1");
      setIntro(true);
    } catch {
      // Private mode or blocked storage: skip the card rather than replay it.
    }
  }, [reduce]);

  const line1 = t("heroLine1").split(" ");
  const line2 = t("heroLine2").split(" ");
  const base = intro ? 0.95 : 0.1;

  return (
    <section className="relative flex min-h-dvh flex-col justify-end overflow-hidden pt-28">
      <div className="pointer-events-none absolute inset-0 text-survey opacity-30">
        <SurveyGrid />
      </div>
      {/* Grounds the type without dimming the whole drawing. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-navy via-navy/85 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-navy to-transparent" />

      <div className="relative mx-auto w-full max-w-[92rem] px-4 pb-10 sm:px-6 lg:px-10 lg:pb-14">
        <motion.p
          className="label text-survey"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: base, duration: 0.6, ease: EASE }}
        >
          {t("heroEyebrow")}
        </motion.p>

        <h1 className="mt-5 text-d1 text-sheet">
          {[line1, line2].map((line, li) => (
            <span key={li} className="block overflow-hidden">
              {line.map((word, wi) => (
                <motion.span
                  key={`${li}-${wi}`}
                  className="inline-block"
                  initial={reduce ? false : { opacity: 0, y: "0.5em" }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: base + 0.18 + (li * line1.length + wi) * 0.085,
                    duration: 0.75,
                    ease: EASE,
                  }}
                >
                  {word}
                  {wi < line.length - 1 && " "}
                </motion.span>
              ))}
            </span>
          ))}
        </h1>

        <motion.div
          className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: base + 0.7, duration: 0.7, ease: EASE }}
        >
          <p className="measure text-lead text-giza">{t("heroBody")}</p>

          <Link
            href="/properties"
            className="group label inline-flex shrink-0 items-center gap-3 border border-giza-dim/50 px-6 py-4 text-sheet transition-colors duration-300 hover:border-survey hover:text-survey"
          >
            {t("heroCta")}
            <Arrow
              className="size-4 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </Link>
        </motion.div>
      </div>

      {/* The sheet's title block: what this drawing is of. */}
      <motion.div
        className="relative mx-auto w-full max-w-[92rem] px-4 pb-8 text-giza sm:px-6 lg:px-10"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: base + 0.95, duration: 0.8 }}
      >
        <TitleBlock
          fields={[
            { label: locale === "ar" ? "المناطق" : "Areas", value: "05", numeric: true },
            {
              label: locale === "ar" ? "معروض" : "Listed",
              value: String(unitCount).padStart(2, "0"),
              numeric: true,
            },
            { label: locale === "ar" ? "المحافظة" : "Governorate", value: locale === "ar" ? "الجيزة" : "Giza" },
            { label: locale === "ar" ? "الحيازة" : "Tenure", value: locale === "ar" ? "تمليك / جديد" : "Freehold / new-law" },
          ]}
        />
      </motion.div>

      {/* Title card. Decoration only — the page underneath is already rendered. */}
      {intro && !reduce && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-navy"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 0.85, duration: 0.55, ease: EASE }}
          onAnimationComplete={() => setIntro(false)}
          aria-hidden="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: [0, 1, 1], scale: [0.94, 1, 1] }}
            transition={{ duration: 0.85, times: [0, 0.45, 1], ease: EASE }}
            className="flex flex-col items-center text-sheet"
          >
            <Mark className="h-12 w-auto" />
            <span className="mt-4 font-display text-[0.9rem] leading-none tracking-[0.42em] [font-variation-settings:'wdth'_100,'wght'_500]">
              ALASER
            </span>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}
