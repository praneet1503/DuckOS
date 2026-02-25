"use client";

import { memo, useCallback } from "react";
import type { KeyValueEntry } from "../../types";
import QAInput from "./Input";
import QAButton from "./Button";

interface KeyValueTableProps {
  entries: KeyValueEntry[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: "key" | "value", value: string) => void;
  onToggle: (id: string) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

function QAKeyValueTable({
  entries,
  onAdd,
  onRemove,
  onUpdate,
  onToggle,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
}: KeyValueTableProps) {
  return (
    <div className="flex flex-col gap-1">
      {/* Header */}
      <div className="flex items-center gap-2 px-1 mb-1">
        <span className="w-6" />
        <span className="flex-1 text-[11px] text-[var(--os-text-secondary)] font-medium uppercase tracking-wider">
          {keyPlaceholder}
        </span>
        <span className="flex-1 text-[11px] text-[var(--os-text-secondary)] font-medium uppercase tracking-wider">
          {valuePlaceholder}
        </span>
        <span className="w-7" />
      </div>

      {/* Rows */}
      {entries.map((entry) => (
        <KeyValueRow
          key={entry.id}
          entry={entry}
          onRemove={onRemove}
          onUpdate={onUpdate}
          onToggle={onToggle}
          keyPlaceholder={keyPlaceholder}
          valuePlaceholder={valuePlaceholder}
        />
      ))}

      {/* Add button */}
      <QAButton
        variant="ghost"
        size="sm"
        onClick={onAdd}
        className="self-start mt-1 ml-1"
      >
        + Add
      </QAButton>
    </div>
  );
}

// ── Row component ───────────────────────────────────────────

interface KeyValueRowProps {
  entry: KeyValueEntry;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: "key" | "value", value: string) => void;
  onToggle: (id: string) => void;
  keyPlaceholder: string;
  valuePlaceholder: string;
}

const KeyValueRow = memo(function KeyValueRow({
  entry,
  onRemove,
  onUpdate,
  onToggle,
  keyPlaceholder,
  valuePlaceholder,
}: KeyValueRowProps) {
  const handleToggle = useCallback(() => onToggle(entry.id), [onToggle, entry.id]);
  const handleRemove = useCallback(() => onRemove(entry.id), [onRemove, entry.id]);
  const handleKeyChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onUpdate(entry.id, "key", e.target.value),
    [onUpdate, entry.id]
  );
  const handleValueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onUpdate(entry.id, "value", e.target.value),
    [onUpdate, entry.id]
  );

  return (
    <div
      className={`flex items-center gap-2 px-1 ${
        !entry.enabled ? "opacity-40" : ""
      }`}
    >
      {/* Enable checkbox */}
      <input
        type="checkbox"
        checked={entry.enabled}
        onChange={handleToggle}
        className="w-3.5 h-3.5 accent-[var(--os-accent-teal)] cursor-pointer shrink-0"
      />

      {/* Key */}
      <QAInput
        value={entry.key}
        onChange={handleKeyChange}
        placeholder={keyPlaceholder}
        mono
        className="flex-1"
      />

      {/* Value */}
      <QAInput
        value={entry.value}
        onChange={handleValueChange}
        placeholder={valuePlaceholder}
        mono
        className="flex-1"
      />

      {/* Remove */}
      <button
        onClick={handleRemove}
        className="w-7 h-7 flex items-center justify-center
          text-[var(--os-text-secondary)] hover:text-red-400
          rounded hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
        title="Remove"
      >
        ×
      </button>
    </div>
  );
});

export default memo(QAKeyValueTable);
