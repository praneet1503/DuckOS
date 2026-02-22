/**
 * QuackCode — useEditorShortcuts hook
 *
 * Registers global keyboard shortcuts for the editor.
 * Shortcuts are only active when QuackCode's window is mounted.
 *
 * Supported:
 *  - Cmd/Ctrl + S → save current file
 *  - Cmd/Ctrl + W → close current tab
 *  - Cmd/Ctrl + P → quick-open (future hook, currently no-op)
 */

"use client";

import { useEffect, useRef } from "react";

export interface EditorShortcutHandlers {
  onSave: () => void;
  onCloseTab: () => void;
  onQuickOpen?: () => void;
}

export function useEditorShortcuts(handlers: EditorShortcutHandlers): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      switch (e.key.toLowerCase()) {
        case "s":
          e.preventDefault();
          e.stopPropagation();
          handlersRef.current.onSave();
          break;

        case "w":
          e.preventDefault();
          e.stopPropagation();
          handlersRef.current.onCloseTab();
          break;

        case "p":
          // Future: quick-open file picker
          if (handlersRef.current.onQuickOpen) {
            e.preventDefault();
            e.stopPropagation();
            handlersRef.current.onQuickOpen();
          }
          break;
      }
    };

    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true });
  }, []);
}
