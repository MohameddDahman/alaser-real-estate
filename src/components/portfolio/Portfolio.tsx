"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

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
import { bookPages, type BookPage } from "./layout";
import { BookEngine } from "./engine/book";
import { BLUR } from "@/content/photos";
import { isOptimisable } from "@/lib/images";
import { cn } from "@/lib/utils";

/**
 * The portfolio: every listing bound as a book on a desk.
 *
 * The page turning is our own (./engine): each page is simulated as a sheet
 * of paper - gravity, air, stiffness, a hand - and drawn as a curved surface
 * in 3D. This component is everything around it: the desk, the entrance as
 * the book rises off it, the book sliding to centre when it opens, the edges
 * of the page block, the controls and the strip of spreads.
 *
 * Sizes are CSS (see .pbook-frame in globals.css), so the server renders the
 * book at its final size and nothing moves when the engine arrives. On a
 * narrow screen the book stays a book - you look at one page of it at a time
 * and the view slides across as you read.
 */

export type SpreadMeta = {
  /** "Sheets 005–006 · Studio in the Third District" */
  label: string;
  /** "Cover", "005" - the tag on its thumbnail. */
  short: string;
  thumb: string | null;
  tone: "cover" | "paper" | "photo";
};

type Mode = "spread" | "single";
/** In single-page view: which page of the spread, in reading order. */
type Focus = "first" | "second";

export function Portfolio({
  units,
  text,
  spreads,
  rtl,
}: {
  units: BookUnit[];
  text: BookText;
  spreads: SpreadMeta[];
  rtl: boolean;
}) {
  const t = useTranslations("portfolio");
  const reduce = !!useReducedMotion();
  const dir: 1 | -1 = rtl ? -1 : 1;
  const pages = bookPages(units.length);
  const leafCount = spreads.length - 1;

  const stageRef = useRef<HTMLElement>(null);
  const colRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLSpanElement>(null);
  const stripRef = useRef<HTMLOListElement>(null);
  const engineRef = useRef<BookEngine | null>(null);

  const [ready, setReady] = useState(false);
  const [spread, setSpread] = useState(0);
  const [mode, setMode] = useState<Mode>("spread");
  const [focus, setFocus] = useState<Focus>("first");
  const [inView, setInView] = useState(false);
  const interacted = useRef(false);
  const peeked = useRef(false);
  const lastSpread = useRef(0);

  /* The entrance: lying back on the desk, rising to face the reader. ---- */
  const { scrollYProgress } = useScroll({ target: colRef, offset: ["start end", "start 0.3"] });
  const tilt = useTransform(scrollYProgress, (v) => {
    const k = 1 - Math.min(1, Math.max(0, v));
    return `perspective(1800px) translateY(${(k * 7).toFixed(3)}%) rotateX(${(k * 26).toFixed(3)}deg) scale(${(1 - k * 0.12).toFixed(4)})`;
  });

  /* Size, from the CSS ---------------------------------------------------- */
  const measure = useCallback(() => {
    const ruler = rulerRef.current;
    const col = colRef.current;
    if (!ruler || !col) return;
    const pw = ruler.offsetWidth;
    const ph = ruler.offsetHeight;
    if (!pw || !ph) return;
    setMode(col.offsetWidth > pw * 1.5 ? "spread" : "single");
    engineRef.current?.resize(pw, ph);
  }, []);

  useEffect(() => {
    const ruler = rulerRef.current;
    if (!ruler) return;
    const ro = new ResizeObserver(measure);
    ro.observe(ruler);
    if (colRef.current) ro.observe(colRef.current);
    return () => ro.disconnect();
  }, [measure]);

  /* The engine ------------------------------------------------------------ */
  useEffect(() => {
    const root = bookRef.current;
    const source = sourceRef.current;
    if (!root || !source) return;
    const nodes = Array.from(source.querySelectorAll<HTMLElement>(":scope > [data-book-page]"));
    const engine = new BookEngine(root, nodes, {
      dir,
      reduced: reduce,
      onChange: (s) => setSpread(s.spread),
    });
    engineRef.current = engine;
    if (process.env.NODE_ENV === "development") {
      (window as Window & { __book?: BookEngine }).__book = engine;
    }
    measure();
    setReady(true);
    return () => {
      engine.destroy();
      engineRef.current = null;
      setReady(false);
      setSpread(0);
    };
  }, [dir, reduce, units.length, measure]);

  // Reading forward lands you on the first page of the new spread; reading
  // back, on the second. Only matters when one page shows at a time.
  useEffect(() => {
    if (spread > lastSpread.current) setFocus("first");
    else if (spread < lastSpread.current) setFocus("second");
    lastSpread.current = spread;
  }, [spread]);

  /* Controls -------------------------------------------------------------- */
  const atCover = spread === 0;
  const atBack = spread === leafCount;
  const single = mode === "single";

  const next = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    interacted.current = true;
    if (single && !atCover && !atBack && focus === "first") return setFocus("second");
    if (atBack) return engine.goTo(0);
    engine.next();
  }, [single, atCover, atBack, focus]);

  const prev = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    interacted.current = true;
    if (single && !atCover && !atBack && focus === "second") return setFocus("first");
    engine.prev();
  }, [single, atCover, atBack, focus]);

  const goTo = useCallback((s: number) => {
    interacted.current = true;
    engineRef.current?.goTo(s);
  }, []);

  // Arrow keys turn the book - only while it is on screen and nothing
  // editable has focus. In Arabic, left is forward.
  useEffect(() => {
    const el = colRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.45,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || !ready) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("input, textarea, select, [contenteditable=true]")) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const forward = rtl ? "ArrowLeft" : "ArrowRight";
      const back = rtl ? "ArrowRight" : "ArrowLeft";
      if (event.key === forward) {
        event.preventDefault();
        next();
      } else if (event.key === back) {
        event.preventDefault();
        prev();
      } else if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
      } else if (event.key === "End") {
        event.preventDefault();
        goTo(leafCount);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inView, ready, rtl, next, prev, goTo, leafCount]);

  // The first time the closed book comes into view, the cover lifts a
  // little and drops back - twice - to show that it opens.
  useEffect(() => {
    if (!ready || reduce || !inView || peeked.current || interacted.current) return;
    peeked.current = true;
    const timers = [650, 2300].map((ms) =>
      window.setTimeout(() => {
        if (!interacted.current) engineRef.current?.peek();
      }, ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [ready, reduce, inView]);

  // Keep the current spread visible in the strip, without scrolling the page.
  useEffect(() => {
    const strip = stripRef.current;
    const item = strip?.children[spread] as HTMLElement | undefined;
    if (!strip || !item) return;
    const a = item.getBoundingClientRect();
    const b = strip.getBoundingClientRect();
    strip.scrollBy({
      left: a.left + a.width / 2 - (b.left + b.width / 2),
      behavior: reduce ? "auto" : "smooth",
    });
  }, [spread, reduce]);

  /* Layout state ---------------------------------------------------------- */
  // Where the book sits, in page widths. Closed, the cover is centred; open,
  // the spread is; one page at a time, whichever page you are reading.
  const unturnedK = -dir * 0.5;
  const turnedK = dir * 0.5;
  const slide = atCover
    ? unturnedK
    : atBack
      ? turnedK
      : single
        ? focus === "first"
          ? turnedK
          : unturnedK
        : 0;

  // The page block's visible edge on each side, from how much is there.
  const edge = (leaves: number) =>
    leaves <= 0 ? 0 : Math.max(1, Math.min(6, Math.ceil((leaves / leafCount) * 6)));
  const turnedEdge = edge(spread);
  const unturnedEdge = edge(leafCount - spread);
  const leftEdge = dir === 1 ? turnedEdge : unturnedEdge;
  const rightEdge = dir === 1 ? unturnedEdge : turnedEdge;
  const stack = (px: number, sign: 1 | -1) =>
    px === 0
      ? "none"
      : Array.from({ length: px }, (_, i) => `${sign * (i + 1)}px ${i + 1}px 0 ${i % 2 ? "#cbc4b4" : "#e8e4db"}`).join(", ");
  // Which halves have any book under them.
  const leftShown = leftEdge > 0;
  const rightShown = rightEdge > 0;

  const nextLabel = atCover ? t("openCover") : atBack ? t("toCover") : t("nextLabel");
  const nextShort = atCover ? t("openShort") : atBack ? t("toCover") : t("nextLabel");
  const canPrev = ready && !atCover;
  const progress = leafCount ? spread / leafCount : 0;

  return (
    <section
      ref={stageRef}
      aria-label={text.coverTitle}
      className="pbook-stage pbook-desk relative isolate overflow-x-clip py-14 text-ink sm:py-20"
    >
      <div className="pbook-frame relative mx-auto">
        <span
          ref={rulerRef}
          aria-hidden="true"
          className="pointer-events-none invisible absolute start-0 top-0"
          style={{ width: "var(--pw)", height: "var(--ph)" }}
        />

        {/* The book. Presentational: the same volume follows as a list of
            links, so nothing here needs to be reached by assistive tech. */}
        <div ref={colRef} className="pbook-col relative mx-auto" aria-hidden="true">
          <motion.div
            className="relative h-full w-full will-change-transform"
            style={reduce ? undefined : { transform: tilt, transformOrigin: "50% 100%" }}
          >
            <div
              className="absolute inset-0 transition-transform duration-[1100ms] ease-[cubic-bezier(0.65,0,0.35,1)]"
              style={{ transform: `translateX(calc(var(--pw) * ${slide}))` }}
              onPointerDown={() => {
                interacted.current = true;
              }}
            >
              <div
                className="absolute top-0 h-full"
                style={{ left: "50%", width: "calc(var(--pw) * 2)", marginLeft: "calc(var(--pw) * -1)" }}
              >
                {/* Under the pages: the shadow on the desk, and the edges of
                    the page block, thicker on whichever side has more. */}
                <div
                  className="pointer-events-none absolute inset-y-0 transition-[left,right] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ left: leftShown ? 0 : "50%", right: rightShown ? 0 : "50%" }}
                >
                  <span className="absolute inset-x-[6%] -bottom-[4%] h-[10%] rounded-[50%] bg-ink/40 blur-2xl" />
                  <span className="absolute inset-0 shadow-[0_50px_90px_-40px_rgba(10,13,24,0.6)]" />
                </div>
                <span
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[#efece5] transition-[box-shadow,opacity] duration-500"
                  style={{ boxShadow: stack(leftEdge, -1), opacity: leftShown ? 1 : 0 }}
                />
                <span
                  className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[#efece5] transition-[box-shadow,opacity] duration-500"
                  style={{ boxShadow: stack(rightEdge, 1), opacity: rightShown ? 1 : 0 }}
                />

                <div ref={bookRef} className="pbook" />

                {/* The cover, server-rendered where the engine will draw it,
                    so the book is there before any script runs. */}
                {!ready && (
                  <div
                    className="absolute top-0"
                    style={{ left: dir === 1 ? "var(--pw)" : 0, width: "var(--pw)", height: "var(--ph)" }}
                  >
                    <CoverPage text={text} />
                    <span className="pbook-gutter" data-side={dir === 1 ? "right" : "left"} data-hard="" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Controls ------------------------------------------------------ */}
        <div className="pbook-controls mx-auto mt-12 px-4 sm:px-0">
          <div className="relative h-px bg-ink/15">
            <span
              className="absolute inset-0 origin-left bg-survey-deep transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] rtl:origin-right"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>

          <div className="mt-5 grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-6">
            <button
              type="button"
              onClick={prev}
              disabled={!canPrev}
              aria-label={t("prev")}
              className="group inline-flex min-h-12 cursor-pointer items-center gap-3 px-1 transition-colors duration-300 hover:text-survey-deep disabled:cursor-default disabled:opacity-30 disabled:hover:text-ink"
            >
              <span aria-hidden="true" className="block h-px w-6 bg-current transition-all duration-500 group-hover:w-10 sm:w-8" />
              <span className="label hidden sm:inline">{t("prevLabel")}</span>
            </button>

            <p className="label truncate text-center text-ink/60" aria-live="polite">
              {spreads[spread]?.label}
            </p>

            <button
              type="button"
              onClick={next}
              disabled={!ready}
              aria-label={atCover || atBack ? undefined : t("next")}
              className="group inline-flex min-h-12 cursor-pointer items-center gap-3 bg-navy px-4 py-3 text-sheet transition-colors duration-300 hover:bg-survey-deep disabled:cursor-default disabled:opacity-40 sm:gap-4 sm:px-7"
            >
              <span className="label sm:hidden">{nextShort}</span>
              <span className="label hidden sm:inline">{nextLabel}</span>
              <span aria-hidden="true" className="block h-px w-6 bg-giza transition-all duration-500 group-hover:w-10 sm:w-8" />
            </button>
          </div>

          <p className="label mt-4 text-center text-ink/45">
            <span className="md:hidden">{t("hintTouch")}</span>
            <span className="hidden md:inline">{t("hintDesktop")}</span>
          </p>

          <ol
            ref={stripRef}
            aria-label={t("filmstrip")}
            className="no-scrollbar mt-6 flex snap-x gap-2 overflow-x-auto pb-3"
          >
            {spreads.map((s, i) => (
              <li key={i} className="shrink-0 snap-start">
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  disabled={!ready}
                  aria-label={t("goTo", { label: s.label })}
                  aria-current={i === spread ? "true" : undefined}
                  className={cn(
                    "relative flex h-12 w-20 cursor-pointer items-end overflow-hidden border transition-all duration-500 sm:h-14 sm:w-24",
                    i === spread
                      ? "border-survey-deep opacity-100 shadow-[0_8px_20px_-10px_rgba(10,13,24,0.6)]"
                      : "border-ink/15 opacity-60 hover:opacity-100",
                  )}
                >
                  {s.tone === "cover" && <span aria-hidden="true" className="absolute inset-0 bg-navy" />}
                  {s.tone === "paper" && <span aria-hidden="true" className="pbook-paper absolute inset-0" />}
                  {s.tone === "photo" && s.thumb && (
                    <Image
                      src={s.thumb}
                      alt=""
                      fill
                      sizes="96px"
                      placeholder="blur"
                      blurDataURL={BLUR}
                      unoptimized={!isOptimisable(s.thumb)}
                      className="graded object-cover"
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className="relative z-10 w-full bg-gradient-to-t from-ink/75 to-transparent px-1.5 pb-1 pt-4 text-start font-data text-[0.6rem] tracking-[0.08em] text-sheet"
                  >
                    {s.short}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* The source pages. Hidden and never interactive: the engine copies
          them into the book, so their images load only where they are seen. */}
      <div ref={sourceRef} hidden>
        {pages.map((page, i) => (
          <PageFor key={i} page={page} units={units} text={text} />
        ))}
      </div>
    </section>
  );
}

function PageFor({ page, units, text }: { page: BookPage; units: BookUnit[]; text: BookText }) {
  switch (page.kind) {
    case "cover":
      return <CoverPage text={text} />;
    case "colophon":
      return <ColophonPage text={text} n={page.n} />;
    case "plate":
      return <PlatePage text={text} n={page.n} />;
    case "contents":
      return (
        <ContentsPage
          text={text}
          units={units.slice(page.start, page.end)}
          n={page.n}
          continued={page.continued}
        />
      );
    case "photo":
      return <UnitPhotoPage unit={units[page.unit]} text={text} />;
    case "sheet":
      return <UnitSheetPage unit={units[page.unit]} text={text} />;
    case "areas":
      return <AreasPage text={text} n={page.n} />;
    case "enquire":
      return <EnquirePage text={text} n={page.n} />;
    case "back":
      return <BackCoverPage text={text} />;
  }
}
