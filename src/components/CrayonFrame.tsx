import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

type FilterId = "crayonWobble" | "crayonWobbleLight" | "crayonWobbleStrong" | "none";

interface CrayonFrameProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Tailwind classes for the absolutely-positioned visual layer
   *  (border, background, shadow, border-radius). */
  visual: string;
  /** SVG filter applied to the visual layer. Default: crayonWobbleLight. */
  filter?: FilterId;
  /** Classes for the outer wrapper (positioning, sizing, interactive states). */
  className?: string;
  /** Classes for the inner content layer (padding, flex, gap). */
  contentClassName?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * Renders a hand-drawn frame in two layers:
 *   - an absolutely-positioned visual layer that carries the wobbled outline
 *   - a content layer above it where text and icons render crisply
 *
 * Use this anywhere a single element previously had both a border *and*
 * text children with `filter: url(#crayonWobble)` applied — the displacement
 * map was distorting the text alongside the border.
 */
export function CrayonFrame({
  visual,
  filter = "crayonWobbleLight",
  className = "",
  contentClassName = "",
  style,
  children,
  ...rest
}: CrayonFrameProps) {
  return (
    <div className={`relative ${className}`} style={style} {...rest}>
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${visual}`}
        style={filter === "none" ? undefined : { filter: `url(#${filter})` }}
      />
      <div className={`relative ${contentClassName}`}>{children}</div>
    </div>
  );
}
