type Size = "sm" | "md" | "lg" | "xl";

const sizeMap: Record<Size, string> = {
  sm: "text-3xl",
  md: "text-5xl",
  lg: "text-6xl sm:text-7xl",
  xl: "text-7xl sm:text-8xl",
};

export function MosesLogo({ size = "lg" }: { size?: Size }) {
  return (
    <h1 className={`t-logo leading-none ${sizeMap[size]} select-none`}>
      <span style={{ display: "inline-block" }}>모세</span>
      <span className="ml-3 align-middle text-[0.42em] tracking-wide t-hand text-[var(--color-ink-300)]">
        (Moses)
      </span>
    </h1>
  );
}
