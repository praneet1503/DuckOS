"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect } from "react";
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
  const openWindows = useOSStore((s) => s.openWindows);

  // debug logging
  useEffect(() => {
    console.log("openWindows updated", openWindows);
  }, [openWindows]);
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

      {/* debug square */}
      <div style={{position:'fixed',top:20,left:20,width:100,height:100,background:'rgba(255,0,0,0.5)',zIndex:11000}} />

      {/* Window layer portal (isolated from desktop layout) */}
      <WindowLayer />

      <Dock />

      {/* DEBUG: list open windows */}
      <div className="pointer-events-none fixed bottom-2 right-2 rounded bg-black/50 p-2 text-[10px] text-white/60">
        <pre className="whitespace-pre-wrap">{JSON.stringify(openWindows, null, 2)}</pre>
      </div>
    </div>
  );
}
