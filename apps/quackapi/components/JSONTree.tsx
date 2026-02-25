/* ══════════════════════════════════════════════════════════════
   QuackAPI — Collapsible JSON Tree Viewer
   ────────────────────────────────────────────────────────────
   Custom React tree component for displaying JSON responses.
   No external dependencies. Fully keyboard-navigable.
   ══════════════════════════════════════════════════════════ */

"use client";

import { memo, useState, useCallback } from "react";

const MAX_DEPTH = 20;
const INDENT = 16;

interface JSONTreeProps {
  data: unknown;
  className?: string;
}

function JSONTree({ data, className = "" }: JSONTreeProps) {
  return (
    <div
      className={`font-mono text-[12px] leading-[1.65] select-text overflow-auto ${className}`}
    >
      <JSONNode value={data} depth={0} keyName={undefined} isLast />
    </div>
  );
}

// ── Node renderer ───────────────────────────────────────────

interface JSONNodeProps {
  value: unknown;
  depth: number;
  keyName: string | undefined;
  isLast: boolean;
}

const JSONNode = memo(function JSONNode({
  value,
  depth,
  keyName,
  isLast,
}: JSONNodeProps) {
  const [collapsed, setCollapsed] = useState(depth > 3);
  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  const comma = isLast ? "" : ",";

  // Primitives
  if (value === null) return <PrimitiveLine keyName={keyName} depth={depth} comma={comma}><span className="text-purple-400">null</span></PrimitiveLine>;
  if (typeof value === "boolean") return <PrimitiveLine keyName={keyName} depth={depth} comma={comma}><span className="text-purple-400">{String(value)}</span></PrimitiveLine>;
  if (typeof value === "number") return <PrimitiveLine keyName={keyName} depth={depth} comma={comma}><span className="text-amber-400">{String(value)}</span></PrimitiveLine>;
  if (typeof value === "string") return <PrimitiveLine keyName={keyName} depth={depth} comma={comma}><span className="text-emerald-400">&quot;{escapeString(value)}&quot;</span></PrimitiveLine>;

  // Depth guard
  if (depth >= MAX_DEPTH) {
    return (
      <PrimitiveLine keyName={keyName} depth={depth} comma={comma}>
        <span className="text-[var(--os-text-secondary)] italic">…</span>
      </PrimitiveLine>
    );
  }

  // Objects and Arrays
  const isArray = Array.isArray(value);
  const entries = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>);
  const bracketOpen = isArray ? "[" : "{";
  const bracketClose = isArray ? "]" : "}";
  const count = entries.length;

  if (count === 0) {
    return (
      <PrimitiveLine keyName={keyName} depth={depth} comma={comma}>
        <span className="text-[var(--os-text-secondary)]">
          {bracketOpen}{bracketClose}
        </span>
      </PrimitiveLine>
    );
  }

  return (
    <div>
      {/* Opening line */}
      <div
        style={{ paddingLeft: depth * INDENT }}
        className="flex items-start hover:bg-white/[0.03] rounded-sm"
      >
        <button
          onClick={toggle}
          className="w-4 h-[1.65em] flex items-center justify-center
            text-[var(--os-text-secondary)] hover:text-[var(--os-text-primary)]
            cursor-pointer select-none shrink-0 transition-colors"
          aria-label={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? "▸" : "▾"}
        </button>
        {keyName !== undefined && (
          <span className="text-[#7eb6d6] mr-1">
            &quot;{keyName}&quot;<span className="text-[var(--os-text-secondary)]">: </span>
          </span>
        )}
        <span className="text-[var(--os-text-secondary)]">
          {bracketOpen}
        </span>
        {collapsed && (
          <>
            <span className="text-[var(--os-text-secondary)] mx-1 italic text-[11px]">
              {count} {count === 1 ? "item" : "items"}
            </span>
            <span className="text-[var(--os-text-secondary)]">
              {bracketClose}{comma}
            </span>
          </>
        )}
      </div>

      {/* Children */}
      {!collapsed && (
        <>
          {entries.map(([k, v], i) => (
            <JSONNode
              key={k}
              value={v}
              depth={depth + 1}
              keyName={isArray ? undefined : k}
              isLast={i === entries.length - 1}
            />
          ))}
          {/* Closing bracket */}
          <div
            style={{ paddingLeft: depth * INDENT + INDENT }}
            className="text-[var(--os-text-secondary)]"
          >
            {bracketClose}{comma}
          </div>
        </>
      )}
    </div>
  );
});

// ── Primitive value line ────────────────────────────────────

interface PrimitiveLineProps {
  keyName: string | undefined;
  depth: number;
  comma: string;
  children: React.ReactNode;
}

function PrimitiveLine({ keyName, depth, comma, children }: PrimitiveLineProps) {
  return (
    <div
      style={{ paddingLeft: depth * INDENT + INDENT }}
      className="flex items-start hover:bg-white/[0.03] rounded-sm"
    >
      {keyName !== undefined && (
        <span className="text-[#7eb6d6] mr-1 shrink-0">
          &quot;{keyName}&quot;<span className="text-[var(--os-text-secondary)]">: </span>
        </span>
      )}
      {children}
      <span className="text-[var(--os-text-secondary)]">{comma}</span>
    </div>
  );
}

// ── Utility ─────────────────────────────────────────────────

function escapeString(s: string): string {
  if (s.length > 500) return s.slice(0, 500) + "…";
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

export default memo(JSONTree);
