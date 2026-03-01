"use client";
import { create } from "zustand";
export type ScreenId = "boot" | "lock" | "desktop";
interface ScreenState {
  current: ScreenId;
  setScreen: (screen: ScreenId) => void;
}
export const useScreen = create<ScreenState>()((set) => ({
  current: "boot",
  setScreen: (screen) => set({ current: screen }),
}));
// all cleared//