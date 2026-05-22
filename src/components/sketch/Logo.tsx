"use client";

type Size = "sm" | "md" | "lg" | "xl";

const sizes: Record<Size, string> = {
  sm: "text-3xl",
  md: "text-5xl",
  lg: "text-6xl sm:text-7xl",
  xl: "text-7xl sm:text-[5.5rem]",
};

export function MosesLogo({ size = "lg" }: { size?: Size }) {
  return (
    <h1 className={`font-logo leading-none ${sizes[size]} select-none text-[#1a1a1a]`}>
      모세
    </h1>
  );
}
