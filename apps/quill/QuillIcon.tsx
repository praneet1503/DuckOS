"use client";

export default function QuillIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* feather quill pen */}
      <path
        d="M20 2C15 4 11 9 9 14l-1.5 5L9 17c2-3 5-7 8-10"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 19l-3 3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      {/* page lines */}
      <line x1="13" y1="16" x2="19" y2="16" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      <line x1="14" y1="19" x2="19" y2="19" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      <line x1="15" y1="22" x2="19" y2="22" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
    </svg>
  );
}
