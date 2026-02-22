/**
 * QuackCode — main app component
 *
 * Production-grade code editor inside DuckOS.
 *
 * Architecture:
 *  - Monaco is lazy-loaded (no SSR)
 *  - Editor only mounts when ≥ 1 tab is open
 *  - Custom duck-dark/duck-light themes synced with OS appearance
 *  - Auto-save debounced at 5 s per tab
 *  - beforeUnmount: all Monaco models disposed
 *  - Listens for "quackcode:open-file" CustomEvent from Burrow / other apps
 */

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import type { OnMount, OnChange } from "@monaco-editor/react";
import type { editor as monacoEditor } from "monaco-editor";
import EditorTabs from "./EditorTabs";
import { useOpenFiles } from "./useOpenFiles";
import { useEditorShortcuts } from "./useEditorShortcuts";
import { registerDuckThemes, getActiveThemeName } from "./editorThemes";

/* ── Lazy-load Monaco (CRITICAL: never render on server) ──── */
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-[13px] text-white/25">
      Loading editor…
    </div>
  ),
});

/* ── Component ────────────────────────────────────────────── */

export default function QuackCodeApp() {
  const {
    tabs,
    activeTabId,
    cursor,
    openFile,
    closeTab,
    saveTab,
    setActiveTab,
    updateContent,
    updateCursor,
    hasDirty,
    error,
  } = useOpenFiles();

  const [theme, setTheme] = useState<"duck-dark" | "duck-light">("duck-dark");
  const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) ?? null,
    [tabs, activeTabId],
  );

  /* ── Theme sync with OS ────────────────────────────────── */

  useEffect(() => {
    setTheme(getActiveThemeName());

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const obs = new MutationObserver(() => setTheme(getActiveThemeName()));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const mqHandler = () => setTheme(getActiveThemeName());
    mq.addEventListener("change", mqHandler);

    return () => {
      obs.disconnect();
      mq.removeEventListener("change", mqHandler);
    };
  }, []);

  /* ── Listen for external "open file" events ────────────── */

  useEffect(() => {
    const handler = (e: Event) => {
      const path = (e as CustomEvent<string>).detail;
      if (path) openFile(path);
    };
    window.addEventListener("quackcode:open-file", handler);
    return () => window.removeEventListener("quackcode:open-file", handler);
  }, [openFile]);

  /* ── Keyboard shortcuts ────────────────────────────────── */

  useEditorShortcuts({
    onSave: () => saveTab(),
    onCloseTab: () => {
      if (activeTabId) closeTab(activeTabId);
    },
  });

  /* ── Monaco mount callback ─────────────────────────────── */

  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      registerDuckThemes(monaco);
      monaco.editor.setTheme(theme);

      editor.focus();
    },
    [theme],
  );

  /* ── Monaco content change ─────────────────────────────── */

  const handleEditorChange: OnChange = useCallback(
    (value) => {
      if (activeTabId && value !== undefined) {
        updateContent(activeTabId, value);
      }
    },
    [activeTabId, updateContent],
  );

  /* ── Sync theme to monaco when it changes ──────────────── */

  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(theme);
    }
  }, [theme]);

  /* ── Cursor tracking ───────────────────────────────────── */

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const disposable = editor.onDidChangeCursorPosition((e) => {
      updateCursor({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });

    return () => disposable.dispose();
  }, [activeTabId, updateCursor]);

  /* ── Cleanup all models on unmount ─────────────────────── */

  useEffect(() => {
    return () => {
      if (monacoRef.current) {
        monacoRef.current.editor.getModels().forEach((m) => m.dispose());
      }
      editorRef.current = null;
      monacoRef.current = null;
    };
  }, []);

  /* ── Warn before browser unload if dirty ───────────────── */

  useEffect(() => {
    if (!hasDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasDirty]);

  /* ── Monaco editor options ─────────────────────────────── */

  const editorOptions: monacoEditor.IStandaloneEditorConstructionOptions =
    useMemo(
      () => ({
        minimap: { enabled: false },
        automaticLayout: true,
        fontSize: 14,
        lineHeight: 22,
        smoothScrolling: true,
        wordWrap: "on" as const,
        bracketPairColorization: { enabled: true },
        padding: { top: 10, bottom: 10 },
        scrollBeyondLastLine: false,
        renderLineHighlight: "gutter" as const,
        cursorBlinking: "smooth" as const,
        cursorSmoothCaretAnimation: "on" as const,
        fontFamily:
          "'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, Monaco, 'Courier New', monospace",
        fontLigatures: true,
        tabSize: 2,
        suggest: { preview: true },
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        overviewRulerBorder: false,
        guides: {
          indentation: true,
          bracketPairs: true,
        },
      }),
      [],
    );

  /* ── Render ─────────────────────────────────────────────── */

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#0d1117] text-white/90">
      {/* ── Tabs bar ──────────────────────────────── */}
      <EditorTabs
        tabs={tabs}
        activeTabId={activeTabId}
        onSelect={setActiveTab}
        onClose={(id) => closeTab(id)}
      />

      {/* ── Editor / empty state ──────────────────── */}
      <div className="relative flex-1 overflow-hidden">
        {activeTab ? (
          <MonacoEditor
            key={activeTab.id}
            language={activeTab.language}
            value={activeTab.content}
            theme={theme}
            options={editorOptions}
            onMount={handleEditorMount}
            onChange={handleEditorChange}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 select-none">
            <QuackCodeLogo className="h-16 w-16 text-white/10" />
            <p className="text-sm text-white/25">
              Open a file to start editing
            </p>
            <p className="text-[11px] text-white/15">
              Use Burrow file explorer → Open with QuackCode
            </p>
          </div>
        )}

        {/* Transient error toast */}
        {error && (
          <div className="absolute bottom-14 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-red-500/20 bg-red-950/80 px-4 py-2 text-[12px] text-red-300 shadow-lg backdrop-blur-sm">
            {error}
          </div>
        )}
      </div>

      {/* ── Status bar ────────────────────────────── */}
      <div className="flex h-6 shrink-0 items-center justify-between border-t border-white/10 bg-black/30 px-3 text-[11px] text-white/40">
        <div className="flex items-center gap-3">
          {activeTab ? (
            <>
              <span className="truncate max-w-[260px]" title={activeTab.path}>
                {activeTab.path}
              </span>
              {activeTab.isDirty && (
                <span className="text-amber-400/70">● Modified</span>
              )}
            </>
          ) : (
            <span>QuackCode</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {activeTab && (
            <>
              <span>
                Ln {cursor.line}, Col {cursor.column}
              </span>
              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase">
                {activeTab.language}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Inline logo (duck head + </>) ────────────────────────── */

function QuackCodeLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Duck head silhouette */}
      <path
        d="M32 8C20 8 12 18 12 28c0 6 3 11 8 14l-2 10h28l-2-10c5-3 8-8 8-14 0-10-8-20-20-20z"
        fill="currentColor"
        opacity="0.15"
      />
      {/* Beak */}
      <ellipse cx="38" cy="28" rx="8" ry="4" fill="currentColor" opacity="0.25" />
      {/* Eye */}
      <circle cx="26" cy="24" r="3" fill="currentColor" opacity="0.35" />
      {/* Code brackets </> */}
      <text
        x="32"
        y="44"
        textAnchor="middle"
        fill="currentColor"
        opacity="0.4"
        fontSize="12"
        fontWeight="600"
        fontFamily="monospace"
      >
        {"</>"}
      </text>
    </svg>
  );
}
