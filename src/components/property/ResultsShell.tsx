"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

import { useFilterTransition } from "./FiltersProvider";

/**
 * Results fade between filter states instead of snapping, and while the
 * server re-queries they are replaced by skeletons built from the same box
 * model as the result row, so nothing jumps when the real rows land.
 */
export function ResultsShell({
  children,
  signature,
  count,
}: {
  children: ReactNode;
  /** Changes whenever the filters change, so the list re-animates. */
  signature: string;
  count: number;
}) {
  const { pending } = useFilterTransition();

  if (pending) {
    return (
      <div className="space-y-4" aria-busy="true">
        {Array.from({ length: Math.max(Math.min(count, 4), 2) }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      key={signature}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Skeleton() {
  return (
    <div className="grid animate-pulse grid-cols-[7rem_minmax(0,1fr)] gap-3 rounded-lg border border-line bg-canvas p-3 motion-reduce:animate-none sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-4 sm:p-4 xl:grid-cols-[15.5rem_minmax(0,1fr)_12.5rem]">
      <div className="min-h-32 rounded-md bg-surface-2 sm:min-h-[12.5rem]" />
      <div className="space-y-3 pt-1">
        <div className="h-5 w-3/4 rounded bg-surface-2" />
        <div className="h-4 w-1/3 rounded bg-surface-2" />
        <div className="h-4 w-1/2 rounded bg-surface-2" />
        <div className="h-4 w-2/3 rounded bg-surface-2" />
      </div>
      <div className="col-span-2 flex flex-col items-end gap-2 xl:col-span-1">
        <div className="h-3 w-16 rounded bg-surface-2" />
        <div className="h-6 w-32 rounded bg-surface-2" />
        <div className="mt-auto h-9 w-28 rounded-md bg-surface-2" />
      </div>
    </div>
  );
}
