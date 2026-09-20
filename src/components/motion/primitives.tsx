"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";

import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ------------------------------------------------------------------ *
 * RevealText — headline arrival, line by line.
 *
 * Lines are passed in explicitly rather than measured, so the break points
 * are a typographic decision instead of whatever the viewport happened to do.
 * Each line sits in its own overflow-hidden block and rises out of it, which
 * is why it reads as type being set rather than text fading in.
 * ------------------------------------------------------------------ */
export function RevealText({
  lines,
  className,
  lineClassName,
  delay = 0,
  stagger = 0.09,
  as: Tag = "h2",
  byWord = false,
}: {
  lines: string[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  stagger?: number;
  as?: "h1" | "h2" | "h3" | "p" | "div";
  byWord?: boolean;
}) {
  const reduce = useReducedMotion();
  const Component = motion[Tag];

  return (
    <Component
      className={className}
      initial={reduce ? undefined : "hidden"}
      whileInView="shown"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
    >
      {lines.map((line, i) => (
        <span key={i} className={cn("block overflow-hidden", lineClassName)}>
          {byWord ? (
            line.split(" ").map((word, w) => (
              <motion.span
                key={w}
                className="inline-block"
                variants={{
                  hidden: { y: "110%" },
                  shown: {
                    y: 0,
                    transition: { duration: 0.9, delay: delay + (i * 4 + w) * stagger, ease: EASE },
                  },
                }}
              >
                {word}
                {w < line.split(" ").length - 1 && " "}
              </motion.span>
            ))
          ) : (
            <motion.span
              className="inline-block"
              variants={{
                hidden: { y: "110%" },
                shown: {
                  y: 0,
                  transition: { duration: 0.95, delay: delay + i * stagger, ease: EASE },
                },
              }}
            >
              {line}
            </motion.span>
          )}
        </span>
      ))}
    </Component>
  );
}

/* ------------------------------------------------------------------ *
 * Parallax — for non-image layers (type, panels, the drawn grid).
 * ------------------------------------------------------------------ */
export function Parallax({
  children,
  amount = 60,
  className,
}: {
  children: ReactNode;
  amount?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [amount, -amount]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={reduce ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Counter — a number that counts as it arrives.
 *
 * Only ever used on figures that are real. An animated fake statistic is
 * worse than a static one.
 * ------------------------------------------------------------------ */
export function Counter({
  to,
  suffix = "",
  duration = 1.6,
  className,
}: {
  to: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  const [display, setDisplay] = useState(reduce ? to : 0);
  const value = useMotionValue(0);
  const spring = useSpring(value, { duration: duration * 1000, bounce: 0 });

  useEffect(() => {
    if (reduce) return;
    if (inView) value.set(to);
  }, [inView, to, value, reduce]);

  useMotionValueEvent(spring, "change", (v) => setDisplay(Math.round(v)));

  return (
    <span ref={ref} className={cn("tabular-nums", className)} dir="ltr">
      {display}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Marquee — used once, on the contact strip. A site with three marquees
 * is a site with none.
 * ------------------------------------------------------------------ */
export function Marquee({
  children,
  speed = 38,
  reverse = false,
  className,
}: {
  children: ReactNode;
  speed?: number;
  reverse?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  /**
   * A marquee that keeps animating after it scrolls away never lets the
   * compositor idle, which on a laptop is a fan that never spools down. It
   * runs only while it is actually on screen.
   */
  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "100px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  const style = {
    animationDuration: `${speed}s`,
    animationDirection: reverse ? ("reverse" as const) : ("normal" as const),
    animationPlayState: visible ? ("running" as const) : ("paused" as const),
  };

  return (
    <div ref={ref} className={cn("relative flex overflow-hidden", className)}>
      <div
        className={cn("flex shrink-0 items-center gap-10", !reduce && "animate-marquee")}
        style={reduce ? undefined : style}
      >
        {children}
      </div>
      {!reduce && (
        <div
          aria-hidden="true"
          className="flex shrink-0 items-center gap-10 animate-marquee"
          style={style}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Magnetic — a control that leans toward the pointer.
 *
 * Pointer devices only, and the translation is small enough that the button
 * never leaves its own hit area.
 * ------------------------------------------------------------------ */
export function Magnetic({
  children,
  strength = 0.28,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 22 });
  const sy = useSpring(y, { stiffness: 260, damping: 22 });

  return (
    <motion.div
      ref={ref}
      className={cn("inline-block", className)}
      style={reduce ? undefined : { x: sx, y: sy }}
      onPointerMove={(event) => {
        if (reduce || event.pointerType !== "mouse" || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
        y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
