"use client";

import { motion } from "framer-motion";
import { useOSStore } from "@/core/os-store";
import type { AppDefinition } from "@/core/types";

/**
 * Dock — bottom-center launcher bar.
 *
 * Reads registered apps from the store and renders clickable icons.
 * Subtle scale bounce on hover; gentle glass backdrop.
 */
export default function Dock() {
  const registeredApps = useOSStore((s) => s.registeredApps);
  const openApp = useOSStore((s) => s.openApp);
  const openWindows = useOSStore((s) => s.openWindows);
  const focusWindow = useOSStore((s) => s.focusWindow);

  function handleClick(app: AppDefinition) {
    // If the app already has an open window, focus it instead
    const existing = openWindows.find((w) => w.appId === app.id && !w.isMinimized);
    if (existing) {
      focusWindow(existing.id);
    } else {
      openApp(app.id);
    }
  }

  if (registeredApps.length === 0) return null;

  return (
    <motion.div
      className="fixed bottom-4 left-1/2 z-9000 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-3 py-2 backdrop-blur-xl"
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      {registeredApps.map((app) => {
        const hasOpenWindow = openWindows.some((w) => w.appId === app.id);
        const Icon = app.icon;

        return (
          <motion.button
            key={app.id}
            onClick={() => handleClick(app)}
            whileHover={{ scale: 1.15, y: -4 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="group relative flex h-11 w-11 items-center justify-center rounded-xl bg-white/8 text-white/70 transition-colors hover:bg-white/[0.14] hover:text-white"
            aria-label={`Open ${app.name}`}
          >
            <Icon className="h-5 w-5" />

            {/* Active dot indicator */}
            {hasOpenWindow && (
              <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-amber-400/80" />
            )}

            {/* Tooltip */}
            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/70 px-2 py-0.5 text-[10px] text-white/70 opacity-0 transition-opacity group-hover:opacity-100">
              {app.name}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
