/* ══════════════════════════════════════════════════════════════
   QuackAPI — Response Viewer
   ────────────────────────────────────────────────────────────
   Status badge | Duration | Size
   Tabs: Pretty | Raw | Headers
   ══════════════════════════════════════════════════════════ */

"use client";

import { memo, useState, useMemo, lazy, Suspense } from "react";
import type { ExecutionResult, ExecutionError, ResponseTab } from "../types";
import { QATabs, QABadge } from "./ui";

// Lazy-load JSONTree for large payloads
const JSONTree = lazy(() => import("./JSONTree"));

interface ResponseViewerProps {
  response: ExecutionResult | null;
  error: ExecutionError | null;
  isLoading: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function ResponseViewer({ response, error, isLoading }: ResponseViewerProps) {
  const [activeTab, setActiveTab] = useState<ResponseTab>("pretty");

  const tabs = useMemo(
    () => [
      { id: "pretty" as const, label: "Pretty" },
      { id: "raw" as const, label: "Raw" },
      { id: "headers" as const, label: "Headers" },
    ],
    []
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--os-text-secondary)] text-[13px]">
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 16 16" fill="none">
            <circle
              cx="8" cy="8" r="6"
              stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeDasharray="28" strokeDashoffset="8"
            />
          </svg>
          Sending request…
        </span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 px-4">
        <div className="text-red-400 text-[13px] font-semibold">
          Request Failed
        </div>
        <div className="text-[var(--os-text-secondary)] text-[12px] text-center max-w-md">
          {error.message}
        </div>
        <div className="text-[10px] text-[var(--os-text-secondary)] mt-1 uppercase tracking-wider">
          {error.type}
        </div>
      </div>
    );
  }

  // Empty state
  if (!response) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--os-text-secondary)] text-[13px]">
        <span className="opacity-50">
          Send a request to see the response
        </span>
      </div>
    );
  }

  // Response view
  const headerEntries = Object.entries(response.headers);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Status bar */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-[var(--os-border)] shrink-0">
        <QABadge status={response.status} />
        <span className="text-[12px] text-[var(--os-text-secondary)]">
          {response.statusText}
        </span>
        <div className="flex-1" />
        <span className="text-[11px] text-[var(--os-text-secondary)] font-mono">
          {formatDuration(response.duration)}
        </span>
        <span className="text-[11px] text-[var(--os-text-secondary)] font-mono">
          {formatSize(response.size)}
        </span>
      </div>

      {/* Response tabs */}
      <QATabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as ResponseTab)}
      />

      {/* Tab content */}
      <div className="flex-1 overflow-auto min-h-0">
        {activeTab === "pretty" && (
          <div className="p-3">
            {response.isJson ? (
              <Suspense
                fallback={
                  <div className="text-[var(--os-text-secondary)] text-[12px]">
                    Rendering…
                  </div>
                }
              >
                <JSONTree data={response.data} />
              </Suspense>
            ) : (
              <pre className="text-[12px] font-mono text-[var(--os-text-primary)] whitespace-pre-wrap break-all">
                {response.raw}
              </pre>
            )}
          </div>
        )}

        {activeTab === "raw" && (
          <pre className="p-3 text-[12px] font-mono text-[var(--os-text-primary)] whitespace-pre-wrap break-all select-text">
            {response.raw}
          </pre>
        )}

        {activeTab === "headers" && (
          <div className="p-3">
            {headerEntries.length === 0 ? (
              <div className="text-[var(--os-text-secondary)] text-[12px]">
                No response headers
              </div>
            ) : (
              <table className="w-full text-[12px]">
                <tbody>
                  {headerEntries.map(([key, val]) => (
                    <tr key={key} className="border-b border-[var(--os-border)] last:border-0">
                      <td className="py-1.5 pr-4 text-[#7eb6d6] font-mono font-medium whitespace-nowrap align-top">
                        {key}
                      </td>
                      <td className="py-1.5 text-[var(--os-text-primary)] font-mono break-all">
                        {val}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ResponseViewer);
