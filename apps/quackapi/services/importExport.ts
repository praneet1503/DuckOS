/* ══════════════════════════════════════════════════════════════
   QuackAPI — Import / Export Service
   ────────────────────────────────────────────────────────────
   Handles collection export (download) and import (file read).
   Validates structure before importing.
   ══════════════════════════════════════════════════════════ */

import type { Collection } from "../types";
import {
  validateAndSanitizeImport,
  saveCollection,
} from "../storage/collectionsStore";

/**
 * Export a collection as a downloadable JSON file.
 */
export function exportCollection(collection: Collection): void {
  const json = JSON.stringify(collection, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${collection.name.replace(/[^a-zA-Z0-9 _-]/g, "")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import a collection from a File object.
 * Validates structure and assigns new IDs before saving.
 * Returns the imported collection or throws on failure.
 */
export async function importCollectionFromFile(
  file: File
): Promise<Collection> {
  const text = await file.text();
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("File is not valid JSON.");
  }

  const collection = validateAndSanitizeImport(parsed);
  await saveCollection(collection);
  return collection;
}

/**
 * Import a collection from a JSON string.
 * Returns the imported collection or throws on failure.
 */
export async function importCollectionFromString(
  json: string
): Promise<Collection> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("String is not valid JSON.");
  }

  const collection = validateAndSanitizeImport(parsed);
  await saveCollection(collection);
  return collection;
}
