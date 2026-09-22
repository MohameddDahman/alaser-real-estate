import { BOARD, PageSim, paper, type Material } from "./sim";

/**
 * The book, drawn.
 *
 * Pages at rest are flat copies in two slots, one each side of the spine -
 * crisp, cheap, exactly what the reader is looking at. A page that moves is
 * lifted into a 3D layer as vertical strips, one per segment of its
 * simulation, each carrying its slice of the front and back page. Placed
 * edge to edge at the angles the simulation gives them, the strips make one
 * curved sheet; shading each by the angle it presents to the light makes it
 * read as paper.
 *
 * A page is always moved the way a hand moves one: by holding a point of it
 * and carrying that point along an arc. The pointer is such a hand; so is a
 * button, and so is the finish of a drag you let go of. The paper between
 * the hand and the spine does whatever paper does.
 *
 * TWO WAYS TO HOLD A BOOK
 *
 * Open on a desk, a book is a run of sheets printed both sides: turn one and
 * its back becomes the left page of the next spread. On a phone there is
 * room for one page, so the book becomes a stack of single sheets, as the
 * reference monograph does: a turned page curls away past the spine and the
 * next lies underneath, the view never moving. The physics is the same;
 * only what counts as a sheet differs (see `Sheet`).
 *
 * Mirroring for a book bound on the right is done in the arithmetic, never
 * with a negative scale: a mirrored 3D context flips which faces the browser
 * thinks are facing it.
 */

export type BookState = {
  /** Sheets committed to the turned side - the reading position. */
  position: number;
  /** Nothing moving. */
  settled: boolean;
};

/** One turnable sheet: the page on each face, or null for plain paper. */
type Sheet = { front: number; back: number | null; board: boolean };

type Hand = {
  t: number;
  duration: number;
  /** The point held, and its distance from the spine along the page. */
  index: number;
  reach: number;
  /** Angle of the held point about the spine: 0 unturned, PI turned. */
  phi0: number;
  phi1: number;
  /** Height of the arc as a share of a rigid swing. Low curls the page. */
  lift: number;
  /** Height the point started at, blended into the arc so nothing jumps. */
  z0: number;
  /** Share of the path after which the hand lets go. */
  releaseAt: number;
  ease: "inOut" | "out";
  /** A peek eases the cover up to this angle and lets it drop. */
  peek: number;
};

type Strip = {
  el: HTMLDivElement;
  frontShade: HTMLDivElement;
  backShade: HTMLDivElement;
};

type Leaf = {
  /** Its sheet; -1 for the stand-in that makes a jump. */
  index: number;
  el: HTMLDivElement;
  strips: Strip[];
  sim: PageSim;
  /** Committed destination: 1 the unturned side, -1 the turned side. */
  target: 1 | -1;
  hand: Hand | null;
  /** When the hand let go, for the stuck-page rescue. */
  releasedAt: number;
  rank: number;
};

type Drag = {
  /** Null while a one-page book waits to see which way a finger moves. */
  leaf: Leaf | null;
  /** The side the page was picked up from. */
  origin: 1 | -1;
  /** Height the grip started at, easing down onto the drag's own arc. */
  zFloor: number;
  pointerId: number;
  startX: number;
  startY: number;
  startT: number;
  moved: boolean;
  /** Pointer x in book space when it went down. */
  startModel: number;
  /** Hand x = base + (pointer x - startModel) * gain. */
  base: number;
  gain: number;
  /** Where the hand is heading, and the hand easing after it. */
  goalX: number;
  handX: number;
  reach: number;
  /** Recent hand positions, for the speed of a flick. */
  trail: Array<{ t: number; x: number }>;
};

const DT = 1 / 240;
/** How high a dragging hand carries the page: low, so it rolls over. */
const DRAG_LIFT = 0.34;
/** A button's turn lifts a little higher, a flick of the wrist. */
const TURN_LIFT = 0.46;
/** A flick this fast (page widths per second) turns the page on its own. */
const FLICK = 0.9;
/**
 * Pulling the last page back on a phone: it is off the screen, so it
 * follows the finger faster than one-to-one to sweep in from the edge.
 */
const PULL_GAIN = 1.6;
/** Strips overlap by this much, so no hairline shows between them. */
const OVERLAP = 0.75;
/** A released page that has not landed after this long is laid down. */
const RESCUE_MS = 2600;
/** Built leaves kept around; each is a few dozen page copies. */
const MAX_LEAVES = 6;
/** How dark a strip turned fully from the light gets. */
const SHADE = 0.42;
/**
 * Under the mouse, near its edge, a page lifts to meet the hand: the outer
 * part rises about a third of a turn, bending near where it leaves the
 * stack. The edge is kept almost as far out as it lies - pushed inward, a
 * sheet buckles in the middle instead, which reads as a glitch.
 */
const HOVER_PAPER = { angle: 0.334, lift: 0.52 };
const HOVER_BOARD = { angle: 0.3, lift: 1 };
/** Within this share of the page width from its outer edge. */
const HOVER_BAND = 0.16;

const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const smoothstep = (t: number) => t * t * (3 - 2 * t);

export class BookEngine {
  private root: HTMLElement;
  private sources: HTMLElement[];
  private dir: 1 | -1;
  private reduced: boolean;
  private single: boolean;
  private onChange: (s: BookState) => void;

  /** Pages in the book. */
  private count: number;
  private sheets: Sheet[];
  /** The page left lying when every sheet is turned (a one-page book). */
  private floor: number | null;
  private leafCount: number;
  /** Resting side of every sheet. */
  private sides: Int8Array;
  private W = 0;
  private H = 0;

  private slotLeft: HTMLDivElement;
  private slotRight: HTMLDivElement;
  private shadowLeft: HTMLDivElement;
  private shadowRight: HTMLDivElement;
  private layer: HTMLDivElement;

  private clones = new Map<number, HTMLElement>();
  private leaves = new Map<number, Leaf>();
  private moving = new Set<Leaf>();
  /** Page in each slot; -1 until the first fill, so an empty slot is hidden too. */
  private shown: { left: number | null; right: number | null } = { left: -1, right: -1 };

  private drag: Drag | null = null;
  /** A page lifted a little under the mouse, waiting to be taken. */
  private hover: { leaf: Leaf; side: 1 | -1 } | null = null;
  /** The stand-in leaf of a jump, while it is in the air. */
  private jumper: Leaf | null = null;
  /**
   * During a jump, the side the stand-in leaves keeps showing what was there
   * until it lands on top - as a real page would cover it.
   */
  private pinned: { turned?: number | null; unturned?: number | null } = {};
  private prepareQueued = false;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private lastState: BookState = { position: -1, settled: true };
  private destroyed = false;
  /** Slows everything down for inspection; 1 is real time. */
  timeScale = 1;

  constructor(
    root: HTMLElement,
    sources: HTMLElement[],
    opts: {
      dir: 1 | -1;
      reduced: boolean;
      /** One page at a time: a stack of single sheets. */
      single: boolean;
      /** Where to open, in sheets turned. */
      start: number;
      onChange: (s: BookState) => void;
    },
  ) {
    this.root = root;
    this.sources = sources;
    this.dir = opts.dir;
    this.reduced = opts.reduced;
    this.single = opts.single;
    this.onChange = opts.onChange;
    this.count = sources.length;

    const last = this.count - 1;
    if (this.single) {
      // Every page is its own sheet, printed one side; the back cover lies
      // at the bottom and is never turned.
      this.sheets = Array.from({ length: last }, (_, p) => ({ front: p, back: null, board: p === 0 }));
      this.floor = last;
    } else {
      // Sheets printed both sides; the first and last are the boards.
      const n = Math.floor(this.count / 2);
      this.sheets = Array.from({ length: n }, (_, j) => ({
        front: j * 2,
        back: j * 2 + 1,
        board: j === 0 || j === n - 1,
      }));
      this.floor = null;
    }
    this.leafCount = this.sheets.length;
    const start = Math.max(0, Math.min(this.leafCount, Math.round(opts.start)));
    this.sides = new Int8Array(this.leafCount);
    for (let j = 0; j < this.leafCount; j++) this.sides[j] = j < start ? -1 : 1;

    const make = (cls: string) => {
      const el = document.createElement("div");
      el.className = cls;
      return el;
    };
    this.slotLeft = make("pbook-slot");
    this.slotRight = make("pbook-slot");
    this.slotRight.style.left = "var(--pw)";
    this.shadowLeft = make("pbook-shadow");
    this.shadowRight = make("pbook-shadow");
    this.layer = make("pbook-layer");
    root.append(this.slotLeft, this.slotRight, this.layer);

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.tick = this.tick.bind(this);
    root.addEventListener("pointerdown", this.onPointerDown);
    root.addEventListener("pointermove", this.onPointerMove);
    root.addEventListener("pointerup", this.onPointerUp);
    root.addEventListener("pointercancel", this.onPointerUp);
    root.addEventListener("lostpointercapture", this.onPointerUp);
    root.addEventListener("pointerleave", this.onPointerLeave);
  }

  /* ---------------------------------------------------------------- */
  /* Public                                                            */
  /* ---------------------------------------------------------------- */

  resize(pageW: number, pageH: number) {
    if (pageW === this.W && pageH === this.H) return;
    const first = this.W === 0;
    this.W = pageW;
    this.H = pageH;
    this.root.style.setProperty("--pw", `${pageW}px`);
    this.root.style.setProperty("--ph", `${pageH}px`);
    if (first) {
      this.refreshSlots();
      this.emit();
      this.schedulePrepare();
      return;
    }
    const all = [...this.leaves.values(), ...(this.jumper ? [this.jumper] : [])];
    for (const leaf of all) {
      leaf.sim.rescale(pageW);
      if (leaf.hand) leaf.hand.reach = leaf.hand.index * leaf.sim.seg;
      if (leaf.el.style.display !== "none") this.render(leaf);
    }
    const d = this.drag;
    if (d?.leaf) d.reach = d.leaf.sim.held * d.leaf.sim.seg;
  }

  next() {
    if (this.drag) return;
    this.finishJump();
    if (this.reduced) return this.setPosition(this.position() + 1);
    if (this.hover?.side === -1) this.endHover();
    this.launch(this.forwardLeaf(), 1);
  }

  prev() {
    if (this.drag) return;
    this.finishJump();
    if (this.reduced) return this.setPosition(this.position() - 1);
    if (this.hover?.side === 1) this.endHover();
    this.launch(this.backwardLeaf(), -1);
  }

  /**
   * Go anywhere in a single turn.
   *
   * The next sheet is an ordinary turn. Further away, one stand-in leaf
   * turns instead of every sheet between: it carries the page you are
   * looking at on the side that lifts and the page you are going to on the
   * side that lands, so it reads as the one page that takes you there -
   * and costs one page to draw, not a dozen.
   */
  goTo(position: number) {
    const target = Math.max(0, Math.min(this.leafCount, Math.round(position)));
    const now = this.position();
    if (target === now) return;
    if (this.reduced) return this.setPosition(target);
    if (Math.abs(target - now) === 1) return target > now ? this.next() : this.prev();

    // Anything already in the air is laid where it was going.
    if (this.moving.size > 0 || this.drag) this.settleAll();
    const from = this.position();
    const forward = target > from;

    // Lifting side: what is showing now. Landing side: where you are going.
    const front = forward ? this.frontOf(from) : this.frontOf(target);
    const back = forward ? this.backOf(target - 1) : this.backOf(from - 1);
    this.pinned = forward ? { turned: this.backOf(from - 1) } : { unturned: this.frontOf(from) };
    for (let j = 0; j < this.leafCount; j++) this.sides[j] = j < target ? -1 : 1;

    const board = front === 0 || (back !== null && back === this.count - 1);
    const material = board ? BOARD : paper(this.segmentsFor("jump"));
    const { el, strips } = this.buildStrips(front, back, material, board);
    el.style.display = "";
    this.layer.appendChild(el);
    const leaf: Leaf = {
      index: -1,
      el,
      strips,
      sim: new PageSim(this.W, material, forward ? 1 : -1),
      target: forward ? -1 : 1,
      hand: null,
      releasedAt: 0,
      rank: 0,
    };
    this.jumper = leaf;
    this.moving.add(leaf);
    this.refreshSlots();
    this.render(leaf);
    this.startHand(leaf, {
      phi0: forward ? 0 : Math.PI,
      phi1: forward ? Math.PI : 0,
      lift: board ? 1 : TURN_LIFT,
      duration: board ? 0.95 : 0.85,
      releaseAt: board ? 0.9 : 0.84,
      ease: "inOut",
      peek: 0,
    });
    this.emit();
    this.schedulePrepare();
  }

  /** Lift the cover a little and let it drop: a hint that it opens. */
  peek() {
    if (this.reduced || this.moving.size > 0 || this.drag || this.W === 0) return;
    if (this.position() !== 0) return;
    const leaf = this.liftLeaf(0);
    leaf.target = 1;
    this.startHand(leaf, {
      phi0: 0,
      phi1: 0,
      lift: 1,
      duration: 0.7,
      releaseAt: 0.62,
      ease: "out",
      peek: (24 * Math.PI) / 180,
    });
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    const root = this.root;
    root.removeEventListener("pointerdown", this.onPointerDown);
    root.removeEventListener("pointermove", this.onPointerMove);
    root.removeEventListener("pointerup", this.onPointerUp);
    root.removeEventListener("pointercancel", this.onPointerUp);
    root.removeEventListener("lostpointercapture", this.onPointerUp);
    root.removeEventListener("pointerleave", this.onPointerLeave);
    this.slotLeft.remove();
    this.slotRight.remove();
    this.layer.remove();
  }

  /* ---------------------------------------------------------------- */
  /* State                                                             */
  /* ---------------------------------------------------------------- */

  /** Sheets committed to the turned side - resting or in flight. */
  private position() {
    let s = 0;
    for (let j = 0; j < this.leafCount; j++) {
      const leaf = this.leaves.get(j);
      const side = leaf && this.moving.has(leaf) ? leaf.target : this.sides[j];
      if (side === -1) s++;
    }
    return s;
  }

  /*
   * THE ORDER OF A BOOK
   *
   * Pages turn in order. Going forward you can only take the first page not
   * yet turned; going back, only the last one turned - even while others
   * are still in the air. Take the page that ought to move and it is
   * whichever it is: resting, or mid-flight, in which case the hand catches
   * it and sends it where it is now wanted. Everything committed to the
   * turned side is therefore always a run from the front of the book, and
   * the stacks can never end up shuffled.
   */

  /** The sheet a forward turn moves. */
  private forwardLeaf(): number | null {
    const c = this.position();
    return c < this.leafCount ? c : null;
  }

  /** The sheet a backward turn moves. */
  private backwardLeaf(): number | null {
    const c = this.position();
    return c > 0 ? c - 1 : null;
  }

  /** The page on top of the unturned side with sheets 0..j-1 turned. */
  private frontOf(j: number): number | null {
    return j < this.leafCount ? this.sheets[j].front : this.floor;
  }

  /** The page face up on the turned side when sheet j lies there. */
  private backOf(j: number): number | null {
    return j >= 0 && j < this.leafCount ? this.sheets[j].back : null;
  }

  private isMoving(j: number) {
    const leaf = this.leaves.get(j);
    return !!leaf && this.moving.has(leaf);
  }

  /** The sheet on top of the unturned stack, ignoring any in the air. */
  private topUnturned(): number | null {
    for (let j = 0; j < this.leafCount; j++) {
      if (this.isMoving(j)) continue;
      if (this.sides[j] === 1) return j;
    }
    return null;
  }

  private topTurned(): number | null {
    for (let j = this.leafCount - 1; j >= 0; j--) {
      if (this.isMoving(j)) continue;
      if (this.sides[j] === -1) return j;
    }
    return null;
  }

  private emit() {
    const state: BookState = {
      position: this.position(),
      settled: this.moving.size === 0 && !this.drag,
    };
    if (state.position === this.lastState.position && state.settled === this.lastState.settled) return;
    this.lastState = state;
    this.onChange(state);
  }

  /** Put the book at a position with no motion at all. */
  private setPosition(position: number) {
    const s = Math.max(0, Math.min(this.leafCount, position));
    for (let j = 0; j < this.leafCount; j++) this.sides[j] = j < s ? -1 : 1;
    this.refreshSlots();
    this.emit();
    this.schedulePrepare();
  }

  /** Lay every moving leaf down where it is committed to go. */
  private settleAll() {
    this.drag = null;
    this.hover = null;
    for (const leaf of [...this.moving]) {
      leaf.sim.place(leaf.target);
      this.land(leaf);
    }
  }

  /** A jump still in the air is laid down at once when something else starts. */
  private finishJump() {
    const j = this.jumper;
    if (!j) return;
    j.sim.place(j.target);
    this.land(j);
  }

  /* ---------------------------------------------------------------- */
  /* Pages                                                             */
  /* ---------------------------------------------------------------- */

  /** Which screen side a page lies on when flat. */
  private liesRight(p: number | null) {
    const unturnedOnRight = this.dir === 1;
    // One-page book: every page lies on the unturned side; its blank back on
    // the other. Two-page book: fronts (even) unturned, backs (odd) turned.
    const onUnturned = p === null ? false : this.single ? true : p % 2 === 0;
    return onUnturned ? unturnedOnRight : !unturnedOnRight;
  }

  /** Spine shading for the side a page lies on; boards get their own. */
  private gutter(liesRight: boolean, hard: boolean) {
    const gutter = document.createElement("span");
    gutter.className = "pbook-gutter";
    gutter.dataset.side = liesRight ? "right" : "left";
    if (hard) gutter.dataset.hard = "";
    return gutter;
  }

  /** Always a whole page, whatever box it sits in - inline, so no utility wins. */
  private sizeAsPage(node: HTMLElement) {
    node.style.position = "absolute";
    node.style.top = "0";
    node.style.left = "0";
    node.style.width = "var(--pw)";
    node.style.height = "var(--ph)";
  }

  /** A copy of page p, with the spine shading for the side it lies on. */
  private makePage(p: number): HTMLElement {
    const node = this.sources[p].cloneNode(true) as HTMLElement;
    this.sizeAsPage(node);
    for (const img of node.querySelectorAll("img")) {
      img.loading = "eager";
      img.decoding = "async";
    }
    const hard = p === 0 || p === this.count - 1;
    (node.firstElementChild ?? node).appendChild(this.gutter(this.liesRight(p), hard));
    return node;
  }

  /** The unprinted back of a one-sided sheet: plain stock, or board. */
  private makeBlank(board: boolean): HTMLElement {
    const node = document.createElement("div");
    this.sizeAsPage(node);
    node.className = board ? "bg-navy" : "pbook-paper";
    node.appendChild(this.gutter(this.liesRight(null), board));
    return node;
  }

  /** A flat copy for a slot, made once and reused. */
  private slotPage(p: number) {
    let node = this.clones.get(p);
    if (!node) {
      node = this.makePage(p);
      this.clones.set(p, node);
    }
    return node;
  }

  /** Show what lies on top of each stack, ignoring anything in the air. */
  private refreshSlots() {
    const turned = this.topTurned();
    const unturned = this.topUnturned();
    // A one-page book shows nothing on the turned side: it is off the page.
    const turnedPage = this.single
      ? null
      : this.pinned.turned !== undefined
        ? this.pinned.turned
        : turned === null
          ? null
          : this.backOf(turned);
    const unturnedPage =
      this.pinned.unturned !== undefined
        ? this.pinned.unturned
        : this.frontOf(unturned ?? this.leafCount);
    const left = this.dir === 1 ? turnedPage : unturnedPage;
    const right = this.dir === 1 ? unturnedPage : turnedPage;
    this.fill(this.slotLeft, this.shadowLeft, left, "left");
    this.fill(this.slotRight, this.shadowRight, right, "right");
  }

  private fill(slot: HTMLDivElement, shadow: HTMLDivElement, page: number | null, which: "left" | "right") {
    if (this.shown[which] === page) return;
    this.shown[which] = page;
    if (page === null) {
      slot.replaceChildren();
      slot.hidden = true;
      return;
    }
    slot.hidden = false;
    slot.replaceChildren(this.slotPage(page), shadow);
  }

  /* ---------------------------------------------------------------- */
  /* Leaves                                                            */
  /* ---------------------------------------------------------------- */

  private isBoard(j: number) {
    return this.sheets[j].board;
  }

  /**
   * How many strips a page is cut into: about one per 34px of page, enough
   * for a smooth curl and no more - every strip is another copy or two of a
   * page to build. The stand-in of a jump turns fast and gets fewer.
   */
  private segmentsFor(use: "page" | "jump") {
    const W = this.W || 480;
    return use === "page"
      ? Math.max(8, Math.min(16, Math.round(W / 34)))
      : Math.max(8, Math.min(12, Math.round(W / 44)));
  }

  /**
   * Keep the two leaves that can move next built, laid out and hidden, so a
   * grab starts on the very next frame. Everything else not in the air is
   * parked out of layout, and the least recently used are thrown away.
   */
  private schedulePrepare() {
    if (this.prepareQueued || this.destroyed) return;
    this.prepareQueued = true;
    const run = () => {
      this.prepareQueued = false;
      if (!this.destroyed) this.prepare();
    };
    const idle = (
      window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }
    ).requestIdleCallback;
    if (idle) idle(run, { timeout: 400 });
    else window.setTimeout(run, 60);
  }

  private prepare() {
    if (this.W === 0 || this.reduced) return;
    const ready = new Set<number>();
    // One new leaf per idle moment: building one is a few dozen page copies,
    // and two at once is long enough to catch a drag that starts meanwhile.
    let built = false;
    for (const j of [this.forwardLeaf(), this.backwardLeaf()]) {
      if (j === null) continue;
      ready.add(j);
      if (!this.leaves.has(j)) {
        if (built) {
          this.schedulePrepare();
          continue;
        }
        built = true;
      }
      // Warm the flat copies that turning this sheet will reveal, so the
      // landing frame only swaps nodes and never has to clone one.
      for (const p of [this.frontOf(j), this.frontOf(j + 1), this.backOf(j), this.backOf(j - 1)]) {
        if (p !== null) this.slotPage(p);
      }
      const leaf = this.buildLeaf(j);
      if (this.moving.has(leaf)) continue;
      leaf.sim.rescale(this.W);
      leaf.sim.place(this.sides[j] === -1 ? -1 : 1);
      leaf.el.style.display = "";
      leaf.el.style.visibility = "hidden";
      this.render(leaf);
    }
    for (const leaf of this.leaves.values()) {
      if (this.moving.has(leaf) || ready.has(leaf.index)) continue;
      leaf.el.style.display = "none";
    }
    // Forget the least recently used.
    for (const [j, leaf] of this.leaves) {
      if (this.leaves.size <= MAX_LEAVES) break;
      if (this.moving.has(leaf) || ready.has(j)) continue;
      leaf.el.remove();
      this.leaves.delete(j);
    }
  }

  /** Build the strips for sheet j, once. */
  private buildLeaf(j: number): Leaf {
    const cached = this.leaves.get(j);
    if (cached) {
      // Most recently used goes to the back of the line.
      this.leaves.delete(j);
      this.leaves.set(j, cached);
      return cached;
    }

    const sheet = this.sheets[j];
    const material: Material = sheet.board ? BOARD : paper(this.segmentsFor("page"));
    const { el, strips } = this.buildStrips(sheet.front, sheet.back, material, sheet.board);
    el.style.display = "none";
    this.layer.appendChild(el);
    const side: 1 | -1 = this.sides[j] === -1 ? -1 : 1;
    const leaf: Leaf = {
      index: j,
      el,
      strips,
      sim: new PageSim(this.W || 1, material, side),
      target: side,
      hand: null,
      releasedAt: 0,
      rank: 0,
    };
    this.leaves.set(j, leaf);
    return leaf;
  }

  /** A leaf's strips: page `front` on one side, page `back` (or blank) on the other. */
  private buildStrips(front: number | null, back: number | null, material: Material, board: boolean) {
    const n = material.segments;
    const el = document.createElement("div");
    el.className = "pbook-leaf";
    const strips: Strip[] = [];
    const rtl = this.dir === -1;

    for (let i = 0; i < n; i++) {
      const ov = i === n - 1 ? 0 : OVERLAP;
      const strip = document.createElement("div");
      strip.className = "pbook-strip";
      strip.style.width = `calc(var(--pw) / ${n} + ${ov}px)`;
      strip.style.transformOrigin = rtl ? "100% 50%" : "0 50%";

      // Each face shows its slice of its page. Fronts lie on the unturned
      // side and backs on the turned side, so which slice is "near" the
      // spine and which "far" swaps with the binding.
      const near = `calc(var(--pw) * ${-i / n})`;
      const far = `calc(var(--pw) * ${(i + 1) / n - 1} + ${ov}px)`;
      const f = this.face(front, rtl ? far : near, false, board);
      const b = this.face(back, rtl ? near : far, true, board);
      strip.append(f.face, b.face);
      el.appendChild(strip);
      strips.push({ el: strip, frontShade: f.shade, backShade: b.shade });
    }
    return { el, strips };
  }

  private face(page: number | null, offset: string, back: boolean, board: boolean) {
    const face = document.createElement("div");
    face.className = "pbook-face";
    if (back) face.dataset.back = "";
    const content = page === null ? this.makeBlank(board) : this.makePage(page);
    content.style.transform = `translateX(${offset})`;
    const shade = document.createElement("div");
    shade.className = "pbook-shade";
    face.append(content, shade);
    return { face, shade };
  }

  /** Take sheet j off its stack and into the air. */
  private liftLeaf(j: number): Leaf {
    const leaf = this.buildLeaf(j);
    if (this.moving.has(leaf)) return leaf;
    leaf.sim.rescale(this.W);
    leaf.sim.place(this.sides[j] === -1 ? -1 : 1);
    leaf.rank = this.moving.size;
    leaf.releasedAt = 0;
    leaf.hand = null;
    leaf.el.style.display = "";
    leaf.el.style.visibility = "";
    this.moving.add(leaf);
    this.refreshSlots();
    this.render(leaf);
    return leaf;
  }

  /** Put a hand on the leaf and set it moving along an arc. */
  private startHand(
    leaf: Leaf,
    o: Omit<Hand, "t" | "index" | "reach" | "z0"> & { index?: number },
  ) {
    const index = o.index ?? leaf.sim.n;
    const reach = index * leaf.sim.seg;
    const z0 = leaf.sim.pz[index];
    leaf.hand = { ...o, t: 0, index, reach, z0 };
    leaf.releasedAt = 0;
    if (leaf.sim.held !== index) leaf.sim.hold(index, leaf.sim.px[index], z0);
    this.start();
  }

  /** Where point `index` of a leaf is, as an angle about the spine. */
  private phiOf(leaf: Leaf, index: number) {
    const reach = index * leaf.sim.seg;
    return Math.acos(Math.max(-1, Math.min(1, leaf.sim.px[index] / reach)));
  }

  /** Turn sheet j over, the way a hand flips a page. */
  private launch(j: number | null, from: 1 | -1, duration?: number) {
    if (j === null) return;
    // Resting, lifted under the mouse, or still in the air: same page.
    const leaf = this.liftLeaf(j);
    if (this.hover?.leaf === leaf) this.hover = null;
    const board = this.isBoard(j);
    leaf.target = from === 1 ? -1 : 1;
    this.startHand(leaf, {
      // From wherever the edge already is - a lifted corner turns from there.
      phi0: this.phiOf(leaf, leaf.sim.n),
      phi1: from === 1 ? Math.PI : 0,
      lift: board ? 1 : TURN_LIFT,
      duration: duration ?? (board ? 0.95 : 0.85),
      releaseAt: board ? 0.9 : 0.84,
      ease: "inOut",
      peek: 0,
    });
    this.emit();
  }

  /** Send a leaf, from wherever it is, to where it is committed to go. */
  private redirect(leaf: Leaf) {
    const board = leaf.sim.n === 1;
    this.startHand(leaf, {
      phi0: this.phiOf(leaf, leaf.sim.n),
      phi1: leaf.target === -1 ? Math.PI : 0,
      lift: board ? 1 : TURN_LIFT,
      duration: 0.6,
      releaseAt: 0.84,
      ease: "inOut",
      peek: 0,
    });
  }

  /** Lay a leaf down where it was committed to go. */
  private land(leaf: Leaf) {
    const side = leaf.target;
    leaf.sim.place(side);
    leaf.hand = null;
    this.moving.delete(leaf);
    if (leaf === this.jumper) {
      // The stand-in has done its work: the real pages beneath it are
      // already where it was taking you.
      this.jumper = null;
      this.pinned = {};
      leaf.el.remove();
    } else {
      this.sides[leaf.index] = side;
      leaf.el.style.visibility = "hidden";
    }
    this.refreshSlots();
    this.emit();
    this.schedulePrepare();
  }

  /* ---------------------------------------------------------------- */
  /* Pointer                                                           */
  /* ---------------------------------------------------------------- */

  /** Pointer x in book space: distance from the spine, toward the unturned side. */
  private toBook(clientX: number) {
    const rect = this.root.getBoundingClientRect();
    const scale = rect.width / (this.W * 2) || 1;
    const spine = rect.left + rect.width / 2;
    return (this.dir * (clientX - spine)) / scale;
  }

  private onPointerDown(e: PointerEvent) {
    if (this.reduced || this.drag || e.button !== 0 || this.W === 0) return;
    this.finishJump();
    const x = this.toBook(e.clientX);
    const t = performance.now();

    if (this.single) {
      // One page on screen, and a finger could mean either direction: wait
      // for the first real movement to say which (see onPointerMove).
      if (x < -this.W * 0.02) return;
      this.endHoverIfOther(1);
      this.drag = {
        leaf: null,
        origin: 1,
        zFloor: 0,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startT: t,
        moved: false,
        startModel: x,
        base: x,
        gain: 1,
        goalX: x,
        handX: x,
        reach: this.W,
        trail: [{ t, x }],
      };
      this.capture(e.pointerId);
      return;
    }

    const side: 1 | -1 = x >= 0 ? 1 : -1;
    // The page that turns from this side - resting, lifted under the mouse,
    // or still in the air, in which case it is caught.
    const j = side === 1 ? this.forwardLeaf() : this.backwardLeaf();
    if (j === null) return;
    this.endHoverIfOther(j);
    this.grab(j, side, x, e, t, 1);
    this.capture(e.pointerId);
    this.emit();
    this.start();
  }

  private capture(pointerId: number) {
    try {
      this.root.setPointerCapture(pointerId);
    } catch {
      /* capture is a nicety */
    }
  }

  private endHoverIfOther(j: number) {
    if (this.hover && this.hover.leaf.index !== j) this.endHover();
  }

  /**
   * Take hold of sheet j where the pointer is. `gain` is how far the hand
   * travels per pixel of pointer - more than one when the page being pulled
   * is off the screen and has to sweep in.
   */
  private grab(j: number, origin: 1 | -1, x: number, e: PointerEvent, t: number, gain: number) {
    const leaf = this.liftLeaf(j);
    if (this.hover?.leaf === leaf) this.hover = null;
    leaf.hand = null;
    leaf.releasedAt = 0;
    const n = leaf.sim.n;
    // Held where it was touched: nearer the spine, the less leverage. A page
    // pulled back from off the screen is held by its edge.
    const index = gain === 1 ? Math.max(1, Math.min(n, Math.round(Math.abs(x) / leaf.sim.seg))) : n;
    const reach = index * leaf.sim.seg;
    const hx = leaf.sim.px[index];
    const hz = leaf.sim.pz[index];
    leaf.sim.hold(index, hx, hz);
    const prev = this.drag;
    this.drag = {
      leaf,
      origin,
      zFloor: hz,
      pointerId: e.pointerId,
      startX: prev?.startX ?? e.clientX,
      startY: prev?.startY ?? e.clientY,
      startT: prev?.startT ?? t,
      moved: prev?.moved ?? false,
      startModel: x,
      base: hx,
      gain,
      goalX: hx,
      handX: hx,
      reach,
      trail: [{ t, x: hx }],
    };
  }

  private onPointerLeave() {
    if (!this.drag) this.endHover();
  }

  /**
   * Near the outer edge of a page, the mouse lifts it a little - the way a
   * page rises to meet a thumb - and lets it fall when it moves on.
   */
  private onHover(e: PointerEvent) {
    if (this.reduced || e.pointerType !== "mouse" || e.buttons !== 0 || this.W === 0) return;
    const x = this.toBook(e.clientX);
    const rect = this.root.getBoundingClientRect();
    const side: 1 | -1 = x >= 0 ? 1 : -1;
    const near =
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom &&
      Math.abs(x) > this.W * (1 - HOVER_BAND) &&
      Math.abs(x) <= this.W * 1.02 &&
      // A one-page book has nothing to lift on the far side.
      !(this.single && side === -1);
    if (!near) return this.endHover();
    if (this.hover?.side === side) return;
    this.endHover();
    if (this.moving.size > 0) return;
    const j = side === 1 ? this.forwardLeaf() : this.backwardLeaf();
    if (j === null) return;
    const leaf = this.liftLeaf(j);
    leaf.target = side;
    const rest = side === 1 ? 0 : Math.PI;
    const how = this.isBoard(j) ? HOVER_BOARD : HOVER_PAPER;
    this.startHand(leaf, {
      phi0: rest,
      phi1: rest + side * how.angle,
      lift: how.lift,
      duration: 0.5,
      // Held there for as long as the mouse stays.
      releaseAt: Infinity,
      ease: "out",
      peek: 0,
    });
    this.hover = { leaf, side };
  }

  private endHover() {
    const h = this.hover;
    if (!h) return;
    this.hover = null;
    const { leaf, side } = h;
    if (!this.moving.has(leaf)) return;
    const index = leaf.sim.held > 0 ? leaf.sim.held : leaf.sim.n;
    const reach = index * leaf.sim.seg;
    const phi0 = Math.acos(Math.max(-1, Math.min(1, leaf.sim.px[index] / reach)));
    leaf.target = side;
    this.startHand(leaf, {
      index,
      phi0,
      phi1: side === 1 ? 0 : Math.PI,
      lift: leaf.sim.n === 1 ? HOVER_BOARD.lift : HOVER_PAPER.lift,
      duration: 0.3,
      releaseAt: 0.8,
      ease: "out",
      peek: 0,
    });
  }

  private onPointerMove(e: PointerEvent) {
    const d = this.drag;
    if (!d) return this.onHover(e);
    if (e.pointerId !== d.pointerId) return;
    const x = this.toBook(e.clientX);
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) > 6) d.moved = true;

    if (!d.leaf) {
      // A one-page book deciding: a mostly vertical move is a scroll, not a
      // turn; toward the spine turns this page; away from it pulls back the
      // one before, which sweeps in from off the screen.
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        this.drag = null;
        return;
      }
      const forward = x < d.startModel;
      const j = forward ? this.forwardLeaf() : this.backwardLeaf();
      if (j === null) {
        this.drag = null;
        return;
      }
      this.grab(j, forward ? 1 : -1, forward ? d.startModel : x, e, performance.now(), forward ? 1 : PULL_GAIN);
      this.emit();
      this.start();
      return;
    }

    d.goalX = d.base + (x - d.startModel) * d.gain;
    const t = performance.now();
    d.trail.push({ t, x: d.goalX });
    while (d.trail.length > 2 && t - d.trail[0].t > 100) d.trail.shift();
  }

  private onPointerUp(e: PointerEvent) {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointerId) return;
    this.drag = null;
    const quick = performance.now() - d.startT < 400;
    const tap = !d.moved && e.type === "pointerup" && quick;

    if (!d.leaf) {
      // A one-page book, and no drag ever began: a tap. Near the spine goes
      // back, anywhere else goes on - as on any reader.
      if (tap) {
        if (d.startModel < this.W * 0.3) this.prev();
        else this.next();
      }
      return;
    }

    const leaf = d.leaf;
    const board = leaf.sim.n === 1;
    if (tap) {
      // A tap on a page turns it, by its edge, like the button.
      leaf.target = d.origin === 1 ? -1 : 1;
      this.startHand(leaf, {
        phi0: this.phiOf(leaf, leaf.sim.n),
        phi1: d.origin === 1 ? Math.PI : 0,
        lift: board ? 1 : TURN_LIFT,
        duration: board ? 0.95 : 0.85,
        releaseAt: board ? 0.9 : 0.84,
        ease: "inOut",
        peek: 0,
      });
      this.emit();
      return;
    }

    // Let go. Over the spine (on a phone, past the middle of the page), or
    // flicked that way, and the page goes over; otherwise it falls back.
    // Either way a hand sees it home.
    const first = d.trail[0];
    const lastSample = d.trail[d.trail.length - 1];
    const dt = Math.max(0.016, (lastSample.t - first.t) / 1000);
    const speed = (lastSample.x - first.x) / dt / this.W;
    const x = leaf.sim.px[leaf.sim.held];
    const reach = leaf.sim.held * leaf.sim.seg;
    const line = this.single ? (d.origin === 1 ? 0.45 : -0.55) * reach : 0;
    const over = d.origin === 1 ? x < line || speed < -FLICK : x > line || speed > FLICK;
    const dest: 1 | -1 = over ? (d.origin === 1 ? -1 : 1) : d.origin;
    leaf.target = dest;
    const phi0 = Math.acos(Math.max(-1, Math.min(1, x / reach)));
    const phi1 = dest === 1 ? 0 : Math.PI;
    this.startHand(leaf, {
      index: leaf.sim.held,
      phi0,
      phi1,
      lift: board ? 1 : DRAG_LIFT,
      duration: 0.18 + (0.5 * Math.abs(phi1 - phi0)) / Math.PI,
      releaseAt: 0.88,
      ease: "out",
      peek: 0,
    });
    this.emit();
  }

  /* ---------------------------------------------------------------- */
  /* Loop                                                              */
  /* ---------------------------------------------------------------- */

  private start() {
    if (this.raf) return;
    this.last = performance.now();
    this.acc = 0;
    this.raf = requestAnimationFrame(this.tick);
  }

  private tick(now: number) {
    this.raf = 0;
    if (this.destroyed) return;
    const elapsed = Math.min(0.05, (now - this.last) / 1000) * this.timeScale;
    this.last = now;
    this.acc += elapsed;

    const d = this.drag?.leaf ? this.drag : null;
    while (this.acc >= DT) {
      this.acc -= DT;
      if (d?.leaf) {
        // The hand follows the pointer closely, not rigidly: a few
        // milliseconds of lag is what makes the page feel held, not glued.
        d.handX += (d.goalX - d.handX) * 0.3;
        const r = d.reach;
        const x = Math.max(-r * 0.99, Math.min(r, d.handX));
        const board = d.leaf.sim.n === 1;
        let z = (board ? 1 : DRAG_LIFT) * Math.sqrt(Math.max(0, r * r - x * x));
        // A page taken already lifted eases down onto the drag's arc.
        d.zFloor *= 0.985;
        if (!board && d.zFloor > z) z = d.zFloor;
        d.leaf.sim.moveHand(x, z);
      }
      for (const leaf of this.moving) {
        if (leaf.hand) this.advanceHand(leaf, DT);
        leaf.sim.step(DT);
      }
    }

    for (const leaf of this.moving) this.render(leaf);
    this.renderShadows();

    const t = performance.now();
    for (const leaf of [...this.moving]) {
      if (d && d.leaf === leaf) continue;
      if (leaf.hand) continue;
      if (leaf.sim.settled()) {
        // Came to rest on the wrong side (a hard flick against the hand):
        // turn it properly rather than snap it across.
        if (leaf.sim.side() === leaf.target) this.land(leaf);
        else this.redirect(leaf);
      } else if (leaf.releasedAt && t - leaf.releasedAt > RESCUE_MS) {
        leaf.sim.place(leaf.target);
        this.land(leaf);
      }
    }

    // A page held up under a resting mouse needs no frames until something
    // changes; the next pointer event wakes the loop.
    const resting =
      !this.drag &&
      this.hover !== null &&
      this.moving.size === 1 &&
      this.moving.has(this.hover.leaf) &&
      !!this.hover.leaf.hand &&
      this.hover.leaf.hand.t >= this.hover.leaf.hand.duration &&
      this.hover.leaf.sim.quiet();

    if ((this.moving.size > 0 || this.drag?.leaf) && !resting) {
      this.raf = requestAnimationFrame(this.tick);
    } else {
      this.renderShadows();
      this.emit();
    }
  }

  private advanceHand(leaf: Leaf, dt: number) {
    const hand = leaf.hand!;
    hand.t += dt;
    const u = Math.min(1, hand.t / hand.duration);
    let x: number;
    let z: number;
    if (hand.peek > 0) {
      // Eased up to the peek angle; then the hand lets go and it drops.
      const a = hand.peek * easeOutCubic(Math.min(1, u / hand.releaseAt));
      x = hand.reach * Math.cos(a);
      z = hand.reach * Math.sin(a);
    } else {
      const k = hand.ease === "out" ? easeOutCubic(u) : easeInOutSine(u);
      const phi = hand.phi0 + (hand.phi1 - hand.phi0) * k;
      x = hand.reach * Math.cos(phi);
      z = hand.lift * hand.reach * Math.sin(phi);
      // Start from exactly where the point was, then settle onto the arc.
      const onArc = hand.lift * hand.reach * Math.sin(hand.phi0);
      z += (hand.z0 - onArc) * (1 - smoothstep(Math.min(1, u / 0.35)));
    }
    leaf.sim.moveHand(x, z);
    if (u >= hand.releaseAt) {
      leaf.hand = null;
      leaf.sim.release(leaf.target);
      leaf.releasedAt = performance.now();
    }
  }

  /* ---------------------------------------------------------------- */
  /* Drawing                                                           */
  /* ---------------------------------------------------------------- */

  private render(leaf: Leaf) {
    const { sim, strips } = leaf;
    const W = this.W;
    const n = sim.n;
    const seg = sim.seg;
    const rtl = this.dir === -1;
    // Just above the desk, later leaves above earlier ones.
    const lift = 0.6 + leaf.rank * 0.5;
    // Light from above the reader's left shoulder.
    const lx = -0.28 * this.dir;
    const lz = 1;
    const ll = Math.hypot(lx, lz);
    const rest = lz / ll;

    for (let i = 0; i < n; i++) {
      const x0 = sim.px[i];
      const z0 = sim.pz[i];
      const dx = sim.px[i + 1] - x0;
      const dz = sim.pz[i + 1] - z0;
      const a = Math.atan2(dz, dx);
      const stretch = Math.hypot(dx, dz) / seg;
      const width = seg + (i === n - 1 ? 0 : OVERLAP);
      const s = strips[i];
      s.el.style.transform = rtl
        ? `translate3d(${W - x0 - width}px,0,${z0 + lift}px) rotateY(${a}rad) scaleX(${stretch})`
        : `translate3d(${W + x0}px,0,${z0 + lift}px) rotateY(${-a}rad) scaleX(${stretch})`;

      // Lambert shading, relative to how the face looks lying flat.
      const nx = -Math.sin(a);
      const nz = Math.cos(a);
      const front = Math.max(0, (nx * lx + nz * lz) / ll);
      const back = Math.max(0, (-nx * lx - nz * lz) / ll);
      s.frontShade.style.opacity = String(Math.max(0, (rest - front) / rest) * SHADE);
      s.backShade.style.opacity = String(Math.max(0, (rest - back) / rest) * SHADE);
    }
  }

  /**
   * The shadow a lifted page casts on the page beneath: over its footprint
   * and a little past it, softer and lighter the higher it rides.
   */
  private renderShadows() {
    let turnedReach = 0;
    let unturnedReach = 0;
    let height = 0;
    for (const leaf of this.moving) {
      const { sim } = leaf;
      for (let i = 1; i <= sim.n; i++) {
        const x = sim.px[i];
        if (x > unturnedReach) unturnedReach = x;
        if (-x > turnedReach) turnedReach = -x;
      }
      height = Math.max(height, sim.lift());
    }
    const W = this.W || 1;
    const fade = this.moving.size ? Math.max(0, 1 - height / (W * 0.9)) : 0;
    const set = (el: HTMLDivElement, reach: number, onLeft: boolean) => {
      if (reach <= 0.5 || fade <= 0) {
        el.style.opacity = "0";
        return;
      }
      const k = Math.min(1, reach / W + 0.12);
      el.style.transformOrigin = onLeft ? "100% 50%" : "0 50%";
      el.style.transform = `scaleX(${k})`;
      el.dataset.edge = onLeft ? "left" : "right";
      el.style.opacity = String(0.3 * fade);
    };
    const unturnedOnLeft = this.dir === -1;
    set(unturnedOnLeft ? this.shadowLeft : this.shadowRight, unturnedReach, unturnedOnLeft);
    set(unturnedOnLeft ? this.shadowRight : this.shadowLeft, turnedReach, !unturnedOnLeft);
  }
}
