"use client";

import { useMemo, type CSSProperties, type ReactNode } from "react";
import { buildArrow } from "./handDrawn";
import { STROKE, type Tone } from "./palette";

/**
 * A curved, hand-drawn arrow. By default it sweeps from the top-left toward the
 * bottom-right of its box with a small bow and an arrowhead at the end. Rotate
 * or flip it from the call site (style transform / className) to aim anywhere.
 */
export function HintArrow({
  width = 110,
  height = 80,
  bend = 0.32,
  tone = "soft",
  strokeWidth = 2.4,
  className = "",
  style,
}: {
  width?: number;
  height?: number;
  bend?: number;
  tone?: Tone;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const { shaft, head } = useMemo(
    () =>
      buildArrow({
        x1: width * 0.1,
        y1: height * 0.12,
        x2: width * 0.86,
        y2: height * 0.82,
        bend,
        headLen: Math.min(width, height) * 0.18,
      }),
    [width, height, bend],
  );

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className={`pointer-events-none ${className}`}
      style={style}
      aria-hidden
    >
      <path
        d={shaft}
        stroke={STROKE[tone]}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
      {head.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke={STROKE[tone]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
      ))}
    </svg>
  );
}

/**
 * A handwritten margin note. Positioned by the caller (absolute, in the open
 * desk margins). Tucked behind `hidden lg:block` at the call site so it only
 * shows when there's room. Slightly rotated for that scribbled-in-the-margin
 * feel.
 */
export function Scrawl({
  children,
  rotate = -3,
  tone = "graphite",
  className = "",
  style,
}: {
  children: ReactNode;
  rotate?: number;
  tone?: "ink" | "graphite" | "ash";
  className?: string;
  style?: CSSProperties;
}) {
  const colorVar =
    tone === "ink"
      ? "var(--color-ink)"
      : tone === "ash"
        ? "var(--color-ash)"
        : "var(--color-graphite)";
  return (
    <span
      className={`font-note leading-snug ${className}`}
      style={{ transform: `rotate(${rotate}deg)`, color: colorVar, ...style }}
    >
      {children}
    </span>
  );
}
