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
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

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
const DOCS_DIR = "/home/documents";
const AUTOSAVE_MS = 600;

/* ── helpers ────────────────────── */
function basename(path: string) {
  return path.split("/").filter(Boolean).pop() ?? "";
}

/* ── toolbar button ─────────────── */
function TB({
  children,
  title,
  active,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
        active
          ? "bg-white/15 text-white"
          : "text-white/40 hover:bg-white/10 hover:text-white/70"
      }`}
    >
      {children}
    </button>
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
          Files
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
            No markdown files yet
          </p>
        )}
      </div>
    </aside>
  );
}

/* ── main component ─────────────── */
export default function QuillApp() {
  const [loaded, setLoaded] = useState(false);
  const [files, setFiles] = useState<{ path: string; name: string }[]>([]);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(true);
  const [mode, setMode] = useState<"edit" | "preview" | "split">("split");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  /* ── boot ─────────────────────── */
  useEffect(() => {
    (async () => {
      await initFileSystem();
      // ensure documents dir exists
      const node = await getNodeByPath(DOCS_DIR);
      if (!node) await createFolder(DOCS_DIR);
      await refreshFiles();
      setLoaded(true);
    })();
  }, []);

  /* ── refresh file list ────────── */
  const refreshFiles = useCallback(async () => {
    try {
      const items = await listDirectory(DOCS_DIR);
      const mdFiles = items
        .filter((i) => i.type === "file" && i.name.endsWith(".md"))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((i) => ({ path: `${DOCS_DIR}/${i.name}`, name: i.name }));
      setFiles(mdFiles);
    } catch {
      setFiles([]);
    }
  }, []);

  /* ── open file ────────────────── */
  const openFile = useCallback(async (path: string) => {
    try {
      const text = await readFile(path);
      setCurrentFile(path);
      setContent(text);
      setSaved(true);
    } catch {
      // file may have been deleted
    }
  }, []);

  /* ── new file ─────────────────── */
  const newFile = useCallback(async () => {
    const ts = Date.now();
    const name = `untitled-${ts}.md`;
    const path = `${DOCS_DIR}/${name}`;
    const initial = `# New Document\n\nStart writing here…\n`;
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

  // cleanup timer when component unmounts
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  /* ── manual save (Cmd+S) ─────── */
  const saveNow = useCallback(async () => {
    if (!currentFile) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    try {
      await writeFile(currentFile, content);
      setSaved(true);
    } catch {}
  }, [currentFile, content]);

  /* ── keyboard shortcuts ───────── */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "s") {
        e.preventDefault();
        saveNow();
        return;
      }
      // Bold: Cmd+B
      if (mod && e.key === "b") {
        e.preventDefault();
        wrapSelection("**", "**");
        return;
      }
      // Italic: Cmd+I
      if (mod && e.key === "i") {
        e.preventDefault();
        wrapSelection("_", "_");
        return;
      }
      // Code: Cmd+E
      if (mod && e.key === "e") {
        e.preventDefault();
        wrapSelection("`", "`");
        return;
      }
      // Link: Cmd+K
      if (mod && e.key === "k") {
        e.preventDefault();
        wrapSelection("[", "](url)");
        return;
      }
      // Tab key: insert 2 spaces
      if (e.key === "Tab") {
        e.preventDefault();
        insertAtCursor("  ");
      }
    },
    [saveNow]
  );

  /* ── editor helpers ───────────── */
  function wrapSelection(before: string, after: string) {
    const ta = editorRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end);
    const replacement = `${before}${selected || "text"}${after}`;
    const next = content.slice(0, start) + replacement + content.slice(end);
    setContent(next);
    scheduleAutosave(next);
    // restore cursor after React re-render
    requestAnimationFrame(() => {
      ta.focus();
      const cursorPos = start + before.length;
      const cursorEnd = cursorPos + (selected.length || 4);
      ta.setSelectionRange(cursorPos, cursorEnd);
    });
  }

  function insertAtCursor(text: string) {
    const ta = editorRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const next = content.slice(0, start) + text + content.slice(start);
    setContent(next);
    scheduleAutosave(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + text.length, start + text.length);
    });
  }

  /* ── content change ───────────── */
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);
    scheduleAutosave(text);
  };

  /* ── word count ───────────────── */
  const wordCount = useMemo(() => {
    if (!content) return 0;
    return content
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
  }, [content]);

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
        {/* ── Toolbar ─────────────── */}
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
          <div className="flex items-center gap-1">
            <TB title="Bold (⌘B)" onClick={() => wrapSelection("**", "**")}>
              <strong>B</strong>
            </TB>
            <TB title="Italic (⌘I)" onClick={() => wrapSelection("_", "_")}>
              <em>I</em>
            </TB>
            <TB title="Code (⌘E)" onClick={() => wrapSelection("`", "`")}>
              {"</>"}
            </TB>
            <TB title="Link (⌘K)" onClick={() => wrapSelection("[", "](url)")}>
              🔗
            </TB>
            <TB title="Heading" onClick={() => insertAtCursor("## ")}>
              H
            </TB>
            <span className="mx-1 text-white/10">|</span>
            <TB
              title="Editor"
              active={mode === "edit"}
              onClick={() => setMode("edit")}
            >
              Edit
            </TB>
            <TB
              title="Split view"
              active={mode === "split"}
              onClick={() => setMode("split")}
            >
              Split
            </TB>
            <TB
              title="Preview"
              active={mode === "preview"}
              onClick={() => setMode("preview")}
            >
              Preview
            </TB>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-white/30">
            <span>{wordCount} words</span>
            <span
              className={`h-1.5 w-1.5 rounded-full ${saved ? "bg-green-400/60" : "bg-amber-400/60"}`}
              title={saved ? "Saved" : "Unsaved"}
            />
            {currentFile && (
              <span className="max-w-[120px] truncate">{basename(currentFile)}</span>
            )}
          </div>
        </div>

        {/* ── Content ─────────────── */}
        {!currentFile ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-white/25">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="opacity-30">
              <path
                d="M20 2C15 4 11 9 9 14l-1.5 5L9 17c2-3 5-7 8-10"
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
              + New Document
            </button>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Editor pane */}
            {(mode === "edit" || mode === "split") && (
              <div
                className={`flex flex-col overflow-hidden ${
                  mode === "split" ? "w-1/2 border-r border-white/10" : "w-full"
                }`}
              >
                <textarea
                  ref={editorRef}
                  value={content}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  spellCheck={false}
                  className="flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-relaxed text-white/80 outline-none placeholder:text-white/20"
                  placeholder="Start writing markdown…"
                />
              </div>
            )}

            {/* Preview pane */}
            {(mode === "preview" || mode === "split") && (
              <div
                className={`overflow-y-auto ${
                  mode === "split" ? "w-1/2" : "w-full"
                } p-4`}
              >
                <div className="prose-invert prose-sm prose max-w-none
                  prose-headings:text-white/90 prose-headings:font-semibold
                  prose-p:text-white/70 prose-p:leading-relaxed
                  prose-a:text-amber-300 prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-white/80
                  prose-code:rounded prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:text-amber-200
                  prose-pre:bg-white/[0.06] prose-pre:border prose-pre:border-white/10
                  prose-blockquote:border-amber-400/40 prose-blockquote:text-white/50
                  prose-li:text-white/70
                  prose-hr:border-white/10
                  prose-th:text-white/60 prose-td:text-white/60
                  prose-img:rounded-lg">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize as any]}>
                    {content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
