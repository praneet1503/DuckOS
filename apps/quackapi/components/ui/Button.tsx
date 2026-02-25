"use client";

import { memo, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--os-accent-teal)] text-white hover:brightness-110 active:brightness-90",
  secondary:
    "bg-white/8 text-[var(--os-text-primary)] hover:bg-white/14 active:bg-white/18",
  danger:
    "bg-red-500/20 text-red-400 hover:bg-red-500/30 active:bg-red-500/40",
  ghost:
    "bg-transparent text-[var(--os-text-secondary)] hover:bg-white/8 hover:text-[var(--os-text-primary)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-2 py-1 text-[11px]",
  md: "px-3 py-1.5 text-[13px]",
  lg: "px-4 py-2 text-[14px]",
};

function QAButton({
  variant = "secondary",
  size = "md",
  className = "",
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-1.5
        rounded font-medium transition-all duration-150
        outline-none cursor-pointer select-none
        border border-transparent
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? "opacity-40 pointer-events-none" : ""}
        ${className}
      `}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

export default memo(QAButton);
