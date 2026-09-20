"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

import { BLUR } from "@/content/photos";
import { cn } from "@/lib/utils";

/**
 * Every photograph on this site goes through Frame. Nothing renders <Image>
 * directly.
 *
 * Three things happen here, and they happen the same way everywhere, which is
 * what makes a mixed library read as one agency's work rather than a folder:
 *
 *   1. MASK REVEAL - the frame opens with a clip-path wipe while the image
 *      itself settles from a slight over-scale. Both are compositor-only.
 *   2. PARALLAX - the image drifts against its mask as the page scrolls. Kept
 *      to a small delta so foreground and background never visibly desync.
 *   3. GRADE - one colour treatment across the whole library (see `.graded` in
 *      globals.css). This is the "one LUT" the brief asks for.
 *
 * Under prefers-reduced-motion the mask is open, the scale is 1 and the
 * parallax is off: the photograph is simply there.
 */
export function Frame({
  src,
  alt,
  priority = false,
  sizes = "(max-width: 640px) 92vw, (max-width: 1024px) 48vw, 34vw",
  parallax = 0,
  scale = true,
  className,
  imageClassName,
  rounded = false,
  delay = 0,
  children,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  /** 0 = none. 0.1 is a gentle drift; above ~0.2 it starts to read as a glitch. */
  parallax?: number;
  scale?: boolean;
  className?: string;
  imageClassName?: string;
  rounded?: boolean;
  delay?: number;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const distance = parallax * 100;
  const y = useTransform(scrollYProgress, [0, 1], [`-${distance}px`, `${distance}px`]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <motion.div
        className="absolute inset-0"
        initial={reduce ? false : { clipPath: "inset(100% 0% 0% 0%)" }}
        whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
        viewport={{ once: true, margin: "0px 0px -8% 0px" }}
        transition={{ duration: 1.1, delay, ease: [0.65, 0, 0.35, 1] }}
      >
        <motion.div
          className="absolute inset-0"
          style={reduce || !parallax ? undefined : { y, scale: 1 + parallax * 2 }}
          initial={reduce || !scale ? false : { scale: 1.18 }}
          whileInView={{ scale: parallax ? 1 + parallax * 2 : 1 }}
          viewport={{ once: true, margin: "0px 0px -8% 0px" }}
          transition={{ duration: 1.4, delay, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes={sizes}
            placeholder="blur"
            blurDataURL={BLUR}
            className={cn(
              "graded object-cover",
              rounded && "rounded-[--radius-photo]",
              imageClassName,
            )}
          />
        </motion.div>
      </motion.div>

      {children}
    </div>
  );
}
