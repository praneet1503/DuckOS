import type { ComponentType } from "react";

// ── Geometry ────────────────────────────────────────────────

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

// ── App definition (registry contract) ──────────────────────

export interface AppDefinition {
  /** Unique slug, e.g. "pond" */
  id: string;
  /** Human-readable label shown in dock / title bar */
  name: string;
  /** React component rendered as the app icon */
  icon: ComponentType<{ className?: string }>;
  /** Default window dimensions when the app first opens */
  defaultSize: WindowSize;
  /** The component rendered inside the window */
  component: ComponentType;
  /**
   * Optional hook called before the window closes.
   * Return `false` (or a Promise resolving to `false`) to cancel the close.
   * Useful for dirty-state confirmation dialogs.
   */
  beforeClose?: () => boolean | Promise<boolean>;
}

// ── Window instance (runtime state per open window) ─────────

export interface WindowInstance {
  /** Unique runtime id (appId + timestamp) */
  id: string;
  /** Which registered app this window belongs to */
  appId: string;
  /** Current top-left position */
  position: WindowPosition;
  /** Current dimensions */
  size: WindowSize;
  /** Compositor stacking order */
  zIndex: number;
  /** Whether the window is minimised to dock */
  isMinimized: boolean;
  /** Whether the window fills the viewport */
  isMaximized: boolean;
}

// ── OS-level state slice ────────────────────────────────────

export interface OSState {
  isBooted: boolean;
  openWindows: WindowInstance[];
  focusedWindowId: string | null;
  registeredApps: AppDefinition[];
  zIndexCounter: number;
  /** Monotonic sequence to ensure unique window ids when opened rapidly */
  nextWindowSeq: number;
}

// ── OS actions (store methods) ──────────────────────────────

export interface OSActions {
  boot: () => void;
  registerApp: (app: AppDefinition) => void;
  openApp: (appId: string) => void;
  closeWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  toggleMaximizeWindow: (windowId: string) => void;
  updateWindowPosition: (windowId: string, position: WindowPosition) => void;
  updateWindowSize: (windowId: string, size: WindowSize) => void;
  clearFocus: () => void;
}
