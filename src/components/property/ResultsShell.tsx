"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

import { useFilterTransition } from "./FiltersProvider";
import { cn } from "@/lib/utils";

/**
 * Results animate between filter states instead of snapping, and while the
 * server re-queries they are replaced by skeletons built from the SAME box
 * model as the card - a 4:3 plate and three text lines. Matching the final
 * dimensions exactly is what keeps CLS at zero while filtering.
 */
export function ResultsShell({
  children,
  signature,
  count,
}: {
  children: ReactNode;
  /** Changes whenever the filters change, so the grid re-animates. */
  signature: string;
  count: number;
}) {
  const { pending } = useFilterTransition();

  if (pending) {
    return (
      <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
        {Array.from({ length: Math.max(Math.min(count, 6), 3) }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      key={signature}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse motion-reduce:animate-none">
      <div className="aspect-[4/3] border border-navy-edge bg-navy-lift" />
      <div className="pt-4">
        <div className="h-3 w-24 bg-navy-lift" />
        <div className="mt-3 h-6 w-full bg-navy-lift" />
        <div className="mt-2 h-6 w-2/3 bg-navy-lift" />
        <div className="mt-3 h-4 w-32 bg-navy-lift" />
        <div className="mt-4 border-t border-navy-edge pt-3">
          <div className="h-4 w-28 bg-navy-lift" />
        </div>
      </div>
    </div>
  );
}

export function ActiveFilterBar({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex flex-wrap items-center gap-2", className)}>{children}</div>;
}
