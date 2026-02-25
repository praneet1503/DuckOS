/* ══════════════════════════════════════════════════════════════
   QuackAPI — useRequest Hook
   ────────────────────────────────────────────────────────────
   Central state management for the active request & response.
   Self-contained — no global state pollution.
   ══════════════════════════════════════════════════════════ */

"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import type {
  HttpMethod,
  KeyValueEntry,
  RequestConfig,
  ExecutionResult,
  ExecutionError,
  RequestTab,
  RequestItem,
} from "../types";
import { executeRequest, isValidUrl } from "../services/requestExecutor";

function uid(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyEntry(): KeyValueEntry {
  return { id: uid(), key: "", value: "", enabled: true };
}

export interface RequestState {
  method: HttpMethod;
  url: string;
  headers: KeyValueEntry[];
  params: KeyValueEntry[];
  body: string;
  apiKey: string;
  activeRequestTab: RequestTab;
  response: ExecutionResult | null;
  error: ExecutionError | null;
  isLoading: boolean;
  urlValid: boolean;
  bodyValid: boolean;
  /** ID of the currently loaded saved request (null if new/unsaved) */
  loadedRequestId: string | null;
  /** ID of the collection the loaded request belongs to */
  loadedCollectionId: string | null;
}

export interface RequestActions {
  setMethod: (method: HttpMethod) => void;
  setUrl: (url: string) => void;
  setBody: (body: string) => void;
  setActiveRequestTab: (tab: RequestTab) => void;

  // Header actions
  addHeader: () => void;
  removeHeader: (id: string) => void;
  updateHeader: (id: string, field: "key" | "value", value: string) => void;
  toggleHeader: (id: string) => void;

  // Param actions
  addParam: () => void;
  removeParam: (id: string) => void;
  updateParam: (id: string, field: "key" | "value", value: string) => void;
  toggleParam: (id: string) => void;

  // Execution
  execute: () => Promise<void>;
  clearResponse: () => void;

  // Request I/O
  getRequestConfig: () => RequestConfig;
  loadFromRequestItem: (item: RequestItem, collectionId: string) => void;
  resetToNew: () => void;
}

export type UseRequestReturn = RequestState & RequestActions;

const INITIAL_STATE: RequestState = {
  method: "GET",
  url: "",
  headers: [emptyEntry()],
  params: [emptyEntry()],
  body: "",
  apiKey: "",
  activeRequestTab: "params",
  response: null,
  error: null,
  isLoading: false,
  urlValid: true,
  bodyValid: true,
  loadedRequestId: null,
  loadedCollectionId: null,
};

export function useRequest(): UseRequestReturn {
  const [state, setState] = useState<RequestState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  // Load API key from localStorage on mount
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("quackapi_weatherapi_key") : null;
    if (saved) {
      setState((s) => ({ ...s, apiKey: saved }));
    }
  }, []);

  // ── Setters ─────────────────────────────────────────────

  const setMethod = useCallback((method: HttpMethod) => {
    setState((s) => ({ ...s, method }));
  }, []);

  const setUrl = useCallback((url: string) => {
    const urlValid = url === "" || isValidUrl(url);
    setState((s) => ({ ...s, url, urlValid }));
  }, []);

  const setBody = useCallback((body: string) => {
    let bodyValid = true;
    if (body.trim()) {
      try {
        JSON.parse(body);
      } catch {
        bodyValid = false;
      }
    }
    setState((s) => ({ ...s, body, bodyValid }));
  }, []);

  const setActiveRequestTab = useCallback((activeRequestTab: RequestTab) => {
    setState((s) => ({ ...s, activeRequestTab }));
  }, []);

  // ── KeyValue helpers (generic for both headers and params) ──

  const addEntry = useCallback((field: "headers" | "params") => {
    setState((s) => ({
      ...s,
      [field]: [...s[field], emptyEntry()],
    }));
  }, []);

  const removeEntry = useCallback((field: "headers" | "params", id: string) => {
    setState((s) => ({
      ...s,
      [field]: s[field].filter((e) => e.id !== id),
    }));
  }, []);

  const updateEntry = useCallback(
    (field: "headers" | "params", id: string, key: "key" | "value", value: string) => {
      setState((s) => {
        const updated = {
          ...s,
          [field]: s[field].map((e) =>
            e.id === id ? { ...e, [key]: value } : e
          ),
        };

        // If updating a "key" param in the params list, save it to localStorage
        if (field === "params" && key === "value") {
          const keyParam = updated.params.find((p) => p.key === "key");
          if (keyParam && keyParam.value && typeof window !== "undefined") {
            if (keyParam.value === "ENTER_YOUR_WEATHERAPI_KEY") {
              localStorage.removeItem("quackapi_weatherapi_key");
            } else {
              localStorage.setItem("quackapi_weatherapi_key", keyParam.value);
            }
          }
        }

        return updated;
      });
    },
    []
  );

  const toggleEntry = useCallback((field: "headers" | "params", id: string) => {
    setState((s) => ({
      ...s,
      [field]: s[field].map((e) =>
        e.id === id ? { ...e, enabled: !e.enabled } : e
      ),
    }));
  }, []);

  // ── Bound header actions ──────────────────────────────────

  const addHeader = useCallback(() => addEntry("headers"), [addEntry]);
  const removeHeader = useCallback((id: string) => removeEntry("headers", id), [removeEntry]);
  const updateHeader = useCallback(
    (id: string, field: "key" | "value", value: string) => updateEntry("headers", id, field, value),
    [updateEntry]
  );
  const toggleHeader = useCallback((id: string) => toggleEntry("headers", id), [toggleEntry]);

  // ── Bound param actions ───────────────────────────────────

  const addParam = useCallback(() => addEntry("params"), [addEntry]);
  const removeParam = useCallback((id: string) => removeEntry("params", id), [removeEntry]);
  const updateParam = useCallback(
    (id: string, field: "key" | "value", value: string) => updateEntry("params", id, field, value),
    [updateEntry]
  );
  const toggleParam = useCallback((id: string) => toggleEntry("params", id), [toggleEntry]);

  // ── Execute ───────────────────────────────────────────────

  const execute = useCallback(async () => {
    if (!isValidUrl(state.url)) return;

    // Abort any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState((s) => ({ ...s, isLoading: true, error: null, response: null }));

    try {
      // Prepare execution URL/params. If the request targets WeatherAPI or
      // OpenWeather, route it through our server-side proxy to avoid CORS.
      let execUrl = state.url;
      let execParams = state.params;

      try {
        const parsed = new URL(state.url, window.location.origin);
        const hostname = parsed.hostname || "";
        if (
          hostname.includes("api.weatherapi.com") ||
          hostname.includes("openweathermap.org") ||
          state.url.startsWith("/api/weather")
        ) {
          execUrl = "/api/weather";

          // Merge existing params and querystring into a params map
          const map = new Map<string, KeyValueEntry>();
          for (const p of execParams) map.set(p.key, p);
          for (const [k, v] of parsed.searchParams.entries()) {
            if (!map.has(k)) map.set(k, { id: uid(), key: k, value: v, enabled: true });
          }

          execParams = Array.from(map.values());
        }
      } catch {
        // ignore parse errors and fall back to original url/params
      }

      const result = await executeRequest({
        method: state.method,
        url: execUrl,
        headers: state.headers,
        params: execParams,
        body: state.body,
      });

      setState((s) => ({ ...s, response: result, isLoading: false }));
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err as ExecutionError,
        isLoading: false,
      }));
    }
  }, [state.method, state.url, state.headers, state.params, state.body]);

  const clearResponse = useCallback(() => {
    setState((s) => ({ ...s, response: null, error: null }));
  }, []);

  // ── Request config extraction ─────────────────────────────

  const getRequestConfig = useCallback((): RequestConfig => {
    return {
      method: state.method,
      url: state.url,
      headers: state.headers,
      params: state.params,
      body: state.body,
    };
  }, [state.method, state.url, state.headers, state.params, state.body]);

  // ── Load from saved request ───────────────────────────────

  const loadFromRequestItem = useCallback(
    (item: RequestItem, collectionId: string) => {
      // If the saved request targets our server proxy, display the
      // external provider's base URL in the UI while keeping the proxy as
      // the execution target under the hood.
      const displayUrl = item.url.startsWith("/api/weather")
        ? "http://api.weatherapi.com/v1"
        : item.url;

      // If this is a weather request and the user has a saved API key in localStorage,
      // update the "key" param to use the saved key (instead of the placeholder).
      let params = item.params.length > 0 ? item.params : [emptyEntry()];
      if (
        (item.url.includes("weatherapi.com") || item.url.startsWith("/api/weather")) &&
        typeof window !== "undefined"
      ) {
        const savedKey = localStorage.getItem("quackapi_weatherapi_key");
        if (savedKey) {
          // Find and update the "key" param, or add it if not present
          const keyParamIdx = params.findIndex((p) => p.key === "key");
          if (keyParamIdx !== -1) {
            params = params.map((p, i) =>
              i === keyParamIdx ? { ...p, value: savedKey } : p
            );
          }
        }
      }

      setState((s) => ({
        ...s,
        method: item.method,
        url: displayUrl,
        headers: item.headers.length > 0 ? item.headers : [emptyEntry()],
        params,
        body: item.body,
        urlValid: displayUrl === "" || isValidUrl(displayUrl),
        bodyValid: true,
        response: null,
        error: null,
        loadedRequestId: item.id,
        loadedCollectionId: collectionId,
      }));
    },
    []
  );

  const resetToNew = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  // ── Return ────────────────────────────────────────────────

  return useMemo(
    () => ({
      ...state,
      setMethod,
      setUrl,
      setBody,
      setActiveRequestTab,
      addHeader,
      removeHeader,
      updateHeader,
      toggleHeader,
      addParam,
      removeParam,
      updateParam,
      toggleParam,
      execute,
      clearResponse,
      getRequestConfig,
      loadFromRequestItem,
      resetToNew,
    }),
    [
      state,
      setMethod,
      setUrl,
      setBody,
      setActiveRequestTab,
      addHeader,
      removeHeader,
      updateHeader,
      toggleHeader,
      addParam,
      removeParam,
      updateParam,
      toggleParam,
      execute,
      clearResponse,
      getRequestConfig,
      loadFromRequestItem,
      resetToNew,
    ]
  );
}
