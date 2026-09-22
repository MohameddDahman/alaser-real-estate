/**
 * A page, simulated.
 *
 * Seen end-on, looking down the spine, a page is a line from the spine to its
 * outer edge. Here that line is a chain of short rigid segments joined by
 * soft hinges: a sheet of paper, discretised. Every step it falls under
 * gravity, loses speed to the air, resists bending, and lands on the stack
 * beneath it. A hand, when there is one, holds one point of it.
 *
 * Book space throughout: x runs from the spine across the page, positive
 * toward the unturned side; z rises off the desk toward the reader. The
 * renderer maps that onto the screen, and mirrors it for a book bound on the
 * right, so the physics never needs to know which language it is in.
 *
 * Position-based dynamics - Verlet integration, then constraint projection -
 * because it stays stable at any frame rate and makes the hand trivial: a
 * held point is simply pinned where the hand is.
 */

export type Material = {
  /** Segments across the page. One makes a rigid board. */
  segments: number;
  /** 0..1 - how hard the sheet straightens itself, per iteration. */
  stiffness: number;
  /**
   * The sharpest a single hinge may bend, in radians. Paper curls; it does
   * not crease or knot. This sets the tightest curve the page can make.
   */
  maxBend: number;
  /** Air resistance, as a decay rate per second. Paper is light and broad. */
  drag: number;
};

export const PAPER: Material = {
  segments: 16,
  stiffness: 0.2,
  maxBend: (20 * Math.PI) / 180,
  drag: 2.2,
};
/**
 * The same paper in fewer, wider segments, for leaves riffled past at speed:
 * a third of the page copies to build, and nobody can see the difference.
 */
export const PAPER_QUICK: Material = {
  segments: 6,
  stiffness: 0.2,
  maxBend: (44 * Math.PI) / 180,
  drag: 2.2,
};
export const BOARD: Material = { segments: 1, stiffness: 1, maxBend: 0, drag: 1.2 };

/** Gravity scales with the page, so a turn takes the same time at any size. */
const GRAVITY_PER_WIDTH = 22;
const ITERATIONS = 14;
/**
 * Bending is resisted over longer spans too (in segments), more gently. A
 * sheet resists rolling up as a whole, not only kinking locally: without
 * this a page can curl into a loop and roll slowly across the spine, which
 * real paper springs straight out of.
 */
const LONG_SPANS = [2, 4];
const LONG_SPAN_WEIGHT = 0.5;
/**
 * The tightest-curve stop is firm but not absolute: a hard stop fighting the
 * desk and the hand at once can jam the solver, and paper gives a little.
 */
const BEND_STOP = 0.6;
/** One paper thickness, as a share of the page width. */
const LAYER = 0.004;
/** A landing page barely bounces, and does not skate across the stack. */
const RESTITUTION = 0.16;
const FRICTION = 0.08;
/** The push that settles a released page toward its side, per unit width. */
const SETTLE_PUSH = 3.2;

export class PageSim {
  readonly n: number;
  readonly material: Material;
  width: number;
  seg: number;

  /** Current and previous positions; velocity is their difference. */
  px: Float64Array;
  pz: Float64Array;
  ox: Float64Array;
  oz: Float64Array;

  /** The held point, or -1. */
  held = -1;
  private tx = 0;
  private tz = 0;
  /**
   * A light steady push toward the side the page was released to. A page let
   * go exactly upright would otherwise balance there; a real one never does.
   */
  private push = 0;

  constructor(width: number, material: Material, side: 1 | -1) {
    this.material = material;
    this.n = material.segments;
    this.width = width;
    this.seg = width / this.n;
    const len = this.n + 1;
    this.px = new Float64Array(len);
    this.pz = new Float64Array(len);
    this.ox = new Float64Array(len);
    this.oz = new Float64Array(len);
    this.place(side);
  }

  /** Lay the page flat on one side, at rest. */
  place(side: 1 | -1) {
    for (let i = 0; i <= this.n; i++) {
      this.px[i] = this.ox[i] = side * i * this.seg;
      this.pz[i] = this.oz[i] = 0;
    }
    this.held = -1;
    this.push = 0;
  }

  /** Follow a resize without disturbing the motion. */
  rescale(width: number) {
    const k = width / this.width;
    for (let i = 0; i <= this.n; i++) {
      this.px[i] *= k;
      this.pz[i] *= k;
      this.ox[i] *= k;
      this.oz[i] *= k;
    }
    this.tx *= k;
    this.tz *= k;
    this.width = width;
    this.seg = width / this.n;
  }

  /** Take hold of point `index` and bring it to (x, z). */
  hold(index: number, x: number, z: number) {
    this.held = Math.max(1, Math.min(this.n, Math.round(index)));
    this.push = 0;
    this.moveHand(x, z);
  }

  /**
   * Where the hand is now. A hand cannot stretch paper: the target is kept
   * within reach of the spine, and a rigid board can only swing on its hinge.
   */
  moveHand(x: number, z: number) {
    const reach = this.held * this.seg;
    z = Math.max(0, z);
    const d = Math.hypot(x, z);
    if (this.n === 1 || d > reach) {
      const k = d > 1e-6 ? reach / d : 0;
      this.tx = d > 1e-6 ? x * k : reach;
      this.tz = z * k;
    } else {
      this.tx = x;
      this.tz = z;
    }
  }

  /** Let go. The page keeps the hand's velocity; `toward` decides a tie. */
  release(toward: 1 | -1) {
    this.held = -1;
    this.push = toward * this.width * SETTLE_PUSH;
  }

  step(dt: number) {
    const { n, px, pz, ox, oz } = this;
    const keep = Math.exp(-this.material.drag * dt);
    const fall = GRAVITY_PER_WIDTH * this.width * dt * dt;
    const shove = this.push * dt * dt;

    // Integrate. The settling push only acts on paper that is in the air.
    for (let i = 1; i <= n; i++) {
      if (i === this.held) continue;
      const vx = (px[i] - ox[i]) * keep;
      const vz = (pz[i] - oz[i]) * keep;
      ox[i] = px[i];
      oz[i] = pz[i];
      px[i] += vx + (pz[i] > 0.5 ? shove * (i / n) : 0);
      pz[i] += vz - fall;
    }
    // The held point moves with the hand, and carries the hand's velocity.
    if (this.held > 0) {
      const h = this.held;
      ox[h] = px[h];
      oz[h] = pz[h];
      px[h] = this.tx;
      pz[h] = this.tz;
    }

    // Project the constraints - softest first, so each pass ends with the
    // paper at its true length.
    for (let it = 0; it < ITERATIONS; it++) {
      px[0] = 0;
      pz[0] = 0;
      if (n > 1) this.solveBending();
      this.solveLength();
      this.solveReach();
      for (let i = 1; i <= n; i++) if (pz[i] < 0) pz[i] = 0;
      if (n > 3) this.solveLayers();
    }

    // Landing: a little bounce, and friction on whatever is lying flat.
    for (let i = 1; i <= n; i++) {
      if (i === this.held || pz[i] > 0.01) continue;
      const vz = pz[i] - oz[i];
      if (vz < 0) oz[i] = pz[i] + vz * RESTITUTION;
      ox[i] = px[i] - (px[i] - ox[i]) * (1 - FRICTION);
    }
  }

  /** Inverse mass: the spine and the hand do not give. */
  private w(i: number) {
    return i === 0 || i === this.held ? 0 : 1;
  }

  /**
   * Move a and b along the line between them so their distance heads for
   * `rest`, by fraction `k` of the error. Only ever pushes apart when `pushOnly`.
   */
  private relax(a: number, b: number, rest: number, k: number, pushOnly: boolean) {
    const { px, pz } = this;
    const wa = this.w(a);
    const wb = this.w(b);
    const w = wa + wb;
    if (w === 0) return;
    const dx = px[b] - px[a];
    const dz = pz[b] - pz[a];
    const d = Math.hypot(dx, dz) || 1e-9;
    if (pushOnly && d >= rest) return;
    const c = ((d - rest) / (d * w)) * k;
    px[a] += dx * c * wa;
    pz[a] += dz * c * wa;
    px[b] -= dx * c * wb;
    pz[b] -= dz * c * wb;
  }

  /** Paper resists bending: softly toward straight, firmly at its tightest. */
  private solveBending() {
    const { n, seg } = this;
    const stiff = this.material.stiffness;
    const span = seg * 2;
    // Two segments bent by the maximum angle still span this much.
    const minSpan = span * Math.cos(this.material.maxBend / 2);
    for (let i = 1; i < n; i++) {
      this.relax(i - 1, i + 1, minSpan, BEND_STOP, true);
      this.relax(i - 1, i + 1, span, stiff, true);
    }
    for (const reach of LONG_SPANS) {
      if (reach * 2 > n) break;
      const rest = seg * reach * 2;
      for (let i = reach; i + reach <= n; i++) {
        this.relax(i - reach, i + reach, rest, stiff * LONG_SPAN_WEIGHT, true);
      }
    }
  }

  /** Paper does not stretch, or compress along its length. */
  private solveLength() {
    for (let i = 1; i <= this.n; i++) this.relax(i - 1, i, this.seg, 1, false);
  }

  /**
   * Long-range attachment: no point can be further from the spine - or from
   * the hand - than the paper between them is long. Neighbour links alone let
   * a fast hand stretch the page; this keeps it one length, at no cost.
   */
  private solveReach() {
    const { n, seg, px, pz } = this;
    const h = this.held;
    for (let i = 1; i <= n; i++) {
      if (i === h) continue;
      clampWithin(px, pz, i, 0, 0, i * seg);
      if (h > 0) clampWithin(px, pz, i, px[h], pz[h], Math.abs(i - h) * seg);
    }
  }

  /**
   * A page folded over lies on itself, not through itself. Hinged at the
   * spine, the part further out is always the part on top, so each point
   * rests a paper's thickness above any segment nearer the spine that it
   * came down onto. (Without it, two layers of one page would sit in the
   * same plane and flicker as the browser failed to decide which is nearer.)
   */
  private solveLayers() {
    const { n, px, pz, oz } = this;
    const gap = this.width * LAYER;
    for (let i = 3; i <= n; i++) {
      if (i === this.held) continue;
      const x = px[i];
      let floor = -1;
      for (let k = 0; k < i - 2; k++) {
        const x0 = px[k];
        const x1 = px[k + 1];
        const span = x1 - x0;
        if (Math.abs(span) < 1e-6) continue;
        const f = (x - x0) / span;
        if (f < 0 || f > 1) continue;
        const z = pz[k] + (pz[k + 1] - pz[k]) * f;
        // Only a layer it was above - never pull it up through one.
        if (z <= oz[i] + gap && z > floor) floor = z;
      }
      if (floor >= 0 && pz[i] < floor + gap) pz[i] = floor + gap;
    }
  }

  /** Where the outer edge is. */
  edgeX() {
    return this.px[this.n];
  }

  /** Highest point off the desk. */
  lift() {
    let m = 0;
    for (let i = 1; i <= this.n; i++) if (this.pz[i] > m) m = this.pz[i];
    return m;
  }

  /** Flat, still, and not held: the page has landed. */
  settled() {
    if (this.held > 0) return false;
    for (let i = 1; i <= this.n; i++) {
      if (this.pz[i] > 0.4) return false;
      if (Math.abs(this.px[i] - this.ox[i]) > 0.06) return false;
      if (Math.abs(this.pz[i] - this.oz[i]) > 0.06) return false;
    }
    return true;
  }

  /** Nothing moving but the hand, and the hand at rest too. */
  quiet(eps = 0.02) {
    for (let i = 1; i <= this.n; i++) {
      if (Math.abs(this.px[i] - this.ox[i]) > eps) return false;
      if (Math.abs(this.pz[i] - this.oz[i]) > eps) return false;
    }
    return true;
  }

  /** Which side the page is on. */
  side(): 1 | -1 {
    return this.edgeX() >= 0 ? 1 : -1;
  }

  /**
   * Where the page will land if let go now - found by letting a copy of it
   * fall. A flick, a slow drift and a page left balanced upright all resolve
   * exactly as they will on screen, so the interface can commit at once.
   */
  predict(dt: number, maxSeconds = 1.6): 1 | -1 {
    const ghost = new PageSim(this.width, this.material, 1);
    ghost.px.set(this.px);
    ghost.pz.set(this.pz);
    ghost.ox.set(this.ox);
    ghost.oz.set(this.oz);
    const steps = Math.ceil(maxSeconds / dt);
    for (let s = 0; s < steps; s++) {
      ghost.step(dt);
      if (ghost.settled()) break;
    }
    return ghost.side();
  }

  /** Angle of segment `i` off the desk, 0 lying flat on the unturned side. */
  angle(i: number) {
    return Math.atan2(this.pz[i + 1] - this.pz[i], this.px[i + 1] - this.px[i]);
  }
}

/** Pull point i back inside a circle of radius r around (cx, cz). */
function clampWithin(
  px: Float64Array,
  pz: Float64Array,
  i: number,
  cx: number,
  cz: number,
  r: number,
) {
  const dx = px[i] - cx;
  const dz = pz[i] - cz;
  const d = Math.hypot(dx, dz);
  if (d <= r || d < 1e-9) return;
  const k = r / d;
  px[i] = cx + dx * k;
  pz[i] = cz + dz * k;
}
