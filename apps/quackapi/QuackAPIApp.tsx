/* ══════════════════════════════════════════════════════════════
   QuackAPI — Main Application Component
   ────────────────────────────────────────────────────────────
   Root component rendered inside DuckOS window.
   3-panel layout: Sidebar | Request Builder | Response Viewer
   ══════════════════════════════════════════════════════════ */

"use client";

import { useState, useCallback } from "react";
import { useRequest } from "./hooks/useRequest";
import { useCollections } from "./hooks/useCollections";
import TopBar from "./components/TopBar";
import RequestTabsSection from "./components/RequestTabsSection";
import ResponseViewer from "./components/ResponseViewer";
import CollectionsSidebar from "./components/CollectionsSidebar";
import SaveModal from "./components/SaveModal";
import type { RequestItem } from "./types";

export default function QuackAPIApp() {
  const request = useRequest();
  const collections = useCollections();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [sidebarWidth] = useState(220);

  // ── Save flow ─────────────────────────────────────────

  const handleSaveClick = useCallback(() => {
    setShowSaveModal(true);
  }, []);

  const handleSaveRequest = useCallback(
    async (
      collectionId: string,
      name: string,
      isUpdate: boolean,
      requestId: string | null
    ) => {
      const config = request.getRequestConfig();

      if (isUpdate && requestId) {
        await collections.updateRequest(collectionId, requestId, {
          name,
          method: config.method,
          url: config.url,
          headers: config.headers,
          params: config.params,
          body: config.body,
        });
      } else {
        const item = await collections.addRequest(collectionId, {
          name,
          method: config.method,
          url: config.url,
          headers: config.headers,
          params: config.params,
          body: config.body,
        });
        if (item) {
          // Track that this request is now saved
          request.loadFromRequestItem(item, collectionId);
        }
      }

      setShowSaveModal(false);
    },
    [request, collections]
  );

  const handleSelectRequest = useCallback(
    (item: RequestItem, collectionId: string) => {
      request.loadFromRequestItem(item, collectionId);
    },
    [request]
  );

  const handleCreateCollectionFromModal = useCallback(
    async (name: string) => {
      return collections.createCollection(name);
    },
    [collections]
  );

  return (
    <div className="flex h-full w-full bg-[#0e1117] text-[var(--os-text-primary)] overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <div className="shrink-0" style={{ width: sidebarWidth }}>
        <CollectionsSidebar
          collections={collections}
          onSelectRequest={handleSelectRequest}
          activeRequestId={request.loadedRequestId}
        />
      </div>

      {/* ── Main Content ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Top Bar */}
        <TopBar
          method={request.method}
          url={request.url}
          urlValid={request.urlValid}
          isLoading={request.isLoading}
          onMethodChange={request.setMethod}
          onUrlChange={request.setUrl}
          onSend={request.execute}
          onSave={handleSaveClick}
        />

        {/* Split: Request Builder (top) | Response (bottom) */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Request section — takes ~40% space */}
          <div className="flex flex-col border-b border-[var(--os-border)]"
            style={{ height: "40%", minHeight: 140 }}
          >
            <RequestTabsSection
              activeTab={request.activeRequestTab}
              onTabChange={request.setActiveRequestTab}
              params={request.params}
              onAddParam={request.addParam}
              onRemoveParam={request.removeParam}
              onUpdateParam={request.updateParam}
              onToggleParam={request.toggleParam}
              headers={request.headers}
              onAddHeader={request.addHeader}
              onRemoveHeader={request.removeHeader}
              onUpdateHeader={request.updateHeader}
              onToggleHeader={request.toggleHeader}
              body={request.body}
              bodyValid={request.bodyValid}
              onBodyChange={request.setBody}
            />
          </div>

          {/* Response section — takes ~60% space */}
          <div className="flex-1 min-h-0">
            <ResponseViewer
              response={request.response}
              error={request.error}
              isLoading={request.isLoading}
            />
          </div>
        </div>
      </div>

      {/* ── Save Modal ──────────────────────────────────── */}
      {showSaveModal && (
        <SaveModal
          collections={collections.collections}
          currentConfig={request.getRequestConfig()}
          preSelectedCollectionId={request.loadedCollectionId}
          preSelectedRequestId={request.loadedRequestId}
          onSave={handleSaveRequest}
          onCreateCollection={handleCreateCollectionFromModal}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}
