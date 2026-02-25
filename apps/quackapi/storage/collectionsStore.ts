/* ══════════════════════════════════════════════════════════════
   QuackAPI — Collections Storage Layer
   ────────────────────────────────────────────────────────────
   Persists collections as JSON files in the DuckOS VFS.
   Path: /home/quackapi/collections/{collection-name}.json
   Integrates with Burrow file browser.
   ══════════════════════════════════════════════════════════ */

import {
  initFileSystem,
  getNodeByPath,
  createFolder,
  listDirectory,
  readFile,
  writeFile,
  deleteNode,
} from "@/core/vfs";
import { COLLECTIONS_DIR, QUACKAPI_HOME } from "../manifest";
import type { Collection, RequestItem, KeyValueEntry } from "../types";

function uid(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Ensure the collections directory exists in VFS.
 */
export async function initCollectionsDir(): Promise<void> {
  await initFileSystem();

  const homeNode = await getNodeByPath(QUACKAPI_HOME);
  if (!homeNode) {
    await createFolder(QUACKAPI_HOME);
  }

  const collectionsNode = await getNodeByPath(COLLECTIONS_DIR);
  if (!collectionsNode) {
    await createFolder(COLLECTIONS_DIR);
  }
}

/**
 * Sanitize a collection name for use as a filename.
 */
function toFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 60);
}

/**
 * Build a file path for a collection.
 */
function collectionPath(collection: Collection): string {
  return `${COLLECTIONS_DIR}/${collection.id}.json`;
}

/**
 * List all collections from VFS.
 */
export async function listCollections(): Promise<Collection[]> {
  await initCollectionsDir();

  try {
    const children = await listDirectory(COLLECTIONS_DIR);
    const collections: Collection[] = [];

    for (const child of children) {
      if (child.type === "file" && child.name.endsWith(".json")) {
        try {
          const content = await readFile(`${COLLECTIONS_DIR}/${child.name}`);
          const parsed = JSON.parse(content) as Collection;
          if (isValidCollection(parsed)) {
            collections.push(parsed);
          }
        } catch {
          // Skip malformed files
        }
      }
    }

    // Sort by updatedAt desc
    collections.sort((a, b) => b.updatedAt - a.updatedAt);
    return collections;
  } catch {
    return [];
  }
}

/**
 * Load a specific collection by ID.
 */
export async function loadCollection(id: string): Promise<Collection | null> {
  try {
    const content = await readFile(`${COLLECTIONS_DIR}/${id}.json`);
    const parsed = JSON.parse(content) as Collection;
    return isValidCollection(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Save (create or update) a collection.
 */
export async function saveCollection(collection: Collection): Promise<void> {
  await initCollectionsDir();
  const path = collectionPath(collection);
  await writeFile(path, JSON.stringify(collection, null, 2));
}

/**
 * Create a new empty collection.
 */
export async function createCollection(name: string): Promise<Collection> {
  const now = Date.now();
  const collection: Collection = {
    id: uid(),
    name,
    createdAt: now,
    updatedAt: now,
    requests: [],
  };
  await saveCollection(collection);
  return collection;
}

/**
 * Delete a collection from VFS.
 */
export async function deleteCollection(id: string): Promise<void> {
  try {
    await deleteNode(`${COLLECTIONS_DIR}/${id}.json`);
  } catch {
    // Already deleted or not found
  }
}

/**
 * Rename a collection.
 */
export async function renameCollection(
  id: string,
  newName: string
): Promise<Collection | null> {
  const collection = await loadCollection(id);
  if (!collection) return null;

  collection.name = newName;
  collection.updatedAt = Date.now();
  await saveCollection(collection);
  return collection;
}

/**
 * Add a request to a collection.
 */
export async function addRequestToCollection(
  collectionId: string,
  request: Omit<RequestItem, "id" | "createdAt" | "updatedAt">
): Promise<RequestItem | null> {
  const collection = await loadCollection(collectionId);
  if (!collection) return null;

  const now = Date.now();
  const item: RequestItem = {
    ...request,
    id: uid(),
    createdAt: now,
    updatedAt: now,
  };

  collection.requests.push(item);
  collection.updatedAt = now;
  await saveCollection(collection);
  return item;
}

/**
 * Update a request within a collection.
 */
export async function updateRequestInCollection(
  collectionId: string,
  requestId: string,
  updates: Partial<Omit<RequestItem, "id" | "createdAt">>
): Promise<RequestItem | null> {
  const collection = await loadCollection(collectionId);
  if (!collection) return null;

  const idx = collection.requests.findIndex((r) => r.id === requestId);
  if (idx === -1) return null;

  collection.requests[idx] = {
    ...collection.requests[idx],
    ...updates,
    updatedAt: Date.now(),
  };
  collection.updatedAt = Date.now();
  await saveCollection(collection);
  return collection.requests[idx];
}

/**
 * Delete a request from a collection.
 */
export async function deleteRequestFromCollection(
  collectionId: string,
  requestId: string
): Promise<boolean> {
  const collection = await loadCollection(collectionId);
  if (!collection) return false;

  const len = collection.requests.length;
  collection.requests = collection.requests.filter((r) => r.id !== requestId);
  if (collection.requests.length === len) return false;

  collection.updatedAt = Date.now();
  await saveCollection(collection);
  return true;
}

// ── Validation ──────────────────────────────────────────────

function isValidCollection(obj: unknown): obj is Collection {
  if (!obj || typeof obj !== "object") return false;
  const c = obj as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    typeof c.name === "string" &&
    typeof c.createdAt === "number" &&
    typeof c.updatedAt === "number" &&
    Array.isArray(c.requests)
  );
}

/**
 * Validate an imported collection structure.
 * Returns a sanitized collection with new IDs.
 */
export function validateAndSanitizeImport(raw: unknown): Collection {
  if (!isValidCollection(raw)) {
    throw new Error("Invalid collection format");
  }

  const now = Date.now();
  return {
    id: uid(),
    name: raw.name,
    createdAt: now,
    updatedAt: now,
    requests: raw.requests.map((r) => ({
      ...r,
      id: uid(),
      createdAt: now,
      updatedAt: now,
    })),
  };
}
