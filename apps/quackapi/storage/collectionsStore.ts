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

    // Deduplicate collections by normalized name. If multiple collections
    // share the same name, merge their requests into the most recently
    // updated collection and delete the duplicates. This keeps the VFS
    // idempotent and avoids duplicate "Quick Start" entries.
    const normalizedMap = new Map<string, Collection[]>();
    for (const c of collections) {
      const key = c.name.trim().toLowerCase();
      const arr = normalizedMap.get(key) ?? [];
      arr.push(c);
      normalizedMap.set(key, arr);
    }

    const result: Collection[] = [];

    for (const [_, group] of normalizedMap) {
      if (group.length === 1) {
        result.push(group[0]);
        continue;
      }

      // Multiple collections with the same name — choose the newest as primary
      group.sort((a, b) => b.updatedAt - a.updatedAt);
      const primary = group[0];

      // Build a set of existing request signatures to avoid duplicates
      const sig = (r: RequestItem) => `${r.method}::${r.url}::${(r.name || "").trim()}`;
      const existing = new Set(primary.requests.map(sig));

      // Merge requests from older copies
      for (let i = 1; i < group.length; i++) {
        const donor = group[i];
        for (const req of donor.requests) {
          if (!existing.has(sig(req))) {
            primary.requests.push(req);
            existing.add(sig(req));
          }
        }
      }

      // Update timestamps and persist merged primary
      primary.updatedAt = Date.now();
      try {
        await saveCollection(primary);
      } catch {
        // ignore save errors — we'll still try to remove duplicates
      }

      // Delete the older duplicated files
      for (let i = 1; i < group.length; i++) {
        const dup = group[i];
        try {
          await deleteNode(`${COLLECTIONS_DIR}/${dup.id}.json`);
        } catch {
          // ignore delete errors
        }
      }

      result.push(primary);
    }

    // Ensure final sort
    result.sort((a, b) => b.updatedAt - a.updatedAt);

      // Migration: replace legacy OpenWeather or direct WeatherAPI requests
      // with our server-side proxy (`/api/weather/current`). This ensures the
      // client never calls the third-party API directly (avoids CORS/401).
      const openWeatherHost = "openweathermap.org";
      const directWeatherApiHost = "api.weatherapi.com";
      const proxyPath = "/api/weather/current";

      for (const col of result) {
        let changed = false;
        for (let i = 0; i < col.requests.length; i++) {
          const r = col.requests[i];
          if (typeof r.url !== "string") continue;

          const isOpenWeather = r.url.includes(openWeatherHost);
          const isDirectWeatherApi = r.url.includes(directWeatherApiHost);

          if (!isOpenWeather && !isDirectWeatherApi) continue;

          // Extract q/units or query string from params or from URL
          let q = "London";
          let aqi = "no";

          // Prefer params array if present
          if (Array.isArray((r as any).params)) {
            for (const p of (r as any).params as KeyValueEntry[]) {
              if (p.key === "q") q = p.value || q;
              if (p.key === "aqi") aqi = p.value || aqi;
              if (p.key === "units") {
                // convert units to nothing — WeatherAPI returns standard units
              }
            }
          } else {
            try {
              const u = new URL(r.url);
              if (u.searchParams.get("q")) q = u.searchParams.get("q") || q;
              if (u.searchParams.get("aqi")) aqi = u.searchParams.get("aqi") || aqi;
              if (u.searchParams.get("units")) {
                // ignore units param
              }
            } catch {
              // ignore URL parse errors
            }
          }

          // Build migrated request to point at proxy
          const newParams: KeyValueEntry[] = [
            { id: uid(), key: "q", value: q, enabled: true },
            { id: uid(), key: "aqi", value: aqi, enabled: true },
          ];

          const migrated: RequestItem = {
            ...r,
            id: uid(),
            name: r.name?.includes("weather") ? r.name : `Weather: ${q}`,
            method: "GET",
            url: proxyPath,
            headers: [{ id: uid(), key: "Accept", value: "application/json", enabled: true }],
            params: newParams,
            body: "",
            createdAt: r.createdAt || Date.now(),
            updatedAt: Date.now(),
          };

          col.requests[i] = migrated;
          changed = true;
        }

        if (changed) {
          col.updatedAt = Date.now();
          try {
            await saveCollection(col);
          } catch {
            // best-effort
          }
        }
      }

      return result;
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
