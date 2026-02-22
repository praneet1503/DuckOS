"use client";

import type { PomodoroMode } from "../hooks/usePomodoro";

/* ── Props ──────────────────────────────────────────────── */

interface SessionControlsProps {
  isRunning: boolean;
  currentMode: PomodoroMode;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
}

/* ── Shared button base ─────────────────────────────────── */

const btn =
  "rounded-lg px-5 py-2 text-[13px] font-medium transition-all duration-200 select-none focus:outline-none";

/* ── Component ──────────────────────────────────────────── */

export default function SessionControls({
  isRunning,
  currentMode,
  onStart,
  onPause,
  onReset,
  onSkip,
}: SessionControlsProps) {
  const isIdle = currentMode === "idle";

  return (
    <div className="flex items-center gap-3">
      {/* Primary: Start / Pause */}
      {isRunning ? (
        <button
          onClick={onPause}
          className={`${btn} bg-white/10 text-white/80 hover:bg-white/15`}
        >
          Pause
        </button>
      ) : (
        <button
          onClick={onStart}
          className={`${btn} bg-white/12 text-white/90 hover:bg-white/18`}
        >
          {isIdle ? "Start Focus" : "Resume"}
        </button>
      )}

      {/* Secondary: Reset */}
      {!isIdle && (
        <button
          onClick={onReset}
          className={`${btn} bg-white/5 text-white/50 hover:bg-white/8 hover:text-white/70`}
        >
          Reset
        </button>
      )}

      {/* Secondary: Skip (only while in a session) */}
      {!isIdle && (
        <button
          onClick={onSkip}
          className={`${btn} bg-white/5 text-white/50 hover:bg-white/8 hover:text-white/70`}
        >
          Skip
        </button>
      )}
    </div>
  );
}
