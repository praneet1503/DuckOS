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
  const titleRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  // Stable position ref to avoid re-renders on every drag tick
  const posRef = useRef(win.position);
  useEffect(() => {
    posRef.current = win.position;
  }, [win.position]);
  // --- Drag logic: grip drag (window follows cursor at grab offset) ---
  const dragState = useRef<{
    dragging: boolean;
    pointerId: number | null;
    grabOffsetX: number; // Offset from window's left to pointer at grab
    grabOffsetY: number; // Offset from window's top to pointer at grab
  }>({
    dragging: false,
    pointerId: null,
    grabOffsetX: 0,
    grabOffsetY: 0,
  });


  // --- Grip drag handlers ---
  const handleTitlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only left click
    if (!isFocused) focusWindow(win.id);
    if (win.isMaximized) return;
    const rect = constraintsRef.current?.getBoundingClientRect();
    dragState.current.dragging = true;
    dragState.current.pointerId = e.pointerId;
    dragState.current.grabOffsetX = rect ? e.clientX - rect.left : 0;
    dragState.current.grabOffsetY = rect ? e.clientY - rect.top : 0;
    // Set initial transform for instant feedback
    if (constraintsRef.current) {
      constraintsRef.current.style.willChange = "transform";
    }
    window.addEventListener("pointermove", handlePointerMove, true);
    window.addEventListener("pointerup", handlePointerUp, true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }, [isFocused, focusWindow, win.id, win.isMaximized]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!dragState.current.dragging || dragState.current.pointerId !== e.pointerId) return;
    // Always use the latest window position from state
    const latestPos = posRef.current;
    const newLeft = e.clientX - dragState.current.grabOffsetX;
    const newTop = e.clientY - dragState.current.grabOffsetY;
    if (constraintsRef.current) {
      constraintsRef.current.style.transform = `translate(${newLeft - latestPos.x}px, ${newTop - latestPos.y}px)`;
    }
  }, []);
  // If window position changes in state while dragging, reset transform to avoid drift
  useEffect(() => {
    if (dragState.current.dragging && constraintsRef.current) {
      constraintsRef.current.style.transform = "";
    }
  }, [win.position.x, win.position.y]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (!dragState.current.dragging || dragState.current.pointerId !== e.pointerId) return;
    dragState.current.dragging = false;
    dragState.current.pointerId = null;
    
    const newLeft = e.clientX - dragState.current.grabOffsetX;
    const newTop = e.clientY - dragState.current.grabOffsetY;
    
    // Update state synchronously so React renders the new position
    updateWindowPosition(win.id, { x: newLeft, y: newTop });
    
    // Reset transform immediately
    if (constraintsRef.current) {
      constraintsRef.current.style.transform = "";
      constraintsRef.current.style.willChange = "";
    }
    
    window.removeEventListener("pointermove", handlePointerMove, true);
    window.removeEventListener("pointerup", handlePointerUp, true);
  }, [updateWindowPosition, win.id]);


  // Keep for focus on window click (not drag)
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
              : "border-white/10 bg-white/4 shadow-[0_4px_20px_rgba(0,0,0,0.35)]"
          }`}
        transition={{ duration: 0.25 }}
      >
        {/* ── Title bar ───────────────────────────── */}
        <motion.div
          ref={titleRef}
          onPointerDown={handleTitlePointerDown}
          className="flex h-10 shrink-0 cursor-grab items-center justify-between px-3 active:cursor-grabbing"
          // prevent text selection while dragging
          style={{ userSelect: "none" }}
        >
          {/* Traffic lights */}
          <div className="flex items-center gap-2">
            <button
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
              onClick={() => minimizeWindow(win.id)}
              className="relative flex h-4 w-4 items-center justify-center rounded-full bg-[#febc2e] transition-opacity hover:opacity-80"
              aria-label="Minimize"
            >
              <span className="text-[8px] font-bold text-black leading-none">–</span>
            </button>
            <button
              onClick={() => toggleMaximizeWindow(win.id)}
              className="relative flex h-4 w-4 items-center justify-center rounded-full bg-[#28c840] transition-opacity hover:opacity-80"
              aria-label="Maximize"
            >
              <span className="text-[8px] font-bold text-black leading-none">+</span>
            </button>
          </div>

          <span
            className="text-xs font-medium text-white/50 select-none pointer-events-none"
            style={{ WebkitUserSelect: "none" as any, userSelect: "none" }}
          >
            {app.name}
          </span>

          {/* Spacer to balance the title */}
          <div className="w-13" />
        </motion.div>

        {/* ── Content area ────────────────────────── */}
        <div className="flex-1 overflow-auto">
          <AppComponent />
        </div>
      </motion.div>
    </motion.div>
  );
}
