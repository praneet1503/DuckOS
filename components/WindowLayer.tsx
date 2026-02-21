"use client";

import { useEffect, useState, useRef } from "react";
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
  const created = useRef(false);

  // Create or find the portal mount point exactly once and attach a
  // click/pointer handler on the host so clicks on empty space can
  // clear OS focus (we call the store directly via getState()).
  useEffect(() => {
    if (created.current) return;
    created.current = true;

    let el = document.getElementById("window-layer");
    let createdByUs = false;
    if (!el) {
      el = document.createElement("div");
      el.id = "window-layer";
      document.body.appendChild(el);
      createdByUs = true;
    }
    setHost(el);

    // pointerdown handler: if the user clicked the empty host (not a
    // window), clear focus in the OS store.
    const handler = (e: PointerEvent) => {
      if (e.target === el) {
        // access store directly to avoid hooks inside this DOM handler
        try {
          // useOSStore is a zustand hook which exposes getState()
          // at runtime — call clearFocus() directly.
          (useOSStore as any).getState().clearFocus();
        } catch (err) {
          console.warn("WindowLayer: failed to clear focus", err);
        }
      }
    };

    el.addEventListener("pointerdown", handler);

    return () => {
      el.removeEventListener("pointerdown", handler);
      // Cleanup only if WE created it
      if (createdByUs && el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    };
  }, []);

  if (!host) return null;

  // debug log every render
  console.log("WindowLayer render", openWindows);
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