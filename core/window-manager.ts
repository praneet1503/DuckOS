import type { WindowInstance, WindowPosition } from "./types";
export const BASE_X = 120;
export const BASE_Y = 80;
export const CASCADE = 28;
export function getSpawnPosition(openWindows: WindowInstance[]): WindowPosition {
  const count = openWindows.length;
  return {
    x: BASE_X + CASCADE * (count % 10),
    y: BASE_Y + CASCADE * (count % 10),
  };
}
export function clampPosition(
  pos: WindowPosition,
  size: { width: number; height: number },
  viewport: { width: number; height: number }
): WindowPosition {
  const maxX = viewport.width - size.width;
  const maxY = viewport.height - size.height;
  if (maxX < 0 || maxY < 0) {
    return { x: 0, y: 0 };
  }

  const x = Math.max(0, Math.min(pos.x, maxX));
  const y = Math.max(0, Math.min(pos.y, maxY));
  return { x, y };
}
