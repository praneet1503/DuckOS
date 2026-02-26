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
      {/* Badge background */}
      <rect x="1" y="1" width="22" height="22" rx="5" fill="currentColor" opacity="0.06" />
      {/* Simplified duck head (distinct from QuackCode) */}
      <circle
        cx="9.2"
        cy="10"
        r="3"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Beak (filled) */}
      <path d="M11.2 10.3l1.6.5-1.6.5z" fill="currentColor" />
      {/* Eye */}
      <circle cx="8.2" cy="9.2" r="0.45" fill="currentColor" />
      {/* Small network nodes to indicate API (top-right) */}
      <circle cx="16.8" cy="8.8" r="0.6" fill="currentColor" />
      <circle cx="18.6" cy="10.8" r="0.55" fill="currentColor" />
      <circle cx="15.2" cy="11.6" r="0.5" fill="currentColor" />
      <path d="M16.8 8.8L15.5 10.6" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M16.8 8.8L18.1 10.2" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );
}
