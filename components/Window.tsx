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
  // Smooth transform-based drag using requestAnimationFrame for fluid motion.
  // use the existing inner constraintsRef for applying transforms (avoids framer-motion conflicts)
  const dragTargetRef = useRef({ x: 0, y: 0 });
  const currentOffsetRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  // animate current offset (which is a translation relative to the window's start position)
  const animateToTarget = useCallback(() => {
    const current = currentOffsetRef.current;
    const target = dragTargetRef.current;
    const ease = 0.22;
    const nx = current.x + (target.x - current.x) * ease;
    const ny = current.y + (target.y - current.y) * ease;
    currentOffsetRef.current = { x: nx, y: ny };
    if (constraintsRef.current) {
      constraintsRef.current.style.transform = `translate(${nx}px, ${ny}px)`;
      constraintsRef.current.style.willChange = "transform";
    }

    const dx = Math.abs(target.x - nx);
    const dy = Math.abs(target.y - ny);
    if (dx > 0.5 || dy > 0.5) {
      rafRef.current = requestAnimationFrame(animateToTarget);
    } else {
      // snap to target (translation)
      if (constraintsRef.current) constraintsRef.current.style.transform = `translate(${target.x}px, ${target.y}px)`;
      currentOffsetRef.current = { x: target.x, y: target.y };
      rafRef.current = null;
    }
  }, []);

  const onPointerMove = useCallback(
    (e: PointerEvent, dx?: number, dy?: number) => {
      // compute desired absolute target position (where window's top-left should be)
      const desiredX = (dx ?? 0) + e.clientX;
      const desiredY = (dy ?? 0) + e.clientY;
      // convert to translation relative to dragStart (start window top-left)
      const relX = desiredX - dragStartRef.current.x;
      const relY = desiredY - dragStartRef.current.y;
      dragTargetRef.current = { x: relX, y: relY };
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(animateToTarget);
    },
    [animateToTarget]
  );

  const onPointerUp = useCallback(() => {
    // commit final position (start + current translation) and clear transform
    const finalRel = dragTargetRef.current;
    const finalX = Math.round(dragStartRef.current.x + finalRel.x);
    const finalY = Math.round(dragStartRef.current.y + finalRel.y);
    if (constraintsRef.current) constraintsRef.current.style.transform = "";
    currentOffsetRef.current = { x: 0, y: 0 };
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    updateWindowPosition(win.id, { x: finalX, y: finalY });
    window.removeEventListener("pointermove", onPointerMove, true);
    window.removeEventListener("pointerup", onPointerUp, true);
  }, [onPointerMove, updateWindowPosition, win.id]);

  const handleTitlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // focus first
      if (!isFocused) focusWindow(win.id);

      if (win.isMaximized) return;

      const rect = titleRef.current?.getBoundingClientRect();
      const dx = rect ? rect.width / 2 : 0; // we want the title centered under pointer -> desired window x = clientX - dx
      const dy = rect ? rect.height / 2 : 0;

      const start = posRef.current; // window's current top-left
      // set drag start
      dragStartRef.current = { x: start.x, y: start.y };
      // compute desired absolute position where window top-left should move to so title centers under cursor
      const desiredX = e.clientX - dx;
      const desiredY = e.clientY - dy;
      // compute translation relative to start
      dragTargetRef.current = { x: desiredX - start.x, y: desiredY - start.y };
      currentOffsetRef.current = { x: 0, y: 0 };

      if (constraintsRef.current) {
        // set transform to zero-based at start position
        constraintsRef.current.style.transform = `translate(0px, 0px)`;
      }

      // begin listening globally
      window.addEventListener("pointermove", onPointerMove as EventListener, true);
      window.addEventListener("pointerup", onPointerUp as EventListener, true);
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(animateToTarget);
      (e.target as Element).setPointerCapture?.(e.pointerId);
    },
    [animateToTarget, focusWindow, isFocused, onPointerMove, onPointerUp, win.id, win.isMaximized]
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
          ref={titleRef}
          onPointerDown={handleTitlePointerDown}
          className="flex h-10 shrink-0 cursor-grab items-center justify-between px-3 active:cursor-grabbing"
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

          <span
            className="text-xs font-medium text-white/50 select-none pointer-events-none"
            style={{ WebkitUserSelect: "none" as any, userSelect: "none" }}
          >
            {app.name}
          </span>

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
