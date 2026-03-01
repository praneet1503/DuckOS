"use client";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOSStore } from "@/core/os-store";
import type { AppDefinition } from "@/core/types";
export default function Dock() {
  const registeredApps = useOSStore((s) => s.registeredApps);
  const openApp = useOSStore((s) => s.openApp);
  const openWindows = useOSStore((s) => s.openWindows);
  const focusWindow = useOSStore((s) => s.focusWindow);
  const MAX_SCALE = 1.6; 
  const MIN_SCALE = 1; 
  const SPREAD = 90;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iconCentersRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const pointerXRef = useRef<number | null>(null);
  const [scales, setScales] = useState<number[]>([]);
  const [isPointerOver, setIsPointerOver] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const handleClick = useCallback((app: AppDefinition) => {
    const existing = openWindows.find((w) => w.appId === app.id && !w.isMinimized);
    if (existing) {
      focusWindow(existing.id);
    } else {
      openApp(app.id);
    }
  }, [focusWindow, openApp, openWindows]);
  if (registeredApps.length === 0) return null;
  useEffect(() => {
    setScales(new Array(registeredApps.length).fill(MIN_SCALE));
  }, [registeredApps.length]);
  function measureIconCenters() {
    const el = containerRef.current;
    if (!el) return;
    const buttons = Array.from(el.querySelectorAll("button")) as HTMLElement[];
    iconCentersRef.current = buttons.map((b) => {
      const r = b.getBoundingClientRect();
      return r.left + r.width / 2;
    });
  }
  useEffect(() => {
    measureIconCenters();
    const onResize = () => measureIconCenters();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [registeredApps.length]);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  function applyScales(pointerX: number | null) {
    const centers = iconCentersRef.current;
    if (!centers || centers.length === 0) return;
    const next = centers.map((cx) => {
      if (pointerX == null) return MIN_SCALE;
      const dist = Math.abs(pointerX - cx);
      const sigma = SPREAD;
      const t = Math.exp(-(dist * dist) / (2 * sigma * sigma));
      return Math.max(MIN_SCALE, MIN_SCALE + (MAX_SCALE - MIN_SCALE) * t);
    });
    setScales(next);
  }
  function scheduleUpdate(clientX: number | null) {
    pointerXRef.current = clientX;
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      applyScales(pointerXRef.current);
      rafRef.current = null;
    });
  }
  useEffect(() => {
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);
  const openAppIds = useMemo(() => {
    const ids = new Set<string>();
    for (const win of openWindows) {
      ids.add(win.appId);
    }
    return ids;
  }, [openWindows]);
  const maxScale = scales.length > 0 ? Math.max(...scales) : MIN_SCALE;
  const basePadding = 8; 
  const expandedPadding = basePadding + (maxScale - MIN_SCALE) * 6; 
  const baseHorizontalPadding = 32;
  const expandedHorizontalPadding = baseHorizontalPadding + (maxScale - MIN_SCALE) * 8;
  return (
    <motion.div
      ref={containerRef}
      onPointerMove={(e) => {
        setIsPointerOver(true);
        scheduleUpdate(e.clientX);
      }}
      onPointerLeave={() => {
        setIsPointerOver(false);
        scheduleUpdate(null);
      }}
      className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-3xl border border-white/20 bg-white/15 px-8 shadow-2xl backdrop-blur-xl"
      initial={{
        y: 60,
        opacity: 0,
        paddingTop: basePadding,
        paddingBottom: basePadding,
        paddingLeft: baseHorizontalPadding,
        paddingRight: baseHorizontalPadding,
      }}
      animate={{
        y: 0,
        opacity: 1,
        paddingTop: expandedPadding,
        paddingBottom: expandedPadding,
        paddingLeft: expandedHorizontalPadding,
        paddingRight: expandedHorizontalPadding,
      }}
      transition={
        hasMounted
          ? { type: "spring", stiffness: 350, damping: 35 }
          : { delay: 0.3, duration: 0.5, ease: [0.4, 0, 0.2, 1] }
      }
      style={{ zIndex: isPointerOver ? 45 : undefined }}
    >
      <div className="h-6 w-0.5 rounded-full bg-white/15" />

      {registeredApps.map((app, idx) => {
        const hasOpenWindow = openAppIds.has(app.id);
        const Icon = app.icon;
        const scale = scales[idx] ?? MIN_SCALE;
        return (
          <motion.button
            key={app.id}
            onClick={() => handleClick(app)}
            animate={{ scale, y: scale > 1.02 ? -4 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            onFocus={() => {
              const next = new Array(registeredApps.length).fill(MIN_SCALE);
              next[idx] = Math.max(1.15, MAX_SCALE * 0.9);
              setScales(next);
            }}
            onBlur={() => scheduleUpdate(isPointerOver ? pointerXRef.current : null)}
            whileTap={{ scale: 0.95 }}
            className="group relative flex h-11 w-11 items-center justify-center rounded-xl bg-white/8 text-white/70 transition-colors hover:bg-white/[0.14] hover:text-white"
            aria-label={`Open ${app.name}`}
          >
            <Icon className="h-5 w-5" />
            {hasOpenWindow && (
              <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-amber-400/80" />
            )}
            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/70 px-2 py-0.5 text-[10px] text-white/70 opacity-0 transition-opacity group-hover:opacity-100">
              {app.name}
            </span>
          </motion.button>
        );
      })}
      <div className="h-6 w-0.5 rounded-full bg-white/15" />
    </motion.div>
  );
}

// all cleared,generated by AI//

