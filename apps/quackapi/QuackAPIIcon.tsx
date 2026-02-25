/**
 * QuackAPI icon — duck with HTTP request arrows.
 * Matches DuckOS icon style (SVG, single-colour, currentColor).
 */

"use client";

export default function QuackAPIIcon({ className }: { className?: string }) {
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
      {/* Right arrow (request) */}
      <path
        d="M8 15.5l3 0"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M10.2 14.3l1.3 1.2-1.3 1.2"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.7"
      />
      {/* Left arrow (response) */}
      <path
        d="M16 17.5l-3 0"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M13.8 16.3l-1.3 1.2 1.3 1.2"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}
