"use client";

import { useMemo } from "react";

/* A clean hand-drawn avatar: one softly-wobbled circle with the initial inside.
 * Consistent across people (no random faces) so a roster reads as tidy, not busy.
 * The circle's slight imperfection is deterministic per name. */

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h) || 1;
}

type Tone = "ink" | "soft";

export function Avatar({
  name,
  size = 44,
  tone = "ink",
}: {
  name: string;
  size?: number;
  tone?: Tone;
}) {
  const stroke = tone === "ink" ? "var(--color-ink)" : "var(--color-graphite)";

  const { path, initial } = useMemo(() => {
    const seed = hash(name);
    // four tiny radial nudges, deterministic, kept small for a calm circle
    const j = (n: number) => ((seed >> n) & 7) / 7 - 0.5; // -0.5..0.5
    const r = 19;
    const c = 24;
    const top = `${c + j(0) * 1.4} ${c - r + j(1) * 1.2}`;
    const right = `${c + r + j(2) * 1.4} ${c + j(3) * 1.2}`;
    const bottom = `${c + j(4) * 1.4} ${c + r + j(5) * 1.2}`;
    const left = `${c - r + j(6) * 1.4} ${c + j(7) * 1.2}`;
    const k = r * 0.55;
    const d =
      `M ${top} ` +
      `C ${c + k} ${c - r}, ${c + r} ${c - k}, ${right} ` +
      `C ${c + r} ${c + k}, ${c + k} ${c + r}, ${bottom} ` +
      `C ${c - k} ${c + r}, ${c - r} ${c + k}, ${left} ` +
      `C ${c - r} ${c - k}, ${c - k} ${c - r}, ${top} Z`;
    return { path: d, initial: name.trim().charAt(0) || "?" };
  }, [name]);

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path d={path} stroke={stroke} strokeWidth={2.2} fill="var(--color-paper)" strokeLinejoin="round" />
      <text
        x="24"
        y="30"
        textAnchor="middle"
        fontFamily="var(--font-hand)"
        fontSize="18"
        fill={stroke}
      >
        {initial}
      </text>
    </svg>
  );
}
