"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useOSStore } from "@/core/os-store";
import { useAuth } from "@/store/useAuth";
import { formatTime } from "@/lib/time";
import Background from "@/components/Background";
import WindowLayer from "@/components/WindowLayer";
import Dock from "@/components/Dock";
import TimeWidget from "@/widgets/time/TimeWidget";

/**
 * Desktop Screen — the main compositor surface.
 *
 * Wraps the existing Desktop shell with a macOS-style
 * top menu bar that includes a DuckOS label, clock, and
 * a Lock button that returns to the lock screen.
 */
export default function DesktopScreen() {
  const clearFocus = useOSStore((s) => s.clearFocus);
  const currentUser = useAuth((s) => s.currentUser);
  const lock = useAuth((s) => s.lock);
  const logout = useAuth((s) => s.logout);

  const [time, setTime] = useState(() => formatTime(new Date()));
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  function handleDesktopClick(e: React.MouseEvent<HTMLDivElement>) {
    setMenuOpen(false);

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
      {/* ── Top Menu Bar ──────────────────────────────────── */}
      <div className="absolute top-0 left-0 z-9998 h-10 w-full flex items-center justify-between px-4 bg-black/30 backdrop-blur-md border-b border-white/10">
        {/* Left: OS label */}
        <span className="text-xs font-normal tracking-wide text-white/80">
          🦆 DuckOS
        </span>

        {/* Right: clock + account menu */}
        <div className="relative flex items-center gap-4">
          <span className="text-xs font-normal tracking-wide text-white/65 tabular-nums">
            {time}
          </span>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="text-xs font-normal tracking-wide text-white/75 hover:text-white transition-colors cursor-pointer"
            title="Account menu"
          >
            {currentUser?.username ?? "Account"}
          </button>

          {menuOpen ? (
            <div className="absolute right-0 top-8 w-36 rounded-xl border border-white/10 bg-black/45 p-1 backdrop-blur-xl shadow-lg shadow-black/30">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  lock();
                }}
                className="w-full rounded-lg px-3 py-1.5 text-left text-xs text-white/80 transition-colors hover:bg-white/10 cursor-pointer"
              >
                Lock
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="w-full rounded-lg px-3 py-1.5 text-left text-xs text-white/80 transition-colors hover:bg-white/10 cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>

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
