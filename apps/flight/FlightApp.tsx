"use client";

import React from "react";
import { useOSStore } from "@/core/os-store";

export default function FlightApp() {
  const openWindows = useOSStore((s) => s.openWindows.length);
  const registeredApps = useOSStore((s) => s.registeredApps.length);

  function forceCascadeTest() {
    const store = useOSStore.getState();
    // Open the Pond app three times to exercise window stacking
    store.openApp("pond");
    store.openApp("pond");
    store.openApp("pond");
  }

  return (
    <div className="p-4 w-full h-full flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Flight — System Monitor</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-gray-800/60 rounded">
          <div className="text-sm text-gray-300">Open windows</div>
          <div className="text-2xl font-mono">{openWindows}</div>
        </div>
        <div className="p-3 bg-gray-800/60 rounded">
          <div className="text-sm text-gray-300">Registered apps</div>
          <div className="text-2xl font-mono">{registeredApps}</div>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={forceCascadeTest}
          className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 rounded text-white"
        >
          Force Cascade Test (open Pond x3)
        </button>
      </div>
    </div>
  );
}
