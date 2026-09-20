import type { FloorPlan, PlanRoom } from "./data/types";

/**
 * Pure geometry for the plan drawing. No React, no motion - so the same
 * functions serve the animated public drawing, the static admin preview and
 * the generated OG image.
 *
 * All coordinates are plan centimetres: 100 units = 1 metre.
 */

export type Segment = { x1: number; y1: number; x2: number; y2: number };

const DEFAULT_DOOR_WIDTH = 80;

/**
 * A room's four walls as line segments, with the door opening punched out.
 * Punching a real gap rather than drawing an arc over a continuous wall is the
 * difference between a plan and a diagram of a plan.
 */
export function roomSegments(room: PlanRoom): Segment[] {
  const { x, y, w, h, door } = room;
  const dw = door?.width ?? DEFAULT_DOOR_WIDTH;
  const out: Segment[] = [];

  const push = (x1: number, y1: number, x2: number, y2: number) => {
    if (x1 !== x2 || y1 !== y2) out.push({ x1, y1, x2, y2 });
  };

  // top
  if (door?.edge === "top") {
    const a = x + door.at;
    push(x, y, a, y);
    push(a + dw, y, x + w, y);
  } else push(x, y, x + w, y);

  // right
  if (door?.edge === "right") {
    const a = y + door.at;
    push(x + w, y, x + w, a);
    push(x + w, a + dw, x + w, y + h);
  } else push(x + w, y, x + w, y + h);

  // bottom
  if (door?.edge === "bottom") {
    const a = x + door.at;
    push(x + w, y + h, a + dw, y + h);
    push(a, y + h, x, y + h);
  } else push(x + w, y + h, x, y + h);

  // left
  if (door?.edge === "left") {
    const a = y + door.at;
    push(x, y + h, x, a + dw);
    push(x, a, x, y);
  } else push(x, y + h, x, y);

  return out;
}

export function segmentsToPath(segments: Segment[]): string {
  return segments.map((s) => `M${s.x1} ${s.y1}L${s.x2} ${s.y2}`).join("");
}

/** Door leaf plus its swing arc, drawn into the room. */
export function doorPath(room: PlanRoom): string | null {
  const { x, y, w, h, door } = room;
  if (!door) return null;
  const d = door.width ?? DEFAULT_DOOR_WIDTH;

  switch (door.edge) {
    case "top": {
      const hx = x + door.at;
      return `M${hx} ${y}L${hx} ${y + d}M${hx} ${y + d}A${d} ${d} 0 0 0 ${hx + d} ${y}`;
    }
    case "bottom": {
      const hx = x + door.at;
      const by = y + h;
      return `M${hx} ${by}L${hx} ${by - d}M${hx} ${by - d}A${d} ${d} 0 0 1 ${hx + d} ${by}`;
    }
    case "left": {
      const hy = y + door.at;
      return `M${x} ${hy}L${x + d} ${hy}M${x + d} ${hy}A${d} ${d} 0 0 1 ${x} ${hy + d}`;
    }
    case "right": {
      const hy = y + door.at;
      const rx = x + w;
      return `M${rx} ${hy}L${rx - d} ${hy}M${rx - d} ${hy}A${d} ${d} 0 0 0 ${rx} ${hy + d}`;
    }
  }
}

/** Every interior wall on the plan, ordered top-left to bottom-right so the
 *  draw reads as a hand working across the sheet rather than random flicker. */
export function partitionPath(plan: FloorPlan): string {
  const ordered = [...plan.rooms].sort((a, b) => a.y - b.y || a.x - b.x);
  return ordered.map((room) => segmentsToPath(roomSegments(room))).join("");
}

export function envelopePath(plan: FloorPlan): string {
  const { width: w, height: h } = plan;
  return `M0 0L${w} 0L${w} ${h}L0 ${h}Z`;
}

export function allDoorsPath(plan: FloorPlan): string {
  return plan.rooms
    .map(doorPath)
    .filter(Boolean)
    .join("");
}

/** Sheet margin around the envelope, leaving room for dimension strings. */
export const PLAN_MARGIN = 250;

/**
 * `margin` leaves room for the dimension strings and north arrow. Card-size
 * plates carry neither, so they pass a tight margin and the drawing fills its
 * box instead of floating in it.
 */
export function planViewBox(plan: FloorPlan, margin: number = PLAN_MARGIN): string {
  return `${-margin} ${-margin} ${plan.width + margin * 2} ${plan.height + margin * 2}`;
}

export const PLAN_MARGIN_TIGHT = 55;

/** Metres, to two places - what a buyer reads off a plan. */
export function metres(cm: number): string {
  return (cm / 100).toFixed(2);
}

export const PLAN_LAYOUT = {
  /** overall width dimension string, below the envelope */
  dimBottomY: (plan: FloorPlan) => plan.height + 130,
  /** overall height dimension string, to the left of the envelope */
  dimLeftX: -130,
  scaleBarY: (plan: FloorPlan) => plan.height + 212,
  northX: (plan: FloorPlan) => plan.width + 120,
  northY: -120,
} as const;

/**
 * A complete, standalone SVG document for the plan.
 *
 * Used by the per-listing OG image, where Satori cannot execute our React SVG
 * tree but can render an <img> pointing at a data URI. Same geometry as the
 * live drawing, so a shared link shows the unit's real layout.
 */
export function planToSvgString(
  plan: FloorPlan,
  { stroke = "#7fa3cc", margin = PLAN_MARGIN_TIGHT }: { stroke?: string; margin?: number } = {},
): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${planViewBox(plan, margin)}">`,
    `<path d="${envelopePath(plan)}" fill="none" stroke="${stroke}" stroke-width="17"/>`,
    `<path d="${partitionPath(plan)}" fill="none" stroke="${stroke}" stroke-opacity="0.6" stroke-width="8"/>`,
    `<path d="${allDoorsPath(plan)}" fill="none" stroke="${stroke}" stroke-opacity="0.35" stroke-width="5"/>`,
    `</svg>`,
  ].join("");
}
