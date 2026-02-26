"use client";

import { useEffect, useRef, useState } from "react";
import {
  formatDate,
  formatTime,
  getNow,
  getUserTimeZone,
} from "@/lib/time";

// ── Component ───────────────────────────────────────────────

/**
 * ClockApp — full-featured digital clock application.
 *
 * Displays time, date, and the user's timezone with a 12 h / 24 h toggle.
 * Updates every second with proper cleanup on unmount.
 */
export default function ClockApp() {
  const [now, setNow] = useState<Date>(getNow);
  const [is24Hour, setIs24Hour] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setNow(getNow());
    }, 1_000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const timeString = formatTime(now, { hour12: !is24Hour });
  const dateString = formatDate(now);
  const timezone = getUserTimeZone();

  return (
    <div className="flex h-full w-full select-none flex-col items-center justify-center gap-6 bg-linear-to-br from-[#0a0a1a] via-[#111128] to-[#0a0a1a] px-6 py-10">
      {/* ── Time ──────────────────────────────────── */}
      <time
        dateTime={now.toISOString()}
        className="font-mono text-7xl font-semibold tracking-wider text-white drop-shadow-[0_0_32px_rgba(140,130,255,0.35)]"
      >
        {timeString}
      </time>

      {/* ── Date ──────────────────────────────────── */}
      <p className="text-base text-white/50">{dateString}</p>

      {/* ── Timezone ──────────────────────────────── */}
      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/40">
        {timezone}
      </span>

      {/* ── Toggle ────────────────────────────────── */}
      <button
        onClick={() => setIs24Hour((v) => !v)}
        className="mt-2 rounded-lg border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white/90 active:scale-95"
      >
        {is24Hour ? "Switch to 12 h" : "Switch to 24 h"}
      </button>
    </div>
  );
}
