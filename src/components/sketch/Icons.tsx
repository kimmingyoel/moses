"use client";

import type { CSSProperties } from "react";

type IconProps = {
  className?: string;
  style?: CSSProperties;
  strokeWidth?: number;
};

/* Minimal sketch icons drawn in the same hand-drawn style as the buttons. */

export function IconCheck({ className = "", style, strokeWidth = 2.6 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      fill="none"
      aria-hidden
    >
      <path
        d="M4 13 Q 6.5 16, 9 19 Q 13 12, 20 5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconClose({ className = "", style, strokeWidth = 2.4 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      fill="none"
      aria-hidden
    >
      <path
        d="M6 6 Q 12 12, 18 18"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M18 6 Q 12 12, 6 18"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconPlus({ className = "", style, strokeWidth = 2.4 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      fill="none"
      aria-hidden
    >
      <path
        d="M4 12 Q 12 11.8, 20 12"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M12 4 Q 12.2 12, 12 20"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconArrowLeft({
  className = "",
  style,
  strokeWidth = 2.4,
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      fill="none"
      aria-hidden
    >
      <path
        d="M19 12 Q 12 12, 5 12"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M11 6 Q 8 9, 5 12 Q 8 15, 11 18"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function IconChevron({
  className = "",
  style,
  strokeWidth = 2.4,
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      fill="none"
      aria-hidden
    >
      <path
        d="M6 9 Q 12 16, 18 9"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconPencil({
  className = "",
  style,
  strokeWidth = 2.3,
}: IconProps) {
  return (
    <svg
      viewBox="0 0 28 28"
      className={className}
      style={style}
      fill="none"
      aria-hidden
    >
      <path
        d="M5 23 L 9 22 L 22 9 L 19 6 L 6 19 Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#f5f5f5"
      />
      <path
        d="M18 7 L 21 10"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M5 23 L 7 21"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconUpload({
  className = "",
  style,
  strokeWidth = 2.4,
}: IconProps) {
  return (
    <svg
      viewBox="0 0 56 56"
      className={className}
      style={style}
      fill="none"
      aria-hidden
    >
      <path
        d="M10 38 Q 9 44, 12 46 Q 16 49, 28 49 Q 40 49, 44 46 Q 47 44, 46 38"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28 8 Q 28 22, 28 36"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M16 19 Q 22 14, 28 8 Q 34 14, 40 19"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function IconSparkle({
  className = "",
  style,
  strokeWidth = 2,
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      fill="none"
      aria-hidden
    >
      <path
        d="M12 3 Q 13 11, 21 12 Q 13 13, 12 21 Q 11 13, 3 12 Q 11 11, 12 3 Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function IconUndo({
  className = "",
  style,
  strokeWidth = 2.4,
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      fill="none"
      aria-hidden
    >
      <path
        d="M4 10 Q 8 6, 13 7 Q 19 9, 19 14 Q 19 18, 14 19"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 5 L 4 10 L 9 10"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconRedo({
  className = "",
  style,
  strokeWidth = 2.4,
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      fill="none"
      aria-hidden
    >
      <path
        d="M20 10 Q 16 6, 11 7 Q 5 9, 5 14 Q 5 18, 10 19"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 5 L 20 10 L 15 10"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconAlert({
  className = "",
  style,
  strokeWidth = 2.2,
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      fill="none"
      aria-hidden
    >
      <path
        d="M12 4 Q 12 10, 12 14"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="18"
        r="1.4"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconCopy({ className = "", style, strokeWidth = 2.2 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" aria-hidden>
      <path
        d="M9 9 L 19 9 Q 20 9, 20 10 L 20 20 Q 20 21, 19 21 L 9 21 Q 8 21, 8 20 L 8 10 Q 8 9, 9 9 Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M5 15 Q 4 15, 4 14 L 4 4 Q 4 3, 5 3 L 15 3 Q 16 3, 16 4 L 16 5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function IconTrash({ className = "", style, strokeWidth = 2.2 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" aria-hidden>
      <path d="M4 7 Q 12 6.4, 20 7" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M9 7 L 9.4 4.6 Q 9.5 4, 10.2 4 L 13.8 4 Q 14.5 4, 14.6 4.6 L 15 7" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M6 8 L 7 19 Q 7.1 20.4, 8.6 20.5 L 15.4 20.5 Q 16.9 20.4, 17 19 L 18 8" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M10 11 L 10.4 17 M 14 11 L 13.6 17" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

export function IconGrip({ className = "", style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" aria-hidden>
      {[8, 12, 16].map((y) =>
        [9, 15].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill="currentColor" />),
      )}
    </svg>
  );
}

export function IconUsers({ className = "", style, strokeWidth = 2.2 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" aria-hidden>
      <path d="M9 10 Q 12 10, 12 7 Q 12 4, 9 4 Q 6 4, 6 7 Q 6 10, 9 10 Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" fill="none" />
      <path d="M3 20 Q 3 14, 9 14 Q 15 14, 15 20" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
      <path d="M16 10 Q 19 9.5, 19 6.5 M 17 14 Q 21 14, 21 20" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function IconShuffle({ className = "", style, strokeWidth = 2.2 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" aria-hidden>
      <path d="M3 6 Q 8 6, 11 12 Q 14 18, 19 18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
      <path d="M3 18 Q 8 18, 11 12 Q 14 6, 19 6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
      <path d="M16 3 L 19.5 6 L 16 9" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M16 15 L 19.5 18 L 16 21" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
