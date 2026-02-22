/**
 * QuackCode — useOpenFiles hook
 *
 * Manages the full lifecycle of open editor tabs:
 *  - Open file from VFS path
 *  - Track in-memory content + dirty state
 *  - Auto-save (debounced, per-tab)
 *  - Manual save (Cmd/Ctrl+S)
 *  - Close tab (with dirty confirmation)
 *  - Detect deleted files
 *  - Prevent duplicate tabs (focus existing instead)
 *  - Cleanup on unmount
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readFile, writeFile, getNodeByPath } from "@/core/vfs";
import {
  type EditorTab,
  type CursorPosition,
  detectLanguage,
  tabIdFromPath,
} from "./types";

const AUTOSAVE_MS = 5_000;

export interface UseOpenFilesReturn {
  tabs: EditorTab[];
  activeTabId: string | null;
  cursor: CursorPosition;
  /** Open a file by VFS path. If already open, focuses that tab. */
  openFile: (path: string) => Promise<void>;
  /** Close a tab by id. Prompts if dirty. Returns true if actually closed. */
  closeTab: (id: string) => Promise<boolean>;
  /** Save the current (or specified) tab to VFS. */
  saveTab: (id?: string) => Promise<void>;
  /** Save all dirty tabs. */
  saveAll: () => Promise<void>;
  /** Switch active tab. */
  setActiveTab: (id: string) => void;
  /** Called by Monaco on content change. */
  updateContent: (id: string, content: string) => void;
  /** Called by Monaco on cursor move. */
  updateCursor: (pos: CursorPosition) => void;
  /** Whether any tab has unsaved changes. */
  hasDirty: boolean;
  /** Error message for display (transient). */
  error: string | null;
  /** Clear error. */
  clearError: () => void;
}

export function useOpenFiles(): UseOpenFilesReturn {
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<CursorPosition>({ line: 1, column: 1 });
  const [error, setError] = useState<string | null>(null);

  // Per-tab autosave timers
  const autosaveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Ref to latest tabs for use in callbacks without stale closure
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;

  /* ── cleanup timers on unmount ─────────────────────────── */
  useEffect(() => {
    return () => {
      autosaveTimers.current.forEach((timer) => clearTimeout(timer));
      autosaveTimers.current.clear();
    };
  }, []);

  /* ── helpers ───────────────────────────────────────────── */

  const basename = (path: string) => path.split("/").filter(Boolean).pop() ?? path;

  const flashError = useCallback((msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  }, []);

  /* ── open file ─────────────────────────────────────────── */

  const openFile = useCallback(
    async (path: string) => {
      const id = tabIdFromPath(path);

      // Already open? Just focus.
      if (tabsRef.current.some((t) => t.id === id)) {
        setActiveTabId(id);
        return;
      }

      try {
        // Check existence
        const node = await getNodeByPath(path);
        if (!node) {
          flashError(`File not found: ${path}`);
          return;
        }
        if (node.type !== "file") {
          flashError(`Not a file: ${path}`);
          return;
        }

        const content = await readFile(path);
        const tab: EditorTab = {
          id,
          path,
          name: basename(path),
          content,
          isDirty: false,
          language: detectLanguage(path),
        };

        setTabs((prev) => [...prev, tab]);
        setActiveTabId(id);
        setCursor({ line: 1, column: 1 });
      } catch (err: any) {
        flashError(err.message ?? "Failed to open file");
      }
    },
    [flashError],
  );

  /* ── update content (on editor change) ─────────────────── */

  const updateContent = useCallback(
    (id: string, content: string) => {
      setTabs((prev) =>
        prev.map((t) => (t.id === id ? { ...t, content, isDirty: true } : t)),
      );

      // Schedule autosave
      const existing = autosaveTimers.current.get(id);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(async () => {
        autosaveTimers.current.delete(id);
        const tab = tabsRef.current.find((t) => t.id === id);
        if (!tab || !tab.isDirty) return;

        try {
          // Verify file still exists
          const node = await getNodeByPath(tab.path);
          if (!node) {
            flashError(`File deleted: ${tab.name}`);
            return;
          }
          await writeFile(tab.path, tab.content);
          setTabs((prev) =>
            prev.map((t) => (t.id === id ? { ...t, isDirty: false } : t)),
          );
        } catch {
          // Silently fail autosave — user can still manual-save
        }
      }, AUTOSAVE_MS);

      autosaveTimers.current.set(id, timer);
    },
    [flashError],
  );

  /* ── update cursor ─────────────────────────────────────── */

  const updateCursor = useCallback((pos: CursorPosition) => {
    setCursor(pos);
  }, []);

  /* ── save tab ──────────────────────────────────────────── */

  const saveTab = useCallback(
    async (id?: string) => {
      const targetId = id ?? activeTabId;
      if (!targetId) return;

      const tab = tabsRef.current.find((t) => t.id === targetId);
      if (!tab) return;

      // Clear pending autosave
      const timer = autosaveTimers.current.get(targetId);
      if (timer) {
        clearTimeout(timer);
        autosaveTimers.current.delete(targetId);
      }

      try {
        await writeFile(tab.path, tab.content);
        setTabs((prev) =>
          prev.map((t) =>
            t.id === targetId ? { ...t, isDirty: false } : t,
          ),
        );
      } catch (err: any) {
        flashError(err.message ?? "Save failed");
      }
    },
    [activeTabId, flashError],
  );

  /* ── save all ──────────────────────────────────────────── */

  const saveAll = useCallback(async () => {
    const dirty = tabsRef.current.filter((t) => t.isDirty);
    for (const tab of dirty) {
      await saveTab(tab.id);
    }
  }, [saveTab]);

  /* ── close tab ─────────────────────────────────────────── */

  const closeTab = useCallback(
    async (id: string) => {
      const tab = tabsRef.current.find((t) => t.id === id);
      if (!tab) return true;

      // Prompt if dirty
      if (tab.isDirty) {
        const ok = window.confirm(
          `"${tab.name}" has unsaved changes. Close without saving?`,
        );
        if (!ok) return false;
      }

      // Clear autosave timer
      const timer = autosaveTimers.current.get(id);
      if (timer) {
        clearTimeout(timer);
        autosaveTimers.current.delete(id);
      }

      setTabs((prev) => {
        const next = prev.filter((t) => t.id !== id);
        // If we closed the active tab, pick a neighbour
        if (activeTabId === id) {
          const idx = prev.findIndex((t) => t.id === id);
          const newActive =
            next.length === 0
              ? null
              : next[Math.min(idx, next.length - 1)]?.id ?? null;
          setActiveTabId(newActive);
        }
        return next;
      });

      return true;
    },
    [activeTabId],
  );

  /* ── set active tab ────────────────────────────────────── */

  const setActiveTab = useCallback((id: string) => {
    setActiveTabId(id);
    setCursor({ line: 1, column: 1 });
  }, []);

  /* ── clear error ───────────────────────────────────────── */

  const clearError = useCallback(() => setError(null), []);

  /* ── computed ──────────────────────────────────────────── */

  const hasDirty = tabs.some((t) => t.isDirty);

  return {
    tabs,
    activeTabId,
    cursor,
    openFile,
    closeTab,
    saveTab,
    saveAll,
    setActiveTab,
    updateContent,
    updateCursor,
    hasDirty,
    error,
    clearError,
  };
}
