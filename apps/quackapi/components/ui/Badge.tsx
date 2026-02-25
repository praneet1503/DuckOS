"use client";

import { memo } from "react";

interface BadgeProps {
  status: number;
  className?: string;
}

function statusColor(status: number): string {
  if (status >= 200 && status < 300)
    return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (status >= 300 && status < 400)
    return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  if (status >= 400 && status < 500)
    return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  if (status >= 500)
    return "bg-red-500/20 text-red-400 border-red-500/30";
  return "bg-white/10 text-[var(--os-text-secondary)] border-white/10";
}

function QABadge({ status, className = "" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5
        rounded text-[11px] font-semibold font-mono
        border
        ${statusColor(status)}
        ${className}
      `}
    >
      {status}
    </span>
  );
}

export default memo(QABadge);
