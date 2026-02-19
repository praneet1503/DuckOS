import React from "react";

export const FlightIcon: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M2 21L23 12L2 3V10L17 12L2 14V21Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default FlightIcon;
