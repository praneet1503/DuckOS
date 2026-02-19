"use client";

import { AnimatePresence } from "framer-motion";
import { useOSStore } from "@/core/os-store";
import Background from "./Background";
import Window from "./Window";
import Dock from "./Dock";

/**
 * Desktop — the full-screen compositor shell.
 *
 * Renders layered: Background → Windows → Dock.
 * Clicking empty space clears focus.
 */
export default function Desktop() {
  const openWindows = useOSStore((s) => s.openWindows);
  const clearFocus = useOSStore((s) => s.clearFocus);

  function handleDesktopClick(e: React.MouseEvent<HTMLDivElement>) {
    // Only clear focus when clicking the desktop itself, not children
    if (e.target === e.currentTarget) {
      clearFocus();
    }
  }

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-[#0b0e14]"
      onClick={handleDesktopClick}
    >
      <Background />

      {/* Window layer */}
      <AnimatePresence mode="popLayout">
        {openWindows
          .filter((w) => !w.isMinimized)
          .map((win) => (
            <Window key={win.id} win={win} />
          ))}
      </AnimatePresence>

      <Dock />
    </div>
  );
}
