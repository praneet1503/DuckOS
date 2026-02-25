/* ══════════════════════════════════════════════════════════════
   QuackAPI — useRequest Hook
   ────────────────────────────────────────────────────────────
   Central state management for the active request & response.
   Self-contained — no global state pollution.
   ══════════════════════════════════════════════════════════ */

"use client";

import { useState, useCallback, useRef, useMemo } from "react";
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
      setState((s) => ({
        ...s,
        [field]: s[field].map((e) =>
          e.id === id ? { ...e, [key]: value } : e
        ),
      }));
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
      const result = await executeRequest({
        method: state.method,
        url: state.url,
        headers: state.headers,
        params: state.params,
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
      setState((s) => ({
        ...s,
        method: item.method,
        url: item.url,
        headers: item.headers.length > 0 ? item.headers : [emptyEntry()],
        params: item.params.length > 0 ? item.params : [emptyEntry()],
        body: item.body,
        urlValid: item.url === "" || isValidUrl(item.url),
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
