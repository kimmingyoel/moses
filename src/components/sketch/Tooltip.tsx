"use client";

import { useState, type ReactNode } from "react";
import { SketchFrame, SketchRectVisual } from "./Sketch";
import { INK, PAPER } from "./palette";
import { IconAlert } from "./Icons";

type Side = "top" | "bottom" | "left" | "right";

/* ── Small "i" / "?" badge, the head of an info note ── */
export function InfoBadge({
  glyph = "i",
  size = 22,
  className = "",
}: {
  glyph?: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <SketchRectVisual radius={9999} fill={INK} stroke="ink" wobble={0.4} strokeWidth={2.1} seed={41} />
      <span
        className="font-title relative leading-none text-[var(--color-paper)]"
        style={{ fontSize: size * 0.62 }}
      >
        {glyph}
      </span>
    </span>
  );
}

/* ── Speech bubble with a hand-drawn tail (design_assets/tooltip) ── */
export function SpeechBubble({
  children,
  side = "top",
  dark = false,
  scribble = false,
  className = "",
}: {
  children: ReactNode;
  side?: Side;
  dark?: boolean;
  scribble?: boolean;
  className?: string;
}) {
  const fill = dark ? INK : PAPER;
  const textCls = dark ? "text-[var(--color-paper)]" : "text-[var(--color-ink)]";

  // Tail geometry per side — a little triangle overlapping the bubble edge.
  const tailStyle: React.CSSProperties = (() => {
    switch (side) {
      case "top": // bubble above target → tail at bottom pointing down
        return { left: "50%", bottom: -9, transform: "translateX(-50%) rotate(0deg)" };
      case "bottom":
        return { left: "50%", top: -9, transform: "translateX(-50%) rotate(180deg)" };
      case "left":
        return { top: "50%", right: -9, transform: "translateY(-50%) rotate(270deg)" };
      case "right":
        return { top: "50%", left: -9, transform: "translateY(-50%) rotate(90deg)" };
    }
  })();

  return (
    <div className={`relative inline-block ${className}`}>
      <SketchFrame
        radius={14}
        fill={fill}
        stroke="ink"
        shadow="drop"
        wobble={0.5}
        strokeWidth={2.3}
        scribble={scribble}
        contentClassName={`px-3.5 py-2 font-note text-[0.98rem] leading-snug ${textCls}`}
      >
        {children}
      </SketchFrame>
      <span className="absolute" style={tailStyle}>
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden>
          <path d="M1 1 L 9 11 L 17 1 Z" fill={fill} />
          <path
            d="M1 1 L 9 11 L 17 1"
            stroke={INK}
            strokeWidth={2.3}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </span>
    </div>
  );
}

/* ── Hover/focus tooltip wrapper ── */
export function Tooltip({
  label,
  side = "top",
  dark = true,
  children,
  className = "",
}: {
  label: ReactNode;
  side?: Side;
  dark?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const pos =
    side === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-3"
      : side === "bottom"
        ? "top-full left-1/2 -translate-x-1/2 mt-3"
        : side === "left"
          ? "right-full top-1/2 -translate-y-1/2 mr-3"
          : "left-full top-1/2 -translate-y-1/2 ml-3";

  return (
    <span
      className={`relative inline-flex ${className}`}
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={`animate-pop pointer-events-none absolute z-50 whitespace-nowrap ${pos}`}
        >
          <SpeechBubble side={side} dark={dark}>
            {label}
          </SpeechBubble>
        </span>
      )}
    </span>
  );
}

/* ── Info callout — a bordered note for guidance / empty states ── */
export function InfoNote({
  children,
  dashed = true,
  tone = "ink",
  className = "",
  contentClassName = "",
}: {
  children: ReactNode;
  dashed?: boolean;
  tone?: "ink" | "soft" | "muted";
  className?: string;
  contentClassName?: string;
}) {
  return (
    <SketchFrame
      radius={16}
      fill={PAPER}
      stroke={tone}
      dashed={dashed}
      shadow="none"
      wobble={0.55}
      strokeWidth={2.2}
      className={className}
      contentClassName={`flex items-center gap-3 px-4 py-3.5 ${contentClassName}`}
    >
      <IconAlert className="h-[22px] w-[22px] shrink-0 text-[var(--color-ink)]" />
      <div className="min-w-0 font-hand text-[1.02rem] leading-snug text-[var(--color-ink)]">
        {children}
      </div>
    </SketchFrame>
  );
}
