"use client";

import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { useOSStore } from "@/core/os-store";
import Window from "./Window";

/**
 * WindowLayer — the global compositor surface for all windows.
 *
 * Rendered via React Portal into a dedicated `#window-layer` div on
 * document.body so that windows are fully isolated from layout reflows
 * in the Desktop / Dock / Background tree.
 *
 * The layer itself is position:fixed, covers the full viewport, and has
 * pointer-events:none.  Individual windows re-enable pointer-events.
 */
export default function WindowLayer() {
  const openWindows = useOSStore((s) => s.openWindows);
  const [host, setHost] = useState<HTMLElement | null>(null);

  // Create or find the portal mount point exactly once
  // Use useLayoutEffect so the host is created before first render
  useLayoutEffect(() => {
    let el = document.getElementById("window-layer");
    let createdByUs = false;
    if (!el) {
      el = document.createElement("div");
      el.id = "window-layer";
      document.body.appendChild(el);
      createdByUs = true;
    }
    setHost(el);

    return () => {
      if (createdByUs && el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    };
  }, []);

  if (!host) {
    return null;
  }

  return createPortal(
    <AnimatePresence mode="popLayout">
      {openWindows
        .filter((w) => !w.isMinimized)
        .map((win) => (
          <Window key={win.id} win={win} />
        ))}
    </AnimatePresence>,
    host
  );
}