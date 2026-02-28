"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useScreen } from "@/store/useScreen";
import { useAuth } from "@/store/useAuth";

/**
 * Boot Screen — the original DuckOS splash.
 *
 * Shows the duck emoji logo, "Duck OS" title, and an amber progress bar.
 * After the progress bar completes (~2.5 s) it auto-transitions to the
 * lock screen. No user interaction required.
 */
export default function BootScreen() {
  const setScreen = useScreen((s) => s.setScreen);
  const currentUser = useAuth((s) => s.currentUser);

  /* Safety net: if the animation-complete callback somehow doesn't fire,
     ensure we still move forward after 3 s. */
  useEffect(() => {
    const id = setTimeout(() => {
      setScreen(currentUser ? "desktop" : "lock");
    }, 3000);
    return () => clearTimeout(id);
  }, [currentUser, setScreen]);

  return (
    <motion.div
      key="boot"
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center gap-8 bg-[#0b0e14] select-none cursor-default"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Duck logo */}
      <motion.div
        className="text-6xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      >
        🦆
      </motion.div>

      {/* Title */}
      <motion.p
        className="text-sm font-medium tracking-widest text-white/40 uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        Duck OS
      </motion.p>

      {/* Progress bar */}
      <div className="mt-4 h-0.75 w-48 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-amber-400/70"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.5, ease: [0.4, 0, 0.2, 1] }}
          onAnimationComplete={() => setScreen(currentUser ? "desktop" : "lock")}
        />
      </div>
    </motion.div>
  );
}
