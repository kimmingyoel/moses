"use client";

import { useMemo } from "react";

/* A tiny hand-drawn avatar — round head with subtle features.
 * Hash the name to choose a stable variant so each member feels distinct. */

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h);
}

type Tone = "ink" | "soft";

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
  const variant = useMemo(() => hash(name) % 4, [name]);
  const initial = name.trim().charAt(0) || "?";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
    >
      {/* face oval */}
      <path
        d={
          variant === 0
            ? "M 24 6 Q 38 7, 39 22 Q 40 38, 24 42 Q 8 38, 9 22 Q 10 7, 24 6 Z"
            : variant === 1
              ? "M 24 5 Q 36 6, 39 20 Q 40 36, 24 42 Q 9 36, 9 21 Q 10 6, 24 5 Z"
              : variant === 2
                ? "M 24 6 Q 39 8, 39 23 Q 38 38, 24 42 Q 9 38, 9 22 Q 10 7, 24 6 Z"
                : "M 24 5 Q 38 6, 39 21 Q 38 37, 24 42 Q 9 37, 9 22 Q 10 6, 24 5 Z"
        }
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
