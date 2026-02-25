/* ══════════════════════════════════════════════════════════════
   QuackAPI — Request Tabs Section
   ────────────────────────────────────────────────────────────
   Tabs: Params | Headers | Body
   Renders the appropriate editor panel below.
   ══════════════════════════════════════════════════════════ */

"use client";

import { memo, useMemo } from "react";
import type { RequestTab, KeyValueEntry } from "../types";
import { QATabs, QAKeyValueTable } from "./ui";
import BodyEditor from "./BodyEditor";

interface RequestTabsSectionProps {
  activeTab: RequestTab;
  onTabChange: (tab: RequestTab) => void;
  // Params
  params: KeyValueEntry[];
  onAddParam: () => void;
  onRemoveParam: (id: string) => void;
  onUpdateParam: (id: string, field: "key" | "value", value: string) => void;
  onToggleParam: (id: string) => void;
  // Headers
  headers: KeyValueEntry[];
  onAddHeader: () => void;
  onRemoveHeader: (id: string) => void;
  onUpdateHeader: (id: string, field: "key" | "value", value: string) => void;
  onToggleHeader: (id: string) => void;
  // Body
  body: string;
  bodyValid: boolean;
  onBodyChange: (body: string) => void;
}

function RequestTabsSection({
  activeTab,
  onTabChange,
  params,
  onAddParam,
  onRemoveParam,
  onUpdateParam,
  onToggleParam,
  headers,
  onAddHeader,
  onRemoveHeader,
  onUpdateHeader,
  onToggleHeader,
  body,
  bodyValid,
  onBodyChange,
}: RequestTabsSectionProps) {
  const tabs = useMemo(
    () => [
      {
        id: "params" as const,
        label: "Params",
        count: params.filter((p) => p.enabled && p.key.trim()).length,
      },
      {
        id: "headers" as const,
        label: "Headers",
        count: headers.filter((h) => h.enabled && h.key.trim()).length,
      },
      {
        id: "body" as const,
        label: "Body",
      },
    ],
    [params, headers]
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <QATabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => onTabChange(id as RequestTab)}
      />

      <div className="flex-1 overflow-auto p-2 min-h-0">
        {activeTab === "params" && (
          <QAKeyValueTable
            entries={params}
            onAdd={onAddParam}
            onRemove={onRemoveParam}
            onUpdate={onUpdateParam}
            onToggle={onToggleParam}
            keyPlaceholder="Parameter"
            valuePlaceholder="Value"
          />
        )}
        {activeTab === "headers" && (
          <QAKeyValueTable
            entries={headers}
            onAdd={onAddHeader}
            onRemove={onRemoveHeader}
            onUpdate={onUpdateHeader}
            onToggle={onToggleHeader}
            keyPlaceholder="Header"
            valuePlaceholder="Value"
          />
        )}
        {activeTab === "body" && (
          <div className="h-full min-h-[120px]">
            <BodyEditor
              value={body}
              onChange={onBodyChange}
              isValid={bodyValid}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(RequestTabsSection);
