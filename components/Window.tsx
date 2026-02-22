"use client";

import React, { useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useOSStore } from "@/core/os-store";
import { getAppById } from "@/core/app-registry";
import { useDrag } from "@/hooks/useDrag";
import type { WindowInstance } from "@/core/types";
import { clampPosition } from "@/core/window-manager";
interface WindowProps {
  win: WindowInstance;
}

/**
 * Single composited window — draggable, focusable, animate in/out,
 * glassmorphism chrome with soft shadow depth changes.
 *
 * Positioning uses ONLY translate3d — never top/left.
 * Each window is position:fixed inside the global WindowLayer portal.
 */
function WindowInner({ win }: WindowProps) {
  const closeWindow = useOSStore((s) => s.closeWindow);
  const focusWindow = useOSStore((s) => s.focusWindow);
  const minimizeWindow = useOSStore((s) => s.minimizeWindow);
  const toggleMaximizeWindow = useOSStore((s) => s.toggleMaximizeWindow);
  const updateWindowPosition = useOSStore((s) => s.updateWindowPosition);
  const focusedWindowId = useOSStore((s) => s.focusedWindowId);

  const isFocused = focusedWindowId === win.id;
  const app = getAppById(win.appId);

  // ── Drag hook ──────────────────────────────────────────
  const getPosition = useCallback(
    () => win.position,
    [win.position]
  );

  const onDragEnd = useCallback(
    (x: number, y: number) => {
      // always clamp synchronously — window manager is imported statically
      if (typeof window !== "undefined") {
        const { width, height } = win.size;
        const vp = { width: window.innerWidth, height: window.innerHeight };
        const { x: cx, y: cy } = clampPosition({ x, y }, { width, height }, vp);
        updateWindowPosition(win.id, { x: cx, y: cy });
      } else {
        updateWindowPosition(win.id, { x, y });
      }
    },
    [updateWindowPosition, win.id, win.size]
  );

  const { elRef, onPointerDown: onTitlePointerDown } = useDrag({
    onDragEnd,
    getPosition,
    disabled: win.isMaximized,
  });

  // Note: low-level pointer lifecycle is handled by `useDrag` hook.


  // Keep for focus on window click (not drag)
  const handlePointerDown = useCallback(() => {
    if (!isFocused) focusWindow(win.id);
  }, [isFocused, focusWindow, win.id]);

  // Combined handler for title bar: focus + start drag
  const handleTitlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      handlePointerDown();
      onTitlePointerDown(e);
    },
    [handlePointerDown, onTitlePointerDown]
  );

  const AppComponent = useMemo(() => app?.component ?? null, [app]);

  if (!app || !AppComponent) return null;

  // ── Positioning via translate3d only ───────────────────
  const posX = win.isMaximized ? 0 : win.position.x;
  const posY = win.isMaximized ? 0 : win.position.y;
  const w = win.isMaximized ? "100vw" : win.size.width;
  const h = win.isMaximized ? "100vh" : win.size.height;

  return (
    <motion.div
      ref={elRef}
      className={`absolute window-shell`}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: w,
        height: h,
        zIndex: win.zIndex,
        x: posX,
        y: posY,
        pointerEvents: "auto",
      }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{
        opacity: win.isMinimized ? 0 : 1,
        scale: 1,
      }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
      transition={{ type: "tween", duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      onPointerDown={handlePointerDown}
    >
      <div
        className={`flex h-full w-full flex-col overflow-hidden rounded-xl border backdrop-blur-xl transition-shadow duration-200
          ${
            isFocused
              ? "border-white/15 bg-white/[0.07] shadow-[0_8px_40px_rgba(0,0,0,0.55)]"
              : "border-white/10 bg-white/4 shadow-[0_4px_20px_rgba(0,0,0,0.35)]"
          }`}
      >
        {/* ── Title bar ───────────────────────────── */}
        <div
          onPointerDown={handleTitlePointerDown}
          className="flex h-10 shrink-0 cursor-grab items-center justify-between px-3 active:cursor-grabbing"
          style={{ userSelect: "none" }}
        >
          {/* Traffic lights */}
          <div className="flex items-center gap-2">
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={async () => {
                if (app?.beforeClose) {
                  const allowed = await app.beforeClose();
                  if (!allowed) return;
                }
                closeWindow(win.id);
              }}
              className="relative flex h-4 w-4 items-center justify-center rounded-full bg-[#ff5f57] transition-opacity hover:opacity-80"
              aria-label="Close"
            >
              <span className="text-[8px] font-bold text-black leading-none">×</span>
            </button>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => minimizeWindow(win.id)}
              className="relative flex h-4 w-4 items-center justify-center rounded-full bg-[#febc2e] transition-opacity hover:opacity-80"
              aria-label="Minimize"
            >
              <span className="text-[8px] font-bold text-black leading-none">–</span>
            </button>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => toggleMaximizeWindow(win.id)}
              className="relative flex h-4 w-4 items-center justify-center rounded-full bg-[#28c840] transition-opacity hover:opacity-80"
              aria-label="Maximize"
            >
              <span className="text-[8px] font-bold text-black leading-none">+</span>
            </button>
          </div>

          <span
            className="text-xs font-medium text-white/50 select-none pointer-events-none"
            style={{ userSelect: "none" }}
          >
            {app.name}
          </span>

          {/* Spacer to balance the title */}
          <div className="w-13" />
        </div>

        {/* ── Content area ────────────────────────── */}
        <div className="flex-1 overflow-auto">
          <AppComponent />
        </div>
      </div>
    </motion.div>
  );
}

const Window = React.memo(WindowInner);
export default Window;
