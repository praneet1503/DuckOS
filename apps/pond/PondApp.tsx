"use client";

import { useState, type ReactNode } from "react";
import FocusTimer from "./components/FocusTimer";

/* ── Tab definitions ───────────────────────────────────── */

interface PondTab {
  id: string;
  label: string;
  content: ReactNode;
}

const tabs: PondTab[] = [
  { id: "focus", label: "Focus", content: <FocusTimer /> },
  {
    id: "journal",
    label: "Journal",
    content: (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 select-none">
        <div className="text-4xl opacity-60">🪷</div>
        <p className="max-w-xs text-center text-[13px] text-white/40">
          A calm space to collect your thoughts. Coming soon.
        </p>
      </div>
    ),
  },
];

/* ── Component ──────────────────────────────────────────── */

export default function PondApp() {
  const [activeTab, setActiveTab] = useState("focus");

  return (
    <div className="flex h-full w-full flex-col select-none">
      {/* ── Tab bar ──────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-1 border-b border-white/6 px-3 pt-2 pb-0">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-t-md px-3 py-1.5 text-[13px] font-medium transition-colors duration-200 ${
                isActive
                  ? "bg-white/8 text-white/80"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ──────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>
    </div>
  );
}
