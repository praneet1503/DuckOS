"use client";

/* ── Props ──────────────────────────────────────────────── */

interface FocusStatsProps {
  completedSessions: number;
}

/* ── Component ──────────────────────────────────────────── */

export default function FocusStats({ completedSessions }: FocusStatsProps) {
  return (
    <p className="text-[13px] text-white/40 select-none">
      Sessions today:{" "}
      <span className="text-white/60 font-medium">{completedSessions}</span>
    </p>
  );
}
