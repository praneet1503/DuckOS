"use client";

import { create } from "zustand";

/** The three system screens rendered in sequence. */
export type ScreenId = "boot" | "lock" | "desktop";

interface ScreenState {
  /** Which full-screen surface is currently active. */
  current: ScreenId;
  /** Transition to a different screen. */
  setScreen: (screen: ScreenId) => void;
}

/**
 * Lightweight Zustand store that drives the full-screen
 * screen manager (boot → lock → desktop).
 *
 * Kept separate from `useOSStore` so that screen-transition
 * logic never leaks into window / app lifecycle code.
 */
export const useScreen = create<ScreenState>()((set) => ({
  current: "boot",
  setScreen: (screen) => set({ current: screen }),
}));
