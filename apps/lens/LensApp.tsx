"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import {
  initFileSystem,
  listDirectory,
  readFile,
  writeFile,
  createFile,
  createFolder,
  getNodeByPath,
  type FileNode,
} from "@/core/vfs";

/* ── constants ──────────────────── */
const DATA_DIR = "/home/documents";
const AUTOSAVE_MS = 600;

function basename(path: string) {
  return path.split("/").filter(Boolean).pop() ?? "";
}

/* ─────────────────────────────────────────────────────
   JSON tree viewer: recursive, collapsible, type-aware
   ───────────────────────────────────────────────────── */

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function typeColor(val: JsonValue): string {
  if (val === null) return "text-rose-300/70";
  switch (typeof val) {
    case "string":
      return "text-emerald-300/80";
    case "number":
      return "text-amber-300/80";
    case "boolean":
      return "text-sky-300/80";
    default:
      return "text-white/60";
  }
}

function typeBadge(val: JsonValue): string {
  if (val === null) return "null";
  if (Array.isArray(val)) return `array[${val.length}]`;
  switch (typeof val) {
    case "object":
      return `object{${Object.keys(val).length}}`;
    case "string":
      return "str";
    case "number":
      return "num";
    case "boolean":
      return "bool";
    default:
      return typeof val;
  }
}

function JsonNode({
  keyName,
  value,
  depth,
  path,
  onCopyPath,
}: {
  keyName?: string;
  value: JsonValue;
  depth: number;
  path: string;
  onCopyPath: (p: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isExpandable =
    value !== null && typeof value === "object";

  const entries = useMemo(() => {
    if (Array.isArray(value)) return value.map((v, i) => [String(i), v] as const);
    if (value !== null && typeof value === "object")
      return Object.entries(value);
    return [];
  }, [value]);

  /* primitive value */
  const renderValue = () => {
    if (value === null) return <span className="text-rose-300/70">null</span>;
    if (typeof value === "string")
      return (
        <span className="text-emerald-300/80">
          &quot;{value.length > 120 ? value.slice(0, 120) + "…" : value}&quot;
        </span>
      );
    if (typeof value === "boolean")
      return <span className="text-sky-300/80">{String(value)}</span>;
    if (typeof value === "number")
      return <span className="text-amber-300/80">{String(value)}</span>;
    return <span className="text-white/60">{String(value)}</span>;
  };

  return (
    <div style={{ paddingLeft: `${depth * 14}px` }}>
      <div className="group flex items-center gap-1 py-[1px]">
        {/* expand toggle */}
        {isExpandable ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex h-4 w-4 shrink-0 items-center justify-center text-white/30 hover:text-white/60"
          >
            <svg
              width="8"
              height="8"
              viewBox="0 0 8 8"
              className={`transition-transform ${expanded ? "rotate-90" : ""}`}
            >
              <path
                d="M2 1l4 3-4 3"
                stroke="currentColor"
                strokeWidth="1.2"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        {/* key */}
        {keyName !== undefined && (
          <>
            <span className="text-purple-300/70">{keyName}</span>
            <span className="text-white/20">:</span>
          </>
        )}

        {/* value or summary */}
        {isExpandable ? (
          <span className="text-[10px] text-white/25">{typeBadge(value)}</span>
        ) : (
          renderValue()
        )}

        {/* copy path button */}
        <button
          onClick={() => onCopyPath(path)}
          className="ml-1 opacity-0 transition-opacity group-hover:opacity-60 hover:!opacity-100 text-[9px] text-white/40"
          title={`Copy path: ${path}`}
        >
          ⧉
        </button>
      </div>

      {/* children */}
      {isExpandable && expanded && (
        <div>
          {entries.map(([k, v]) => (
            <JsonNode
              key={k}
              keyName={k}
              value={v as JsonValue}
              depth={depth + 1}
              path={`${path}.${k}`}
              onCopyPath={onCopyPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── file picker sidebar ────────── */
function FilePicker({
  files,
  currentPath,
  onSelect,
  onNew,
}: {
  files: { path: string; name: string }[];
  currentPath: string | null;
  onSelect: (path: string) => void;
  onNew: () => void;
}) {
  return (
    <aside className="flex w-44 shrink-0 flex-col border-r border-white/10 bg-white/[0.03]">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
          JSON files
        </span>
        <button
          onClick={onNew}
          className="text-[11px] text-white/40 transition-colors hover:text-white/70"
          title="New file"
        >
          +
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-1">
        {files.map((f) => (
          <button
            key={f.path}
            onClick={() => onSelect(f.path)}
            className={`w-full truncate rounded-md px-2 py-1 text-left text-[12px] transition-colors ${
              f.path === currentPath
                ? "bg-white/10 text-white"
                : "text-white/50 hover:bg-white/5 hover:text-white/70"
            }`}
          >
            {f.name}
          </button>
        ))}
        {files.length === 0 && (
          <p className="px-2 py-4 text-center text-[11px] text-white/25">
            No JSON files yet
          </p>
        )}
      </div>
    </aside>
  );
}

/* ── main component ─────────────── */
export default function LensApp() {
  const [loaded, setLoaded] = useState(false);
  const [files, setFiles] = useState<{ path: string; name: string }[]>([]);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [rawContent, setRawContent] = useState("");
  const [saved, setSaved] = useState(true);
  const [mode, setMode] = useState<"tree" | "editor">("tree");
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── parsed JSON ──────────────── */
  const parsed = useMemo<{ ok: true; data: JsonValue } | { ok: false; error: string }>(() => {
    try {
      const data = JSON.parse(rawContent);
      return { ok: true, data };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }, [rawContent]);

  /* ── boot ─────────────────────── */
  useEffect(() => {
    (async () => {
      await initFileSystem();
      const node = await getNodeByPath(DATA_DIR);
      if (!node) await createFolder(DATA_DIR);
      await refreshFiles();
      setLoaded(true);
    })();
  }, []);

  /* ── refresh files ────────────── */
  const refreshFiles = useCallback(async () => {
    try {
      const items = await listDirectory(DATA_DIR);
      const jsonFiles = items
        .filter((i) => i.type === "file" && i.name.endsWith(".json"))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((i) => ({ path: `${DATA_DIR}/${i.name}`, name: i.name }));
      setFiles(jsonFiles);
    } catch {
      setFiles([]);
    }
  }, []);

  /* ── open file ────────────────── */
  const openFile = useCallback(async (path: string) => {
    try {
      const text = await readFile(path);
      setCurrentFile(path);
      setRawContent(text);
      setSaved(true);
      setParseError(null);
    } catch {}
  }, []);

  /* ── new file ─────────────────── */
  const newFile = useCallback(async () => {
    const ts = Date.now();
    const name = `data-${ts}.json`;
    const path = `${DATA_DIR}/${name}`;
    const initial = JSON.stringify({ hello: "world", items: [1, 2, 3] }, null, 2);
    await createFile(path, initial);
    await refreshFiles();
    await openFile(path);
  }, [refreshFiles, openFile]);

  /* ── autosave ─────────────────── */
  const scheduleAutosave = useCallback(
    (text: string) => {
      if (!currentFile) return;
      setSaved(false);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await writeFile(currentFile, text);
          setSaved(true);
        } catch {}
      }, AUTOSAVE_MS);
    },
    [currentFile]
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  /* ── format ───────────────────── */
  const formatJson = useCallback(() => {
    if (!parsed.ok) return;
    const formatted = JSON.stringify(parsed.data, null, 2);
    setRawContent(formatted);
    scheduleAutosave(formatted);
  }, [parsed, scheduleAutosave]);

  /* ── minify ───────────────────── */
  const minifyJson = useCallback(() => {
    if (!parsed.ok) return;
    const minified = JSON.stringify(parsed.data);
    setRawContent(minified);
    scheduleAutosave(minified);
  }, [parsed, scheduleAutosave]);

  /* ── copy ──────────────────────── */
  const copyContent = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(rawContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }, [rawContent]);

  /* ── copy path from tree ──────── */
  const copyPath = useCallback(async (p: string) => {
    try {
      await navigator.clipboard.writeText(p);
    } catch {}
  }, []);

  /* ── keyboard shortcuts ───────── */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "s") {
        e.preventDefault();
        if (!currentFile) return;
        if (saveTimer.current) clearTimeout(saveTimer.current);
        writeFile(currentFile, rawContent).then(() => setSaved(true));
        return;
      }
      if (mod && e.shiftKey && e.key === "f") {
        e.preventDefault();
        formatJson();
        return;
      }
    },
    [currentFile, rawContent, formatJson]
  );

  /* ── editor change ────────────── */
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setRawContent(text);
    scheduleAutosave(text);
  };

  if (!loaded) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-white/30">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex h-full w-full select-none overflow-hidden text-white/90">
      {/* ── Sidebar ───────────────── */}
      <FilePicker
        files={files}
        currentPath={currentFile}
        onSelect={openFile}
        onNew={newFile}
      />

      {/* ── Main area ─────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode("tree")}
              className={`rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
                mode === "tree"
                  ? "bg-white/15 text-white"
                  : "text-white/40 hover:bg-white/10 hover:text-white/70"
              }`}
            >
              🌲 Tree
            </button>
            <button
              onClick={() => setMode("editor")}
              className={`rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
                mode === "editor"
                  ? "bg-white/15 text-white"
                  : "text-white/40 hover:bg-white/10 hover:text-white/70"
              }`}
            >
              ✏️ Editor
            </button>

            <span className="mx-1 text-white/10">|</span>

            <button
              onClick={formatJson}
              disabled={!parsed.ok}
              className="rounded px-1.5 py-0.5 text-[11px] text-white/40 transition-colors hover:bg-white/10 hover:text-white/70 disabled:opacity-30"
              title="Format (⌘⇧F)"
            >
              Format
            </button>
            <button
              onClick={minifyJson}
              disabled={!parsed.ok}
              className="rounded px-1.5 py-0.5 text-[11px] text-white/40 transition-colors hover:bg-white/10 hover:text-white/70 disabled:opacity-30"
            >
              Minify
            </button>
            <button
              onClick={copyContent}
              className="rounded px-1.5 py-0.5 text-[11px] text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-white/30">
            {parsed.ok ? (
              <span className="text-emerald-400/60">Valid JSON</span>
            ) : currentFile ? (
              <span className="text-rose-400/60">Invalid</span>
            ) : null}
            <span
              className={`h-1.5 w-1.5 rounded-full ${saved ? "bg-green-400/60" : "bg-amber-400/60"}`}
              title={saved ? "Saved" : "Unsaved"}
            />
            {currentFile && (
              <span className="max-w-[120px] truncate">{basename(currentFile)}</span>
            )}
          </div>
        </div>

        {/* Content */}
        {!currentFile ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-white/25">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="opacity-30">
              <path
                d="M8 4C6.5 4 5.5 5 5.5 6.5v3c0 1-1 2-2 2 1 0 2 1 2 2v3c0 1.5 1 2.5 2.5 2.5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
              <path
                d="M16 4c1.5 0 2.5 1 2.5 2.5v3c0 1 1 2 2 2-1 0-2 1-2 2v3c0 1.5-1 2.5-2.5 2.5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
            <p className="text-sm">Select a file or create a new one</p>
            <button
              onClick={newFile}
              className="rounded-lg border border-white/10 px-4 py-1.5 text-xs text-white/40 transition-colors hover:bg-white/5 hover:text-white/60"
            >
              + New JSON File
            </button>
          </div>
        ) : mode === "tree" ? (
          <div className="flex-1 overflow-y-auto p-3 font-mono text-[12px]">
            {parsed.ok ? (
              <JsonNode value={parsed.data} depth={0} path="$" onCopyPath={copyPath} />
            ) : (
              <div className="flex flex-col gap-2 p-4">
                <p className="text-rose-300/80 text-sm">⚠ JSON Parse Error</p>
                <p className="text-[11px] text-white/40 font-mono">{parsed.error}</p>
                <button
                  onClick={() => setMode("editor")}
                  className="mt-2 self-start rounded-lg border border-white/10 px-3 py-1 text-xs text-white/40 hover:bg-white/5 hover:text-white/60"
                >
                  Switch to Editor to fix
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* parse error bar */}
            {!parsed.ok && (
              <div className="border-b border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-[11px] text-rose-300/80">
                ⚠ {parsed.error}
              </div>
            )}
            <textarea
              value={rawContent}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              className="flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-relaxed text-white/80 outline-none placeholder:text-white/20"
              placeholder='{"key": "value"}'
            />
          </div>
        )}
      </div>
    </div>
  );
}
