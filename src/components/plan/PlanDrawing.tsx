"use client";

import { motion, useReducedMotion, useTransform, type MotionValue } from "motion/react";

import type { FloorPlan, PlanRoom } from "@/lib/data/types";
import { roomArea } from "@/lib/data/types";
import {
  allDoorsPath,
  envelopePath,
  metres,
  partitionPath,
  PLAN_LAYOUT,
  planViewBox,
} from "@/lib/plan-geometry";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * THE SIGNATURE.
 *
 * The plan draws itself as you scroll: envelope, then partitions, then the
 * doors swing, then the dimension strings, then each room labelled with the
 * area computed off its own rectangle, then the north arrow and scale bar.
 *
 * Every number on this drawing is derived, never typed - the label reads
 * 32.20 m² because the rectangle is 660 x 520 cm, and the north arrow points
 * where it does because the unit faces the way it faces. That is the whole
 * argument for the device: it is useful, it is accurate, and it is made
 * entirely of the client's own material.
 *
 * Nobody else in this market has it. Buyers study plans obsessively.
 */

const STAGES: Record<
  "envelope" | "partitions" | "doors" | "dims" | "labels" | "annotation",
  [number, number]
> = {
  envelope: [0.0, 0.2],
  partitions: [0.14, 0.46],
  doors: [0.4, 0.56],
  dims: [0.5, 0.68],
  labels: [0.6, 0.9],
  annotation: [0.78, 1.0],
};

export function PlanDrawing({
  plan,
  locale,
  progress,
  className,
  showAnnotation = true,
}: {
  plan: FloorPlan;
  locale: Locale;
  progress: MotionValue<number>;
  className?: string;
  showAnnotation?: boolean;
}) {
  const reduce = useReducedMotion();

  const envelope = useTransform(progress, STAGES.envelope, [0, 1], { clamp: true });
  const partitions = useTransform(progress, STAGES.partitions, [0, 1], { clamp: true });
  const doors = useTransform(progress, STAGES.doors, [0, 1], { clamp: true });
  const dims = useTransform(progress, STAGES.dims, [0, 1], { clamp: true });
  const annotation = useTransform(progress, STAGES.annotation, [0, 1], { clamp: true });

  const w = plan.width;
  const h = plan.height;
  const dimY = PLAN_LAYOUT.dimBottomY(plan);
  const dimX = PLAN_LAYOUT.dimLeftX;
  const gap = 230;

  return (
    <svg
      viewBox={planViewBox(plan)}
      className={cn("h-auto w-full overflow-visible", className)}
      role="img"
      aria-label={
        locale === "ar"
          ? `${plan.label.ar}: ${metres(w)} × ${metres(h)} متر، ${plan.rooms.length} غرف`
          : `${plan.label.en}: ${metres(w)} by ${metres(h)} metres, ${plan.rooms.length} rooms`
      }
    >
      {/* 1. The envelope - the outside wall, heaviest line on the sheet */}
      <motion.path
        d={envelopePath(plan)}
        data-draw
        fill="none"
        stroke="currentColor"
        strokeWidth={17}
        strokeLinecap="square"
        style={reduce ? undefined : { pathLength: envelope }}
      />

      {/* 2. Partitions, drawn top-left to bottom-right with the door gaps punched */}
      <motion.path
        d={partitionPath(plan)}
        data-draw
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.72}
        strokeWidth={8}
        strokeLinecap="square"
        style={reduce ? undefined : { pathLength: partitions }}
      />

      {/* 3. Door leaves and swings */}
      <motion.path
        d={allDoorsPath(plan)}
        data-draw
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.42}
        strokeWidth={5}
        strokeLinecap="round"
        style={reduce ? undefined : { pathLength: doors }}
      />

      {/* 4. Dimension strings - overall width below, overall height at the side.
             45-degree end ticks, the way they are drawn on a real sheet. */}
      <motion.g
        stroke="currentColor"
        strokeOpacity={0.5}
        strokeWidth={3.5}
        style={reduce ? undefined : { opacity: dims }}
      >
        <path d={`M0 ${dimY}L${w / 2 - gap / 2} ${dimY}M${w / 2 + gap / 2} ${dimY}L${w} ${dimY}`} />
        <path d={`M-28 ${dimY - 28}L28 ${dimY + 28}`} />
        <path d={`M${w - 28} ${dimY - 28}L${w + 28} ${dimY + 28}`} />
        <path d={`M0 ${h + 40}L0 ${dimY + 40}M${w} ${h + 40}L${w} ${dimY + 40}`} strokeOpacity={0.22} />

        <path d={`M${dimX} 0L${dimX} ${h / 2 - gap / 2}M${dimX} ${h / 2 + gap / 2}L${dimX} ${h}`} />
        <path d={`M${dimX - 28} -28L${dimX + 28} 28`} />
        <path d={`M${dimX - 28} ${h - 28}L${dimX + 28} ${h + 28}`} />
        <path d={`M${dimX - 40} 0L-40 0M${dimX - 40} ${h}L-40 ${h}`} strokeOpacity={0.22} />
      </motion.g>

      <motion.g
        fill="currentColor"
        fillOpacity={0.75}
        className="font-data"
        fontSize={30}
        style={reduce ? undefined : { opacity: dims }}
      >
        <text x={w / 2} y={dimY + 11} textAnchor="middle" direction="ltr">
          {metres(w)}
        </text>
        <text
          x={dimX}
          y={h / 2}
          textAnchor="middle"
          direction="ltr"
          transform={`rotate(-90 ${dimX} ${h / 2})`}
          dy={11}
        >
          {metres(h)}
        </text>
      </motion.g>

      {/* 5. Room labels, staggered, each with its own measured area */}
      {plan.rooms.map((room, i) => (
        <RoomLabel
          key={room.key}
          room={room}
          locale={locale}
          progress={progress}
          index={i}
          total={plan.rooms.length}
          reduce={!!reduce}
        />
      ))}

      {/* 6. North arrow and scale bar - both real */}
      {showAnnotation && (
        <motion.g style={reduce ? undefined : { opacity: annotation }}>
          <NorthArrow plan={plan} locale={locale} />
          <ScaleBar plan={plan} locale={locale} />
        </motion.g>
      )}
    </svg>
  );
}

function RoomLabel({
  room,
  locale,
  progress,
  index,
  total,
  reduce,
}: {
  room: PlanRoom;
  locale: Locale;
  progress: MotionValue<number>;
  index: number;
  total: number;
  reduce: boolean;
}) {
  const [from, to] = STAGES.labels;
  const span = (to - from) / Math.max(total, 1);
  const start = from + span * index;
  const opacity = useTransform(progress, [start, start + span * 1.6], [0, 1], { clamp: true });
  const y = useTransform(progress, [start, start + span * 1.6], [10, 0], { clamp: true });

  const cx = room.x + room.w / 2;
  const cy = room.y + room.h / 2;
  const area = roomArea(room);
  // Very small rooms get the name only; a WC cannot carry two lines legibly.
  const tight = room.w < 260 || room.h < 200;

  return (
    <motion.g style={reduce ? undefined : { opacity, y }} fill="currentColor">
      <text
        x={cx}
        y={tight ? cy + 4 : cy - 8}
        textAnchor="middle"
        className="font-display"
        fontSize={tight ? 27 : 32}
        fillOpacity={0.9}
        style={{ fontVariationSettings: locale === "ar" ? undefined : "'wdth' 100, 'wght' 500" }}
      >
        {room.label[locale]}
      </text>
      {!tight && (
        <text
          x={cx}
          y={cy + 30}
          textAnchor="middle"
          direction="ltr"
          className="font-data"
          fontSize={26}
          fillOpacity={0.55}
        >
          {area.toFixed(2)} m²
        </text>
      )}
    </motion.g>
  );
}

/**
 * The north arrow points where north actually is for this unit, derived from
 * its orientation in the listing. A unit facing east has north to its left and
 * this arrow says so.
 */
function NorthArrow({ plan, locale }: { plan: FloorPlan; locale: Locale }) {
  const x = PLAN_LAYOUT.northX(plan);
  const y = PLAN_LAYOUT.northY;

  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={62} fill="none" stroke="currentColor" strokeOpacity={0.3} strokeWidth={3.5} />
      <g transform={`rotate(${plan.north})`}>
        <path
          d="M0 -46L14 22L0 12L-14 22Z"
          fill="currentColor"
          fillOpacity={0.8}
        />
      </g>
      <text
        y={96}
        textAnchor="middle"
        className="font-data"
        fontSize={25}
        fill="currentColor"
        fillOpacity={0.55}
      >
        {locale === "ar" ? "شمال" : "N"}
      </text>
    </g>
  );
}

/** A real scale bar: five one-metre divisions, alternating. */
function ScaleBar({ plan, locale }: { plan: FloorPlan; locale: Locale }) {
  const y = PLAN_LAYOUT.scaleBarY(plan);
  const unit = 100; // 1 metre in plan units
  const bars = [0, 1, 2, 3, 4];

  return (
    <g transform={`translate(0 ${y})`}>
      {bars.map((i) => (
        <rect
          key={i}
          x={i * unit}
          y={0}
          width={unit}
          height={16}
          fill="currentColor"
          fillOpacity={i % 2 === 0 ? 0.55 : 0.12}
          stroke="currentColor"
          strokeOpacity={0.4}
          strokeWidth={2.5}
        />
      ))}
      {[0, 1, 3, 5].map((m) => (
        <text
          key={m}
          x={m * unit}
          y={52}
          textAnchor="middle"
          direction="ltr"
          className="font-data"
          fontSize={24}
          fill="currentColor"
          fillOpacity={0.5}
        >
          {m}
        </text>
      ))}
      <text
        x={5 * unit + 46}
        y={52}
        className="font-data"
        fontSize={24}
        fill="currentColor"
        fillOpacity={0.5}
      >
        {locale === "ar" ? "متر" : "m"}
      </text>
    </g>
  );
}
