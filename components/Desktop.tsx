"use client";

import { useOSStore } from "@/core/os-store";
import Background from "./Background";
import WindowLayer from "./WindowLayer";
import Dock from "./Dock";

/**
 * Desktop — the full-screen compositor shell.
 *
 * Renders layered: Background → Windows → Dock.
 * Clicking empty space clears focus.
 */
export default function Desktop() {
  const clearFocus = useOSStore((s) => s.clearFocus);

  function handleDesktopClick(e: React.MouseEvent<HTMLDivElement>) {
    // Only clear focus when clicking the desktop itself, not children
    if (e.target === e.currentTarget) {
      clearFocus();
    }
  }

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-transparent"
      onClick={handleDesktopClick}
    >
      <Background />

      {/* Window layer portal (isolated from desktop layout) */}
      <WindowLayer />

      <Dock />

    </div>
  );
}
