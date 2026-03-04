"use client";
import { useEffect, useState } from "react";

export default function MobileWarning() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem("duckos_mobile_warning_dismissed");
    if (dismissed) return;
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent) || window.innerWidth < 640;
    if (isMobile) setVisible(true);
  }, []);

  if (!visible) return null;

  const close = (persist = false) => {
    if (persist) localStorage.setItem("duckos_mobile_warning_dismissed", "1");
    setVisible(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-700 rounded-2xl p-5 text-white shadow-lg">
        <h3 className="text-lg font-semibold mb-2">Not recommended on phones</h3>
        <p className="text-sm text-white/80 mb-4">
          DuckOS is not optimized for mobile devices. For the best experience,
          please use a desktop or laptop. Using a phone may cause layout issues
          or broken functionality.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => close()}
            className="px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-sm"
          >
            Continue anyway
          </button>
          <button
            onClick={() => close(true)}
            className="px-3 py-2 rounded-md bg-blue-500 text-white text-sm font-medium"
          >
            Don't show again
          </button>
        </div>
      </div>
    </div>
  );
}
