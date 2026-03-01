"use client";

import { motion } from "framer-motion";
import { useOSStore } from "@/core/os-store";
import Background from "@/components/Background";
import WindowLayer from "@/components/WindowLayer";
import Dock from "@/components/Dock";
import TimeWidget from "@/widgets/time/TimeWidget";

/**
 * Desktop Screen — the main compositor surface.
 *
 * Wraps the existing Desktop shell without any menu bars.
 */
export default function DesktopScreen() {
  const clearFocus = useOSStore((s) => s.clearFocus);

  function handleDesktopClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      clearFocus();
    }
  }

  return (
    <motion.div
      key="desktop"
      className="fixed inset-0 z-0 select-none cursor-default"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >

      {/* ── Desktop shell (background + widgets + windows + dock) */}
      <div
        className="relative h-full w-full overflow-hidden bg-transparent"
        onClick={handleDesktopClick}
      >
        <Background />
        <TimeWidget />
        <WindowLayer />
        <Dock />
      </div>
    </motion.div>
  );
}
