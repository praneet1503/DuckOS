"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  initFileSystem,
  listDirectory,
  createFile,
  createFolder,
  deleteNode,
  renameNode,
  getTree,
  getPathForNode,
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
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

type TreeNode = FileNode & { children?: TreeNode[] };

/* ── Sidebar tree item ────────────────────────────── */
function TreeItem({
  node,
  depth,
  currentPath,
  onNavigate,
}: {
  node: TreeNode;
  depth: number;
  currentPath: string;
  onNavigate: (path: string, nodeId: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  if (node.type !== "folder") return null;

  const isActive = node.name === currentPath.split("/").filter(Boolean).pop();
  const hasChildren = (node.children ?? []).filter((c) => c.type === "folder").length > 0;

  return (
    <div>
      <button
        onClick={() => {
          setExpanded(!expanded);
          getPathForNode(node.id).then((p) => onNavigate(p, node.id));
        }}
        className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-[12px] transition-colors ${
          isActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white/80"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className={`shrink-0 transition-transform ${expanded ? "rotate-90" : ""} ${hasChildren ? "opacity-60" : "opacity-0"}`}
        >
          <path d="M3 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 opacity-50">
          <rect x="1" y="3" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1" />
          <path d="M1 5h4l1-2h5" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
        <span className="truncate">{node.name}</span>
      </button>
      {expanded &&
        (node.children ?? [])
          .filter((c) => c.type === "folder")
          .map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              currentPath={currentPath}
              onNavigate={onNavigate}
            />
          ))}
    </div>
  );
}

/* ── Storage panel ─────────────────────────────────── */
function StoragePanel() {
  const [usage, setUsage] = useState<{ used: number; quota: number } | null>(null);

  useEffect(() => {
    if (navigator.storage?.estimate) {
      navigator.storage.estimate().then((est) => {
        setUsage({ used: est.usage ?? 0, quota: est.quota ?? 0 });
      });
    }
  }, []);

  if (!usage) return null;

  const pct = usage.quota > 0 ? ((usage.used / usage.quota) * 100).toFixed(2) : "0";
  const fmt = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="border-t border-white/10 px-3 py-2">
      <p className="text-[10px] uppercase tracking-widest text-white/30">Storage</p>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-amber-400/60" style={{ width: `${Math.min(parseFloat(pct), 100)}%` }} />
      </div>
      <p className="mt-0.5 text-[10px] text-white/30">
        {fmt(usage.used)} / {fmt(usage.quota)} ({pct}%)
      </p>
    </div>
  );
}

/* ── Main component ────────────────────────────────── */
export default function BurrowApp() {
  const [currentPath, setCurrentPath] = useState("/");
  const [entries, setEntries] = useState<FileNode[]>([]);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState<"file" | "folder" | null>(null);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const [items, rootTree] = await Promise.all([
      listDirectory(currentPath),
      getTree("/"),
    ]);

    // debug: look for duplicate ids among siblings in the tree
    function checkDupes(node: TreeNode, path = "") {
      const errors: string[] = [];
      const ids = new Set<string>();
      (node.children || []).forEach((child) => {
        if (ids.has(child.id)) {
          errors.push(`${path}/${node.name || "root"} has duplicate child id ${child.id}`);
        } else {
          ids.add(child.id);
        }
      });
      (node.children || [])
        .filter((c) => c.type === "folder")
        .forEach((c) => errors.push(...checkDupes(c, path + "/" + (node.name || "root"))));
      return errors;
    }
    const dupes = checkDupes(rootTree, "");
    if (dupes.length) {
      console.warn("Burrow: duplicate ids detected in tree:", dupes);
    }

    setEntries(items);
    setTree(rootTree);
  }, [currentPath]);

  useEffect(() => {
    (async () => {
      await initFileSystem();
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (loaded) refresh();
  }, [loaded, refresh]);

  useEffect(() => {
    if (creating && inputRef.current) inputRef.current.focus();
  }, [creating]);

  const handleNavigate = useCallback((path: string, _nodeId: string) => {
    setCurrentPath(path);
    setSelected(null);
    setCreating(null);
  }, []);

  const handleOpen = useCallback(
    (entry: FileNode) => {
      if (entry.type === "folder") {
        setCurrentPath(currentPath === "/" ? `/${entry.name}` : `${currentPath}/${entry.name}`);
        setSelected(null);
      }
      // For files, just select for now
    },
    [currentPath]
  );

  const handleCreate = useCallback(async () => {
    if (!newName.trim() || !creating) return;
    const fullPath = currentPath === "/" ? `/${newName}` : `${currentPath}/${newName}`;
    try {
      if (creating === "folder") await createFolder(fullPath);
      else await createFile(fullPath, "");
      setCreating(null);
      setNewName("");
      await refresh();
    } catch (e: any) {
      // silently ignore duplicate errors
    }
  }, [creating, newName, currentPath, refresh]);

  const handleDelete = useCallback(async () => {
    if (!selected) return;
    const entry = entries.find((e) => e.id === selected);
    if (!entry) return;
    const fullPath = currentPath === "/" ? `/${entry.name}` : `${currentPath}/${entry.name}`;
    await deleteNode(fullPath);
    setSelected(null);
    await refresh();
  }, [selected, entries, currentPath, refresh]);

  const handleRenameStart = useCallback(
    (entry: FileNode) => {
      setRenamingId(entry.id);
      setRenameValue(entry.name);
    },
    []
  );

  const handleRenameCommit = useCallback(async () => {
    if (!renamingId || !renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    const entry = entries.find((e) => e.id === renamingId);
    if (!entry || entry.name === renameValue) {
      setRenamingId(null);
      return;
    }
    const fullPath = currentPath === "/" ? `/${entry.name}` : `${currentPath}/${entry.name}`;
    try {
      await renameNode(fullPath, renameValue);
    } catch {}
    setRenamingId(null);
    await refresh();
  }, [renamingId, renameValue, entries, currentPath, refresh]);

  const breadcrumbs = currentPath === "/" ? ["/"] : ["/", ...currentPath.split("/").filter(Boolean)];

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
      <aside className="flex w-48 shrink-0 flex-col border-r border-white/10 bg-white/3">
        <div className="px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Folders
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-1">
          {tree && <TreeItem node={tree} depth={0} currentPath={currentPath} onNavigate={handleNavigate} />}
        </div>
        <StoragePanel />
      </aside>

      {/* ── Main panel ───────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden bg-white/2">
        {/* Breadcrumbs + actions */}
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
          <div className="flex items-center gap-1 text-[12px] text-white/50">
            {breadcrumbs.map((seg, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-white/20">/</span>}
                <button
                  onClick={() => {
                    const path = i === 0 ? "/" : "/" + breadcrumbs.slice(1, i + 1).join("/");
                    setCurrentPath(path);
                    setSelected(null);
                  }}
                  className="rounded px-1 py-0.5 transition-colors hover:bg-white/10 hover:text-white/80"
                >
                  {seg === "/" ? "Root" : seg}
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => { setCreating("file"); setNewName(""); }}
              className="rounded-md px-2 py-1 text-[11px] text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
              title="New File"
            >
              + File
            </button>
            <button
              onClick={() => { setCreating("folder"); setNewName(""); }}
              className="rounded-md px-2 py-1 text-[11px] text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
              title="New Folder"
            >
              + Folder
            </button>
            {selected && (
              <>
                <button
                  onClick={() => {
                    const e = entries.find((x) => x.id === selected);
                    if (e) handleRenameStart(e);
                  }}
                  className="rounded-md px-2 py-1 text-[11px] text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
                >
                  Rename
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded-md px-2 py-1 text-[11px] text-red-400/60 transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Inline create */}
        {creating && (
          <div className="flex items-center gap-2 border-b border-white/5 px-3 py-1.5">
            <span className="text-[11px] text-white/40">
              {creating === "folder" ? "📁" : "📄"} New {creating}:
            </span>
            <input
              ref={inputRef}
              className="flex-1 rounded bg-white/5 px-2 py-1 text-[12px] text-white/80 outline-none ring-1 ring-white/10 focus:ring-white/30"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") setCreating(null);
              }}
              placeholder={creating === "folder" ? "folder name" : "file.txt"}
            />
            <button
              onClick={handleCreate}
              className="rounded-md bg-white/10 px-2 py-1 text-[11px] text-white/60 hover:bg-white/15"
            >
              Create
            </button>
            <button
              onClick={() => setCreating(null)}
              className="px-1 text-[11px] text-white/30 hover:text-white/60"
            >
              ✕
            </button>
          </div>
        )}

        {/* File list */}
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 grid grid-cols-[1fr_80px_110px] gap-2 border-b border-white/10 bg-black/20 px-3 py-1.5 text-[10px] uppercase tracking-widest text-white/30">
            <span>Name</span>
            <span>Type</span>
            <span>Modified</span>
          </div>

          {/* Go up */}
          {currentPath !== "/" && (
            <button
              onClick={() => {
                const parent = currentPath.split("/").slice(0, -1).join("/") || "/";
                setCurrentPath(parent);
                setSelected(null);
              }}
              className="grid w-full grid-cols-[1fr_80px_110px] gap-2 px-3 py-1.5 text-left text-[12px] text-white/40 transition-colors hover:bg-white/5"
            >
              <span>↑ ..</span>
              <span></span>
              <span></span>
            </button>
          )}

          {entries.map((entry) => (
            <button
              key={entry.id}
              onClick={() => setSelected(entry.id === selected ? null : entry.id)}
              onDoubleClick={() => handleOpen(entry)}
              className={`grid w-full grid-cols-[1fr_80px_110px] gap-2 px-3 py-1.5 text-left text-[12px] transition-colors ${
                entry.id === selected
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5"
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <span className="text-[11px] opacity-50">
                  {entry.type === "folder" ? "📁" : "📄"}
                </span>
                {renamingId === entry.id ? (
                  <input
                    autoFocus
                    className="w-full rounded bg-white/10 px-1 py-0.5 text-[12px] text-white/80 outline-none"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameCommit();
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    onBlur={handleRenameCommit}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="truncate">{entry.name}</span>
                )}
              </span>
              <span className="text-[11px] text-white/30">
                {entry.type === "folder" ? "Folder" : "File"}
              </span>
              <span className="text-[11px] text-white/30">
                {formatDate(entry.updatedAt)}
              </span>
            </button>
          ))}

          {entries.length === 0 && (
            <div className="flex items-center justify-center py-12 text-[12px] text-white/25">
              This folder is empty
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
