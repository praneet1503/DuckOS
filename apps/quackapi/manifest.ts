/* ══════════════════════════════════════════════════════════════
   QuackAPI — App Manifest
   ══════════════════════════════════════════════════════════ */

export const QUACKAPI_MANIFEST = {
  id: "quackapi.app",
  name: "QuackAPI",
  icon: "🦆",
  version: "1.0.0",
  category: "developer" as const,
  window: {
    width: 1100,
    height: 700,
    minWidth: 900,
    minHeight: 600,
  },
} as const;

/** VFS directory where collections are persisted */
export const COLLECTIONS_DIR = "/home/quackapi/collections";
export const QUACKAPI_HOME = "/home/quackapi";
