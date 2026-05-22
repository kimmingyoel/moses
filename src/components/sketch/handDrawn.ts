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
  const tl = cornerArc(0, r, r, 0, r + (rand() - 0.5) * wobble, 1);
  const tr = cornerArc(w - r, 0, w, r, r + (rand() - 0.5) * wobble, 1);
  const br = cornerArc(w, h - r, w - r, h, r + (rand() - 0.5) * wobble, 1);
  const bl = cornerArc(r, h, 0, h - r, r + (rand() - 0.5) * wobble, 1);

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
