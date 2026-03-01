"use client";
import { useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { useOSStore } from "@/core/os-store";
import Window from "./Window";
export default function WindowLayer() {
  const openWindows = useOSStore((s) => s.openWindows);
  const [host, setHost] = useState<HTMLElement | null>(null);
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

// all cleared//