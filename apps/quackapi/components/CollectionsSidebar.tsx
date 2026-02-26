/* ══════════════════════════════════════════════════════════════
   QuackAPI — Collections Sidebar
   ────────────────────────────────────────────────────────────
   Left panel: collapsible tree of collections and requests.
   Supports create, rename, delete, import, export.
   ══════════════════════════════════════════════════════════ */

"use client";

import { memo, useState, useCallback, useRef } from "react";
import type { Collection, RequestItem, HttpMethod } from "../types";
import type { UseCollectionsReturn } from "../hooks/useCollections";
import { QAButton } from "./ui";

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "text-emerald-400",
  POST: "text-amber-400",
  PUT: "text-blue-400",
  PATCH: "text-purple-400",
  DELETE: "text-red-400",
};

interface CollectionsSidebarProps {
  collections: UseCollectionsReturn;
  onSelectRequest: (item: RequestItem, collectionId: string) => void;
  activeRequestId: string | null;
}

function CollectionsSidebar({
  collections,
  onSelectRequest,
  activeRequestId,
}: CollectionsSidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  // ── Create collection ─────────────────────────────────

  const handleCreateStart = useCallback(() => {
    setIsCreating(true);
    setNewName("");
  }, []);

  const handleCreateSubmit = useCallback(async () => {
    const name = newName.trim();
    if (!name) return;
    await collections.createCollection(name);
    setIsCreating(false);
    setNewName("");
  }, [newName, collections]);

  const handleCreateKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleCreateSubmit();
      if (e.key === "Escape") setIsCreating(false);
    },
    [handleCreateSubmit]
  );

  // ── Rename ────────────────────────────────────────────

  const startRename = useCallback((id: string, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
  }, []);

  const submitRename = useCallback(async () => {
    if (renamingId && renameValue.trim()) {
      await collections.renameCollection(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  }, [renamingId, renameValue, collections]);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") submitRename();
      if (e.key === "Escape") setRenamingId(null);
    },
    [submitRename]
  );

  // ── Import ────────────────────────────────────────────

  const handleImportClick = useCallback(() => {
    importRef.current?.click();
  }, []);

  const handleImportFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        await collections.importCollection(file);
      } catch {
        // Import failed — silently ignore for now
      }
      // Reset file input
      if (importRef.current) importRef.current.value = "";
    },
    [collections]
  );

  return (
    <div className="flex flex-col h-full border-r border-(--os-border) bg-white/2">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-(--os-border)">
        <span className="text-[12px] font-semibold text-foreground uppercase tracking-wider">
          Collections
        </span>
        <div className="flex items-center gap-1">
          <QAButton variant="ghost" size="sm" onClick={handleImportClick} title="Import">
            ↓
          </QAButton>
          <QAButton variant="ghost" size="sm" onClick={handleCreateStart} title="New Collection">
            +
          </QAButton>
        </div>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={importRef}
        type="file"
        accept=".json"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* Collection list */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* Create input */}
        {isCreating && (
          <div className="px-2 py-1">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleCreateKeyDown}
              onBlur={handleCreateSubmit}
              placeholder="Collection name…"
              className="w-full px-2 py-1 bg-white/8 border border-(--os-accent-teal)/40
                rounded text-[12px] text-foreground outline-none
                placeholder:text-(--os-text-secondary)/40"
            />
          </div>
        )}

        {/* Empty state */}
        {collections.isLoaded && collections.collections.length === 0 && !isCreating && (
          <div className="px-3 py-6 text-center">
            <div className="text-(--os-text-secondary) text-[11px]">
              No collections yet
            </div>
            <QAButton
              variant="ghost"
              size="sm"
              onClick={handleCreateStart}
              className="mt-2"
            >
              + Create Collection
            </QAButton>
          </div>
        )}

        {/* Collection items */}
        {collections.collections.map((col) => (
          <CollectionItem
            key={col.id}
            collection={col}
            isExpanded={collections.expandedIds.has(col.id)}
            isRenaming={renamingId === col.id}
            renameValue={renameValue}
            activeRequestId={activeRequestId}
            onToggle={() => collections.toggleExpanded(col.id)}
            onDelete={() => collections.deleteCollection(col.id)}
            onRenameStart={() => startRename(col.id, col.name)}
            onRenameChange={setRenameValue}
            onRenameKeyDown={handleRenameKeyDown}
            onRenameSubmit={submitRename}
            onExport={() => collections.exportCollection(col)}
            onSelectRequest={(req) => onSelectRequest(req, col.id)}
            onDeleteRequest={(reqId) => collections.deleteRequest(col.id, reqId)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Collection Item ─────────────────────────────────────────

interface CollectionItemProps {
  collection: Collection;
  isExpanded: boolean;
  isRenaming: boolean;
  renameValue: string;
  activeRequestId: string | null;
  onToggle: () => void;
  onDelete: () => void;
  onRenameStart: () => void;
  onRenameChange: (val: string) => void;
  onRenameKeyDown: (e: React.KeyboardEvent) => void;
  onRenameSubmit: () => void;
  onExport: () => void;
  onSelectRequest: (req: RequestItem) => void;
  onDeleteRequest: (reqId: string) => void;
}

const CollectionItem = memo(function CollectionItem({
  collection,
  isExpanded,
  isRenaming,
  renameValue,
  activeRequestId,
  onToggle,
  onDelete,
  onRenameStart,
  onRenameChange,
  onRenameKeyDown,
  onRenameSubmit,
  onExport,
  onSelectRequest,
  onDeleteRequest,
}: CollectionItemProps) {
  return (
    <div>
      {/* Collection header */}
      <div
        className="flex items-center gap-1 px-2 py-1 hover:bg-white/5 cursor-pointer group"
        onClick={onToggle}
      >
        <span className="text-(--os-text-secondary) text-[11px] w-4 text-center shrink-0 select-none">
          {isExpanded ? "▾" : "▸"}
        </span>

        {isRenaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            onKeyDown={onRenameKeyDown}
            onBlur={onRenameSubmit}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 px-1 py-0 bg-white/8 border border-(--os-accent-teal)/40
              rounded text-[12px] text-foreground outline-none min-w-0"
          />
        ) : (
          <span className="flex-1 text-[12px] text-foreground truncate select-none">
            {collection.name}
          </span>
        )}

        {/* Actions — visible on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExport();
            }}
            className="w-5 h-5 flex items-center justify-center text-[10px]
              text-(--os-text-secondary) hover:text-foreground
              rounded hover:bg-white/10 cursor-pointer transition-colors"
            title="Export"
          >
            ↑
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRenameStart();
            }}
            className="w-5 h-5 flex items-center justify-center text-[10px]
              text-(--os-text-secondary) hover:text-foreground
              rounded hover:bg-white/10 cursor-pointer transition-colors"
            title="Rename"
          >
            ✎
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-5 h-5 flex items-center justify-center text-[10px]
              text-(--os-text-secondary) hover:text-red-400
              rounded hover:bg-red-500/10 cursor-pointer transition-colors"
            title="Delete"
          >
            ×
          </button>
        </div>
      </div>

      {/* Requests */}
      {isExpanded && (
        <div className="ml-4">
          {collection.requests.length === 0 && (
            <div className="px-3 py-2 text-[11px] text-(--os-text-secondary) italic">
              No requests
            </div>
          )}
          {collection.requests.map((req) => (
            <RequestRow
              key={req.id}
              request={req}
              isActive={activeRequestId === req.id}
              onSelect={() => onSelectRequest(req)}
              onDelete={() => onDeleteRequest(req.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// ── Request Row ─────────────────────────────────────────────

interface RequestRowProps {
  request: RequestItem;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const RequestRow = memo(function RequestRow({
  request,
  isActive,
  onSelect,
  onDelete,
}: RequestRowProps) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 cursor-pointer group
        ${isActive ? "bg-(--os-accent-teal)/10" : "hover:bg-white/4"}`}
      onClick={onSelect}
    >
      <span
        className={`text-[10px] font-mono font-semibold w-10 shrink-0 ${
          METHOD_COLORS[request.method] ?? "text-(--os-text-secondary)"
        }`}
      >
        {request.method}
      </span>
      <span className="flex-1 text-[11px] text-foreground truncate">
        {request.name}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="w-4 h-4 flex items-center justify-center
          text-(--os-text-secondary) hover:text-red-400
          opacity-0 group-hover:opacity-100 transition-all cursor-pointer text-[10px]"
        title="Delete"
      >
        ×
      </button>
    </div>
  );
});

export default memo(CollectionsSidebar);
