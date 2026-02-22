/**
 * QuackCode — type definitions
 *
 * Shared types for the code editor app.
 * Designed for extensibility (future: diagnostics, git, preview pane).
 */

/* ── Tab model ────────────────────────────────────────────── */

export interface EditorTab {
  /** Unique runtime id (path-based, deduplicated) */
  id: string;
  /** Absolute VFS path, e.g. "/home/notes/hello.ts" */
  path: string;
  /** Display name (basename of path) */
  name: string;
  /** In-memory content (may diverge from disk) */
  content: string;
  /** True when in-memory content differs from last save */
  isDirty: boolean;
  /** Language id for Monaco, e.g. "typescript" */
  language: string;
}

/* ── Cursor / status ──────────────────────────────────────── */

export interface CursorPosition {
  line: number;
  column: number;
}

/* ── Extension → language map ─────────────────────────────── */

const EXT_MAP: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  py: "python",
  json: "json",
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  less: "less",
  md: "markdown",
  yaml: "yaml",
  yml: "yaml",
  xml: "xml",
  svg: "xml",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  sql: "sql",
  graphql: "graphql",
  dockerfile: "dockerfile",
  rs: "rust",
  go: "go",
  java: "java",
  kt: "kotlin",
  c: "c",
  cpp: "cpp",
  h: "c",
  hpp: "cpp",
  rb: "ruby",
  php: "php",
  swift: "swift",
  lua: "lua",
  toml: "ini",
  ini: "ini",
  env: "ini",
  txt: "plaintext",
};

/**
 * Detect Monaco language id from a file name / path.
 */
export function detectLanguage(nameOrPath: string): string {
  const name = nameOrPath.split("/").pop() ?? nameOrPath;

  // Special filenames
  const lower = name.toLowerCase();
  if (lower === "dockerfile") return "dockerfile";
  if (lower === "makefile") return "plaintext";
  if (lower === ".gitignore" || lower === ".env") return "ini";

  const ext = name.includes(".") ? name.split(".").pop()?.toLowerCase() : undefined;
  if (ext && ext in EXT_MAP) return EXT_MAP[ext];
  return "plaintext";
}

/**
 * Derive a stable tab id from a VFS path.
 */
export function tabIdFromPath(path: string): string {
  return `qc:${path}`;
}

/* ── Future extension hooks (stubs) ───────────────────────── */

/** Placeholder for diagnostics integration */
export interface DiagnosticEntry {
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning" | "info" | "hint";
}

/** Placeholder for preview pane config */
export interface PreviewConfig {
  enabled: boolean;
  type: "html" | "markdown" | "none";
}
