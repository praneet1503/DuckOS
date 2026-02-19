import { create } from "zustand";
import type {
  OSState,
  OSActions,
  WindowInstance,
  WindowPosition,
  WindowSize,
} from "./types";
import { getAppById } from "./app-registry";
import { getSpawnPosition } from "./window-manager";

/**
 * Central OS store – the "kernel" of Duck OS.
 *
 * All window / app lifecycle flows through here.
 * Components subscribe reactively via selectors.
 */
export const useOSStore = create<OSState & OSActions>()((set, get) => ({
  // ── initial state ───────────────────────────────────────
  isBooted: false,
  openWindows: [],
  focusedWindowId: null,
  registeredApps: [],
  zIndexCounter: 1,

  // ── boot ────────────────────────────────────────────────
  boot: () => set({ isBooted: true }),

  // ── registry bridge ─────────────────────────────────────
  registerApp: (app) =>
    set((s) => {
      if (s.registeredApps.some((a) => a.id === app.id)) return s;
      return { registeredApps: [...s.registeredApps, app] };
    }),

  // ── app lifecycle ───────────────────────────────────────
  openApp: (appId) => {
    const app = getAppById(appId);
    if (!app) {
      console.warn(`[os-store] Unknown app "${appId}"`);
      return;
    }

    const { zIndexCounter, openWindows } = get();
    const nextZ = zIndexCounter + 1;

    const instance: WindowInstance = {
      id: `${appId}-${Date.now()}`,
      appId,
      position: getSpawnPosition(openWindows),
      size: { ...app.defaultSize },
      zIndex: nextZ,
      isMinimized: false,
      isMaximized: false,
    };

    set({
      openWindows: [...openWindows, instance],
      focusedWindowId: instance.id,
      zIndexCounter: nextZ,
    });
  },

  closeWindow: (windowId) =>
    set((s) => ({
      openWindows: s.openWindows.filter((w) => w.id !== windowId),
      focusedWindowId:
        s.focusedWindowId === windowId ? null : s.focusedWindowId,
    })),

  focusWindow: (windowId) => {
    const { zIndexCounter, openWindows } = get();
    const nextZ = zIndexCounter + 1;

    set({
      openWindows: openWindows.map((w) =>
        w.id === windowId ? { ...w, zIndex: nextZ, isMinimized: false } : w
      ),
      focusedWindowId: windowId,
      zIndexCounter: nextZ,
    });
  },

  minimizeWindow: (windowId) =>
    set((s) => ({
      openWindows: s.openWindows.map((w) =>
        w.id === windowId ? { ...w, isMinimized: true } : w
      ),
      focusedWindowId:
        s.focusedWindowId === windowId ? null : s.focusedWindowId,
    })),

  toggleMaximizeWindow: (windowId) =>
    set((s) => ({
      openWindows: s.openWindows.map((w) =>
        w.id === windowId ? { ...w, isMaximized: !w.isMaximized } : w
      ),
    })),

  updateWindowPosition: (windowId: string, position: WindowPosition) =>
    set((s) => ({
      openWindows: s.openWindows.map((w) =>
        w.id === windowId ? { ...w, position } : w
      ),
    })),

  updateWindowSize: (windowId: string, size: WindowSize) =>
    set((s) => ({
      openWindows: s.openWindows.map((w) =>
        w.id === windowId ? { ...w, size } : w
      ),
    })),

  clearFocus: () => set({ focusedWindowId: null }),
}));
