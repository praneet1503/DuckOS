"use client";

import { memo, useCallback } from "react";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

function QATabs({ tabs, activeTab, onTabChange, className = "" }: TabsProps) {
  return (
    <div
      className={`flex items-center gap-0.5 border-b border-[var(--os-border)] ${className}`}
    >
      {tabs.map((tab) => (
        <TabButton
          key={tab.id}
          tab={tab}
          isActive={activeTab === tab.id}
          onClick={onTabChange}
        />
      ))}
    </div>
  );
}

interface TabButtonProps {
  tab: Tab;
  isActive: boolean;
  onClick: (id: string) => void;
}

const TabButton = memo(function TabButton({
  tab,
  isActive,
  onClick,
}: TabButtonProps) {
  const handleClick = useCallback(() => onClick(tab.id), [onClick, tab.id]);

  return (
    <button
      onClick={handleClick}
      className={`
        px-3 py-2 text-[12px] font-medium
        transition-colors duration-150 cursor-pointer
        border-b-2 -mb-px select-none
        ${
          isActive
            ? "text-[var(--os-text-primary)] border-[var(--os-accent-teal)]"
            : "text-[var(--os-text-secondary)] border-transparent hover:text-[var(--os-text-primary)] hover:border-white/20"
        }
      `}
    >
      {tab.label}
      {tab.count !== undefined && tab.count > 0 && (
        <span className="ml-1.5 text-[10px] opacity-50">({tab.count})</span>
      )}
    </button>
  );
});

export default memo(QATabs);
