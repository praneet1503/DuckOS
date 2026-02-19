"use client";

import { useRef, useCallback, useMemo, useEffect } from "react";
import { motion, type PanInfo } from "framer-motion";
import { useOSStore } from "@/core/os-store";
import { getAppById } from "@/core/app-registry";
import type { WindowInstance } from "@/core/types";

interface WindowProps {
  win: WindowInstance;
}

/**
 * Single composited window — draggable, focusable, animate in/out,
 * glassmorphism chrome with soft shadow depth changes.
 */
export default function Window({ win }: WindowProps) {
  const closeWindow = useOSStore((s) => s.closeWindow);
  const focusWindow = useOSStore((s) => s.focusWindow);
  const minimizeWindow = useOSStore((s) => s.minimizeWindow);
  const toggleMaximizeWindow = useOSStore((s) => s.toggleMaximizeWindow);
  const updateWindowPosition = useOSStore((s) => s.updateWindowPosition);
  const focusedWindowId = useOSStore((s) => s.focusedWindowId);

  const isFocused = focusedWindowId === win.id;
  const app = getAppById(win.appId);

  const constraintsRef = useRef<HTMLDivElement | null>(null);

  // Stable position ref to avoid re-renders on every drag tick
  const posRef = useRef(win.position);
  useEffect(() => {
    posRef.current = win.position;
  }, [win.position]);

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      updateWindowPosition(win.id, {
        x: posRef.current.x + info.offset.x,
        y: posRef.current.y + info.offset.y,
      });
    },
    [win.id, updateWindowPosition]
  );

  const handlePointerDown = useCallback(() => {
    if (!isFocused) focusWindow(win.id);
  }, [isFocused, focusWindow, win.id]);

  const AppComponent = useMemo(() => app?.component ?? null, [app]);

  if (!app || !AppComponent) return null;

  // Maximised windows fill viewport
  const style = win.isMaximized
    ? { top: 0, left: 0, width: "100vw", height: "100vh", zIndex: win.zIndex }
    : {
        top: win.position.y,
        left: win.position.x,
        width: win.size.width,
        height: win.size.height,
        zIndex: win.zIndex,
      };

  return (
    <motion.div
      layout
      className="absolute"
      style={style}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{
        opacity: win.isMinimized ? 0 : 1,
        scale: win.isMinimized ? 0.92 : 1,
        y: win.isMinimized ? 40 : 0,
      }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
      transition={{ type: "tween", duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      onPointerDown={handlePointerDown}
    >
      <motion.div
        ref={constraintsRef}
        className={`flex h-full w-full flex-col overflow-hidden rounded-xl border backdrop-blur-xl
          ${
            isFocused
              ? "border-white/15 bg-white/[0.07] shadow-[0_8px_40px_rgba(0,0,0,0.55)]"
              : "border-white/10 bg-white/[0.04] shadow-[0_4px_20px_rgba(0,0,0,0.35)]"
          }`}
        transition={{ duration: 0.25 }}
      >
        {/* ── Title bar ───────────────────────────── */}
        <motion.div
          className="flex h-10 shrink-0 cursor-grab items-center justify-between px-3 active:cursor-grabbing"
          drag={!win.isMaximized}
          dragMomentum={false}
          dragElastic={0}
          onDragEnd={handleDragEnd}
          // prevent text selection while dragging
          style={{ userSelect: "none" }}
        >
          {/* Traffic lights */}
          <div className="flex items-center gap-[7px]">
            <button
              onClick={() => closeWindow(win.id)}
              className="h-3 w-3 rounded-full bg-[#ff5f57] transition-opacity hover:opacity-80"
              aria-label="Close"
            />
            <button
              onClick={() => minimizeWindow(win.id)}
              className="h-3 w-3 rounded-full bg-[#febc2e] transition-opacity hover:opacity-80"
              aria-label="Minimize"
            />
            <button
              onClick={() => toggleMaximizeWindow(win.id)}
              className="h-3 w-3 rounded-full bg-[#28c840] transition-opacity hover:opacity-80"
              aria-label="Maximize"
            />
          </div>

          <span className="text-xs font-medium text-white/50">{app.name}</span>

          {/* Spacer to balance the title */}
          <div className="w-[52px]" />
        </motion.div>

        {/* ── Content area ────────────────────────── */}
        <div className="flex-1 overflow-auto">
          <AppComponent />
        </div>
      </motion.div>
    </motion.div>
  );
}
