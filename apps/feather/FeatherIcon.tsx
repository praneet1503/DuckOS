"use client";

export default function FeatherIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 7c4.5 1 8 3.5 10 7 1.5-1.5 3-4.5 5-5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M7 18c3-0.5 5-2.5 8-5 0.4-0.35 1-0.25 1 0.2v3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="9" cy="11" r="1" fill="currentColor" />
    </svg>
  );
}
