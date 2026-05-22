import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type CrayonButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
  }
>;

export function CrayonButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: CrayonButtonProps) {
  const sizeClass = size === "sm" ? "crayon-btn--small" : size === "lg" ? "px-6 py-3 text-[1.24rem]" : "";
  const variantClass =
    variant === "ghost"
      ? "crayon-btn--ghost"
      : variant === "danger"
        ? ""
        : "";

  return (
    <button className={`crayon-btn ${sizeClass} ${variantClass} ${className}`} {...rest}>
      {children}
    </button>
  );
}
