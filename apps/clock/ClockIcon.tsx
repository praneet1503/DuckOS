import React from "react";

export const ClockIcon: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      {/* Hour hand */}
      <line
        x1="12"
        y1="12"
        x2="12"
        y2="7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Minute hand */}
      <line
        x1="12"
        y1="12"
        x2="16"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Center dot */}
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
};

export default ClockIcon;
