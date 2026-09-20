"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";

/**
 * The ONE reveal vocabulary for the whole site.
 *
 * Transform and opacity only - never width, height, top or filter. Every
 * section uses this, because a different reveal style per section is the
 * clearest tell that a page was assembled rather than designed.
 *
 * Under prefers-reduced-motion the content is simply present: no animation, no
 * delay, no broken layout.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

const listVariants: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};

/** Real stagger for grids and lists - 70ms apart, which reads as deliberate. */
export function RevealList({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "ul" | "ol";
}) {
  const reduce = useReducedMotion();
  const Component = motion[Tag];

  return (
    <Component
      className={className}
      variants={reduce ? undefined : listVariants}
      initial={reduce ? false : "hidden"}
      whileInView="shown"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
    >
      {children}
    </Component>
  );
}

export function RevealItem({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const reduce = useReducedMotion();
  const Component = motion[Tag];

  return (
    <Component className={className} variants={reduce ? undefined : itemVariants}>
      {children}
    </Component>
  );
}
