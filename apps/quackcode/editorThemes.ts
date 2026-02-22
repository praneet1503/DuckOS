/**
 * QuackCode — Monaco editor themes
 *
 * Custom "duck-dark" and "duck-light" themes that align with
 * the DuckOS design tokens (amber accent, teal accent).
 *
 * Themes are registered lazily when Monaco mounts for the first time.
 */

import type { editor } from "monaco-editor";

/* ── duck-dark ────────────────────────────────────────────── */

export const duckDarkTheme: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "", foreground: "d4d4d4", background: "0d1117" },
    { token: "comment", foreground: "6a737d", fontStyle: "italic" },
    { token: "keyword", foreground: "d9b06a" },           // --os-accent-amber
    { token: "string", foreground: "9ecbce" },
    { token: "number", foreground: "d9b06a" },
    { token: "type", foreground: "5eaeb5" },               // --os-accent-teal
    { token: "function", foreground: "dcdcaa" },
    { token: "variable", foreground: "9cdcfe" },
    { token: "constant", foreground: "d9b06a" },
    { token: "operator", foreground: "d4d4d4" },
    { token: "delimiter", foreground: "808080" },
    { token: "tag", foreground: "5eaeb5" },
    { token: "attribute.name", foreground: "9cdcfe" },
    { token: "attribute.value", foreground: "9ecbce" },
  ],
  colors: {
    "editor.background": "#0d1117",
    "editor.foreground": "#d4d4d4",
    "editor.lineHighlightBackground": "#161b22",
    "editor.selectionBackground": "#264f78",
    "editor.inactiveSelectionBackground": "#1a2332",
    "editorCursor.foreground": "#d9b06a",
    "editorWhitespace.foreground": "#2d333b",
    "editorIndentGuide.background": "#21262d",
    "editorIndentGuide.activeBackground": "#30363d",
    "editorLineNumber.foreground": "#484f58",
    "editorLineNumber.activeForeground": "#8b949e",
    "editor.selectionHighlightBackground": "#1a2332",
    "editorBracketMatch.background": "#1a2332",
    "editorBracketMatch.border": "#5eaeb5",
    "editorGutter.background": "#0d1117",
    "scrollbar.shadow": "#00000000",
    "scrollbarSlider.background": "#ffffff15",
    "scrollbarSlider.hoverBackground": "#ffffff25",
    "scrollbarSlider.activeBackground": "#ffffff30",
    "editorOverviewRuler.border": "#00000000",
    "minimap.background": "#0d1117",
  },
};

/* ── duck-light ───────────────────────────────────────────── */

export const duckLightTheme: editor.IStandaloneThemeData = {
  base: "vs",
  inherit: true,
  rules: [
    { token: "", foreground: "24292e", background: "ffffff" },
    { token: "comment", foreground: "6a737d", fontStyle: "italic" },
    { token: "keyword", foreground: "9a6e2e" },
    { token: "string", foreground: "3b7a7e" },
    { token: "number", foreground: "9a6e2e" },
    { token: "type", foreground: "3b7a7e" },
    { token: "function", foreground: "6f42c1" },
    { token: "variable", foreground: "005cc5" },
    { token: "constant", foreground: "9a6e2e" },
    { token: "operator", foreground: "24292e" },
    { token: "delimiter", foreground: "6a737d" },
    { token: "tag", foreground: "3b7a7e" },
    { token: "attribute.name", foreground: "005cc5" },
    { token: "attribute.value", foreground: "3b7a7e" },
  ],
  colors: {
    "editor.background": "#ffffff",
    "editor.foreground": "#24292e",
    "editor.lineHighlightBackground": "#f6f8fa",
    "editor.selectionBackground": "#0366d625",
    "editor.inactiveSelectionBackground": "#0366d610",
    "editorCursor.foreground": "#9a6e2e",
    "editorWhitespace.foreground": "#d1d5da",
    "editorIndentGuide.background": "#eff2f5",
    "editorIndentGuide.activeBackground": "#d1d5da",
    "editorLineNumber.foreground": "#babbbd",
    "editorLineNumber.activeForeground": "#6a737d",
    "editor.selectionHighlightBackground": "#0366d610",
    "editorBracketMatch.background": "#0366d615",
    "editorBracketMatch.border": "#3b7a7e",
    "editorGutter.background": "#ffffff",
    "scrollbar.shadow": "#00000000",
    "scrollbarSlider.background": "#00000015",
    "scrollbarSlider.hoverBackground": "#00000025",
    "scrollbarSlider.activeBackground": "#00000030",
    "editorOverviewRuler.border": "#00000000",
    "minimap.background": "#ffffff",
  },
};

/* ── Theme registration helper ────────────────────────────── */

let registered = false;

/**
 * Register both duck themes with Monaco's theme engine.
 * Safe to call multiple times — registers only once.
 */
export function registerDuckThemes(monaco: typeof import("monaco-editor")): void {
  if (registered) return;
  monaco.editor.defineTheme("duck-dark", duckDarkTheme);
  monaco.editor.defineTheme("duck-light", duckLightTheme);
  registered = true;
}

/**
 * Return the correct theme name for the current OS appearance.
 * DuckOS currently only has dark mode (html.dark), but this is
 * future-proof for a light mode toggle.
 */
export function getActiveThemeName(): "duck-dark" | "duck-light" {
  if (typeof window === "undefined") return "duck-dark";
  // Check the <html> class first (DuckOS uses class="dark")
  if (document.documentElement.classList.contains("dark")) return "duck-dark";
  // Fallback to media query
  if (window.matchMedia?.("(prefers-color-scheme: light)").matches) return "duck-light";
  return "duck-dark";
}
