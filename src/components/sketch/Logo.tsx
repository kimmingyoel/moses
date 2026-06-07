"use client";

type Size = "sm" | "md" | "lg" | "xl";

const sizes: Record<Size, string> = {
  sm: "text-3xl",
  md: "text-5xl",
  lg: "text-6xl sm:text-7xl",
  xl: "text-7xl sm:text-[6rem]",
};

/**
 * The "모세" wordmark — always set in PyeongChangPeace (brand requirement),
 * with a quick underline flourish drawn beneath it.
 */
export function MosesLogo({
  size = "lg",
  underline = true,
}: {
  size?: Size;
  underline?: boolean;
}) {
  return (
    <span className="relative inline-block select-none">
      <span className={`font-logo block leading-none text-[var(--color-ink)] ${sizes[size]}`}>
        모세
      </span>
      {underline && (
        <svg
          className="absolute -bottom-2 left-1/2 h-3 w-[112%] -translate-x-1/2"
          viewBox="0 0 120 12"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M3 7 Q 30 2, 60 6 T 117 5"
            stroke="var(--color-ink)"
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      )}
    </span>
  );
}
