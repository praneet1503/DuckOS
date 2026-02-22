"use client";

import { useMemo } from "react";
import { usePomodoro, type PomodoroMode } from "../hooks/usePomodoro";
import ProgressRing from "./ProgressRing";
import SessionControls from "./SessionControls";
import FocusStats from "./FocusStats";

/* ── Helpers ────────────────────────────────────────────── */

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const MODE_LABELS: Record<PomodoroMode, string> = {
  idle: "Ready",
  focus: "Focus",
  short_break: "Short Break",
  long_break: "Long Break",
};

const MODE_DURATIONS: Record<PomodoroMode, number> = {
  idle: 25 * 60,
  focus: 25 * 60,
  short_break: 5 * 60,
  long_break: 20 * 60,
};

/** Soft ring colour per mode */
const MODE_COLORS: Record<PomodoroMode, string> = {
  idle: "rgba(255,255,255,0.2)",
  focus: "rgba(94,174,181,0.7)",   // teal accent
  short_break: "rgba(217,176,106,0.65)", // amber accent
  long_break: "rgba(217,176,106,0.8)",
};

/* ── Notification helper ────────────────────────────────── */

function notifySessionComplete(mode: PomodoroMode) {
  if (typeof window === "undefined") return;

  const message =
    mode === "focus"
      ? "Focus session complete. Time for a break."
      : "Break over. Ready to focus?";

  // Browser Notification API
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification("Pond — Focus", { body: message, silent: true });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          new Notification("Pond — Focus", { body: message, silent: true });
        }
      });
    }
  }
}

/* ── Component ──────────────────────────────────────────── */

export default function FocusTimer() {
  const {
    timeLeft,
    isRunning,
    currentMode,
    completedSessions,
    start,
    pause,
    reset,
    skip,
  } = usePomodoro(notifySessionComplete);

  /* Progress: 1 when full, 0 when empty */
  const progress = useMemo(() => {
    const total = MODE_DURATIONS[currentMode];
    return timeLeft / total;
  }, [timeLeft, currentMode]);

  const ringColor = MODE_COLORS[currentMode];

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 px-4 select-none">
      {/* Title */}
      <h2 className="text-[15px] font-semibold tracking-tight text-white/70">
        Focus
      </h2>

      {/* Progress ring + time */}
      <ProgressRing progress={progress} size={200} strokeWidth={5} color={ringColor}>
        <span className="text-3xl font-semibold tabular-nums text-white/85">
          {formatTime(timeLeft)}
        </span>
        <span className="mt-1 text-[12px] font-medium text-white/40">
          {MODE_LABELS[currentMode]}
        </span>
      </ProgressRing>

      {/* Controls */}
      <SessionControls
        isRunning={isRunning}
        currentMode={currentMode}
        onStart={start}
        onPause={pause}
        onReset={reset}
        onSkip={skip}
      />

      {/* Stats */}
      <FocusStats completedSessions={completedSessions} />
    </div>
  );
}
