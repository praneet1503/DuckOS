"use client";

import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useScreen } from "@/store/useScreen";
import { useAuth } from "@/store/useAuth";
import BootScreen from "./screens/BootScreen";
import LockScreen from "./screens/LockScreen";
import DesktopScreen from "./screens/DesktopScreen";

/**
 * OSRoot — the top-level screen compositor.
 *
 * Reads the current screen from the useScreen store and
 * renders exactly ONE full-viewport screen at a time with
 * smooth Framer Motion cross-fade transitions.
 */
export default function OSRoot() {
  const current = useScreen((s) => s.current);
  const setScreen = useScreen((s) => s.setScreen);
  const autoLogin = useAuth((s) => s.autoLogin);
  const currentUser = useAuth((s) => s.currentUser);

  useEffect(() => {
    autoLogin();
  }, [autoLogin]);

  useEffect(() => {
    if (current === "boot") return;

    const target = currentUser ? "desktop" : "lock";
    if (current !== target) {
      setScreen(target);
    }
  }, [current, currentUser, setScreen]);

  return (
    <AnimatePresence mode="wait">
      {current === "boot" && <BootScreen key="boot" />}
      {current === "lock" && <LockScreen key="lock" />}
      {current === "desktop" && <DesktopScreen key="desktop" />}
    </AnimatePresence>
  );
}
