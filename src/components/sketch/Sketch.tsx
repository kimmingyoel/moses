"use client";

import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  buildHandDrawnRect,
  buildHandDrawnUnderline,
  buildScribbleFill,
  type HandDrawnPaths,
} from "./handDrawn";
import { WHITE, PAPER, INK, STROKE, type Tone } from "./palette";

/* ────────────────────────────────────────────────────────────────────────── */
/*  SketchRectVisual — a measured div that paints a hand-drawn outline behind  */
/*  whatever the parent renders. Parent must be position:relative.             */
/* ────────────────────────────────────────────────────────────────────────── */

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
  /** Fill the interior with diagonal pen hatching (Scribble=True look). */
  scribble?: boolean;
  scribbleColor?: Tone;
  /** Hide the outline stroke (used by checkbox interior). */
  hideStroke?: boolean;
};

export function SketchRectVisual({
  radius = 14,
  fill = PAPER,
  stroke = "ink",
  strokeWidth = 2.5,
  shadow = "none",
  wobble = 0.55,
  seed = 7,
  dashed = false,
  className = "",
  scribble = false,
  scribbleColor = "ink",
  hideStroke = false,
}: SketchRectProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fallback = useMemo<{ vb: { w: number; h: number }; paths: HandDrawnPaths }>(
    () => ({
      vb: { w: 4, h: 4 },
      paths: buildHandDrawnRect({ width: 4, height: 4, radius: 0, wobble: 0, seed }),
    }),
    [seed],
  );
  const [data, setData] = useState(fallback);
  const [measured, setMeasured] = useState(false);
  const uid = useId().replace(/:/g, "");
  const shadowId = `sk-shadow-${uid}`;
  const clipId = `sk-clip-${uid}`;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let rafId: number | null = null;
    let lastSize: { w: number; h: number } | null = null;
    const apply = (w: number, h: number) => {
      if (w < 2 || h < 2) return false;
      if (lastSize) {
        const dw = Math.abs(w - lastSize.w);
        const dh = Math.abs(h - lastSize.h);
        if (dw < 4 && dh < 4 && dw / lastSize.w < 0.08 && dh / lastSize.h < 0.08) {
          return true;
        }
      }
      const paths = buildHandDrawnRect({ width: w, height: h, radius, wobble, seed });
      setData({ vb: { w, h }, paths });
      setMeasured(true);
      lastSize = { w, h };
      return true;
    };
    const measure = () => {
      const rect = el.getBoundingClientRect();
      return apply(rect.width, rect.height);
    };
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

  const scribblePath = useMemo(
    () =>
      scribble && measured
        ? buildScribbleFill({
            width: data.vb.w,
            height: data.vb.h,
            gap: 7,
            wobble: 1,
            seed: seed + 3,
          })
        : "",
    [scribble, measured, data.vb.w, data.vb.h, seed],
  );

  const strokeColor = STROKE[stroke];

  return (
    <div ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${data.vb.w} ${data.vb.h}`}
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", overflow: "visible" }}
      >
        {(shadow !== "none" || scribble) && measured && (
          <defs>
            {shadow !== "none" && (
              <filter id={shadowId} x="-2%" y="-2%" width="104%" height="108%">
                <feOffset dx="0" dy={shadow === "drop" ? 3 : 2} />
                <feGaussianBlur stdDeviation={shadow === "drop" ? 0.4 : 0.2} />
                <feColorMatrix
                  type="matrix"
                  values={`0 0 0 0 0.149  0 0 0 0 0.149  0 0 0 0 0.149  0 0 0 ${shadow === "drop" ? 0.2 : 0.15} 0`}
                />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            )}
            {scribble && (
              <clipPath id={clipId}>
                <path d={data.paths.fill} />
              </clipPath>
            )}
          </defs>
        )}

        <path
          d={data.paths.fill}
          fill={fill}
          filter={shadow !== "none" && measured ? `url(#${shadowId})` : undefined}
        />

        {scribble && scribblePath && (
          <g clipPath={`url(#${clipId})`}>
            <path
              d={scribblePath}
              stroke={STROKE[scribbleColor]}
              strokeWidth={1.7}
              strokeLinecap="round"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )}

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
            {data.paths.edges.map((d, i) =>
              d ? <path key={`edge-${i}`} d={d} vectorEffect="non-scaling-stroke" /> : null,
            )}
            {data.paths.corners.map((d, i) =>
              d ? <path key={`corner-${i}`} d={d} vectorEffect="non-scaling-stroke" /> : null,
            )}
          </g>
        )}
      </svg>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  SketchFrame — wrapper that paints SketchRectVisual behind its children.    */
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
  scribble,
  scribbleColor,
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
        scribble={scribble}
        scribbleColor={scribbleColor}
      />
      <div className={`relative ${contentClassName}`}>{children}</div>
    </Tag>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  SketchButton                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

type SketchButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  rounded?: boolean;
  fullWidth?: boolean;
  scribble?: boolean;
};

export function SketchButton({
  variant = "primary",
  size = "md",
  rounded = true,
  fullWidth = false,
  scribble = false,
  className = "",
  disabled,
  children,
  ...rest
}: SketchButtonProps) {
  const sizing =
    size === "sm"
      ? "min-h-[38px] px-4 text-[1rem] gap-1.5"
      : size === "lg"
        ? "min-h-[54px] px-8 text-[1.25rem] gap-2.5"
        : "min-h-[46px] px-6 text-[1.1rem] gap-2";

  const radius = rounded ? (size === "sm" ? 18 : size === "lg" ? 27 : 22) : 10;

  const isPrimary = variant === "primary";
  const isGhost = variant === "ghost";

  // Color per state, following design_assets/button:
  //   Primary   — 900 surface, 100 text, lifted.
  //   Secondary — 100 surface, 900 border, 900 text, lifted.
  //   Ghost     — no surface, no border, 900 text.
  //   Disabled  — graphite surface + border faded to ~1/6 (reads as ~300),
  //               700 text, flat (no lift).
  const fill = disabled
    ? "var(--color-graphite)"
    : isPrimary
      ? INK
      : isGhost
        ? "transparent"
        : WHITE;

  const textCls = disabled
    ? "text-[var(--color-graphite)]"
    : isPrimary
      ? "text-[var(--color-white)]"
      : "text-[var(--color-ink)]";

  return (
    <button
      type="button"
      disabled={disabled}
      className={`relative inline-flex items-center justify-center ${sizing} ${
        fullWidth ? "w-full" : ""
      } ${textCls} font-hand transition-transform duration-100 ${
        disabled
          ? "cursor-not-allowed"
          : "hover:-translate-y-[1.5px] active:translate-y-[1px]"
      } ${className}`}
      {...rest}
    >
      <SketchRectVisual
        radius={radius}
        fill={fill}
        stroke={disabled ? "soft" : "ink"}
        hideStroke={isGhost}
        shadow={isGhost || disabled ? "none" : "drop"}
        className={disabled ? "opacity-[0.1667]" : ""}
        wobble={0.48}
        strokeWidth={2.4}
        scribble={scribble && !disabled}
        scribbleColor="ink"
        seed={size === "sm" ? 5 : 11}
      />
      <span className="relative inline-flex items-center justify-center gap-2 whitespace-nowrap">
        {children}
      </span>
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  SketchInput                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

type SketchInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
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
  const height = size === "sm" ? "h-[42px]" : size === "lg" ? "h-[54px]" : "h-[48px]";
  const fontSize =
    size === "sm" ? "text-[1.02rem]" : size === "lg" ? "text-[1.2rem]" : "text-[1.1rem]";
  const alignCls =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  return (
    <div className={`relative ${height} ${className}`}>
      <SketchRectVisual
        radius={12}
        fill={PAPER}
        stroke="ink"
        shadow="none"
        wobble={0.45}
        strokeWidth={2.3}
      />
      <input
        ref={ref}
        {...rest}
        className={`relative h-full w-full bg-transparent px-4 font-hand text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ash)] ${fontSize} ${alignCls} ${inputClassName}`}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  SketchCheckbox                                                             */
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
      <span className="relative mt-0.5 inline-block h-[24px] w-[24px] shrink-0">
        <SketchRectVisual
          radius={5}
          fill={checked ? INK : WHITE}
          stroke="ink"
          shadow={checked ? "drop" : "soft"}
          wobble={0.45}
          strokeWidth={2.3}
          seed={checked ? 17 : 29}
        />
        {checked && (
          <svg aria-hidden viewBox="0 0 24 24" className="absolute inset-0 h-full w-full">
            <path
              d="M5 12 Q 8 15, 10 17 Q 13 11, 18 6"
              stroke={WHITE}
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
            <span className="block font-hand text-[1.05rem] text-[var(--color-ink)]">{label}</span>
          )}
          {description && (
            <span className="block font-note text-[0.95rem] text-[var(--color-graphite)]">
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  SketchUnderline                                                            */
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
          <path d={d} stroke={INK} strokeWidth={2} strokeLinecap="round" fill="none" />
        </svg>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  SketchCircleVisual                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

export function SketchCircleVisual({
  fill = PAPER,
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
