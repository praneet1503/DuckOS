"use client";

function PondIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Stylised ripple / water drop */}
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.2" opacity="0.25" />
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

export { PondIcon };
export { default as PondApp } from "./PondApp";
