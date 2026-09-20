"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X, ChevronLeft, ChevronRight, Expand } from "lucide-react";

import { Frame } from "@/components/motion/Frame";
import { BLUR } from "@/content/photos";
import type { GalleryImage } from "@/lib/data/types";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Unit gallery and lightbox.
 *
 * Buyers spend longer here than anywhere else on a listing, so this is the
 * part of the site that gets the most polish:
 *
 *   - full-screen lightbox with a filmstrip and a room label per frame
 *   - arrow keys, Home/End and Escape; focus is trapped while open and
 *     returned to the thumbnail that opened it
 *   - drag or swipe to move between frames, with a velocity threshold so a
 *     scroll never counts as a swipe
 *   - neighbours are kept mounted so the next frame is already decoded
 *   - the page behind is locked, not just visually covered
 */
export function Gallery({ images }: { images: GalleryImage[] }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("property");
  const reduce = useReducedMotion();

  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const count = images.length;
  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  const launch = (i: number, el: HTMLButtonElement) => {
    openerRef.current = el;
    setIndex(i);
    setOpen(true);
  };

  const close = useCallback(() => {
    setOpen(false);
    // Return focus where it came from, or a keyboard user is stranded.
    requestAnimationFrame(() => openerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") go(index + (locale === "ar" ? -1 : 1));
      if (event.key === "ArrowLeft") go(index - (locale === "ar" ? -1 : 1));
      if (event.key === "Home") go(0);
      if (event.key === "End") go(count - 1);
      if (event.key === "Tab") {
        // Simple trap: keep focus inside the dialog.
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables?.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, index, go, close, count, locale]);

  if (count === 0) return null;

  const current = images[index];
  const roomLabel = (image: GalleryImage) =>
    image.room ? t(`room.${image.room}` as "room.reception") : "";

  return (
    <>
      {/* Editorial grid: a large lead frame, then pairs. Deliberately not a
          uniform grid - the reception deserves more room than the WC. */}
      <div className="grid gap-3 sm:grid-cols-2">
        {images.slice(0, 5).map((image, i) => (
          <button
            key={image.src + i}
            type="button"
            onClick={(event) => launch(i, event.currentTarget)}
            className={cn(
              "group/shot relative block w-full overflow-hidden border border-navy-edge focus-visible:outline-offset-4",
              i === 0 ? "aspect-[16/10] sm:col-span-2" : "aspect-[4/3]",
            )}
          >
            <Frame
              src={image.src}
              alt={image.alt[locale]}
              priority={i === 0}
              sizes={i === 0 ? "(max-width: 1024px) 92vw, 60vw" : "(max-width: 1024px) 46vw, 30vw"}
              className="absolute inset-0"
              imageClassName="transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/shot:scale-[1.05]"
            />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-3">
              {image.room && (
                <span className="label bg-navy/70 px-2.5 py-1.5 text-giza">
                  {roomLabel(image)}
                </span>
              )}
              {i === 0 && (
                <span className="label flex items-center gap-2 bg-navy/70 px-2.5 py-1.5 text-sheet">
                  <Expand className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                  {t("galleryCounter", { current: 1, total: count })}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {count > 5 && (
        <button
          type="button"
          onClick={(event) => launch(5, event.currentTarget)}
          className="label mt-4 inline-flex min-h-12 items-center gap-2 border border-giza-dim/50 px-5 text-sheet transition-colors duration-300 hover:border-survey hover:text-survey"
        >
          <Expand className="size-4" strokeWidth={1.75} aria-hidden="true" />
          {t("galleryCounter", { current: count - 5, total: count })}
        </button>
      )}

      {/* Lightbox ------------------------------------------------------- */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("galleryOpen")}
            tabIndex={-1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[120] flex flex-col bg-ink outline-none"
          >
            <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <p className="label truncate text-sheet">{roomLabel(current)}</p>
                <p className="label text-giza-dim" dir="ltr">
                  {t("galleryCounter", { current: index + 1, total: count })}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="-me-2 flex size-12 items-center justify-center text-sheet transition-colors hover:text-survey"
              >
                <span className="sr-only">{t("galleryClose")}</span>
                <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>

            <div className="relative flex-1 overflow-hidden">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                  key={index}
                  className="absolute inset-0 flex touch-pan-y items-center justify-center p-3 sm:p-8"
                  initial={reduce ? false : { opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduce ? undefined : { opacity: 0, scale: 0.99 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  drag={count > 1 ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.14}
                  onDragEnd={(_, info) => {
                    // Velocity threshold: a scroll must never read as a swipe.
                    if (info.offset.x < -70 || info.velocity.x < -450) go(index + 1);
                    else if (info.offset.x > 70 || info.velocity.x > 450) go(index - 1);
                  }}
                >
                  <div className="relative h-full w-full">
                    <Image
                      src={current.src}
                      alt={current.alt[locale]}
                      fill
                      priority
                      sizes="100vw"
                      placeholder="blur"
                      blurDataURL={BLUR}
                      className="graded select-none object-contain"
                      draggable={false}
                    />
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Neighbours stay mounted so the next frame is already decoded. */}
              <div className="pointer-events-none absolute size-px overflow-hidden opacity-0">
                {[index - 1, index + 1].map((i) => {
                  const n = images[((i % count) + count) % count];
                  return (
                    <Image
                      key={`pre-${i}`}
                      src={n.src}
                      alt=""
                      width={40}
                      height={30}
                      sizes="100vw"
                      aria-hidden="true"
                    />
                  );
                })}
              </div>

              {count > 1 && (
                <>
                  <Arrow side="start" onClick={() => go(index - 1)} label={t("galleryPrev")} />
                  <Arrow side="end" onClick={() => go(index + 1)} label={t("galleryNext")} />
                </>
              )}
            </div>

            {/* Filmstrip */}
            {count > 1 && (
              <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-4 sm:px-6">
                {images.map((image, i) => (
                  <button
                    key={image.src + i}
                    type="button"
                    onClick={() => go(i)}
                    aria-current={i === index}
                    aria-label={roomLabel(image) || image.alt[locale]}
                    className={cn(
                      "relative h-16 w-24 shrink-0 overflow-hidden border transition-opacity duration-200",
                      i === index
                        ? "border-survey opacity-100"
                        : "border-navy-edge opacity-45 hover:opacity-80",
                    )}
                  >
                    <Image
                      src={image.src}
                      alt=""
                      fill
                      sizes="6rem"
                      placeholder="blur"
                      blurDataURL={BLUR}
                      className="graded object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Arrow({
  side,
  onClick,
  label,
}: {
  side: "start" | "end";
  onClick: () => void;
  label: string;
}) {
  const Icon = side === "start" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute top-1/2 hidden size-14 -translate-y-1/2 items-center justify-center border border-navy-edge bg-navy/60 text-sheet transition-colors hover:border-survey hover:text-survey sm:flex",
        side === "start" ? "start-4" : "end-4",
      )}
    >
      <span className="sr-only">{label}</span>
      {/* The chevron points along the reading direction, so it flips in Arabic. */}
      <Icon className="size-5 rtl:rotate-180" strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}
