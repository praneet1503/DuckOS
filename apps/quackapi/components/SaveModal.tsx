/* ══════════════════════════════════════════════════════════════
   QuackAPI — Save Request Modal
   ────────────────────────────────────────────────────────────
   Prompts the user to select or create a collection, then
   saves the current request.
   ══════════════════════════════════════════════════════════ */

"use client";

import { memo, useState, useCallback } from "react";
import type { Collection, RequestConfig } from "../types";
import { QAButton, QAInput } from "./ui";

interface SaveModalProps {
  collections: Collection[];
  currentConfig: RequestConfig;
  /** Pre-selected collection ID (if request was loaded from a collection) */
  preSelectedCollectionId: string | null;
  /** Pre-selected request ID (for update vs create-new) */
  preSelectedRequestId: string | null;
  onSave: (
    collectionId: string,
    name: string,
    isUpdate: boolean,
    requestId: string | null
  ) => void;
  onCreateCollection: (name: string) => Promise<Collection>;
  onClose: () => void;
}

function SaveModal({
  collections,
  currentConfig,
  preSelectedCollectionId,
  preSelectedRequestId,
  onSave,
  onCreateCollection,
  onClose,
}: SaveModalProps) {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(
    preSelectedCollectionId ?? ""
  );
  const [requestName, setRequestName] = useState(
    () => deriveRequestName(currentConfig)
  );
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [mode, setMode] = useState<"new" | "update">(
    preSelectedRequestId ? "update" : "new"
  );

  // ── Derive a default name from the request ────────────

  function deriveRequestName(config: RequestConfig): string {
    if (!config.url) return "New Request";
    try {
      const url = new URL(config.url);
      const path = url.pathname === "/" ? "" : url.pathname;
      return `${config.method} ${path || url.hostname}`;
    } catch {
      return `${config.method} Request`;
    }
  }

  // ── Create new collection inline ──────────────────────

  const handleCreateCollection = useCallback(async () => {
    const name = newCollectionName.trim();
    if (!name) return;
    const col = await onCreateCollection(name);
    setSelectedCollectionId(col.id);
    setIsCreatingCollection(false);
    setNewCollectionName("");
  }, [newCollectionName, onCreateCollection]);

  const handleCreateKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleCreateCollection();
      if (e.key === "Escape") setIsCreatingCollection(false);
    },
    [handleCreateCollection]
  );

  // ── Submit ────────────────────────────────────────────

  const handleSave = useCallback(() => {
    if (!selectedCollectionId || !requestName.trim()) return;
    onSave(
      selectedCollectionId,
      requestName.trim(),
      mode === "update",
      mode === "update" ? preSelectedRequestId : null
    );
  }, [selectedCollectionId, requestName, mode, preSelectedRequestId, onSave]);

  const canSave = selectedCollectionId && requestName.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-[420px] bg-[#181b22] border border-[var(--os-border)]
          rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--os-border)]">
          <span className="text-[14px] font-semibold text-[var(--os-text-primary)]">
            Save Request
          </span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center
              text-[var(--os-text-secondary)] hover:text-[var(--os-text-primary)]
              rounded hover:bg-white/10 cursor-pointer transition-colors"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3 flex flex-col gap-3">
          {/* Request name */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[var(--os-text-secondary)] font-medium uppercase tracking-wider">
              Request Name
            </label>
            <QAInput
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              placeholder="My Request"
              autoFocus
            />
          </div>

          {/* Collection selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[var(--os-text-secondary)] font-medium uppercase tracking-wider">
              Collection
            </label>

            {isCreatingCollection ? (
              <div className="flex items-center gap-1.5">
                <QAInput
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={handleCreateKeyDown}
                  placeholder="New collection name"
                  autoFocus
                />
                <QAButton
                  variant="primary"
                  size="sm"
                  onClick={handleCreateCollection}
                  disabled={!newCollectionName.trim()}
                >
                  Create
                </QAButton>
                <QAButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreatingCollection(false)}
                >
                  ✕
                </QAButton>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedCollectionId}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded
                    bg-white/5 text-[var(--os-text-primary)]
                    border border-[var(--os-border)]
                    text-[13px] outline-none cursor-pointer"
                >
                  <option value="" className="bg-[#1a1d24]">
                    Select collection…
                  </option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#1a1d24]">
                      {c.name}
                    </option>
                  ))}
                </select>
                <QAButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreatingCollection(true)}
                >
                  + New
                </QAButton>
              </div>
            )}
          </div>

          {/* Save mode (only if updating existing request) */}
          {preSelectedRequestId && (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-[12px] text-[var(--os-text-primary)]">
                <input
                  type="radio"
                  name="saveMode"
                  checked={mode === "update"}
                  onChange={() => setMode("update")}
                  className="accent-[var(--os-accent-teal)]"
                />
                Update existing
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-[12px] text-[var(--os-text-primary)]">
                <input
                  type="radio"
                  name="saveMode"
                  checked={mode === "new"}
                  onChange={() => setMode("new")}
                  className="accent-[var(--os-accent-teal)]"
                />
                Save as new
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--os-border)]">
          <QAButton variant="ghost" onClick={onClose}>
            Cancel
          </QAButton>
          <QAButton
            variant="primary"
            onClick={handleSave}
            disabled={!canSave}
          >
            Save
          </QAButton>
        </div>
      </div>
    </div>
  );
}

export default memo(SaveModal);
