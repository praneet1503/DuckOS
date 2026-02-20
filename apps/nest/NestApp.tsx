"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  initFileSystem,
  listDirectory,
  createFile,
  writeFile,
  readFile,
  deleteNode,
  type FileNode,
} from "@/core/vfs";

/* ── helpers ─────────────────────────────────────── */
function formatDate(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function excerpt(body: string, max = 60) {
  const line = body.replace(/\n/g, " ").trim();
  return line.length > max ? line.slice(0, max) + "…" : line || "No additional text";
}

const NOTES_DIR = "/home/notes";

interface NoteEntry {
  id: string;
  name: string;
  title: string;
  body: string;
  updatedAt: number;
}

/* ── component ───────────────────────────────────── */
export default function NestApp() {
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── load from VFS on mount ──
  useEffect(() => {
    (async () => {
      await initFileSystem();
      const children = await listDirectory(NOTES_DIR);
      const files = children.filter((f) => f.type === "file");

      const entries: NoteEntry[] = [];
      for (const f of files) {
        const body = await readFile(`${NOTES_DIR}/${f.name}`);
        // Derive title from filename (strip extension)
        const title = f.name.replace(/\.txt$/, "");
        entries.push({ id: f.id, name: f.name, title, body, updatedAt: f.updatedAt });
      }
      entries.sort((a, b) => b.updatedAt - a.updatedAt);

      if (entries.length === 0) {
        // seed a welcome note
        const fname = "Welcome to Notes.txt";
        const body = "Start writing your thoughts here.\nAll notes are saved locally in your browser.";
        const node = await createFile(`${NOTES_DIR}/${fname}`, body);
        const entry: NoteEntry = { id: node.id, name: fname, title: "Welcome to Notes", body, updatedAt: node.updatedAt };
        setNotes([entry]);
        setActiveId(entry.id);
      } else {
        setNotes(entries);
        setActiveId(entries[0].id);
      }
      setLoaded(true);
    })();
  }, []);

  const active = notes.find((n) => n.id === activeId) ?? null;

  /* ── CRUD ── */
  const handleNew = useCallback(async () => {
    let fname = "Untitled.txt";
    let counter = 1;
    const existing = notes.map((n) => n.name);
    while (existing.includes(fname)) {
      fname = `Untitled ${counter}.txt`;
      counter++;
    }
    const node = await createFile(`${NOTES_DIR}/${fname}`, "");
    const entry: NoteEntry = { id: node.id, name: fname, title: fname.replace(/\.txt$/, ""), body: "", updatedAt: node.updatedAt };
    setNotes((prev) => [entry, ...prev]);
    setActiveId(entry.id);
  }, [notes]);

  const handleDelete = useCallback(
    async (id: string) => {
      const note = notes.find((n) => n.id === id);
      if (!note) return;
      await deleteNode(`${NOTES_DIR}/${note.name}`);
      setNotes((prev) => {
        const next = prev.filter((n) => n.id !== id);
        if (activeId === id) setActiveId(next[0]?.id ?? null);
        return next;
      });
    },
    [activeId, notes]
  );

  // Auto-save with debounce
  const persist = useCallback((entry: NoteEntry) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await writeFile(`${NOTES_DIR}/${entry.name}`, entry.body);
    }, 300);
  }, []);

  const handleTitleChange = useCallback(
    async (value: string) => {
      if (!active) return;
      // Rename: delete old file, create new
      const newName = (value || "Untitled") + ".txt";
      if (newName !== active.name) {
        await deleteNode(`${NOTES_DIR}/${active.name}`);
        const node = await createFile(`${NOTES_DIR}/${newName}`, active.body);
        const updated: NoteEntry = { id: node.id, name: newName, title: value, body: active.body, updatedAt: Date.now() };
        setNotes((prev) => [updated, ...prev.filter((n) => n.id !== active.id)]);
        setActiveId(node.id);
      } else {
        const updated = { ...active, title: value, updatedAt: Date.now() };
        setNotes((prev) => [updated, ...prev.filter((n) => n.id !== active.id)]);
      }
    },
    [active]
  );

  const handleBodyChange = useCallback(
    (value: string) => {
      if (!active) return;
      const updated = { ...active, body: value, updatedAt: Date.now() };
      setNotes((prev) => [updated, ...prev.filter((n) => n.id !== active.id)]);
      persist(updated);
    },
    [active, persist]
  );

  if (!loaded) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-white/30">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex h-full w-full select-none overflow-hidden text-white/90">
      {/* ── Sidebar ──────────────────────────────── */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-white/10 bg-white/3">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
            Notes
          </span>
          <button
            onClick={handleNew}
            className="flex h-6 w-6 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            title="New note"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Note list */}
        <div className="flex-1 overflow-y-auto">
          {notes.map((note) => (
            <button
              key={note.id}
              onClick={() => setActiveId(note.id)}
              className={`group flex w-full flex-col gap-0.5 border-b border-white/5 px-3 py-2.5 text-left transition-colors ${
                note.id === activeId
                  ? "bg-white/10"
                  : "hover:bg-white/4"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate text-[13px] font-medium leading-tight text-white/80">
                  {note.title || "Untitled"}
                </span>
                <span className="ml-2 shrink-0 text-[10px] text-white/30">
                  {formatDate(note.updatedAt)}
                </span>
              </div>
              <span className="truncate text-[11px] leading-tight text-white/30">
                {excerpt(note.body)}
              </span>
            </button>
          ))}
          {notes.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-white/30">
              No notes yet
            </p>
          )}
        </div>
      </aside>

      {/* ── Editor ───────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden bg-white/2">
        {active ? (
          <>
            {/* Title + delete */}
            <div className="flex items-center border-b border-white/10 px-4 py-2">
              <input
                value={active.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Untitled"
                className="flex-1 bg-transparent text-base font-semibold text-white/90 placeholder-white/25 outline-none"
              />
              <button
                onClick={() => handleDelete(active.id)}
                className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/30 transition-colors hover:bg-red-500/20 hover:text-red-400"
                title="Delete note"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3.5 4h7M5.5 4V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1M5 6v4M9 6v4M4 4l.5 7.5a1 1 0 0 0 1 .5h3a1 1 0 0 0 1-.5L10 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <textarea
              value={active.body}
              onChange={(e) => handleBodyChange(e.target.value)}
              placeholder="Start writing…"
              className="flex-1 resize-none bg-transparent px-4 py-3 text-[13px] leading-relaxed text-white/70 placeholder-white/20 outline-none"
              spellCheck={false}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-white/25">
            Select or create a note
          </div>
        )}
      </main>
    </div>
  );
}
