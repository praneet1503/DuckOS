import React from "react";

export const EchoIcon: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 3C7.03 3 3 6.58 3 11c0 1.89.73 3.63 1.98 5.06L4 21l4.94-1.27A8.96 8.96 0 0 0 12 20c4.97 0 9-3.58 9-9s-4.03-8-9-8z"
        fill="currentColor"
      />
    </svg>
  );
};

export default EchoIcon;
