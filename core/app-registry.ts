import type { AppDefinition } from "./types";

/**
 * App registry – a thin runtime catalogue.
 *
 * Apps call `registerApp` at startup; the OS store also keeps a
 * `registeredApps` array so the dock and window manager can read
 * from Zustand reactively. This module is the canonical source list
 * that gets fed into the store on boot.
 */

const registry = new Map<string, AppDefinition>();

export function registerApp(app: AppDefinition): void {
  if (registry.has(app.id)) {
    console.warn(`[app-registry] App "${app.id}" is already registered.`);
    return;
  }
  registry.set(app.id, app);
}

export function getAppById(id: string): AppDefinition | undefined {
  return registry.get(id);
}

export function getRegisteredApps(): AppDefinition[] {
  return Array.from(registry.values());
}

export function clearRegistry(): void {
  registry.clear();
}
