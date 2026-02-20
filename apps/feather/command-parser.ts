import {
  initFileSystem,
  listDirectory,
  createFile,
  createFolder,
  readFile,
  deleteNode,
  moveNode,
  getNodeByPath,
  type FileNode,
} from "@/core/vfs";

export type TerminalLinePayload = {
  type: "output" | "error";
  content: string;
};

export type CommandResponse = {
  lines: TerminalLinePayload[];
  clear?: boolean;
  openAppId?: string;
  /** target window id to close */
  closeWindowId?: string;
  /** target app id to close all windows for */
  closeAppId?: string;
  /** If set, caller should update its currentPath */
  newPath?: string;
};

export type CommandContext = {
  // list of open windows including ids and their app identity
  openWindows: { id: string; appId: string }[];
  openWindowsCount: number;
  focusedWindowId: string | null;
  currentPath: string;
};

/** Normalise a path relative to cwd */
function resolve(cwd: string, target: string): string {
  if (target.startsWith("/")) return normalisePath(target);
  const parts = cwd.split("/").filter(Boolean);
  for (const seg of target.split("/")) {
    if (seg === "..") parts.pop();
    else if (seg !== "." && seg !== "") parts.push(seg);
  }
  return "/" + parts.join("/") || "/";
}

function normalisePath(p: string): string {
  let out = p.replace(/\/+/g, "/");
  if (!out.startsWith("/")) out = "/" + out;
  if (out.length > 1 && out.endsWith("/")) out = out.slice(0, -1);
  return out;
}

const HELP_TEXT = [
  "Available commands:",
  "",
  "  help          — show this help text",
  "  clear         — clear the terminal",
  "  echo [text]   — repeat text",
  "  system        — show window metadata",
  "  open [app]    — launch an app",
  "  close [id]    — close window or app",
  "",
  "  pwd           — print working directory",
  "  ls [path]     — list directory",
  "  cd [path]     — change directory",
  "  mkdir [name]  — create a folder",
  "  touch [name]  — create a file",
  "  cat [file]    — print file contents",
  "  rm [path]     — delete file or folder",
  "  mv [src] [dst]— move / rename",
];

export async function parseCommand(
  input: string,
  context: CommandContext
): Promise<CommandResponse> {
  const trimmed = input.trim();
  if (!trimmed) return { lines: [] };

  const [command, ...args] = trimmed.split(/\s+/);
  const lower = command.toLowerCase();
  const cwd = context.currentPath;

  // ── built-in commands ──

  if (lower === "help") {
    return { lines: HELP_TEXT.map((l) => ({ type: "output", content: l })) };
  }

  if (lower === "clear") {
    return { lines: [], clear: true };
  }

  if (lower === "echo") {
    return { lines: [{ type: "output", content: args.join(" ") }] };
  }

  if (lower === "system") {
    return {
      lines: [
        { type: "output", content: `open windows: ${context.openWindowsCount}` },
        { type: "output", content: `focused window: ${context.focusedWindowId ?? "none"}` },
      ],
    };
  }

  if (lower === "open") {
    const target = args[0]?.toLowerCase();
    const valid = ["pond", "nest", "feather", "flight", "echo", "burrow", "quill", "lens"];
    if (target && valid.includes(target)) {
      return {
        lines: [{ type: "output", content: `Opening ${target.charAt(0).toUpperCase() + target.slice(1)}…` }],
        openAppId: target,
      };
    }
    return {
      lines: [{ type: "error", content: `Unknown app: ${args[0] ?? "?"}. Available: ${valid.join(", ")}` }],
    };
  }

  if (lower === "close") {
    const target = args[0];
    if (!target) {
      return { lines: [{ type: "error", content: "Usage: close <windowId|appId|all>" }] };
    }

    // special 'all' keyword
    if (target === "all") {
      return { lines: [{ type: "output", content: "Closing all…" }], closeAppId: "all" };
    }

    // look for exact window id
    const win = context.openWindows.find((w) => w.id === target);
    if (win) {
      return { lines: [{ type: "output", content: `Closing window ${target}…` }], closeWindowId: target };
    }

    // look for open windows matching an app
    const matches = context.openWindows.filter((w) => w.appId === target);
    if (matches.length > 0) {
      return { lines: [{ type: "output", content: `Closing app ${target}…` }], closeAppId: target };
    }

    return { lines: [{ type: "error", content: `No such window or app: ${target}` }] };
  }

  // ── VFS commands ──

  if (lower === "pwd") {
    return { lines: [{ type: "output", content: cwd }] };
  }

  if (lower === "ls") {
    const target = args[0] ? resolve(cwd, args[0]) : cwd;
    try {
      const items = await listDirectory(target);
      if (items.length === 0) {
        return { lines: [{ type: "output", content: "(empty)" }] };
      }
      const lines: TerminalLinePayload[] = items.map((item) => ({
        type: "output" as const,
        content: `${item.type === "folder" ? "📁" : "📄"} ${item.name}`,
      }));
      return { lines };
    } catch (e: any) {
      return { lines: [{ type: "error", content: e.message }] };
    }
  }

  if (lower === "cd") {
    if (!args[0]) return { lines: [], newPath: "/home" };
    const target = resolve(cwd, args[0]);
    try {
      const node = await getNodeByPath(target);
      if (!node) return { lines: [{ type: "error", content: `Not found: ${target}` }] };
      if (node.type !== "folder") return { lines: [{ type: "error", content: `Not a directory: ${target}` }] };
      return { lines: [], newPath: target };
    } catch (e: any) {
      return { lines: [{ type: "error", content: e.message }] };
    }
  }

  if (lower === "mkdir") {
    if (!args[0]) return { lines: [{ type: "error", content: "Usage: mkdir <name>" }] };
    const target = resolve(cwd, args[0]);
    try {
      await createFolder(target);
      return { lines: [{ type: "output", content: `Created folder: ${target}` }] };
    } catch (e: any) {
      return { lines: [{ type: "error", content: e.message }] };
    }
  }

  if (lower === "touch") {
    if (!args[0]) return { lines: [{ type: "error", content: "Usage: touch <name>" }] };
    const target = resolve(cwd, args[0]);
    try {
      await createFile(target, "");
      return { lines: [{ type: "output", content: `Created file: ${target}` }] };
    } catch (e: any) {
      return { lines: [{ type: "error", content: e.message }] };
    }
  }

  if (lower === "cat") {
    if (!args[0]) return { lines: [{ type: "error", content: "Usage: cat <file>" }] };
    const target = resolve(cwd, args[0]);
    try {
      const content = await readFile(target);
      return {
        lines: content.split("\n").map((l) => ({ type: "output" as const, content: l })),
      };
    } catch (e: any) {
      return { lines: [{ type: "error", content: e.message }] };
    }
  }

  if (lower === "rm") {
    if (!args[0]) return { lines: [{ type: "error", content: "Usage: rm <path>" }] };
    const target = resolve(cwd, args[0]);
    try {
      await deleteNode(target);
      return { lines: [{ type: "output", content: `Deleted: ${target}` }] };
    } catch (e: any) {
      return { lines: [{ type: "error", content: e.message }] };
    }
  }

  if (lower === "mv") {
    if (args.length < 2) return { lines: [{ type: "error", content: "Usage: mv <source> <dest>" }] };
    const src = resolve(cwd, args[0]);
    const dst = resolve(cwd, args[1]);
    try {
      await moveNode(src, dst);
      return { lines: [{ type: "output", content: `Moved: ${src} → ${dst}` }] };
    } catch (e: any) {
      return { lines: [{ type: "error", content: e.message }] };
    }
  }

  return {
    lines: [{ type: "error", content: `Command not found: ${command}. Type "help" for available commands.` }],
  };
}
