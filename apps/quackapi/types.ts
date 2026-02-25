/* ══════════════════════════════════════════════════════════════
   QuackAPI — Type Definitions
   ────────────────────────────────────────────────────────────
   Strict types for the REST client, collections, and future
   extensions (OAuth, GraphQL, environments).
   ══════════════════════════════════════════════════════════ */

// ── HTTP primitives ─────────────────────────────────────────

export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export interface KeyValueEntry {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

// ── Request model ───────────────────────────────────────────

export interface RequestConfig {
  method: HttpMethod;
  url: string;
  headers: KeyValueEntry[];
  params: KeyValueEntry[];
  body: string;
}

// ── Execution result ────────────────────────────────────────

export interface ExecutionResult {
  status: number;
  statusText: string;
  duration: number;
  size: number;
  headers: Record<string, string>;
  data: unknown;
  raw: string;
  isJson: boolean;
}

export interface ExecutionError {
  type: "network" | "timeout" | "cors" | "unknown";
  message: string;
}

// ── Collections ─────────────────────────────────────────────

export interface RequestItem {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: KeyValueEntry[];
  params: KeyValueEntry[];
  body: string;
  createdAt: number;
  updatedAt: number;
}

export interface Collection {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  requests: RequestItem[];
}

// ── Response tab identifiers ────────────────────────────────

export type ResponseTab = "pretty" | "raw" | "headers";
export type RequestTab = "params" | "headers" | "body";

// ── Future-proofing interfaces ──────────────────────────────

/** Placeholder for environment variable system */
export interface Environment {
  id: string;
  name: string;
  variables: Record<string, string>;
  isActive: boolean;
}

/** Placeholder for OAuth flow manager */
export interface AuthConfig {
  type: "none" | "bearer" | "basic" | "oauth2";
  token?: string;
  username?: string;
  password?: string;
  oauth2?: {
    grantType: "authorization_code" | "client_credentials";
    authUrl: string;
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
    scope: string;
  };
}

/** Placeholder for request history auto-tracking */
export interface HistoryEntry {
  id: string;
  request: RequestConfig;
  response: ExecutionResult | null;
  timestamp: number;
}

/** Placeholder for GraphQL mode */
export interface GraphQLConfig {
  query: string;
  variables: string;
  operationName?: string;
}
