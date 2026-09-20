import type { FloorPlan } from "@/lib/data/types";
import { roomArea } from "@/lib/data/types";
import {
  allDoorsPath,
  envelopePath,
  partitionPath,
  planViewBox,
  PLAN_MARGIN_TIGHT,
} from "@/lib/plan-geometry";
import { cn } from "@/lib/utils";

/**
 * A plan at card size: fully drawn, no animation, no client JavaScript.
 *
 * This occupies the exact aspect box a photograph will take when the client's
 * shoots land, which is the point — the grid never reflows, and an
 * unphotographed unit shows the agency's own measured material instead of
 * somebody else's stock interior.
 */
export function PlanPlate({
  plan,
  className,
  withLabels = false,
}: {
  plan: FloorPlan;
  className?: string;
  withLabels?: boolean;
}) {
  return (
    <svg
      viewBox={planViewBox(plan, PLAN_MARGIN_TIGHT)}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
      className={cn("h-full w-full", className)}
    >
      <path
        d={envelopePath(plan)}
        fill="none"
        stroke="currentColor"
        strokeWidth={17}
        strokeLinecap="square"
      />
      <path
        d={partitionPath(plan)}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.6}
        strokeWidth={8}
        strokeLinecap="square"
      />
      <path
        d={allDoorsPath(plan)}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.32}
        strokeWidth={5}
        strokeLinecap="round"
      />

      {withLabels &&
        plan.rooms
          .filter((room) => room.w >= 280 && room.h >= 220)
          .map((room) => (
            <text
              key={room.key}
              x={room.x + room.w / 2}
              y={room.y + room.h / 2 + 10}
              textAnchor="middle"
              className="font-data"
              fontSize={30}
              fill="currentColor"
              fillOpacity={0.5}
              direction="ltr"
            >
              {roomArea(room).toFixed(1)}
            </text>
          ))}
    </svg>
  );
}
