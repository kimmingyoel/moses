"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { buildWavyLine, buildDoubleWavyLine } from "./handDrawn";

type Tone = "ink" | "soft" | "muted";
const STROKE: Record<Tone, string> = {
  ink: "#262626",
  soft: "#666666",
  muted: "#9e9e9e",
};

/* A single hand-drawn divider line, used sparingly. */
export function WavyDivider({
  double = false,
  tone = "muted",
  roughness = 0.7,
  seed = 7,
  className = "",
}: {
  double?: boolean;
  tone?: Tone;
  roughness?: number;
  seed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setW(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const height = double ? 9 : 4;
  const paths = useMemo(() => {
    if (w < 8) return [];
    return double ? buildDoubleWavyLine(w, height, roughness, seed) : buildWavyLine(w, height, roughness, seed);
  }, [w, double, height, roughness, seed]);

  return (
    <div ref={ref} className={`w-full ${className}`} aria-hidden>
      {paths.length > 0 && (
        <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} fill="none">
          {paths.map((d, i) => (
            <path key={i} d={d} stroke={STROKE[tone]} strokeWidth={2} strokeLinecap="round" fill="none" />
          ))}
        </svg>
      )}
    </div>
  );
}
