"use client";

export default function LensIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* curly braces */}
      <path
        d="M8 4C6.5 4 5.5 5 5.5 6.5v3c0 1-1 2-2 2 1 0 2 1 2 2v3c0 1.5 1 2.5 2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 4c1.5 0 2.5 1 2.5 2.5v3c0 1 1 2 2 2-1 0-2 1-2 2v3c0 1.5-1 2.5-2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* magnifying glass */}
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="14.1" y1="14.1" x2="16" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
    </svg>
  );
}
