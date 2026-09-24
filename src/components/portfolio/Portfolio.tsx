"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
 * The page turning is our own (./engine): a page turns the way a magazine's
 * does, by its corner - folded along a clean line with a gloss where it curls
 * over and a soft shadow on the page it uncovers. This component is
 * everything around it: the desk, the entrance as the book rises off it, the
 * book sliding to centre when it opens, the edges of the page block, the
 * controls and the strip of spreads.
 *
 * Sizes are CSS (see .pbook-frame in globals.css), so the server renders the
 * book at its final size and nothing moves when the engine arrives. On a
 * phone the book is read a page at a time: each page folds away past the
 * spine and the next lies beneath.
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

export function Portfolio({
  units,
  text,
  spreads,
  pageLabels,
  rtl,
}: {
  units: BookUnit[];
  text: BookText;
  spreads: SpreadMeta[];
  /** One per page, for reading a page at a time. */
  pageLabels: string[];
  rtl: boolean;
}) {
  const t = useTranslations("portfolio");
  const reduce = !!useReducedMotion();
  const dir: 1 | -1 = rtl ? -1 : 1;
  const pages = bookPages(units.length);
  const leafCount = spreads.length - 1;
  const lastPage = pages.length - 1;

  const stageRef = useRef<HTMLElement>(null);
  const colRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLSpanElement>(null);
  const stripRef = useRef<HTMLOListElement>(null);
  const engineRef = useRef<BookEngine | null>(null);

  const [ready, setReady] = useState(false);
  /** Unknown until measured; the server renders the closed book either way. */
  const [mode, setMode] = useState<Mode | null>(null);
  /** The engine's reading position: spreads open, or pages turned. */
  const [pos, setPos] = useState(0);
  const [inView, setInView] = useState(false);
  const interacted = useRef(false);
  const peeked = useRef(false);
  /** Where the reader is, kept across a switch between the two ways of reading. */
  const place = useRef<{ mode: Mode | null; pos: number }>({ mode: null, pos: 0 });

  // Spread s opens on its first page, p; page p belongs to spread s.
  const pageOf = useCallback(
    (s: number) => (s <= 0 ? 0 : s >= leafCount ? lastPage : s * 2 - 1),
    [leafCount, lastPage],
  );
  const spreadOf = useCallback(
    (p: number) => (p <= 0 ? 0 : p >= lastPage ? leafCount : Math.ceil(p / 2)),
    [leafCount, lastPage],
  );

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
  // Built for whichever way the book is being read, and rebuilt - at the
  // same place in the book - when that changes.
  useEffect(() => {
    const root = bookRef.current;
    const source = sourceRef.current;
    if (!root || !source || !mode) return;
    const nodes = Array.from(source.querySelectorAll<HTMLElement>(":scope > [data-book-page]"));
    const was = place.current;
    const start =
      was.mode === null || was.mode === mode
        ? was.pos
        : mode === "single"
          ? pageOf(was.pos)
          : spreadOf(was.pos);
    place.current = { mode, pos: start };
    setPos(start);
    const engine = new BookEngine(root, nodes, {
      dir,
      reduced: reduce,
      single: mode === "single",
      start,
      onChange: (s) => {
        place.current = { mode, pos: s.position };
        setPos(s.position);
      },
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
    };
  }, [dir, reduce, mode, units.length, measure, pageOf, spreadOf]);

  /* Controls -------------------------------------------------------------- */
  const single = mode === "single";
  const spread = single ? spreadOf(pos) : pos;
  const atCover = pos === 0;
  const atBack = single ? pos >= lastPage : pos >= leafCount;

  const next = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    interacted.current = true;
    if (atBack) return engine.goTo(0);
    engine.next();
  }, [atBack]);

  const prev = useCallback(() => {
    interacted.current = true;
    engineRef.current?.prev();
  }, []);

  /** Go to a spread - its first page, when reading a page at a time. */
  const goTo = useCallback(
    (s: number) => {
      interacted.current = true;
      engineRef.current?.goTo(single ? pageOf(s) : s);
    },
    [single, pageOf],
  );

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
  // the spread is. A page at a time, the page is - always, and the view
  // never moves: pages leave past the spine and come back from it.
  const unturnedK = -dir * 0.5;
  const turnedK = dir * 0.5;
  const slide = single || atCover ? unturnedK : atBack ? turnedK : 0;

  // The page block's visible edge on each side, from how much is there. A
  // page at a time, only the stack still to read is on the screen.
  const edge = (share: number) => (share <= 0 ? 0 : Math.max(1, Math.min(3, Math.ceil(share * 3))));
  const turnedEdge = single ? 0 : edge(spread / leafCount);
  const unturnedEdge = single ? edge((lastPage - pos) / lastPage) : edge((leafCount - spread) / leafCount);
  const leftEdge = dir === 1 ? turnedEdge : unturnedEdge;
  const rightEdge = dir === 1 ? unturnedEdge : turnedEdge;
  const stack = (px: number, sign: 1 | -1) =>
    px === 0
      ? "none"
      : Array.from({ length: px }, (_, i) => `${sign * (i + 1)}px ${i + 1}px 0 ${i % 2 ? "#d6d8dc" : "#f3f3f1"}`).join(", ");
  // Which halves have any book under them.
  const leftShown = leftEdge > 0;
  const rightShown = rightEdge > 0;

  const nextLabel = atCover ? t("openCover") : atBack ? t("toCover") : t("nextLabel");
  const nextShort = atCover ? t("openShort") : atBack ? t("toCover") : t("nextLabel");
  const canPrev = ready && !atCover;
  const progress = single ? pos / lastPage : leafCount ? spread / leafCount : 0;
  const label = single ? pageLabels[pos] : spreads[spread]?.label;

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
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[#f6f6f4] transition-[box-shadow,opacity] duration-500"
                  style={{ boxShadow: stack(leftEdge, -1), opacity: leftShown ? 1 : 0 }}
                />
                <span
                  className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[#f6f6f4] transition-[box-shadow,opacity] duration-500"
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
          <div className="relative h-1 overflow-hidden rounded-full bg-line">
            <span
              className="absolute inset-0 origin-left rounded-full bg-primary transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] rtl:origin-right"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>

          <div className="mt-5 grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-6">
            <button
              type="button"
              onClick={prev}
              disabled={!canPrev}
              aria-label={t("prev")}
              className="btn btn-quiet px-3 sm:px-4"
            >
              <ChevronLeft className="size-5 rtl:rotate-180" strokeWidth={2} aria-hidden="true" />
              <span className="hidden sm:inline">{t("prevLabel")}</span>
            </button>

            <p className="truncate text-center text-sm text-fg-muted" aria-live="polite">
              {label}
            </p>

            <button
              type="button"
              onClick={next}
              disabled={!ready}
              aria-label={atCover || atBack ? undefined : t("next")}
              className="btn btn-primary px-4 sm:px-5"
            >
              <span className="sm:hidden">{nextShort}</span>
              <span className="hidden sm:inline">{nextLabel}</span>
              <ChevronRight className="size-5 rtl:rotate-180" strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-fg-subtle">
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
                    "relative flex h-12 w-20 cursor-pointer items-end overflow-hidden rounded-md transition-all duration-300 sm:h-14 sm:w-24",
                    i === spread
                      ? "opacity-100 ring-2 ring-primary"
                      : "opacity-60 ring-1 ring-ink/10 hover:opacity-100",
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
