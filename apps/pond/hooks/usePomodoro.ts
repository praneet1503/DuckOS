"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ── Types ──────────────────────────────────────────────── */

export type PomodoroMode = "idle" | "focus" | "short_break" | "long_break";

export interface PomodoroState {
  timeLeft: number;
  isRunning: boolean;
  currentMode: PomodoroMode;
  completedSessions: number;
}

export interface PomodoroActions {
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
}

/* ── Duration constants (seconds) ──────────────────────── */

const FOCUS_DURATION = 25 * 60;
const SHORT_BREAK_DURATION = 5 * 60;
const LONG_BREAK_DURATION = 20 * 60;
const SESSIONS_BEFORE_LONG_BREAK = 4;

/* ── localStorage helpers ──────────────────────────────── */

const STORAGE_KEY = "duckos-pond-pomodoro";

interface PersistedState {
  timeLeft: number;
  currentMode: PomodoroMode;
  completedSessions: number;
  isRunning: boolean;
  /** epoch ms when state was saved — used to resume running timers */
  savedAt: number;
  /** date string (YYYY-MM-DD) for daily session reset */
  date: string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadState(): Partial<PersistedState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<PersistedState>;
  } catch {
    return null;
  }
}

function saveState(s: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* quota exceeded — silently ignore */
  }
}

function durationForMode(mode: PomodoroMode): number {
  switch (mode) {
    case "focus":
      return FOCUS_DURATION;
    case "short_break":
      return SHORT_BREAK_DURATION;
    case "long_break":
      return LONG_BREAK_DURATION;
    default:
      return FOCUS_DURATION;
  }
}

/* ── Hook ───────────────────────────────────────────────── */

export function usePomodoro(
  onSessionComplete?: (mode: PomodoroMode) => void,
): PomodoroState & PomodoroActions {
  /* ---------- initialise from localStorage ---------- */
  const [currentMode, setCurrentMode] = useState<PomodoroMode>(() => {
    const saved = loadState();
    if (saved && saved.date === today() && saved.currentMode) {
      return saved.currentMode;
    }
    return "idle";
  });

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const saved = loadState();
    if (saved && saved.date === today() && typeof saved.timeLeft === "number") {
      // If timer was running, subtract elapsed time
      if (saved.isRunning && saved.savedAt) {
        const elapsed = Math.floor((Date.now() - saved.savedAt) / 1000);
        return Math.max(0, saved.timeLeft - elapsed);
      }
      return saved.timeLeft;
    }
    return FOCUS_DURATION;
  });

  const [isRunning, setIsRunning] = useState<boolean>(() => {
    const saved = loadState();
    if (saved && saved.date === today() && saved.isRunning) {
      // Only resume if there's time left after accounting for elapsed
      if (saved.savedAt && typeof saved.timeLeft === "number") {
        const elapsed = Math.floor((Date.now() - saved.savedAt) / 1000);
        return saved.timeLeft - elapsed > 0;
      }
    }
    return false;
  });

  const [completedSessions, setCompletedSessions] = useState<number>(() => {
    const saved = loadState();
    if (saved && saved.date === today() && typeof saved.completedSessions === "number") {
      return saved.completedSessions;
    }
    return 0;
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onSessionComplete);
  onCompleteRef.current = onSessionComplete;

  /* ---------- persist on every meaningful change ---------- */
  useEffect(() => {
    saveState({
      timeLeft,
      currentMode,
      completedSessions,
      isRunning,
      savedAt: Date.now(),
      date: today(),
    });
  }, [timeLeft, currentMode, completedSessions, isRunning]);

  /* ---------- transition to next mode ---------- */
  const transitionToNext = useCallback(
    (finishedMode: PomodoroMode) => {
      onCompleteRef.current?.(finishedMode);

      if (finishedMode === "focus") {
        const newCount = completedSessions + 1;
        setCompletedSessions(newCount);

        if (newCount % SESSIONS_BEFORE_LONG_BREAK === 0) {
          setCurrentMode("long_break");
          setTimeLeft(LONG_BREAK_DURATION);
        } else {
          setCurrentMode("short_break");
          setTimeLeft(SHORT_BREAK_DURATION);
        }
        // Auto-start break
        setIsRunning(true);
      } else {
        // Break finished → start new focus
        setCurrentMode("focus");
        setTimeLeft(FOCUS_DURATION);
        // Auto-start next focus
        setIsRunning(true);
      }
    },
    [completedSessions],
  );

  /* ---------- interval tick ---------- */
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer just finished — schedule transition
          // We use setTimeout(0) to avoid setState-inside-setState
          setTimeout(() => transitionToNext(currentMode), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, currentMode, transitionToNext]);

  /* ---------- actions ---------- */
  const start = useCallback(() => {
    if (currentMode === "idle") {
      setCurrentMode("focus");
      setTimeLeft(FOCUS_DURATION);
    }
    setIsRunning(true);
  }, [currentMode]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setCurrentMode("idle");
    setTimeLeft(FOCUS_DURATION);
    setCompletedSessions(0);
  }, []);

  const skip = useCallback(() => {
    setIsRunning(false);
    transitionToNext(currentMode);
  }, [currentMode, transitionToNext]);

  return {
    timeLeft,
    isRunning,
    currentMode,
    completedSessions,
    start,
    pause,
    reset,
    skip,
  };
}
