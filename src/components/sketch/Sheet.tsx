"use client";

import type { HTMLAttributes, PropsWithChildren } from "react";
import { SketchRectVisual, PAPER } from "./Sketch";

type SheetProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>> & {
  compact?: boolean;
};

/**
 * The paper sheet each step is written on. Same paper tone as the desk
 * underneath — it reads as a separate sheet only through its hand-drawn
 * outline and the soft drop shadow lifting it off the page (see
 * design_assets/elevation.svg).
 */
export function Sheet({ children, className = "", compact = false, ...rest }: SheetProps) {
  const padding = compact ? "px-5 py-6 sm:px-8 sm:py-9" : "px-6 py-8 sm:px-12 sm:py-12";

  return (
    <div className={`relative ${className}`} {...rest}>
      <SketchRectVisual
        radius={24}
        fill={PAPER}
        stroke="ink"
        shadow="drop"
        wobble={0.7}
        strokeWidth={2.6}
        seed={3}
      />
      <div className={`relative ${padding}`}>{children}</div>
    </div>
  );
}
