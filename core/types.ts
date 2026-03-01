import type { ComponentType } from "react";
export interface WindowPosition {
  x: number;
  y: number;
}
export interface WindowSize {
  width: number;
  height: number;
}
export interface AppDefinition {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
  defaultSize: WindowSize;
  component: ComponentType;
  beforeClose?: () => boolean | Promise<boolean>;
}
export interface WindowInstance {
  id: string;
  appId: string;
  position: WindowPosition;
  size: WindowSize;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
}
export interface OSState {
  isBooted: boolean;
  openWindows: WindowInstance[];
  focusedWindowId: string | null;
  registeredApps: AppDefinition[];
  zIndexCounter: number;
  nextWindowSeq: number;
}
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

// gen by AI, all cleared//