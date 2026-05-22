"use client";

import type { HTMLAttributes, PropsWithChildren } from "react";
import { SketchRectVisual } from "./Sketch";

type SheetProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>> & {
  compact?: boolean;
};

/**
 * Paper-style frame used as the main canvas for each step. It's drawn with
 * SketchRectVisual so the border is genuinely hand-drawn rather than relying
 * on CSS filters that would distort child text as a side effect.
 */
export function Sheet({
  children,
  className = "",
  compact = false,
  ...rest
}: SheetProps) {
  const padding = compact ? "px-5 py-6 sm:px-8 sm:py-8" : "px-6 py-8 sm:px-10 sm:py-12";

  return (
    <div className={`relative ${className}`} {...rest}>
      <SketchRectVisual
        radius={22}
        fill="#ffffff"
        stroke="ink"
        shadow="drop"
        wobble={0.65}
        strokeWidth={2.6}
        seed={3}
      />
      <div className={`relative ${padding}`}>{children}</div>
    </div>
  );
}
