"use client";

import { useMemo, useState } from "react";
import { nestFileSystem, type FileNode } from "./file-system";

/** Render a simple tree of folders for navigation. */
function FolderTree({
  node,
  onSelect,
  currentId,
}: {
  node: FileNode;
  onSelect: (node: FileNode) => void;
  currentId: string;
}) {
  if (node.type !== "folder") return null;

  const children = node.children ?? [];
  const folders = children.filter((child) => child.type === "folder");

  return (
    <div className="space-y-1">
      <button
        onClick={() => onSelect(node)}
        className={`w-full text-left text-sm font-medium transition-colors ${
          currentId === node.id
            ? "text-amber-300"
            : "text-white/70 hover:text-white"
        }`}
      >
        {node.name}
      </button>
      <div className="ml-3 space-y-1">
        {folders.map((child) => (
          <FolderTree
            key={child.id}
            node={child}
            onSelect={onSelect}
            currentId={currentId}
          />
        ))}
      </div>
    </div>
  );
}

export default function NestApp() {
  const [currentFolder, setCurrentFolder] = useState<FileNode>(nestFileSystem);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);

  const folders = useMemo(
    () => (currentFolder.children ?? []).filter((child) => child.type === "folder"),
    [currentFolder]
  );

  const files = useMemo(
    () => (currentFolder.children ?? []).filter((child) => child.type === "file"),
    [currentFolder]
  );

  return (
    <div className="flex h-full w-full gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-lg">
      <aside className="flex w-1/4 max-w-55 flex-col gap-3 rounded-lg border border-white/10 bg-black/20 p-3 text-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">Folders</p>
        <div className="flex-1 space-y-2 overflow-auto">
          <FolderTree
            node={nestFileSystem}
            onSelect={(node) => {
              setCurrentFolder(node);
              setSelectedFile(null);
            }}
            currentId={currentFolder.id}
          />
        </div>
      </aside>

      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        <section className="flex flex-1 flex-col gap-2 rounded-lg border border-white/10 bg-black/30 p-3">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/40">
            <span>Current Folder</span>
            <span>{currentFolder.name}</span>
          </div>
          <div className="flex flex-wrap gap-2 overflow-auto">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => {
                  setCurrentFolder(folder);
                  setSelectedFile(null);
                }}
                className="flex min-w-30 items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2 text-left text-sm text-white/70 transition-colors hover:border-amber-300 hover:text-white"
              >
                <span>{folder.name}</span>
                <span className="text-[10px] text-white/40">Folder</span>
              </button>
            ))}
            {folders.length === 0 && (
              <p className="text-xs text-white/40">No subfolders</p>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-2 overflow-auto pt-2">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">Files</p>
            <div className="grid auto-rows-min grid-cols-1 gap-2 md:grid-cols-2">
              {files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => setSelectedFile(file)}
                  className={`flex flex-col gap-1 rounded-lg border border-white/10 px-3 py-2 text-left text-sm transition-shadow ${
                    selectedFile?.id === file.id
                      ? "border-amber-300 shadow-[0_0_20px_rgba(217,176,106,0.25)]"
                      : "hover:border-white/30"
                  }`}
                >
                  <span className="font-medium text-white/90">{file.name}</span>
                  <span className="text-[11px] text-white/40">{file.type}</span>
                </button>
              ))}
              {files.length === 0 && (
                <p className="text-xs text-white/40">No files in this folder.</p>
              )}
            </div>
          </div>
        </section>

        <section className="flex h-36 min-h-35 flex-col gap-2 rounded-lg border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/40">
            <span>Preview</span>
            <span>{selectedFile ? selectedFile.name : "No file selected"}</span>
          </div>
          <div className="flex-1 overflow-auto rounded-md border border-white/10 bg-black/40 p-3 text-sm text-white/70">
            {selectedFile ? (
              <pre className="whitespace-pre-wrap text-[13px] leading-5">{selectedFile.content}</pre>
            ) : (
              <p className="text-[12px] text-white/40">Select a file to preview its contents.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
