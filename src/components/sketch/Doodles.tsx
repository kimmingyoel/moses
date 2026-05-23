"use client";

import type { CSSProperties, SVGProps } from "react";

/**
 * Small hand-drawn decoration glyphs. Built to match the rest of the sketch
 * primitives — thin charcoal strokes (#262626), white fills, slight wobble.
 *
 * Each doodle takes the usual width/height via Tailwind and accepts a
 * `tone` knob so the stroke can fade for mid-ground decoration.
 */

type Tone = "ink" | "soft" | "muted";

const TONE: Record<Tone, string> = {
  ink: "#262626",
  soft: "#585858",
  muted: "#9e9e9e",
};

type Props = SVGProps<SVGSVGElement> & {
  tone?: Tone;
  className?: string;
  style?: CSSProperties;
};

function commonProps(tone: Tone) {
  return {
    stroke: TONE[tone],
    strokeWidth: 2.2 as const,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

/* ── Receipt — long strip with zigzag bottom and a few price lines ── */
export function DoodleReceipt({ tone = "ink", className, style, ...rest }: Props) {
  const p = commonProps(tone);
  return (
    <svg
      viewBox="0 0 64 96"
      fill="none"
      className={className}
      style={style}
      aria-hidden
      {...rest}
    >
      <path
        d="M8 6 Q 6 4, 9 4 L 55 4 Q 58 4, 56 7 L 56 84
           L 50 80 L 44 84 L 38 80 L 32 84 L 26 80 L 20 84 L 14 80 L 8 84 Z"
        fill="#ffffff"
        {...p}
      />
      <path d="M14 22 Q 24 21, 38 22" {...p} strokeWidth={1.8} />
      <path d="M14 32 Q 28 31, 50 32" {...p} strokeWidth={1.8} />
      <path d="M14 42 Q 22 41, 32 42" {...p} strokeWidth={1.8} />
      <path d="M40 42 Q 46 42, 50 42" {...p} strokeWidth={1.8} />
      <path d="M14 56 L 50 56" {...p} strokeDasharray="2 3" strokeWidth={1.6} />
      <path d="M14 66 Q 30 65, 50 66" {...p} strokeWidth={1.8} />
    </svg>
  );
}

/* ── Coin ── */
export function DoodleCoin({ tone = "ink", className, style, ...rest }: Props) {
  const p = commonProps(tone);
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-hidden
      {...rest}
    >
      <path
        d="M24 5 Q 41 6, 43 24 Q 41 42, 24 43 Q 7 42, 5 24 Q 7 6, 24 5 Z"
        fill="#ffffff"
        {...p}
      />
      <path
        d="M24 11 Q 36 12, 37 24 Q 36 36, 24 37 Q 12 36, 11 24 Q 12 12, 24 11"
        {...p}
        strokeWidth={1.6}
      />
      <text
        x="24"
        y="30"
        textAnchor="middle"
        fontFamily="var(--font-hand)"
        fontSize="16"
        fill={TONE[tone]}
      >
        ₩
      </text>
    </svg>
  );
}

/* ── Small coin (no ₩ glyph) for clusters ── */
export function DoodleCoinSmall({ tone = "ink", className, style, ...rest }: Props) {
  const p = commonProps(tone);
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      style={style}
      aria-hidden
      {...rest}
    >
      <path
        d="M16 3 Q 28 4, 29 16 Q 28 28, 16 29 Q 4 28, 3 16 Q 4 4, 16 3 Z"
        fill="#ffffff"
        {...p}
      />
      <path d="M11 13 Q 16 12, 21 13" {...p} strokeWidth={1.6} />
      <path d="M11 19 Q 16 20, 21 19" {...p} strokeWidth={1.6} />
    </svg>
  );
}

/* ── Coffee cup with steam ── */
export function DoodleCoffee({ tone = "ink", className, style, ...rest }: Props) {
  const p = commonProps(tone);
  return (
    <svg
      viewBox="0 0 56 64"
      fill="none"
      className={className}
      style={style}
      aria-hidden
      {...rest}
    >
      {/* steam */}
      <path d="M18 6 Q 16 11, 19 16 Q 22 21, 19 26" {...p} strokeWidth={1.6} />
      <path d="M28 4 Q 26 9, 29 14 Q 32 19, 29 24" {...p} strokeWidth={1.6} />
      <path d="M38 6 Q 36 11, 39 16 Q 42 21, 39 26" {...p} strokeWidth={1.6} />
      {/* cup */}
      <path
        d="M10 30 Q 9 28, 12 28 L 44 28 Q 47 28, 46 30
           L 43 54 Q 43 60, 36 60 L 20 60 Q 13 60, 13 54 Z"
        fill="#ffffff"
        {...p}
      />
      {/* handle */}
      <path
        d="M46 34 Q 53 36, 53 44 Q 53 51, 45 50"
        {...p}
      />
    </svg>
  );
}

/* ── Pencil ── */
export function DoodlePencil({ tone = "ink", className, style, ...rest }: Props) {
  const p = commonProps(tone);
  return (
    <svg
      viewBox="0 0 96 32"
      fill="none"
      className={className}
      style={style}
      aria-hidden
      {...rest}
    >
      {/* body */}
      <path
        d="M16 8 L 78 6 Q 82 7, 82 10 L 82 22 Q 82 25, 78 26 L 16 24 L 4 16 Z"
        fill="#ffffff"
        {...p}
      />
      {/* eraser tip cap */}
      <path d="M78 6 Q 82 7, 82 10 L 82 22 Q 82 25, 78 26" {...p} />
      {/* ferrule line */}
      <path d="M72 7 Q 73 16, 72 25" {...p} strokeWidth={1.8} />
      <path d="M66 8 Q 67 16, 66 24" {...p} strokeWidth={1.6} />
      {/* tip */}
      <path d="M4 16 L 10 12 M 4 16 L 10 20" {...p} strokeWidth={1.8} />
    </svg>
  );
}

/* ── Piggy bank ── */
export function DoodlePiggyBank({ tone = "ink", className, style, ...rest }: Props) {
  const p = commonProps(tone);
  return (
    <svg
      viewBox="0 0 80 64"
      fill="none"
      className={className}
      style={style}
      aria-hidden
      {...rest}
    >
      {/* body */}
      <path
        d="M12 32 Q 8 22, 18 16 Q 30 9, 46 12 Q 64 16, 70 28
           Q 74 36, 70 44 Q 68 50, 62 52 L 60 58 Q 60 60, 56 60 L 52 60
           Q 50 60, 50 56 L 50 54 L 32 54 L 32 56 Q 32 60, 28 60 L 24 60
           Q 20 60, 22 54 Q 14 50, 12 42 Z"
        fill="#ffffff"
        {...p}
      />
      {/* coin slot */}
      <path d="M34 18 Q 42 16, 50 18" {...p} strokeWidth={2.4} />
      {/* eye */}
      <circle cx="22" cy="28" r="1.6" fill={TONE[tone]} />
      {/* curly tail */}
      <path d="M68 30 Q 73 28, 74 32 Q 75 36, 72 36" {...p} strokeWidth={1.8} />
    </svg>
  );
}

/* ── Sparkle ── */
export function DoodleSparkle({ tone = "ink", className, style, ...rest }: Props) {
  const p = commonProps(tone);
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={style}
      aria-hidden
      {...rest}
    >
      <path
        d="M12 2 Q 13 10, 22 12 Q 13 14, 12 22 Q 11 14, 2 12 Q 11 10, 12 2 Z"
        fill="#ffffff"
        {...p}
      />
    </svg>
  );
}

/* ── Squiggle — a few wavy strokes for filler ── */
export function DoodleSquiggle({ tone = "muted", className, style, ...rest }: Props) {
  const p = commonProps(tone);
  return (
    <svg
      viewBox="0 0 64 16"
      fill="none"
      className={className}
      style={style}
      aria-hidden
      {...rest}
    >
      <path d="M2 8 Q 10 2, 18 8 T 34 8 T 50 8 T 62 8" {...p} strokeWidth={1.8} />
    </svg>
  );
}

/* ── Small star burst (different from sparkle) ── */
export function DoodleBurst({ tone = "ink", className, style, ...rest }: Props) {
  const p = commonProps(tone);
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      className={className}
      style={style}
      aria-hidden
      {...rest}
    >
      <path d="M14 2 L 14 8" {...p} strokeWidth={1.8} />
      <path d="M14 20 L 14 26" {...p} strokeWidth={1.8} />
      <path d="M2 14 L 8 14" {...p} strokeWidth={1.8} />
      <path d="M20 14 L 26 14" {...p} strokeWidth={1.8} />
      <path d="M5 5 L 9 9" {...p} strokeWidth={1.6} />
      <path d="M19 19 L 23 23" {...p} strokeWidth={1.6} />
      <path d="M23 5 L 19 9" {...p} strokeWidth={1.6} />
      <path d="M5 23 L 9 19" {...p} strokeWidth={1.6} />
    </svg>
  );
}
