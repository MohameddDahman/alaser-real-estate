/**
 * The book, turned the way a magazine is.
 *
 * Pages at rest are flat copies in two slots, one each side of the spine -
 * crisp, cheap, exactly what the reader is looking at. A page that moves is
 * folded, not bent: take a corner and carry it across, and the paper creases
 * along the line halfway between where the corner was and where it is now.
 * Everything past that line lies turned over on top, showing the back of the
 * sheet; everything before it stays where it lay. That is two copies of the
 * page - the front where it lies, the back reflected across the fold - under
 * one clip along the fold line. It is all transforms: nothing is cut into
 * strips, nothing is repainted as it moves, and the type stays sharp.
 *
 * A gloss runs along the fold on the back of the sheet - coated stock catching
 * the light where it curls over - and the lifted paper throws a soft shadow on
 * the page it uncovers.
 *
 * The motion is eased, not simulated: the corner follows the finger, and a
 * page let go finishes its turn, or falls back, on a curve. No gravity, no
 * bounce, no ripple.
 *
 * Book space: x runs from the spine across the page toward the unturned side,
 * y down from the top edge, both in page units (0..1), so a resize never
 * disturbs a turn. A book bound on the right is mirrored in the arithmetic
 * when it is drawn, never with a negative scale.
 *
 * TWO WAYS TO HOLD A BOOK
 *
 * Open on a desk, a book is a run of sheets printed both sides: turn one and
 * its back becomes the left page of the next spread. On a phone there is
 * room for one page, so the book becomes a stack of single sheets: a turned
 * page folds away past the spine and the next lies underneath, the view never
 * moving. The fold is the same; only what counts as a sheet differs (see
 * `Sheet`).
 */

export type BookState = {
  /** Sheets committed to the turned side - the reading position. */
  position: number;
  /** Nothing moving. */
  settled: boolean;
};

/** One turnable sheet: the page on each face, or null for plain paper. */
type Sheet = { front: number; back: number | null; board: boolean };

type Vec = { x: number; y: number };

type Motion = {
  t: number;
  duration: number;
  from: Vec;
  to: Vec;
  /** How far the corner rises off the straight path mid-way, in page heights. */
  arc: number;
  ease: (t: number) => number;
  /** Out and back again: a peek. */
  yoyo: boolean;
  /** Lay the page down when the motion ends. */
  land: boolean;
};

type Leaf = {
  /** Its sheet; -1 for the stand-in that makes a jump. */
  index: number;
  el: HTMLDivElement;
  castBox: HTMLDivElement;
  cast: HTMLDivElement;
  clip: HTMLDivElement;
  inner: HTMLDivElement;
  front: HTMLElement;
  back: HTMLElement;
  gloss: HTMLDivElement;
  /** Height of the corner being carried, on the outer edge: 0 top, 1 bottom. */
  gy: number;
  /** Where that corner is now. */
  p: Vec;
  /** Committed destination: 1 the unturned side, -1 the turned side. */
  target: 1 | -1;
  motion: Motion | null;
  rank: number;
  /** Pixel size the clip and the gradients were last laid out for. */
  laidOut: number;
};

type Drag = {
  /** Null while a one-page book waits to see which way a finger moves. */
  leaf: Leaf | null;
  /** The side the page was picked up from. */
  origin: 1 | -1;
  pointerId: number;
  startX: number;
  startY: number;
  startT: number;
  moved: boolean;
  /** The pointer in book space when it went down. */
  start: Vec;
  /** The corner when the drag took it. */
  base: Vec;
  /** Corner travel per unit of pointer travel, across the page. */
  gain: number;
  goal: Vec;
  /** Recent corner positions, for the speed of a flick. */
  trail: Array<{ t: number; x: number }>;
};

type Hover = { leaf: Leaf; side: 1 | -1; goal: Vec };

/** A flick this fast (page widths per second) turns the page on its own. */
const FLICK = 0.9;
/**
 * Pulling the last page back on a phone: it is off the screen, so it follows
 * the finger faster than one-to-one to sweep in from the spine.
 */
const PULL_GAIN = 1.6;
/** How quickly the corner catches up with the finger, per second. */
const FOLLOW = 26;
/** A whole turn, from a button or a tap. */
const TURN_SECONDS = 0.7;
/**
 * How far the corner rises mid-turn, in page heights. It is what makes the
 * fold run diagonally, as it does when a thumb takes a page by the corner.
 */
const TURN_ARC = 0.14;
const DRAG_ARC = 0.09;
/** Built leaves kept around; each is two page copies. */
const MAX_LEAVES = 8;
/** Under the mouse, near a corner, the page peels up to meet it. */
const HOVER_ZONE = { x: 0.22, y: 0.3 };
const HOVER_PEEL = { x: 0.16, y: 0.1 };

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const matrix = (a: number, b: number, c: number, d: number, e: number, f: number) =>
  `matrix(${a},${b},${c},${d},${e},${f})`;

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
  private layer: HTMLDivElement;

  private clones = new Map<number, HTMLElement>();
  private leaves = new Map<number, Leaf>();
  private moving = new Set<Leaf>();
  /** Page in each slot; -1 until the first fill, so an empty slot is hidden too. */
  private shown: { left: number | null; right: number | null } = { left: -1, right: -1 };

  private drag: Drag | null = null;
  /** A corner peeled up under the mouse, waiting to be taken. */
  private hover: Hover | null = null;
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
      // Sheets printed both sides; the first and last are the covers.
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
    // Positions are in page units, so a turn in progress simply redraws.
    for (const leaf of [...this.leaves.values(), ...(this.jumper ? [this.jumper] : [])]) {
      if (leaf.el.style.display !== "none") this.render(leaf);
    }
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
   * side that lands, so it reads as the one page that takes you there.
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
    const leaf = this.makeLeaf(-1, front, back, board);
    leaf.el.style.display = "";
    leaf.gy = 1;
    leaf.p = { x: forward ? 1 : -1, y: 1 };
    leaf.target = forward ? -1 : 1;
    this.jumper = leaf;
    this.moving.add(leaf);
    this.refreshSlots();
    this.render(leaf);
    this.turn(leaf);
    this.emit();
    this.schedulePrepare();
  }

  /** Peel the cover's corner up a little and let it fall back: it opens. */
  peek() {
    if (this.reduced || this.moving.size > 0 || this.drag || this.W === 0) return;
    if (this.position() !== 0) return;
    const leaf = this.liftLeaf(0, 1);
    leaf.target = 1;
    leaf.motion = {
      t: 0,
      duration: 1.1,
      from: { x: 1, y: 1 },
      to: { x: 1 - 0.2, y: 1 - 0.1 },
      arc: 0,
      ease: (t) => t,
      yoyo: true,
      land: true,
    };
    this.start();
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
   * whichever it is: resting, or mid-turn, in which case it is caught where
   * it is and sent where it is now wanted. Everything committed to the
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
    // Nothing should be in the air here; if anything is, take it out first,
    // or its destination would argue with where the book is being put.
    this.drag = null;
    this.hover = null;
    for (const leaf of [...this.moving]) {
      leaf.motion = null;
      this.moving.delete(leaf);
      if (leaf === this.jumper) {
        this.jumper = null;
        this.pinned = {};
        leaf.el.remove();
      } else {
        leaf.el.style.visibility = "hidden";
      }
    }
    for (let j = 0; j < this.leafCount; j++) this.sides[j] = j < s ? -1 : 1;
    this.refreshSlots();
    this.emit();
    this.schedulePrepare();
  }

  /** Lay every moving leaf down where it is committed to go. */
  private settleAll() {
    this.drag = null;
    this.hover = null;
    for (const leaf of [...this.moving]) this.land(leaf);
  }

  /** A jump still in the air is laid down at once when something else starts. */
  private finishJump() {
    if (this.jumper) this.land(this.jumper);
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

  /** Spine shading for the side a page lies on; covers get their own. */
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

  /** The unprinted back of a one-sided sheet: plain stock, or the cover's board. */
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
      this.pinned.unturned !== undefined ? this.pinned.unturned : this.frontOf(unturned ?? this.leafCount);
    const left = this.dir === 1 ? turnedPage : unturnedPage;
    const right = this.dir === 1 ? unturnedPage : turnedPage;
    this.fill(this.slotLeft, left, "left");
    this.fill(this.slotRight, right, "right");
  }

  private fill(slot: HTMLDivElement, page: number | null, which: "left" | "right") {
    if (this.shown[which] === page) return;
    this.shown[which] = page;
    if (page === null) {
      slot.replaceChildren();
      slot.hidden = true;
      return;
    }
    slot.hidden = false;
    slot.replaceChildren(this.slotPage(page));
  }

  /* ---------------------------------------------------------------- */
  /* Leaves                                                            */
  /* ---------------------------------------------------------------- */

  /**
   * Keep the two leaves that can move next built and hidden, so a grab
   * starts on the very next frame. Everything else not in the air is parked
   * out of layout, and the least recently used are thrown away.
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
    for (const j of [this.forwardLeaf(), this.backwardLeaf()]) {
      if (j === null) continue;
      ready.add(j);
      // Warm the flat copies that turning this sheet will reveal, so the
      // landing frame only swaps nodes and never has to clone one.
      for (const p of [this.frontOf(j), this.frontOf(j + 1), this.backOf(j), this.backOf(j - 1)]) {
        if (p !== null) this.slotPage(p);
      }
      const leaf = this.buildLeaf(j);
      if (this.moving.has(leaf)) continue;
      leaf.p = { x: this.sides[j] === -1 ? -1 : 1, y: leaf.gy };
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

  /** The leaf for sheet j, built once. */
  private buildLeaf(j: number): Leaf {
    const cached = this.leaves.get(j);
    if (cached) {
      // Most recently used goes to the back of the line.
      this.leaves.delete(j);
      this.leaves.set(j, cached);
      return cached;
    }
    const sheet = this.sheets[j];
    const leaf = this.makeLeaf(j, sheet.front, sheet.back, sheet.board);
    leaf.el.style.display = "none";
    leaf.p = { x: this.sides[j] === -1 ? -1 : 1, y: leaf.gy };
    leaf.target = this.sides[j] === -1 ? -1 : 1;
    this.leaves.set(j, leaf);
    return leaf;
  }

  /**
   * A leaf: its front where it lies, its back to be turned over across the
   * fold, the shadow it throws, and the gloss along its fold.
   */
  private makeLeaf(index: number, front: number | null, back: number | null, board: boolean): Leaf {
    const make = (cls: string) => {
      const el = document.createElement("div");
      el.className = cls;
      return el;
    };
    const el = make("pbook-leaf");
    const castBox = make("pbook-castbox");
    const cast = make("pbook-cast");
    const clip = make("pbook-clip");
    const inner = make("pbook-clip-inner");
    const frontNode = front === null ? this.makeBlank(board) : this.makePage(front);
    const backNode = back === null ? this.makeBlank(board) : this.makePage(back);
    const gloss = make("pbook-gloss");
    for (const node of [frontNode, backNode]) {
      node.style.transformOrigin = "0 0";
      node.style.overflow = "hidden";
      node.style.willChange = "transform";
    }
    backNode.appendChild(gloss);
    castBox.appendChild(cast);
    inner.append(frontNode, backNode);
    clip.appendChild(inner);
    el.append(castBox, clip);
    this.layer.appendChild(el);
    return {
      index,
      el,
      castBox,
      cast,
      clip,
      inner,
      front: frontNode,
      back: backNode,
      gloss,
      gy: 1,
      p: { x: 1, y: 1 },
      target: 1,
      motion: null,
      rank: 0,
      laidOut: 0,
    };
  }

  /**
   * Take sheet j off its stack and into the air, by its top (0) or bottom
   * (1) corner. A sheet already in the air keeps the corner it has.
   */
  private liftLeaf(j: number, corner: number): Leaf {
    const leaf = this.buildLeaf(j);
    if (this.moving.has(leaf)) return leaf;
    const side = this.sides[j] === -1 ? -1 : 1;
    leaf.gy = corner;
    leaf.p = { x: side, y: corner };
    leaf.target = side;
    leaf.motion = null;
    leaf.rank = this.moving.size;
    leaf.el.style.zIndex = String(1 + leaf.rank);
    leaf.el.style.display = "";
    leaf.el.style.visibility = "";
    this.moving.add(leaf);
    this.refreshSlots();
    this.render(leaf);
    return leaf;
  }

  /** Where a leaf's corner lies when it is down on `side`. */
  private rest(leaf: Leaf, side: 1 | -1): Vec {
    return { x: side, y: leaf.gy };
  }

  /** Send a leaf, from wherever it is, over to where it is committed to go. */
  private turn(leaf: Leaf, seconds = TURN_SECONDS) {
    const to = this.rest(leaf, leaf.target);
    const share = Math.abs(to.x - leaf.p.x) / 2;
    leaf.motion = {
      t: 0,
      duration: Math.max(0.3, seconds * Math.sqrt(share)),
      from: { ...leaf.p },
      to,
      arc: TURN_ARC * share,
      ease: easeInOutCubic,
      yoyo: false,
      land: true,
    };
    this.start();
  }

  /** Let a leaf go: it finishes where it was sent, on an easing curve. */
  private release(leaf: Leaf) {
    const to = this.rest(leaf, leaf.target);
    const share = Math.abs(to.x - leaf.p.x) / 2;
    leaf.motion = {
      t: 0,
      duration: 0.2 + 0.45 * share,
      from: { ...leaf.p },
      to,
      arc: 0,
      ease: easeOutCubic,
      yoyo: false,
      land: true,
    };
    this.start();
  }

  /** Turn sheet j over, the way a hand flips a page. */
  private launch(j: number | null, from: 1 | -1) {
    if (j === null) return;
    // Resting, peeled under the mouse, or still in the air: same page.
    const leaf = this.liftLeaf(j, 1);
    if (this.hover?.leaf === leaf) this.hover = null;
    leaf.target = from === 1 ? -1 : 1;
    this.turn(leaf);
    this.emit();
  }

  /** Lay a leaf down where it was committed to go. */
  private land(leaf: Leaf) {
    const side = leaf.target;
    leaf.motion = null;
    leaf.p = this.rest(leaf, side);
    if (this.hover?.leaf === leaf) this.hover = null;
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

  /**
   * Paper does not tear from the spine: the corner can go no further from
   * either end of the spine than the edge of the page between them is long.
   */
  private constrain(leaf: Leaf) {
    const W = this.W;
    const H = this.H;
    if (!W || !H) return;
    let x = leaf.p.x * W;
    let y = leaf.p.y * H;
    const gy = leaf.gy * H;
    const toTop = Math.hypot(W, gy);
    const toBottom = Math.hypot(W, H - gy);
    for (let k = 0; k < 4; k++) {
      [x, y] = within(x, y, 0, 0, toTop);
      [x, y] = within(x, y, 0, H, toBottom);
    }
    leaf.p.x = x / W;
    leaf.p.y = y / H;
  }

  /* ---------------------------------------------------------------- */
  /* Pointer                                                           */
  /* ---------------------------------------------------------------- */

  /** A pointer in book space, in page units. */
  private toBook(clientX: number, clientY: number): Vec {
    const rect = this.root.getBoundingClientRect();
    const sx = rect.width / (this.W * 2) || 1;
    const sy = rect.height / this.H || 1;
    const spine = rect.left + rect.width / 2;
    return {
      x: (this.dir * (clientX - spine)) / sx / this.W,
      y: (clientY - rect.top) / sy / this.H,
    };
  }

  private onPointerDown(e: PointerEvent) {
    if (this.drag || e.button !== 0 || this.W === 0) return;
    this.finishJump();
    const at = this.toBook(e.clientX, e.clientY);
    const t = performance.now();
    const pending = (): Drag => ({
      leaf: null,
      origin: 1,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startT: t,
      moved: false,
      start: at,
      base: at,
      gain: 1,
      goal: at,
      trail: [{ t, x: at.x }],
    });

    // With motion turned down, pages still turn where you tap them - they
    // just change rather than fold. A tap is all this records.
    if (this.reduced) {
      this.drag = pending();
      return;
    }

    if (this.single) {
      // One page on screen, and a finger could mean either direction: wait
      // for the first real movement to say which (see onPointerMove).
      if (at.x < -0.02) return;
      this.drag = pending();
      this.capture(e.pointerId);
      return;
    }

    const side: 1 | -1 = at.x >= 0 ? 1 : -1;
    // The page that turns from this side - resting, peeled under the mouse,
    // or still in the air, in which case it is caught.
    const j = side === 1 ? this.forwardLeaf() : this.backwardLeaf();
    if (j === null) return;
    if (this.hover && this.hover.leaf.index !== j) this.endHover();
    this.grab(j, side, at, e, t, 1);
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

  /**
   * Take sheet j by the corner nearest the pointer. `gain` is how far the
   * corner travels per unit of pointer - more than one when the page being
   * pulled is off the screen and has to sweep in.
   */
  private grab(j: number, origin: 1 | -1, at: Vec, e: PointerEvent, t: number, gain: number) {
    const leaf = this.liftLeaf(j, at.y < 0.5 ? 0 : 1);
    if (this.hover?.leaf === leaf) this.hover = null;
    leaf.motion = null;
    const prev = this.drag;
    this.drag = {
      leaf,
      origin,
      pointerId: e.pointerId,
      startX: prev?.startX ?? e.clientX,
      startY: prev?.startY ?? e.clientY,
      startT: prev?.startT ?? t,
      moved: prev?.moved ?? false,
      start: at,
      base: { ...leaf.p },
      gain,
      goal: { ...leaf.p },
      trail: [{ t, x: leaf.p.x }],
    };
  }

  private onPointerLeave() {
    if (!this.drag) this.endHover();
  }

  /**
   * Near a corner of a page, the mouse peels it up a little - the corner
   * leaning toward the pointer, the way a page rises to meet a thumb - and
   * lets it lie down again when it moves away.
   */
  private onHover(e: PointerEvent) {
    if (this.reduced || e.pointerType !== "mouse" || e.buttons !== 0 || this.W === 0) return;
    const at = this.toBook(e.clientX, e.clientY);
    const side: 1 | -1 = at.x >= 0 ? 1 : -1;
    const corner = at.y < 0.5 ? 0 : 1;
    const near =
      Math.abs(at.x) > 1 - HOVER_ZONE.x &&
      Math.abs(at.x) <= 1.02 &&
      at.y >= -0.02 &&
      at.y <= 1.02 &&
      (at.y < HOVER_ZONE.y || at.y > 1 - HOVER_ZONE.y) &&
      // A one-page book has nothing to lift on the far side.
      !(this.single && side === -1);
    if (!near) return this.endHover();
    if (this.hover && (this.hover.side !== side || this.hover.leaf.gy !== corner)) this.endHover();
    if (!this.hover) {
      if (this.moving.size > 0) return;
      const j = side === 1 ? this.forwardLeaf() : this.backwardLeaf();
      if (j === null) return;
      const leaf = this.liftLeaf(j, corner);
      leaf.target = side;
      this.hover = { leaf, side, goal: { ...leaf.p } };
    }
    // Inward from the corner, toward the pointer - never more than a peel.
    const inward = -side;
    const toward = { x: (at.x - side) * 0.6, y: (at.y - corner) * 0.6 };
    const dx = clamp(inward * toward.x, 0.03, HOVER_PEEL.x) * inward;
    const dy = clamp((corner === 1 ? -1 : 1) * toward.y, 0.02, HOVER_PEEL.y) * (corner === 1 ? -1 : 1);
    this.hover.goal = { x: side + dx, y: corner + dy };
    this.start();
  }

  private endHover() {
    const h = this.hover;
    if (!h) return;
    this.hover = null;
    if (!this.moving.has(h.leaf)) return;
    h.leaf.target = h.side;
    this.release(h.leaf);
  }

  private onPointerMove(e: PointerEvent) {
    const d = this.drag;
    if (!d) return this.onHover(e);
    if (e.pointerId !== d.pointerId) return;
    const at = this.toBook(e.clientX, e.clientY);
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) > 6) d.moved = true;

    if (!d.leaf) {
      // Nothing to drag with motion turned down: only the tap counts.
      if (this.reduced) return;
      // A one-page book deciding: a mostly vertical move is a scroll, not a
      // turn; toward the spine turns this page; away from it pulls back the
      // one before, which sweeps in from past the spine.
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        this.drag = null;
        return;
      }
      const forward = at.x < d.start.x;
      const j = forward ? this.forwardLeaf() : this.backwardLeaf();
      if (j === null) {
        this.drag = null;
        return;
      }
      this.grab(j, forward ? 1 : -1, forward ? d.start : at, e, performance.now(), forward ? 1 : PULL_GAIN);
      this.emit();
      this.start();
      return;
    }

    const leaf = d.leaf;
    const x = d.base.x + (at.x - d.start.x) * d.gain;
    // Carried across, the corner rises toward the middle of the page and
    // comes down again, so the fold runs diagonally, as under a thumb.
    const across = clamp((1 - x) / 2, 0, 1);
    const up = leaf.gy >= 0.5 ? -1 : 1;
    d.goal = {
      x,
      y: d.base.y + (at.y - d.start.y) + up * Math.sin(Math.PI * across) * DRAG_ARC,
    };
    const t = performance.now();
    d.trail.push({ t, x: d.goal.x });
    while (d.trail.length > 2 && t - d.trail[0].t > 100) d.trail.shift();
  }

  private onPointerUp(e: PointerEvent) {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointerId) return;
    this.drag = null;
    const quick = performance.now() - d.startT < 400;
    const tap = !d.moved && e.type === "pointerup" && quick;

    if (!d.leaf) {
      // No drag ever began: a tap. Near the spine goes back, anywhere else
      // goes on - as on any reader.
      if (tap) {
        if (d.start.x < (this.single || this.reduced ? 0.3 : 0)) this.prev();
        else this.next();
      }
      return;
    }

    const leaf = d.leaf;
    if (tap) {
      // A tap on a page turns it, like the button.
      leaf.target = d.origin === 1 ? -1 : 1;
      this.turn(leaf);
      this.emit();
      return;
    }

    // Let go. Over the spine (on a phone, the corner past the middle of the
    // page), or flicked that way, and the page goes over; otherwise it
    // falls back.
    const first = d.trail[0];
    const last = d.trail[d.trail.length - 1];
    const dt = Math.max(0.016, (last.t - first.t) / 1000);
    const speed = (last.x - first.x) / dt;
    const line = this.single ? (d.origin === 1 ? 0.5 : -0.55) : 0;
    const x = leaf.p.x;
    const over = d.origin === 1 ? x < line || speed < -FLICK : x > line || speed > FLICK;
    leaf.target = over ? (d.origin === 1 ? -1 : 1) : d.origin;
    this.release(leaf);
    this.emit();
  }

  /* ---------------------------------------------------------------- */
  /* Loop                                                              */
  /* ---------------------------------------------------------------- */

  private start() {
    if (this.raf) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  private tick(now: number) {
    this.raf = 0;
    if (this.destroyed) return;
    const dt = Math.min(0.05, (now - this.last) / 1000) * this.timeScale;
    this.last = now;
    const follow = 1 - Math.exp(-FOLLOW * dt);

    const d = this.drag?.leaf ? this.drag : null;
    if (d?.leaf) approach(d.leaf.p, d.goal, follow);
    const h = !d && this.hover && this.moving.has(this.hover.leaf) && !this.hover.leaf.motion ? this.hover : null;
    if (h) approach(h.leaf.p, h.goal, follow);

    const done: Leaf[] = [];
    for (const leaf of this.moving) {
      const m = leaf.motion;
      if (m) {
        m.t += dt;
        const u = Math.min(1, m.t / m.duration);
        if (m.yoyo) {
          const k = Math.sin(Math.PI * u);
          leaf.p.x = m.from.x + (m.to.x - m.from.x) * k;
          leaf.p.y = m.from.y + (m.to.y - m.from.y) * k;
        } else {
          const k = m.ease(u);
          const up = leaf.gy >= 0.5 ? -1 : 1;
          leaf.p.x = m.from.x + (m.to.x - m.from.x) * k;
          leaf.p.y = m.from.y + (m.to.y - m.from.y) * k + up * Math.sin(Math.PI * k) * m.arc;
        }
        if (u >= 1) done.push(leaf);
      }
      this.constrain(leaf);
      this.render(leaf);
    }
    for (const leaf of done) {
      if (leaf.motion?.land) this.land(leaf);
      else leaf.motion = null;
    }

    const animating = [...this.moving].some((leaf) => leaf.motion);
    const hovering = !!h && Math.hypot(h.goal.x - h.leaf.p.x, h.goal.y - h.leaf.p.y) > 0.0005;
    if (d || animating || hovering) {
      this.raf = requestAnimationFrame(this.tick);
    } else {
      this.emit();
    }
  }

  /* ---------------------------------------------------------------- */
  /* Drawing                                                           */
  /* ---------------------------------------------------------------- */

  private render(leaf: Leaf) {
    const W = this.W;
    const H = this.H;
    if (!W || !H) return;
    const dir = this.dir;

    // The fold: the perpendicular bisector of where the corner was (on the
    // outer edge, at height gy) and where it is now. n points back toward
    // where the corner was - the side of the fold that has turned over.
    const gx = W;
    const gy = leaf.gy * H;
    const px = leaf.p.x * W;
    const py = leaf.p.y * H;
    const dx = gx - px;
    const dy = gy - py;
    const dist = Math.hypot(dx, dy);
    let nx = 1;
    let ny = 0;
    let mx = W + 2;
    let my = gy;
    if (dist > 0.5) {
      nx = dx / dist;
      ny = dy / dist;
      mx = (gx + px) / 2;
      my = (gy + py) / 2;
    }

    // Sizes that follow the page, set only when it changes.
    const size = Math.round(W * 10000 + H);
    const big = 4 * Math.max(W, H);
    const reach = 2 * Math.hypot(W, H);
    if (leaf.laidOut !== size) {
      leaf.laidOut = size;
      leaf.clip.style.width = `${big}px`;
      leaf.clip.style.height = `${big}px`;
      for (const g of [leaf.gloss, leaf.cast]) {
        g.style.width = `${reach}px`;
        g.style.height = `${reach}px`;
      }
    }

    // Book space to the screen: X = W + dir * x.
    const snx = dir * nx;
    const sny = ny;
    const smx = W + dir * mx;
    const smy = my;

    // The clip keeps everything on the corner's new side of the fold: its
    // box starts at the fold line and runs away from where the corner was.
    const a = -snx;
    const b = -sny;
    const c = sny;
    const d = -snx;
    const e = smx - (big / 2) * sny;
    const f = smy + (big / 2) * snx;
    leaf.clip.style.transform = matrix(a, b, c, d, e, f);
    // ...and undoes itself inside, so the pages are placed in book coordinates.
    const ie = -(d * e - c * f);
    const iF = -(-b * e + a * f);
    leaf.inner.style.transform = matrix(d, -b, -c, a, ie, iF);

    // The front lies where it lies.
    const frontX = dir === 1 ? W : 0;
    leaf.front.style.transform = `translate3d(${frontX}px,0,0)`;
    leaf.castBox.style.transform = `translate3d(${frontX}px,0,0)`;

    // The back, turned over across the fold. Its own x runs from its outer
    // edge (LTR) or its spine (RTL), so map that to distance from the spine,
    // reflect it, and place it: a rotation, since turning a sheet over flips
    // it twice.
    const across = (u: number) => (dir === 1 ? W - u : u);
    const place = (u: number, v: number): [number, number] => {
      const x = across(u);
      const s = (x - mx) * nx + (v - my) * ny;
      return [W + dir * (x - 2 * s * nx), v - 2 * s * ny];
    };
    const [x0, y0] = place(0, 0);
    const [x1, y1] = place(W, 0);
    const [x2, y2] = place(0, H);
    leaf.back.style.transform = matrix((x1 - x0) / W, (y1 - y0) / W, (x2 - x0) / H, (y2 - y0) / H, x0, y0);

    // How open the fold is: nothing to light or shade until it is.
    const open = clamp(dist / (0.08 * W), 0, 1);

    // The gloss, on the back: from the fold into the turned-over part.
    const backDu = dir === 1 ? -1 : 1;
    const glossAngle = Math.atan2(ny, nx * backDu);
    const bu = dir === 1 ? W - mx : mx;
    leaf.gloss.style.transform = `translate3d(${bu}px,${my}px,0) rotate(${glossAngle}rad) translate3d(0,${-reach / 2}px,0)`;
    leaf.gloss.style.opacity = String(open);

    // The shadow the lifted paper throws on the page it uncovers - gone as
    // the page lies down on the far side.
    const frontDu = dir === 1 ? 1 : -1;
    const castAngle = Math.atan2(ny, nx * frontDu);
    const fu = dir === 1 ? mx : W - mx;
    leaf.cast.style.transform = `translate3d(${fu}px,${my}px,0) rotate(${castAngle}rad) translate3d(0,${-reach / 2}px,0)`;
    leaf.cast.style.opacity = String(open * clamp((leaf.p.x + 1) / 0.35, 0, 1));
  }
}

/** Move `p` part of the way to `goal`. */
function approach(p: Vec, goal: Vec, k: number) {
  p.x += (goal.x - p.x) * k;
  p.y += (goal.y - p.y) * k;
}

/** (x, y) pulled back inside a circle of radius r around (cx, cy). */
function within(x: number, y: number, cx: number, cy: number, r: number): [number, number] {
  const dx = x - cx;
  const dy = y - cy;
  const d = Math.hypot(dx, dy);
  if (d <= r || d < 1e-9) return [x, y];
  const k = r / d;
  return [cx + dx * k, cy + dy * k];
}
