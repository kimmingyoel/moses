/**
 * Helpers for generating hand-drawn SVG paths.
 *
 * Each path mimics the look of the figma asset SVGs: each "straight" edge is
 * split into several short quadratic segments with tiny Y/X offsets so that
 * the line wobbles like a real pen stroke. Corner arcs are drawn as two
 * separate strokes that lap each other slightly. The result keeps crisp text
 * (we never use the displacement filter for text) while still feeling sketched.
 */

export type HandDrawnOptions = {
  width: number;
  height: number;
  radius?: number;
  wobble?: number;
  seed?: number;
  /** Number of zigzag points along the longer edge. Edges are scaled relative. */
  segments?: number;
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function linePath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  rand: () => number,
  wobble: number,
  segments: number,
  axis: "x" | "y"
) {
  const dx = endX - startX;
  const dy = endY - startY;
  const out: string[] = [`M ${startX.toFixed(2)} ${startY.toFixed(2)}`];
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    let x = startX + dx * t;
    let y = startY + dy * t;
    const j = (rand() - 0.5) * 2 * wobble;
    if (axis === "x") y += j;
    else x += j;
    out.push(`L ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return out.join(" ");
}

/** Cubic arc helper for a clean rounded corner that still feels hand-drawn. */
function cornerArc(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  radius: number,
  sweep: 0 | 1
) {
  return `M ${fromX.toFixed(2)} ${fromY.toFixed(2)} A ${radius.toFixed(2)} ${radius.toFixed(2)} 0 0 ${sweep} ${toX.toFixed(2)} ${toY.toFixed(2)}`;
}

export type HandDrawnPaths = {
  /** Full closed outline for filling the background */
  fill: string;
  /** Four edge strokes — each wobbles slightly */
  edges: string[];
  /** Four corner arcs */
  corners: string[];
};

export function buildHandDrawnRect({
  width,
  height,
  radius = 12,
  wobble = 0.55,
  seed = 7,
  segments,
}: HandDrawnOptions): HandDrawnPaths {
  // Keep the measured rect honest — clamp radius to fit, never inflate the rect
  // to accommodate an oversized radius (that's how a radius=999 "pill" request
  // used to balloon a 126x51 ribbon into a 2002x2002 monster).
  const w = Math.max(width, 4);
  const h = Math.max(height, 4);
  const r = Math.max(0, Math.min(radius, Math.min(w, h) / 2));
  const rand = mulberry32(seed);
  const longSide = Math.max(w, h);
  const segs = Math.max(3, Math.round((segments ?? Math.max(longSide / 28, 4))));

  const top = linePath(r, 0, w - r, 0, rand, wobble, segs, "x");
  const bottom = linePath(r, h, w - r, h, rand, wobble, segs, "x");
  const left = linePath(0, h - r, 0, r, rand, wobble, segs, "y");
  const right = linePath(w, r, w, h - r, rand, wobble, segs, "y");

  // For corners, sample a slightly different sweep on each piece to mimic the
  // double-laced look from the design assets.
  //
  // When the radius is zero we emit empty path strings instead of degenerate
  // arcs. A zero-length stroked path with strokeLinecap="round" renders as a
  // FULL CIRCLE of diameter=strokeWidth in user-space units in Safari — and
  // because the SSR fallback uses a 4×4 viewBox stretched via
  // preserveAspectRatio="none", that "circle" balloons into a several-hundred
  // pixel amoeba blob at each corner. Empty `d` skips painting entirely.
  const hasCorners = r > 0;
  const tl = hasCorners ? cornerArc(0, r, r, 0, r + (rand() - 0.5) * wobble, 1) : "";
  const tr = hasCorners ? cornerArc(w - r, 0, w, r, r + (rand() - 0.5) * wobble, 1) : "";
  const br = hasCorners ? cornerArc(w, h - r, w - r, h, r + (rand() - 0.5) * wobble, 1) : "";
  const bl = hasCorners ? cornerArc(r, h, 0, h - r, r + (rand() - 0.5) * wobble, 1) : "";

  const fill = [
    `M ${r} 0`,
    `L ${w - r} 0`,
    `A ${r} ${r} 0 0 1 ${w} ${r}`,
    `L ${w} ${h - r}`,
    `A ${r} ${r} 0 0 1 ${w - r} ${h}`,
    `L ${r} ${h}`,
    `A ${r} ${r} 0 0 1 0 ${h - r}`,
    `L 0 ${r}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
    "Z",
  ].join(" ");

  return {
    fill,
    edges: [top, right, bottom, left],
    corners: [tl, tr, br, bl],
  };
}

/** Generate a short, slightly wavy underline of given width. */
export function buildHandDrawnUnderline(width: number, seed = 9) {
  const rand = mulberry32(seed);
  const segs = Math.max(4, Math.round(width / 28));
  return linePath(2, 3, width - 2, 3, rand, 1.2, segs, "x");
}

/**
 * Horizontal wavy line at the vertical center of a `height`-tall box, mimicking
 * the `design_assets/line` strokes. `roughness` scales the wobble amplitude;
 * `double` returns a second parallel stroke a few pixels above for the
 * Double=True variant.
 */
export function buildWavyLine(
  width: number,
  height = 6,
  roughness = 1,
  seed = 7,
): string[] {
  const rand = mulberry32(seed);
  const w = Math.max(width, 8);
  const amp = Math.min(Math.max(roughness, 0.2), 2.4);
  const segs = Math.max(4, Math.round(w / 30));
  const midY = height / 2;
  return [linePath(2, midY, w - 2, midY, rand, amp, segs, "x")];
}

export function buildDoubleWavyLine(
  width: number,
  height = 11,
  roughness = 1,
  seed = 7,
): string[] {
  const rand = mulberry32(seed);
  const w = Math.max(width, 8);
  const amp = Math.min(Math.max(roughness, 0.2), 2.4);
  const segs = Math.max(4, Math.round(w / 30));
  const gap = Math.max(height - 4, 4);
  const top = (height - gap) / 2;
  return [
    linePath(2, top, w - 2, top, rand, amp, segs, "x"),
    linePath(2, top + gap, w - 2, top + gap, rand, amp, segs, "x"),
  ];
}

/**
 * Diagonal back-and-forth hatching that fills a rect — the "Scribble=True"
 * look from the button assets. Returns a single continuous path so one stroke
 * draws the whole scribble (like a pen never leaving the paper). Caller clips
 * it to the rounded rect.
 */
export function buildScribbleFill({
  width,
  height,
  gap = 7,
  wobble = 1.1,
  seed = 7,
}: {
  width: number;
  height: number;
  gap?: number;
  wobble?: number;
  seed?: number;
}): string {
  const w = Math.max(width, 4);
  const h = Math.max(height, 4);
  const rand = mulberry32(seed);
  // Sweep 45° diagonals across the box. We parametrise by the x-intercept of
  // each diagonal along the top/bottom edges and zig-zag up and down.
  const out: string[] = [];
  const span = w + h; // diagonal coverage
  let first = true;
  let dir = 1;
  for (let c = -h; c <= w + h; c += gap) {
    // A diagonal line going down-right: from (c, 0) to (c + h, h), clipped to box.
    const ax = c;
    const ay = 0;
    const bx = c + h;
    const by = h;
    // Endpoints, alternating direction so the pen "returns".
    const p1x = (dir > 0 ? ax : bx) + (rand() - 0.5) * wobble;
    const p1y = (dir > 0 ? ay : by) + (rand() - 0.5) * wobble;
    const p2x = (dir > 0 ? bx : ax) + (rand() - 0.5) * wobble;
    const p2y = (dir > 0 ? by : ay) + (rand() - 0.5) * wobble;
    if (first) {
      out.push(`M ${p1x.toFixed(1)} ${p1y.toFixed(1)}`);
      first = false;
    } else {
      out.push(`L ${p1x.toFixed(1)} ${p1y.toFixed(1)}`);
    }
    out.push(`L ${p2x.toFixed(1)} ${p2y.toFixed(1)}`);
    dir *= -1;
  }
  void span;
  return out.join(" ");
}

/**
 * A hand-drawn curved arrow from `start` to `end` with a small two-stroke
 * arrowhead at the end. `bend` curves the shaft (positive = bow one way).
 * Returns shaft + the two head strokes.
 */
export function buildArrow({
  x1,
  y1,
  x2,
  y2,
  bend = 0.3,
  headLen = 12,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  bend?: number;
  headLen?: number;
}): { shaft: string; head: string[] } {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  // Perpendicular offset for the control point → a gentle bow.
  const nx = -dy / len;
  const ny = dx / len;
  const cx = mx + nx * bend * len;
  const cy = my + ny * bend * len;
  const shaft = `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;

  // Arrowhead: direction is the tangent at the end (from control point to end).
  const tx = x2 - cx;
  const ty = y2 - cy;
  const tlen = Math.hypot(tx, ty) || 1;
  const ux = tx / tlen;
  const uy = ty / tlen;
  const angle = Math.PI / 6; // 30°
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  // Two head strokes rotated ±angle from the reversed tangent.
  const r1x = -(ux * cos - uy * sin);
  const r1y = -(ux * sin + uy * cos);
  const r2x = -(ux * cos + uy * sin);
  const r2y = -(-ux * sin + uy * cos);
  const head = [
    `M ${x2.toFixed(1)} ${y2.toFixed(1)} L ${(x2 + r1x * headLen).toFixed(1)} ${(y2 + r1y * headLen).toFixed(1)}`,
    `M ${x2.toFixed(1)} ${y2.toFixed(1)} L ${(x2 + r2x * headLen).toFixed(1)} ${(y2 + r2y * headLen).toFixed(1)}`,
  ];
  return { shaft, head };
}
