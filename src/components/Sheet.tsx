import type { HTMLAttributes, PropsWithChildren } from "react";

type SheetProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>> & {
  /** Tighter padding for compact screens */
  compact?: boolean;
};

/**
 * A paper sheet — the central card on every screen.
 * Renders with paper grain, a slightly warped torn-edge silhouette,
 * and a hard offset shadow giving the impression of a paper cutout on a desk.
 */
export function Sheet({ children, className = "", compact = false, ...rest }: SheetProps) {
  return (
    <div className="relative">
      {/* Layered shadow card behind to suggest paper-on-paper */}
      <div
        aria-hidden
        className="absolute inset-0 translate-x-[6px] translate-y-[8px] rounded-[22px] bg-[var(--color-ink-400)]/85"
        style={{ filter: "url(#crayonWobble)" }}
      />
      <div
        className={`sheet relative rounded-[22px] ${compact ? "px-5 py-6 sm:px-8 sm:py-8" : "px-5 py-7 sm:px-10 sm:py-12"} ${className}`}
        style={{
          border: "3px solid var(--color-ink-500)",
          filter: "url(#crayonWobble)",
        }}
        {...rest}
      >
        {children}
      </div>
    </div>
  );
}
