/* ══════════════════════════════════════════════════════════════
   QuackAPI — Request Executor Service
   ────────────────────────────────────────────────────────────
   Pure function layer — no side effects, no state mutation.
   Accepts request config, returns structured result or error.
   ══════════════════════════════════════════════════════════ */

import type {
  HttpMethod,
  KeyValueEntry,
  ExecutionResult,
  ExecutionError,
} from "../types";

interface ExecuteParams {
  method: HttpMethod;
  url: string;
  headers: KeyValueEntry[];
  params: KeyValueEntry[];
  body: string;
}

const METHODS_WITH_BODY: HttpMethod[] = ["POST", "PUT", "PATCH"];

/**
 * Build final URL by merging query params into the base URL.
 * Respects any existing query string on the URL.
 */
function buildUrl(base: string, params: KeyValueEntry[]): string {
  const url = new URL(base);
  for (const p of params) {
    if (p.enabled && p.key.trim()) {
      url.searchParams.append(p.key.trim(), p.value);
    }
  }
  return url.toString();
}

/**
 * Build headers object from key-value entries.
 * Filters disabled entries and empty keys.
 */
function buildHeaders(entries: KeyValueEntry[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const h of entries) {
    if (h.enabled && h.key.trim()) {
      result[h.key.trim()] = h.value;
    }
  }
  return result;
}

/**
 * Parse response headers into a flat Record.
 */
function parseResponseHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

/**
 * Calculate approximate byte size of a string.
 */
function byteSize(str: string): number {
  return new Blob([str]).size;
}

/**
 * Classify an error into a structured error type.
 */
function classifyError(err: unknown): ExecutionError {
  if (err instanceof TypeError) {
    const msg = (err as Error).message.toLowerCase();
    if (msg.includes("failed to fetch") || msg.includes("network")) {
      return { type: "network", message: "Network error — check your connection or CORS policy." };
    }
    if (msg.includes("cors")) {
      return { type: "cors", message: "CORS error — the server does not allow this origin." };
    }
  }
  if (err instanceof DOMException && err.name === "AbortError") {
    return { type: "timeout", message: "Request timed out." };
  }
  return {
    type: "unknown",
    message: err instanceof Error ? err.message : "An unknown error occurred.",
  };
}

/**
 * Execute an HTTP request. Returns a structured result or throws an ExecutionError.
 *
 * This is the ONLY function that performs network I/O for QuackAPI.
 * No side effects — caller is responsible for state updates.
 */
export async function executeRequest(
  params: ExecuteParams
): Promise<ExecutionResult> {
  // Build final URL with merged params
  let finalUrl: string;
  try {
    finalUrl = buildUrl(params.url, params.params);
  } catch {
    throw { type: "unknown", message: "Invalid URL format." } as ExecutionError;
  }

  // Build headers
  const headers = buildHeaders(params.headers);

  // Auto-inject Content-Type for body methods if not already set
  const hasContentType = Object.keys(headers).some(
    (k) => k.toLowerCase() === "content-type"
  );
  if (METHODS_WITH_BODY.includes(params.method) && params.body.trim() && !hasContentType) {
    headers["Content-Type"] = "application/json";
  }

  // Build body
  const body = METHODS_WITH_BODY.includes(params.method) && params.body.trim()
    ? params.body
    : undefined;

  // Execute with timing
  const startTime = performance.now();

  let response: Response;
  try {
    response = await fetch(finalUrl, {
      method: params.method,
      headers,
      body,
    });
  } catch (err) {
    throw classifyError(err);
  }

  const duration = Math.round(performance.now() - startTime);

  // Read response
  const raw = await response.text();
  const size = byteSize(raw);
  const responseHeaders = parseResponseHeaders(response.headers);

  // Try to parse as JSON
  let data: unknown = raw;
  let isJson = false;
  try {
    data = JSON.parse(raw);
    isJson = true;
  } catch {
    // Not JSON — keep raw text
  }

  return {
    status: response.status,
    statusText: response.statusText,
    duration,
    size,
    headers: responseHeaders,
    data,
    raw,
    isJson,
  };
}

/**
 * Validate whether a string is a valid URL.
 */
export function isValidUrl(url: string): boolean {
  if (!url.trim()) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
