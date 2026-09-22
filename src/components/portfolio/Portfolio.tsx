"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import type { PageFlip } from "page-flip";

import {
  AreasPage,
  BackCoverPage,
  ColophonPage,
  ContentsPage,
  CoverPage,
  EnquirePage,
  PlatePage,
  UnitPhotoPage,
  UnitSheetPage,
  type BookText,
  type BookUnit,
} from "./BookPages";
import { layoutBook } from "./layout";
import { cn } from "@/lib/utils";

/**
 * The portfolio: every listing bound as a drawing set.
 *
 * TWO DECISIONS THAT SHAPE THIS FILE
 *
 * 1. The flip engine (page-flip) moves DOM nodes into a structure of its own.
 *    If React owned those nodes, the first navigation or unmount would throw
 *    as React tried to remove children that were no longer where it left
 *    them. So React renders the pages into a hidden SOURCE, and the engine is
 *    handed CLONES inside a root React never touches. No ownership, no fight.
 *
 * 2. An Arabic book is bound on the right and turns the other way. Mirroring
 *    the book with CSS would break corner-dragging, because the engine reads
 *    pointer coordinates in its own un-mirrored space. Instead, in Arabic the
 *    page order is reversed and the book opens on its last page: the front
 *    cover then sits on the left and pages swing rightward - natively, so
 *    drag, swipe and the page shadows all keep working. "Next" becomes the
 *    engine's "previous", and the counter reads backwards to match.
 *
 * The engine is dynamically imported: nothing about it ships on any other
 * page of the site.
 */

const BASE_W = 480;
const BASE_H = 640;

export function Portfolio({
  units,
  text,
  rtl,
}: {
  units: BookUnit[];
  text: BookText;
  rtl: boolean;
}) {
  // Labels are read here rather than passed in: a formatting function cannot
  // cross from a Server Component into a Client one.
  const t = useTranslations("portfolio");
  const reduce = useReducedMotion();
  const layout = layoutBook(units.length);
  const sourceRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlip | null>(null);

  const [ready, setReady] = useState(false);
  const [engineIndex, setEngineIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [landscape, setLandscape] = useState(true);
  const [inView, setInView] = useState(false);

  /**
   * Reading position - the first page the reader's eye lands on, whichever
   * way the book is bound.
   *
   * In a two-page spread the engine reports the LEFT page. In a Western book
   * that is the first page read; in an Arabic one it is the second, so the raw
   * number would sit one ahead of the English counter for the same spread.
   * Stepping back one inside a spread makes both counters agree. Covers are
   * single pages and are left alone.
   */
  const reading = (() => {
    if (total === 0) return 0;
    if (!rtl) return engineIndex;
    const raw = total - 1 - engineIndex;
    return landscape && raw > 0 && raw < total - 1 ? raw - 1 : raw;
  })();
  const atStart = reading <= 0;
  const atEnd = total > 0 && reading >= total - 1;

  /* Mount the engine ---------------------------------------------- */
  useEffect(() => {
    let cancelled = false;
    let root: HTMLDivElement | null = null;
    let flip: PageFlip | null = null;

    (async () => {
      const { PageFlip } = await import("page-flip");
      if (cancelled || !mountRef.current || !sourceRef.current) return;

      root = document.createElement("div");
      root.className = "portfolio-book";
      mountRef.current.appendChild(root);

      const originals = Array.from(
        sourceRef.current.querySelectorAll<HTMLElement>(":scope > [data-book-page]"),
      );
      const ordered = rtl ? [...originals].reverse() : originals;
      const pages = ordered.map((node) => node.cloneNode(true) as HTMLElement);

      flip = new PageFlip(root, {
        width: BASE_W,
        height: BASE_H,
        size: "stretch",
        minWidth: 260,
        maxWidth: 620,
        minHeight: 346,
        maxHeight: 827,
        showCover: true,
        usePortrait: true,
        mobileScrollSupport: true,
        drawShadow: true,
        maxShadowOpacity: 0.45,
        // Under reduced motion the page simply changes; it does not fly.
        flippingTime: reduce ? 1 : 900,
        swipeDistance: 30,
        showPageCorners: !reduce,
        startPage: rtl ? pages.length - 1 : 0,
      });

      flip.loadFromHTML(pages);
      flip.on("flip", (event) => setEngineIndex(Number(event.data)));
      // A narrow screen shows one page at a time; the counter needs to know.
      flip.on("changeOrientation", (event) => {
        setLandscape(event.data === "landscape");
        setEngineIndex(flip?.getCurrentPageIndex() ?? 0);
      });

      flipRef.current = flip;
      setTotal(flip.getPageCount());
      setEngineIndex(flip.getCurrentPageIndex());
      setLandscape(flip.getOrientation() === "landscape");
      setReady(true);
    })();

    return () => {
      cancelled = true;
      try {
        flip?.destroy();
      } catch {
        /* the engine may already have torn its own DOM down */
      }
      root?.remove();
      flipRef.current = null;
      setReady(false);
    };
  }, [rtl, reduce, units.length]);

  /* Controls ------------------------------------------------------ */
  const goNext = useCallback(() => {
    const flip = flipRef.current;
    if (!flip || atEnd) return;
    if (rtl) flip.flipPrev();
    else flip.flipNext();
  }, [rtl, atEnd]);

  const goPrev = useCallback(() => {
    const flip = flipRef.current;
    if (!flip || atStart) return;
    if (rtl) flip.flipNext();
    else flip.flipPrev();
  }, [rtl, atStart]);

  const goCover = useCallback(() => {
    const flip = flipRef.current;
    if (!flip) return;
    flip.turnToPage(rtl ? flip.getPageCount() - 1 : 0);
    setEngineIndex(flip.getCurrentPageIndex());
  }, [rtl]);

  // Arrow keys turn the book - but only while it is on screen and nothing
  // editable has focus, so they never hijack a form field elsewhere.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.35,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || !ready) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true]")) return;
      // Reading-direction aware: in Arabic, left is forward.
      const forward = rtl ? "ArrowLeft" : "ArrowRight";
      const back = rtl ? "ArrowRight" : "ArrowLeft";
      if (event.key === forward) {
        event.preventDefault();
        goNext();
      } else if (event.key === back) {
        event.preventDefault();
        goPrev();
      } else if (event.key === "Home") {
        event.preventDefault();
        goCover();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inView, ready, rtl, goNext, goPrev, goCover]);

  return (
    <div ref={sectionRef}>
      {/* The book. Presentational: its content is duplicated as a real list
          of units with links right below, so assistive tech gets the same
          information without having to "turn" anything. */}
      <div className="relative mx-auto w-full max-w-[1240px]" aria-hidden="true">
        {/* Holds the space the book will occupy, so nothing jumps when the
            engine arrives, and shows the real cover until it does. */}
        {!ready && (
          <div className="mx-auto aspect-[3/4] w-full max-w-[520px] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
            <CoverPage text={text} />
          </div>
        )}
        <div ref={mountRef} className={cn(!ready && "absolute inset-0 opacity-0")} />
      </div>

      {/* Controls ----------------------------------------------------- */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={!ready || atStart}
          className="flex size-12 cursor-pointer items-center justify-center border border-navy-edge text-sheet transition-colors hover:border-survey hover:text-survey disabled:cursor-default disabled:opacity-30"
        >
          <span className="sr-only">{t("prev")}</span>
          <ChevronLeft className="size-5 rtl:rotate-180" strokeWidth={1.5} aria-hidden="true" />
        </button>

        <p
          className="label min-w-[7rem] text-center text-giza tabular-nums"
          aria-live="polite"
          dir="ltr"
        >
          {ready ? t("counter", { current: reading + 1, total }) : "—"}
        </p>

        <button
          type="button"
          onClick={goNext}
          disabled={!ready || atEnd}
          className="flex size-12 cursor-pointer items-center justify-center border border-navy-edge text-sheet transition-colors hover:border-survey hover:text-survey disabled:cursor-default disabled:opacity-30"
        >
          <span className="sr-only">{t("next")}</span>
          <ChevronRight className="size-5 rtl:rotate-180" strokeWidth={1.5} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={goCover}
          disabled={!ready || atStart}
          className="label ms-2 flex min-h-12 cursor-pointer items-center gap-2 border border-navy-edge px-4 text-giza transition-colors hover:border-survey hover:text-survey disabled:cursor-default disabled:opacity-30"
        >
          <BookOpen className="size-4" strokeWidth={1.5} aria-hidden="true" />
          {t("toCover")}
        </button>
      </div>

      <p className="label mt-4 text-center text-giza-dim/70" aria-hidden="true">
        {t("dragHint")}
      </p>

      {/* The source pages. Hidden and never interactive: the engine is given
          clones of these, so their images load only where they are seen. */}
      <div ref={sourceRef} hidden>
        <CoverPage text={text} />
        <ColophonPage text={text} n={1} />
        {layout.plate !== null && <PlatePage text={text} n={layout.plate} />}
        {layout.contents.map((page, i) => (
          <ContentsPage
            key={page.n}
            text={text}
            units={units.slice(page.start, page.end)}
            n={page.n}
            continued={i > 0}
          />
        ))}
        {units.flatMap((unit) => [
          <UnitPhotoPage key={`${unit.refCode}-p`} unit={unit} text={text} />,
          <UnitSheetPage key={`${unit.refCode}-s`} unit={unit} text={text} />,
        ])}
        <AreasPage text={text} n={layout.areasPage} />
        <EnquirePage text={text} n={layout.enquirePage} />
        <BackCoverPage text={text} />
      </div>
    </div>
  );
}
