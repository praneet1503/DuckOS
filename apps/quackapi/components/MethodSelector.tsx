/* ══════════════════════════════════════════════════════════════
   QuackAPI — Method Selector
   ══════════════════════════════════════════════════════════ */

"use client";

import { memo, useCallback } from "react";
import { HTTP_METHODS, type HttpMethod } from "../types";

interface MethodSelectorProps {
  value: HttpMethod;
  onChange: (method: HttpMethod) => void;
}

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "text-emerald-400",
  POST: "text-amber-400",
  PUT: "text-blue-400",
  PATCH: "text-purple-400",
  DELETE: "text-red-400",
};

function MethodSelector({ value, onChange }: MethodSelectorProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange(e.target.value as HttpMethod);
    },
    [onChange]
  );

  return (
    <select
      value={value}
      onChange={handleChange}
      className={`
        px-2.5 py-1.5 rounded-l
        bg-white/8 border border-[var(--os-border)]
        text-[13px] font-semibold font-mono
        outline-none cursor-pointer
        transition-colors
        ${METHOD_COLORS[value]}
        hover:bg-white/12
        appearance-none
        min-w-[88px]
      `}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff50' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundPosition: "right 4px center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "16px",
        paddingRight: "22px",
      }}
    >
      {HTTP_METHODS.map((m) => (
        <option key={m} value={m} className="bg-[#1a1d24] text-white">
          {m}
        </option>
      ))}
    </select>
  );
}

export default memo(MethodSelector);
