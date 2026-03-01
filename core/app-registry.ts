import type { AppDefinition } from "./types";
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

// gen by AI, all cleared//