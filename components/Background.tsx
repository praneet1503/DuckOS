"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

/**
 * Background layer — subtle shifting gradient with a soft radial
 * light that follows the cursor. Pure CSS, zero GPU overhead.
 */
export default function Background() {
  const radialRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      if (radialRef.current) {
        radialRef.current.style.background = `radial-gradient(600px circle at ${e.clientX}px ${e.clientY}px, rgba(217,176,106,0.06), transparent 60%)`;
      }
    }
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <>
      {/* Base animated gradient */}
      <motion.div
        className="pointer-events-none fixed inset-0 -z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        style={{
          backgroundImage: "url('/backgrounds/duck-pond.jpg'), linear-gradient(135deg, #0b0e14 0%, #111820 40%, #0f1923 70%, #0b0e14 100%)",
          backgroundSize: "cover, 400% 400%",
          backgroundPosition: "center, 0% 50%",
          backgroundRepeat: "no-repeat, no-repeat",
          backgroundBlendMode: "overlay",
          filter: "brightness(0.86) saturate(0.95)",
          animation: "bgShift 20s ease infinite",
        }}
      />

      {/* Cursor-following radial highlight */}
      <div
        ref={radialRef}
        className="pointer-events-none fixed inset-0 -z-10 transition-opacity duration-300"
      />
    </>
  );
}
