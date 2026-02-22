"use client";

import { useMemo } from "react";

/* ── Props ──────────────────────────────────────────────── */

interface ProgressRingProps {
  /** 0 → 1 (0 = empty, 1 = full) */
  progress: number;
  /** Outer diameter in px */
  size?: number;
  /** Ring stroke width in px */
  strokeWidth?: number;
  /** Stroke colour */
  color?: string;
  /** Track colour behind the ring */
  trackColor?: string;
  children?: React.ReactNode;
}

/* ── Component ──────────────────────────────────────────── */

export default function ProgressRing({
  progress,
  size = 200,
  strokeWidth = 6,
  color = "rgba(255,255,255,0.7)",
  trackColor = "rgba(255,255,255,0.08)",
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset = useMemo(
    () => circumference * (1 - Math.min(Math.max(progress, 0), 1)),
    [circumference, progress],
  );

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>

      {/* Centre content (time, mode label) */}
      {children && (
        <div className="relative z-10 flex flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
