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
      {/* Full-bleed background image (guaranteed to render) */}
      <img
        src="/backgrounds/duck-pond.jpg"
        alt="Duck pond background"
        className="pointer-events-none fixed inset-0 w-full h-full object-cover"
        style={{ zIndex: -30 }}
      />

      {/* Base animated gradient overlay */}
      <motion.div
        className="pointer-events-none fixed inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        style={{
          zIndex: -20,
          background: "linear-gradient(135deg, rgba(11,14,20,0.18) 0%, rgba(17,24,32,0.16) 40%, rgba(15,25,35,0.14) 70%, rgba(11,14,20,0.16) 100%)",
          backgroundSize: "400% 400%",
          backgroundPosition: "0% 50%",
          backgroundRepeat: "no-repeat",
          animation: "bgShift 20s ease infinite",
          mixBlendMode: "overlay",
          filter: "brightness(0.9) saturate(0.98)",
        }}
      />

      {/* Cursor-following radial highlight */}
      <div
        ref={radialRef}
        className="pointer-events-none fixed inset-0 transition-opacity duration-300"
        style={{ zIndex: -10 }}
      />
    </>
  );
}
