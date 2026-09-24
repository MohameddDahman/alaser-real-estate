"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";

import { Photo } from "@/components/ui/Photo";
import { BLUR } from "@/content/photos";
import { isOptimisable } from "@/lib/images";
import type { GalleryImage } from "@/lib/data/types";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Unit photographs: a lead frame with two beside it and a strip underneath,
 * the arrangement buyers already know from every booking site, and a
 * full-screen viewer behind any of them.
 *
 * The viewer:
 *   - arrow keys, Home/End and Escape; focus is trapped while open and
 *     returned to the photograph that opened it
 *   - drag or swipe between frames, with a velocity threshold so a scroll
 *     never counts as a swipe
 *   - neighbours stay mounted so the next frame is already decoded
 *   - the page behind is locked, not just covered
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
  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

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
  const label = (image: GalleryImage, i: number) =>
    `${roomLabel(image) || image.alt[locale]} — ${t("galleryCounter", { current: i + 1, total: count })}`;

  const side = images.slice(1, 3);
  const strip = images.slice(3, 8);
  const hidden = count - 8;

  return (
    <>
      {/* Phone: one frame and a strip to thumb through. */}
      <div className="sm:hidden">
        <Shot
          image={images[0]}
          i={0}
          label={label(images[0], 0)}
          onOpen={launch}
          priority
          sizes="100vw"
          className="aspect-[4/3] w-full rounded-lg"
        >
          <span className="absolute bottom-3 end-3 inline-flex items-center gap-1.5 rounded-md bg-ink/75 px-2.5 py-1.5 text-xs font-semibold text-white">
            <Images className="size-3.5" strokeWidth={2} aria-hidden="true" />
            <span dir="ltr">1 / {count}</span>
          </span>
        </Shot>
        {count > 1 && (
          <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4">
            {images.slice(1).map((image, n) => (
              <Shot
                key={image.src + n}
                image={image}
                i={n + 1}
                label={label(image, n + 1)}
                onOpen={launch}
                sizes="7rem"
                className="h-20 w-28 shrink-0 rounded-md"
              />
            ))}
          </div>
        )}
      </div>

      {/* Desk: the lead frame, two beside it, a strip of five below. */}
      <div className="hidden space-y-2 sm:block">
        <div className="grid h-[22rem] grid-cols-3 grid-rows-2 gap-2 lg:h-[26rem]">
          <Shot
            image={images[0]}
            i={0}
            label={label(images[0], 0)}
            onOpen={launch}
            priority
            sizes="(max-width: 1024px) 64vw, 50rem"
            className={cn("rounded-s-lg", side.length ? "col-span-2 row-span-2" : "col-span-3 row-span-2 rounded-e-lg")}
          />
          {side.map((image, n) => (
            <Shot
              key={image.src + n}
              image={image}
              i={n + 1}
              label={label(image, n + 1)}
              onOpen={launch}
              sizes="(max-width: 1024px) 32vw, 25rem"
              className={cn(
                n === 0 && "rounded-se-lg",
                (n === 1 || side.length === 1) && "rounded-ee-lg",
                side.length === 1 && "row-span-2",
              )}
            />
          ))}
        </div>

        {strip.length > 0 && (
          <div className="grid h-24 grid-cols-5 gap-2 lg:h-28">
            {strip.map((image, n) => {
              const i = n + 3;
              const last = n === strip.length - 1;
              return (
                <Shot
                  key={image.src + i}
                  image={image}
                  i={i}
                  label={label(image, i)}
                  onOpen={launch}
                  sizes="12rem"
                  className="rounded-md"
                >
                  {last && hidden > 0 && (
                    <span className="absolute inset-0 flex items-center justify-center bg-ink/55 text-sm font-semibold text-white">
                      +{hidden}
                    </span>
                  )}
                </Shot>
              );
            })}
          </div>
        )}
      </div>

      {count > 1 && (
        <button
          type="button"
          onClick={(event) => launch(0, event.currentTarget)}
          className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <Images className="size-4" strokeWidth={2} aria-hidden="true" />
          {t("showAllPhotos", { count })}
        </button>
      )}

      {/* The viewer --------------------------------------------------- */}
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[120] flex flex-col bg-ink text-white outline-none"
          >
            <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <p className="truncate font-semibold">{roomLabel(current) || current.alt[locale]}</p>
                <p className="text-sm text-white/60" dir="ltr">
                  {t("galleryCounter", { current: index + 1, total: count })}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="-me-2 flex size-11 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-white/10 focus-visible:outline-white"
              >
                <span className="sr-only">{t("galleryClose")}</span>
                <X className="size-6" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>

            <div className="relative flex-1 overflow-hidden">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                  key={index}
                  className="absolute inset-0 flex touch-pan-y items-center justify-center p-3 sm:px-20 sm:py-6"
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduce ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
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
                      unoptimized={!isOptimisable(current.src)}
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
                      unoptimized={!isOptimisable(n.src)}
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

            {count > 1 && (
              <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-4 sm:justify-center sm:px-6">
                {images.map((image, i) => (
                  <button
                    key={image.src + i}
                    type="button"
                    onClick={() => go(i)}
                    aria-current={i === index}
                    aria-label={roomLabel(image) || image.alt[locale]}
                    className={cn(
                      "relative h-14 w-20 shrink-0 cursor-pointer overflow-hidden rounded-md transition-opacity focus-visible:outline-white",
                      i === index ? "opacity-100 ring-2 ring-white" : "opacity-50 hover:opacity-85",
                    )}
                  >
                    <Photo src={image.src} alt="" sizes="5rem" />
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

function Shot({
  image,
  i,
  label,
  onOpen,
  priority = false,
  sizes,
  className,
  children,
}: {
  image: GalleryImage;
  i: number;
  label: string;
  onOpen: (i: number, el: HTMLButtonElement) => void;
  priority?: boolean;
  sizes: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const locale = useLocale() as Locale;

  return (
    <button
      type="button"
      onClick={(event) => onOpen(i, event.currentTarget)}
      aria-label={label}
      className={cn("group/shot relative block h-full w-full cursor-zoom-in overflow-hidden bg-surface-2", className)}
    >
      <Photo
        src={image.src}
        alt={image.alt[locale]}
        sizes={sizes}
        priority={priority}
        className="transition-[transform,filter] duration-500 ease-out group-hover/shot:scale-[1.03] group-hover/shot:brightness-95"
      />
      {children}
    </button>
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
        "absolute top-1/2 hidden size-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-white sm:flex",
        side === "start" ? "start-4" : "end-4",
      )}
    >
      <span className="sr-only">{label}</span>
      {/* The chevron points along the reading direction, so it flips in Arabic. */}
      <Icon className="size-6 rtl:rotate-180" strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}
