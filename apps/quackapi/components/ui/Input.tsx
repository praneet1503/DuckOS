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
        bg-white/5 text-foreground
        border outline-none transition-all duration-150
        placeholder:text-(--os-text-secondary)
        text-[13px]
        ${mono ? "font-mono" : ""}
        ${
          error
            ? "border-red-500/60 focus:border-red-400"
            : "border-(--os-border) focus:border-(--os-accent-teal)/60"
        }
        ${className}
      `}
      {...rest}
    />
  );
}

export default memo(QAInput);
