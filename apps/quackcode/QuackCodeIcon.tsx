/**
 * QuackCode icon — minimal duck head with </> code brackets.
 * Matches DuckOS icon style (SVG, single-colour, currentColor).
 */

"use client";

export default function QuackCodeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Duck head outline */}
      <path
        d="M12 3C7.5 3 4 7 4 11c0 2.5 1.2 4.7 3 6.2L6 20h12l-1-2.8c1.8-1.5 3-3.7 3-6.2 0-4-3.5-8-8-8z"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
        opacity="0.7"
      />
      {/* Beak */}
      <ellipse
        cx="16"
        cy="10.5"
        rx="3"
        ry="1.5"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.5"
      />
      {/* Eye */}
      <circle cx="10" cy="9.5" r="1.2" fill="currentColor" opacity="0.8" />
      {/* </> code brackets */}
      <text
        x="12"
        y="17.5"
        textAnchor="middle"
        fill="currentColor"
        opacity="0.7"
        fontSize="5.5"
        fontWeight="700"
        fontFamily="monospace"
      >
        {"</>"}
      </text>
    </svg>
  );
}
