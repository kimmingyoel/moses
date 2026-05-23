"use client";

import { useMemo } from "react";

/* Hand-drawn avatar. Every member gets a circle, but no two circles are
 * drawn the same way — variant, eyes, mouth, and ear/bow accents are all
 * picked from the name's hash so each profile feels distinct without ever
 * straying from the doodled aesthetic. */

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

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h) || 1;
}

type Tone = "ink" | "soft";

/* Different circle shapes — all roughly round but drawn with different
 * imperfections so back-to-back avatars don't look stamped. */
const SHAPES = [
  // 1. Slightly tall oval
  "M 24 5 Q 38 6, 39 21 Q 38 37, 24 42 Q 9 37, 9 22 Q 10 6, 24 5 Z",
  // 2. Wider, near-circle
  "M 24 6 Q 41 7, 41 24 Q 40 39, 24 42 Q 8 39, 7 24 Q 8 7, 24 6 Z",
  // 3. Lopsided — bigger on the right
  "M 24 5 Q 41 6, 42 23 Q 41 39, 25 42 Q 9 39, 8 23 Q 10 7, 24 5 Z",
  // 4. Squatter
  "M 24 8 Q 40 9, 41 24 Q 40 38, 24 41 Q 8 38, 8 24 Q 9 9, 24 8 Z",
  // 5. Pear-ish — wider at bottom
  "M 24 6 Q 37 6, 38 20 Q 41 35, 24 42 Q 7 35, 10 20 Q 11 6, 24 6 Z",
  // 6. Tilt — leans slightly right
  "M 25 5 Q 40 7, 41 22 Q 40 38, 25 42 Q 9 39, 9 23 Q 11 7, 25 5 Z",
];

/* Optional accents — a curl, an antenna, a side-tuft. Drawn before the face
 * so the head sits on top. */
function Accent({ kind, stroke }: { kind: number; stroke: string }) {
  switch (kind) {
    case 0: // little curl on top
      return (
        <path
          d="M 24 5 Q 22 1, 26 2"
          stroke={stroke}
          strokeWidth={1.8}
          fill="none"
          strokeLinecap="round"
        />
      );
    case 1: // antenna with dot
      return (
        <>
          <path
            d="M 24 5 Q 25 1, 28 -1"
            stroke={stroke}
            strokeWidth={1.6}
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="28" cy="-1" r="1.6" fill={stroke} />
        </>
      );
    case 2: // side tuft (hair flick)
      return (
        <path
          d="M 39 12 Q 44 10, 43 15"
          stroke={stroke}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
        />
      );
    case 3: // tiny bow on top
      return (
        <path
          d="M 21 3 Q 24 5, 27 3 Q 28 6, 24 6 Q 20 6, 21 3 Z"
          stroke={stroke}
          strokeWidth={1.4}
          fill="#ffffff"
          strokeLinejoin="round"
        />
      );
    default: // no accent
      return null;
  }
}

export function Avatar({
  name,
  size = 48,
  tone = "ink",
}: {
  name: string;
  size?: number;
  tone?: Tone;
}) {
  const stroke = tone === "ink" ? "#262626" : "#7a7a7a";

  const { shapePath, accentKind, initial } = useMemo(() => {
    const seed = hash(name);
    const rand = mulberry32(seed);
    const shape = Math.floor(rand() * SHAPES.length);
    // 60% chance an accent gets drawn — keeps the lineup from feeling busy.
    const accent = rand() < 0.6 ? Math.floor(rand() * 4) : -1;
    return {
      shapePath: SHAPES[shape],
      accentKind: accent,
      initial: name.trim().charAt(0) || "?",
    };
  }, [name]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="-4 -6 56 54"
      fill="none"
      aria-hidden
    >
      <Accent kind={accentKind} stroke={stroke} />
      <path
        d={shapePath}
        stroke={stroke}
        strokeWidth={2.3}
        fill="#ffffff"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <text
        x="24"
        y="29"
        textAnchor="middle"
        fontFamily="var(--font-hand)"
        fontSize="17"
        fill={stroke}
      >
        {initial}
      </text>
    </svg>
  );
}
