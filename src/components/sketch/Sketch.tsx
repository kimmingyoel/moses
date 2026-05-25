"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { buildHandDrawnRect, buildHandDrawnUnderline, type HandDrawnPaths } from "./handDrawn";

/* ────────────────────────────────────────────────────────────────────────── */
/*  SketchRect — a measured div that paints a hand-drawn outline behind it.   */
/* ────────────────────────────────────────────────────────────────────────── */

type Tone = "ink" | "soft" | "muted";

const STROKE: Record<Tone, string> = {
  ink: "#262626",
  soft: "#585858",
  muted: "#9e9e9e",
};

type SketchRectProps = {
  radius?: number;
  fill?: string;
  stroke?: Tone;
  strokeWidth?: number;
  shadow?: "none" | "soft" | "drop";
  wobble?: number;
  seed?: number;
  dashed?: boolean;
  className?: string;
  /** When true, the visual hides the stroke (used by SketchCheckbox interior). */
  hideStroke?: boolean;
};

/**
 * Absolute-positioned SVG layer that paints a hand-drawn rectangle behind
 * whatever the parent renders. Parent must be `position: relative`.
 *
 * Strategy:
 *   1. Synchronously measure the parent once on mount in useLayoutEffect.
 *   2. Generate the hand-drawn path from that measurement and fix it.
 *   3. Render the SVG with `width="100%" height="100%"` and the original
 *      measurement as the viewBox — preserveAspectRatio="none" lets the
 *      SVG stretch to whatever size the parent grows or shrinks to, without
 *      ever regenerating the path. `vector-effect="non-scaling-stroke"`
 *      keeps the stroke width pixel-stable through that stretch.
 *
 * Why this matters: the earlier ResizeObserver-driven redraw rebuilt the
 * randomized path on every parent size change, which on hover transforms,
 * detail expansions, and Safari animations caused both visible jitter
 * ("달그락") and wasted re-renders.
 */
export function SketchRectVisual({
  radius = 14,
  fill = "#ffffff",
  stroke = "ink",
  strokeWidth = 2.5,
  shadow = "none",
  wobble = 0.55,
  seed = 7,
  dashed = false,
  className = "",
  hideStroke = false,
}: SketchRectProps) {
  const ref = useRef<HTMLDivElement>(null);
  // The fallback path is a clean rounded rectangle (zero wobble). It renders
  // identically on server and client, so the SVG is present in the SSR HTML
  // — critical for Next.js back-navigation, which restores the cached HTML
  // without re-running useLayoutEffect / ref callbacks. Once measurement
  // succeeds we swap in the real wobbly path. Until then the user sees a
  // calm rounded outline instead of a missing border. The fallback's viewBox
  // is small (4×4) so preserveAspectRatio="none" stretches it cleanly to any
  // container size; corners become elliptical but never "crumpled" because
  // there is no per-segment displacement to amplify.
  const fallback = useMemo<{ vb: { w: number; h: number }; paths: HandDrawnPaths }>(
    () => ({
      vb: { w: 4, h: 4 },
      paths: buildHandDrawnRect({ width: 4, height: 4, radius: 0, wobble: 0, seed }),
    }),
    [seed],
  );
  const [data, setData] = useState<{ vb: { w: number; h: number }; paths: HandDrawnPaths }>(fallback);
  const uid = useId().replace(/:/g, "");
  const shadowId = `sk-shadow-${uid}`;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let rafId: number | null = null;
    let lastSize: { w: number; h: number } | null = null;
    const apply = (w: number, h: number) => {
      if (w < 2 || h < 2) return false;
      // Skip insignificant size changes — hover translate, small
      // detail-expansion frames, sub-pixel layout drift. Without this filter
      // we'd rebuild the path on every transform and end up with the
      // "달그락" jitter the visual was designed to avoid. Threshold: <4px on
      // both axes AND <8% relative change.
      if (lastSize) {
        const dw = Math.abs(w - lastSize.w);
        const dh = Math.abs(h - lastSize.h);
        if (
          dw < 4 &&
          dh < 4 &&
          dw / lastSize.w < 0.08 &&
          dh / lastSize.h < 0.08
        ) {
          return true;
        }
      }
      const paths = buildHandDrawnRect({
        width: w,
        height: h,
        radius,
        wobble,
        seed,
      });
      setData({ vb: { w, h }, paths });
      lastSize = { w, h };
      return true;
    };
    const measure = () => {
      const rect = el.getBoundingClientRect();
      return apply(rect.width, rect.height);
    };
    // Initial sync measurement. If layout isn't settled (view transitions,
    // off-screen, font swap), poll up to ~5 s of rAF frames to catch it.
    if (!measure()) {
      let attempts = 0;
      const tick = () => {
        rafId = null;
        if (attempts++ > 300) return;
        if (measure()) return;
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }
    // Persistent ResizeObserver — re-measures when the parent's size
    // genuinely changes (async-loaded list items growing the Sheet 3-4×
    // taller, font swap, etc.). We read the entry's contentRect directly:
    // during a view-transition Chrome can mask getBoundingClientRect to
    // 0×0, but RO still delivers the element's real box size. Small jitter
    // is filtered above so hover/animation are no-ops.
    const ro = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (!entry) return;
      const cr = entry.contentRect;
      apply(cr.width, cr.height);
    });
    ro.observe(el);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [radius, wobble, seed]);

  const strokeColor = STROKE[stroke];

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
    >
      {data && (
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${data.vb.w} ${data.vb.h}`}
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          // overflow:visible lets the stroke sit ON the element edge instead
          // of being clipped half-out — so the visual outline lines up with
          // the hit area of buttons and cards. The parent's overflow-hidden
          // still clips the rest of the SVG.
          style={{ display: "block", overflow: "visible" }}
        >
          {shadow !== "none" && (
            <defs>
              <filter
                id={shadowId}
                x="-2%"
                y="-2%"
                width="104%"
                height="108%"
              >
                <feOffset dx="0" dy={shadow === "drop" ? 3 : 2} />
                <feGaussianBlur stdDeviation={shadow === "drop" ? 0.4 : 0.2} />
                <feColorMatrix
                  type="matrix"
                  values={`0 0 0 0 0.15  0 0 0 0 0.15  0 0 0 0 0.15  0 0 0 ${shadow === "drop" ? 0.22 : 0.16} 0`}
                />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          )}

          {/* Fill (with optional shadow filter) */}
          <path
            d={data.paths.fill}
            fill={fill}
            filter={shadow !== "none" ? `url(#${shadowId})` : undefined}
          />

          {!hideStroke && (
            <g
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray={dashed ? "9 7" : undefined}
              vectorEffect="non-scaling-stroke"
            >
              {data.paths.edges.map((d, i) => (
                <path key={`edge-${i}`} d={d} vectorEffect="non-scaling-stroke" />
              ))}
              {data.paths.corners.map((d, i) => (
                <path key={`corner-${i}`} d={d} vectorEffect="non-scaling-stroke" />
              ))}
            </g>
          )}
        </svg>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  SketchFrame — wrapper that paints SketchRectVisual behind its children.   */
/* ────────────────────────────────────────────────────────────────────────── */

type SketchFrameProps = Omit<SketchRectProps, "className" | "hideStroke"> & {
  className?: string;
  contentClassName?: string;
  children?: ReactNode;
  style?: CSSProperties;
  as?: "div" | "li" | "section" | "article";
  onClick?: React.MouseEventHandler<HTMLDivElement>;
};

export function SketchFrame({
  radius,
  fill,
  stroke,
  strokeWidth,
  shadow,
  wobble,
  seed,
  dashed,
  className = "",
  contentClassName = "",
  children,
  style,
  as = "div",
  onClick,
}: SketchFrameProps) {
  const Tag = as as "div";
  return (
    <Tag className={`relative ${className}`} style={style} onClick={onClick}>
      <SketchRectVisual
        radius={radius}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        shadow={shadow}
        wobble={wobble}
        seed={seed}
        dashed={dashed}
      />
      <div className={`relative ${contentClassName}`}>{children}</div>
    </Tag>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  SketchButton                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

type SketchButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  rounded?: boolean;
  fullWidth?: boolean;
};

export function SketchButton({
  variant = "primary",
  size = "md",
  rounded = true,
  fullWidth = false,
  className = "",
  disabled,
  children,
  ...rest
}: SketchButtonProps) {
  const sizing =
    size === "sm"
      ? "min-h-[36px] px-3.5 text-[0.98rem] gap-1.5"
      : size === "lg"
        ? "min-h-[52px] px-7 text-[1.22rem] gap-2.5"
        : "min-h-[44px] px-5 text-[1.08rem] gap-2";

  const radius = rounded ? (size === "sm" ? 18 : size === "lg" ? 26 : 22) : 10;

  const isPrimary = variant === "primary";
  const isGhost = variant === "ghost";

  const fill = disabled
    ? "#d4d4d4"
    : isPrimary
      ? "#262626"
      : isGhost
        ? "transparent"
        : "#ffffff";

  const textCls = disabled
    ? "text-[#7a7a7a]"
    : isPrimary
      ? "text-white"
      : "text-[#262626]";

  return (
    <button
      type="button"
      disabled={disabled}
      className={`relative inline-flex items-center justify-center ${sizing} ${
        fullWidth ? "w-full" : ""
      } ${textCls} font-hand transition-transform duration-100 ${
        disabled
          ? "cursor-not-allowed"
          : "hover:-translate-y-[1px] active:translate-y-[1px]"
      } ${className}`}
      {...rest}
    >
      <SketchRectVisual
        radius={radius}
        fill={fill}
        stroke={disabled ? "muted" : "ink"}
        shadow={isGhost || disabled ? "none" : "drop"}
        wobble={0.5}
        strokeWidth={2.4}
        seed={size === "sm" ? 5 : 11}
      />
      <span className="relative inline-flex items-center justify-center gap-2 whitespace-nowrap">
        {children}
      </span>
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  SketchInput                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

type SketchInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> & {
  size?: "sm" | "md" | "lg";
  inputClassName?: string;
  align?: "left" | "center" | "right";
  ref?: React.Ref<HTMLInputElement>;
};

export function SketchInput({
  size = "md",
  className = "",
  inputClassName = "",
  align = "left",
  ref,
  ...rest
}: SketchInputProps) {
  const height =
    size === "sm" ? "h-[40px]" : size === "lg" ? "h-[52px]" : "h-[46px]";
  const fontSize =
    size === "sm" ? "text-[1.0rem]" : size === "lg" ? "text-[1.18rem]" : "text-[1.08rem]";
  const alignCls =
    align === "right"
      ? "text-right"
      : align === "center"
        ? "text-center"
        : "text-left";

  return (
    <div className={`relative ${height} ${className}`}>
      <SketchRectVisual
        radius={10}
        fill="#ffffff"
        stroke="ink"
        shadow="soft"
        wobble={0.5}
        strokeWidth={2.4}
      />
      <input
        ref={ref}
        {...rest}
        className={`relative h-full w-full bg-transparent px-3.5 font-hand text-[#1a1a1a] outline-none placeholder:text-[#9e9e9e] ${fontSize} ${alignCls} ${inputClassName}`}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  SketchCheckbox                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

type SketchCheckboxProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  className?: string;
  disabled?: boolean;
  id?: string;
};

export function SketchCheckbox({
  checked,
  onChange,
  label,
  description,
  className = "",
  disabled = false,
  id,
}: SketchCheckboxProps) {
  const reactId = useId();
  const inputId = id ?? `sk-cb-${reactId}`;
  return (
    <label
      htmlFor={inputId}
      className={`flex items-start gap-2.5 ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      } ${className}`}
    >
      <span className="relative mt-0.5 inline-block h-[22px] w-[22px] shrink-0">
        <SketchRectVisual
          radius={4}
          fill={checked ? "#262626" : "#ffffff"}
          stroke="ink"
          shadow={checked ? "drop" : "soft"}
          wobble={0.45}
          strokeWidth={2.3}
          seed={checked ? 17 : 29}
        />
        {checked && (
          <svg
            aria-hidden
            viewBox="0 0 22 22"
            className="absolute inset-0 h-full w-full"
          >
            <path
              d="M5 11.5 Q 7.5 14, 9 16 Q 12 11.5, 17 6"
              stroke="#ffffff"
              strokeWidth="2.6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </span>
      {(label || description) && (
        <span className="leading-snug">
          {label && (
            <span className="block font-hand text-[1.04rem] text-[#262626]">
              {label}
            </span>
          )}
          {description && (
            <span className="block font-hand text-[0.92rem] text-[#7a7a7a]">
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  SketchUnderline — used for editable cells.                                */
/* ────────────────────────────────────────────────────────────────────────── */

export function SketchUnderline({
  width,
  className = "",
}: {
  width?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(width ?? 0);
  useLayoutEffect(() => {
    if (width != null) return;
    const el = ref.current;
    if (!el) return;
    const update = () => setW(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  const d = useMemo(() => (w > 4 ? buildHandDrawnUnderline(w, 13) : ""), [w]);
  return (
    <div ref={ref} className={`pointer-events-none ${className}`}>
      {d && (
        <svg width={w} height={6} viewBox={`0 0 ${w} 6`} fill="none">
          <path
            d={d}
            stroke="#262626"
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  SketchCircle — used for icon buttons / badges.                            */
/* ────────────────────────────────────────────────────────────────────────── */

export function SketchCircleVisual({
  fill = "#ffffff",
  stroke = "ink",
  strokeWidth = 2.4,
  shadow = "none",
  wobble = 0.5,
  seed = 31,
}: {
  fill?: string;
  stroke?: Tone;
  strokeWidth?: number;
  shadow?: "none" | "soft" | "drop";
  wobble?: number;
  seed?: number;
}) {
  // Render circle as a SketchRect with very large radius — it becomes a pill/circle.
  return (
    <SketchRectVisual
      radius={9999}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      shadow={shadow}
      wobble={wobble}
      seed={seed}
    />
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  StepIndicator — small "STEP n / 5" hand-drawn divider.                    */
/* ────────────────────────────────────────────────────────────────────────── */

export function StepIndicator({
  current,
  total = 5,
  className = "",
}: {
  current: number;
  total?: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-data text-[0.92rem] tracking-[0.05em] text-[#7a7a7a]">
        STEP {current} / {total}
      </span>
      <span className="block h-[2px] flex-1">
        <span className="block h-full w-full bg-[repeating-linear-gradient(90deg,#262626_0_5px,transparent_5px_10px)] opacity-30" />
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Re-export hook for client edges measurement (used by other components).   */
/* ────────────────────────────────────────────────────────────────────────── */

export function useMeasured() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, size };
}
