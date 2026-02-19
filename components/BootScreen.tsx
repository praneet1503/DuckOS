"use client";

import { motion } from "framer-motion";

interface BootScreenProps {
  onBootComplete: () => void;
}

/**
 * Boot sequence — duck logo fade-in, progress bar, then hand off to Desktop.
 */
export default function BootScreen({ onBootComplete }: BootScreenProps) {
  return (
    <motion.div
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center gap-8 bg-[#0b0e14]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Logo */}
      <motion.div
        className="select-none text-6xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      >
        🦆
      </motion.div>

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
          transition={{ duration: 2, ease: [0.4, 0, 0.2, 1] }}
          onAnimationComplete={onBootComplete}
        />
      </div>
    </motion.div>
  );
}
