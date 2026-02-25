"use client";

import { memo, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  mono?: boolean;
}

function QAInput({
  error = false,
  mono = false,
  className = "",
  ...rest
}: InputProps) {
  return (
    <input
      className={`
        w-full px-2.5 py-1.5 rounded
        bg-white/5 text-[var(--os-text-primary)]
        border outline-none transition-all duration-150
        placeholder:text-[var(--os-text-secondary)]
        text-[13px]
        ${mono ? "font-mono" : ""}
        ${
          error
            ? "border-red-500/60 focus:border-red-400"
            : "border-[var(--os-border)] focus:border-[var(--os-accent-teal)]/60"
        }
        ${className}
      `}
      {...rest}
    />
  );
}

export default memo(QAInput);
