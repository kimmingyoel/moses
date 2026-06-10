/* ────────────────────────────────────────────────────────────────────────── */
/*  Palette handles — every color resolves to a token from the canonical       */
/*  palette in globals.css (design_assets/color palette.svg). Never hard-code   */
/*  a hex here; add/adjust the level there instead.                            */
/* ────────────────────────────────────────────────────────────────────────── */

export const WHITE = "var(--color-white)"; /* 100 */
export const PAPER = "var(--color-paper)"; /* 300 */
export const INK = "var(--color-ink)"; /* 900 */

export type Tone = "ink" | "soft" | "muted";

export const STROKE: Record<Tone, string> = {
  ink: "var(--color-ink)" /* 900 */,
  soft: "var(--color-graphite)" /* 700 */,
  muted: "var(--color-ash)" /* 500 */,
};
