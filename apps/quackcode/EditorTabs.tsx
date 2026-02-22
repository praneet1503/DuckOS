/**
 * QuackCode — EditorTabs
 *
 * Horizontal tab bar showing open files.
 * Features: dirty indicator (●), close button, active highlight,
 * horizontal scroll for many tabs.
 */

"use client";

import { useRef, useEffect } from "react";
import type { EditorTab } from "./types";

interface EditorTabsProps {
  tabs: EditorTab[];
  activeTabId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

export default function EditorTabs({
  tabs,
  activeTabId,
  onSelect,
  onClose,
}: EditorTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active tab
  useEffect(() => {
    if (!activeTabId || !scrollRef.current) return;
    const el = scrollRef.current.querySelector(
      `[data-tab-id="${CSS.escape(activeTabId)}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [activeTabId]);

  if (tabs.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      className="flex shrink-0 items-end gap-0 overflow-x-auto border-b border-white/10 bg-black/20"
      style={{ scrollbarWidth: "none" }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`group relative flex shrink-0 items-center gap-1.5 border-r border-white/5 px-3 py-1.5 text-[12px] transition-colors ${
              isActive
                ? "bg-white/[0.07] text-white/90"
                : "text-white/45 hover:bg-white/[0.04] hover:text-white/65"
            }`}
            style={{ maxWidth: 180 }}
          >
            {/* Dirty indicator */}
            {tab.isDirty && (
              <span
                className="shrink-0 text-[10px] text-amber-400/80"
                title="Unsaved changes"
              >
                ●
              </span>
            )}

            {/* Language icon — small coloured dot */}
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                tab.isDirty ? "hidden" : ""
              }`}
              style={{
                backgroundColor:
                  tab.language === "typescript"
                    ? "#3178c6"
                    : tab.language === "javascript"
                      ? "#f0db4f"
                      : tab.language === "python"
                        ? "#3572a5"
                        : tab.language === "json"
                          ? "#a8a8a8"
                          : tab.language === "html"
                            ? "#e34c26"
                            : tab.language === "css"
                              ? "#563d7c"
                              : "#6a737d",
              }}
            />

            <span className="truncate">{tab.name}</span>

            {/* Close button */}
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onClose(tab.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                  onClose(tab.id);
                }
              }}
              className="ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] text-white/25 opacity-0 transition-all hover:bg-white/10 hover:text-white/60 group-hover:opacity-100"
              title="Close tab"
            >
              ×
            </span>

            {/* Active bottom highlight */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-400/50" />
            )}
          </button>
        );
      })}
    </div>
  );
}
