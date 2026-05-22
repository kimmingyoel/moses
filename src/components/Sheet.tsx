import type { HTMLAttributes, PropsWithChildren } from "react";

type SheetProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>> & {
  compact?: boolean;
  performanceSafe?: boolean;
};

/**
 * The central paper sheet. Layered as:
 *   1. dark offset shadow card behind (filter wobble, no children)
 *   2. paper card container (sizing + layout)
 *      - visual layer with paper grain + wobbled border (filter)
 *      - content layer with padding and children (no filter, crisp text)
 */
export function Sheet({
  children,
  className = "",
  compact = false,
  performanceSafe = false,
}: SheetProps) {
  const padding = compact
    ? "px-5 py-6 sm:px-8 sm:py-8"
    : "px-5 py-7 sm:px-10 sm:py-12";

  return (
    <div className="relative">
      {/* Offset drop shadow */}
      <div
        aria-hidden
        className="absolute inset-0 translate-x-[6px] translate-y-[8px] rounded-[22px] bg-[var(--color-ink-400)]/85"
        style={performanceSafe ? undefined : { filter: "url(#crayonWobble)" }}
      />
      {/* Paper card — visual rendered first in DOM so content paints over it */}
      <div className={`relative ${className}`}>
        <div
          aria-hidden
          className="sheet pointer-events-none absolute inset-0 rounded-[22px]"
          style={{
            border: "3px solid var(--color-ink-500)",
            ...(performanceSafe ? {} : { filter: "url(#crayonWobble)" }),
          }}
        />
        <div className={`relative ${padding}`}>{children}</div>
      </div>
    </div>
  );
}
