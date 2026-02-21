import type { WindowInstance, WindowPosition } from "./types";

/**
 * Pure helpers for the window compositor layer.
 *
 * These stay deterministic — no store access, no side-effects.
 * The OS store calls into them when spawning / arranging windows.
 */

/** Base offset from top-left for the first spawned window. */
export const BASE_X = 120;
export const BASE_Y = 80;
/** Cascade step per open window. */
export const CASCADE = 28;

/**
 * Return a spawn position that cascades from existing windows
 * so new windows don't stack directly on top of each other.
 */
export function getSpawnPosition(openWindows: WindowInstance[]): WindowPosition {
  const count = openWindows.length;
  return {
    x: BASE_X + CASCADE * (count % 10),
    y: BASE_Y + CASCADE * (count % 10),
  };
}

/**
 * Clamp a position so at least 60 px of the title bar stays visible.
 */
export function clampPosition(
  pos: WindowPosition,
  size: { width: number; height: number },
  viewport: { width: number; height: number }
): WindowPosition {
  // Clamp so entire window rectangle stays within the visible viewport.
  // This prevents new windows from spawning off-screen and ensures
  // dragged windows cannot permanently disappear.
  const x = Math.max(0, Math.min(pos.x, viewport.width - size.width));
  const y = Math.max(0, Math.min(pos.y, viewport.height - size.height));
  return { x, y };
}
