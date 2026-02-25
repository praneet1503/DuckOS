/* ══════════════════════════════════════════════════════════════
   QuackAPI — URL Input with Validation
   ══════════════════════════════════════════════════════════ */

"use client";

import { memo, useCallback, useRef, useEffect } from "react";

interface URLInputProps {
  value: string;
  onChange: (url: string) => void;
  isValid: boolean;
  onSubmit: () => void;
}

function URLInput({ value, onChange, isValid, onSubmit }: URLInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      // Debounce validation (50ms) but update value immediately
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChange(v);
      }, 50);
      // Immediately update the input
      onChange(v);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && isValid && value.trim()) {
        e.preventDefault();
        onSubmit();
      }
    },
    [isValid, value, onSubmit]
  );

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const showError = value.trim() !== "" && !isValid;

  return (
    <div className="flex-1 relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="https://api.example.com/endpoint"
        className={`
          w-full px-3 py-1.5
          bg-white/5 text-[var(--os-text-primary)]
          text-[13px] font-mono
          border-y outline-none
          transition-all duration-150
          placeholder:text-[var(--os-text-secondary)]/40
          ${
            showError
              ? "border-red-500/60 focus:border-red-400"
              : "border-[var(--os-border)] focus:border-[var(--os-accent-teal)]/60"
          }
        `}
        autoComplete="off"
        spellCheck={false}
      />
      {showError && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-red-400 text-[11px]">
          Invalid URL
        </div>
      )}
    </div>
  );
}

export default memo(URLInput);
