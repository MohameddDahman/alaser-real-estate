"use client";

import { motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";

import { cn } from "@/lib/utils";

/**
 * A subdivision grid: blocks separated by roads, each block cut into numbered
 * plots. This is what Hadayek El-Ahram and 6th of October actually are, and
 * two of the five areas Alaser works are laid out exactly like this.
 *
 * It is the hero's material because the client has no photography yet — and
 * because a survey grid says "we know this ground at plot level" faster than a
 * stock interior ever could. Generated deterministically, so it is designed
 * rather than random.
 */

const ROAD = 26;

type Plot = { x: number; y: number; w: number; h: number; n: number };

function buildPlots(): { plots: Plot[]; roads: string } {
  const blockCols = 4;
  const blockRows = 3;
  const blockW = 380;
  const blockH = 264;
  const plots: Plot[] = [];
  let n = 1;

  for (let br = 0; br < blockRows; br++) {
    for (let bc = 0; bc < blockCols; bc++) {
      const ox = bc * (blockW + ROAD);
      const oy = br * (blockH + ROAD);
      // Blocks alternate between 3-wide and 4-wide plot runs so the grid reads
      // as surveyed land rather than graph paper.
      const cols = (br + bc) % 2 === 0 ? 3 : 4;
      const rows = 2;
      const pw = blockW / cols;
      const ph = blockH / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          plots.push({ x: ox + c * pw, y: oy + r * ph, w: pw, h: ph, n: n++ });
        }
      }
    }
  }

  const roads: string[] = [];
  for (let bc = 1; bc < blockCols; bc++) {
    const x = bc * (blockW + ROAD) - ROAD / 2;
    roads.push(`M${x} -40L${x} ${blockRows * (blockH + ROAD) + 40}`);
  }
  for (let br = 1; br < blockRows; br++) {
    const y = br * (blockH + ROAD) - ROAD / 2;
    roads.push(`M-40 ${y}L${blockCols * (blockW + ROAD) + 40} ${y}`);
  }

  return { plots, roads: roads.join("") };
}

export function SurveyGrid({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const { plots, roads } = useMemo(buildPlots, []);

  const w = 4 * 380 + 3 * ROAD;
  const h = 3 * 264 + 2 * ROAD;

  // A handful of plots read as "listed here" — the count is the five areas, so
  // even the decoration is carrying a fact.
  const marked = new Set([7, 19, 34, 52, 61]);

  return (
    <svg
      viewBox={`-40 -40 ${w + 80} ${h + 80}`}
      aria-hidden="true"
      className={cn("h-full w-full", className)}
      preserveAspectRatio="xMidYMid slice"
    >
      <motion.path
        d={roads}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.5}
        strokeWidth={2.5}
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1], delay: 0.15 }}
      />

      {plots.map((plot, i) => (
        <motion.rect
          key={plot.n}
          x={plot.x}
          y={plot.y}
          width={plot.w}
          height={plot.h}
          fill={marked.has(plot.n) ? "currentColor" : "none"}
          fillOpacity={marked.has(plot.n) ? 0.16 : 0}
          stroke="currentColor"
          strokeOpacity={0.3}
          strokeWidth={1.25}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.5 + (i % 12) * 0.018 + Math.floor(i / 12) * 0.05,
            ease: "easeOut",
          }}
        />
      ))}
    </svg>
  );
}
