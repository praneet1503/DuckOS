/* ══════════════════════════════════════════════════════════════
   QuackAPI — useCollections Hook
   ────────────────────────────────────────────────────────────
   Manages collections state. Async-loads from VFS on mount.
   ══════════════════════════════════════════════════════════ */

"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type { Collection, RequestItem } from "../types";
import {
  listCollections,
  createCollection as createCollectionInVFS,
  deleteCollection as deleteCollectionFromVFS,
  renameCollection as renameCollectionInVFS,
  addRequestToCollection,
  updateRequestInCollection,
  deleteRequestFromCollection,
} from "../storage/collectionsStore";

// we bundle a small starter set of endpoints so people can hit something right away
import { quickStartCollection } from "../examples"; // examples.ts lives next to hooks

// Guard to avoid double-seeding during React StrictMode or multiple mounts.
// Module-level flag persists across component mounts in the same session.
let quickStartSeeded = false;

import {
  exportCollection,
  importCollectionFromFile,
} from "../services/importExport";

export interface CollectionsState {
  collections: Collection[];
  isLoaded: boolean;
  expandedIds: Set<string>;
}

export interface CollectionsActions {
  refresh: () => Promise<void>;
  createCollection: (name: string) => Promise<Collection>;
  deleteCollection: (id: string) => Promise<void>;
  renameCollection: (id: string, newName: string) => Promise<void>;
  toggleExpanded: (id: string) => void;
  addRequest: (
    collectionId: string,
    request: Omit<RequestItem, "id" | "createdAt" | "updatedAt">
  ) => Promise<RequestItem | null>;
  updateRequest: (
    collectionId: string,
    requestId: string,
    updates: Partial<Omit<RequestItem, "id" | "createdAt">>
  ) => Promise<void>;
  deleteRequest: (collectionId: string, requestId: string) => Promise<void>;
  exportCollection: (collection: Collection) => void;
  importCollection: (file: File) => Promise<Collection>;
}

export type UseCollectionsReturn = CollectionsState & CollectionsActions;

export function useCollections(): UseCollectionsReturn {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // ── Load on mount ───────────────────────────────────────

  const refresh = useCallback(async () => {
    let result = await listCollections();

    // if the user has no collections yet, populate with a quick‑start template
    // Use a module-level guard to avoid double-seeding (React StrictMode may mount twice).
    if (result.length === 0 && !quickStartSeeded) {
      quickStartSeeded = true;

      // Double-check by name to be extra safe in concurrent scenarios
      const existsByName = result.find((c) => c.name === quickStartCollection.name);
      if (!existsByName) {
        const seeded = await createCollectionInVFS(quickStartCollection.name);
        for (const req of quickStartCollection.requests) {
          const { id, createdAt, updatedAt, ...rest } = req;
          await addRequestToCollection(seeded.id, rest);
        }
      }

      result = await listCollections();
    }

    setCollections(result);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ── Collection CRUD ─────────────────────────────────────

  const create = useCallback(
    async (name: string): Promise<Collection> => {
      const collection = await createCollectionInVFS(name);
      await refresh();
      // Auto-expand newly created collection
      setExpandedIds((prev) => new Set(prev).add(collection.id));
      return collection;
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteCollectionFromVFS(id);
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await refresh();
    },
    [refresh]
  );

  const rename = useCallback(
    async (id: string, newName: string) => {
      await renameCollectionInVFS(id, newName);
      await refresh();
    },
    [refresh]
  );

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ── Request CRUD ────────────────────────────────────────

  const addReq = useCallback(
    async (
      collectionId: string,
      request: Omit<RequestItem, "id" | "createdAt" | "updatedAt">
    ): Promise<RequestItem | null> => {
      const item = await addRequestToCollection(collectionId, request);
      await refresh();
      return item;
    },
    [refresh]
  );

  const updateReq = useCallback(
    async (
      collectionId: string,
      requestId: string,
      updates: Partial<Omit<RequestItem, "id" | "createdAt">>
    ) => {
      await updateRequestInCollection(collectionId, requestId, updates);
      await refresh();
    },
    [refresh]
  );

  const deleteReq = useCallback(
    async (collectionId: string, requestId: string) => {
      await deleteRequestFromCollection(collectionId, requestId);
      await refresh();
    },
    [refresh]
  );

  // ── Import / Export ─────────────────────────────────────

  const doExport = useCallback((collection: Collection) => {
    exportCollection(collection);
  }, []);

  const doImport = useCallback(
    async (file: File): Promise<Collection> => {
      const collection = await importCollectionFromFile(file);
      await refresh();
      return collection;
    },
    [refresh]
  );

  // ── Return ──────────────────────────────────────────────

  return useMemo(
    () => ({
      collections,
      isLoaded,
      expandedIds,
      refresh,
      createCollection: create,
      deleteCollection: remove,
      renameCollection: rename,
      toggleExpanded,
      addRequest: addReq,
      updateRequest: updateReq,
      deleteRequest: deleteReq,
      exportCollection: doExport,
      importCollection: doImport,
    }),
    [
      collections,
      isLoaded,
      expandedIds,
      refresh,
      create,
      remove,
      rename,
      toggleExpanded,
      addReq,
      updateReq,
      deleteReq,
      doExport,
      doImport,
    ]
  );
}
