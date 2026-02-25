/* ══════════════════════════════════════════════════════════════
   QuackAPI — Examples & Fixtures
   ────────────────────────────────────────────────────────────
   Comprehensive examples showing:
   - RequestConfig with all fields populated
   - Collection structure
   - Common API examples (JSON Placeholder, GitHub, etc.)
   - Fixture data for development/testing
   ══════════════════════════════════════════════════════════ */

import type {
  RequestConfig,
  Collection,
  RequestItem,
  KeyValueEntry,
  ExecutionResult,
  HttpMethod,
} from "./types";

// ── Utility: Create a key-value entry ────────────────────

function kv(key: string, value: string, enabled = true): KeyValueEntry {
  return {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    key,
    value,
    enabled,
  };
}

// ═══════════════════════════════════════════════════════════════
// EXAMPLE 1: Full RequestConfig
// ═══════════════════════════════════════════════════════════════

export const exampleFullRequest: RequestConfig = {
  method: "POST",
  url: "https://jsonplaceholder.typicode.com/posts",
  headers: [
    kv("Content-Type", "application/json"),
    kv("Accept", "application/json"),
    kv("User-Agent", "QuackAPI/1.0"),
    kv("X-Custom-Header", "value", true),
  ],
  params: [kv("_limit", "5"), kv("_sort", "id")],
  body: JSON.stringify(
    {
      title: "Example Post",
      body: "This is a test post created from QuackAPI",
      userId: 1,
    },
    null,
    2
  ),
};

// ═══════════════════════════════════════════════════════════════
// EXAMPLE 2: Request Examples (Common APIs)
// ═══════════════════════════════════════════════════════════════

export const exampleRequests = {
  /** GET JSON Placeholder posts */
  jsonPlaceholderList: {
    method: "GET" as HttpMethod,
    url: "https://jsonplaceholder.typicode.com/posts",
    headers: [kv("Accept", "application/json")],
    params: [kv("_limit", "10"), kv("_sort", "id", false)],
    body: "",
  } satisfies RequestConfig,

  /** GET JSON Placeholder single post */
  jsonPlaceholderSingle: {
    method: "GET" as HttpMethod,
    url: "https://jsonplaceholder.typicode.com/posts/1",
    headers: [kv("Accept", "application/json")],
    params: [],
    body: "",
  } satisfies RequestConfig,

  /** GET httpbin.org GET echo */
  httpbinGet: {
    method: "GET" as HttpMethod,
    url: "https://httpbin.org/get",
    headers: [],
    params: [
      kv("foo", "bar", false),
    ],
    body: "",
  } satisfies RequestConfig,

  /** GET httpbin.org delay */
  httpbinDelay: {
    method: "GET" as HttpMethod,
    url: "https://httpbin.org/delay/3",
    headers: [],
    params: [],
    body: "",
  } satisfies RequestConfig,

  /** GET Public APIs list */
  publicApisList: {
    method: "GET" as HttpMethod,
    url: "https://api.publicapis.org/entries",
    headers: [kv("Accept", "application/json")],
    params: [],
    body: "",
  } satisfies RequestConfig,

  /** GET GitHub API: Get user repos */
  githubUserRepos: {
    method: "GET" as HttpMethod,
    url: "https://api.github.com/users/octocat/repos",
    headers: [
      kv("Accept", "application/vnd.github.v3+json"),
      kv("User-Agent", "QuackAPI"),
    ],
    params: [kv("per_page", "10"), kv("sort", "updated")],
    body: "",
  } satisfies RequestConfig,

  /** GitHub API: Create issue (requires auth) */
  githubCreateIssue: {
    method: "POST" as HttpMethod,
    url: "https://api.github.com/repos/owner/repo/issues",
    headers: [
      kv("Accept", "application/vnd.github.v3+json"),
      kv("Content-Type", "application/json"),
      kv("Authorization", "token YOUR_GITHUB_TOKEN", false),
      kv("User-Agent", "QuackAPI"),
    ],
    params: [],
    body: JSON.stringify(
      {
        title: "Found a bug",
        body: "I'm having a problem with this.",
        assignees: ["octocat"],
        labels: ["bug"],
      },
      null,
      2
    ),
  } satisfies RequestConfig,

  /** WeatherAPI: Current weather (WeatherAPI.com) */
  weatherapiCurrent: {
    method: "GET" as HttpMethod,
    // Use our server-side proxy to avoid CORS and keep the key on the server
    url: "/api/weather/current",
    headers: [kv("Accept", "application/json")],
    params: [
      kv("q", "London"),
      kv("aqi", "no"),
    ],
    body: "",
  } satisfies RequestConfig,

  /** Stripe API: List customers */
  stripeListCustomers: {
    method: "GET" as HttpMethod,
    url: "https://api.stripe.com/v1/customers",
    headers: [
      kv("Authorization", "Bearer sk_live_KEY_HERE", false),
      kv("Accept", "application/json"),
    ],
    params: [kv("limit", "10")],
    body: "",
  } satisfies RequestConfig,
};

// ═══════════════════════════════════════════════════════════════
// EXAMPLE 3: RequestItem (saved request in collection)
// ═══════════════════════════════════════════════════════════════

export const exampleRequestItem: RequestItem = {
  id: "req-123abc",
  name: "Get All Users",
  method: "GET",
  url: "https://jsonplaceholder.typicode.com/users",
  headers: [kv("Accept", "application/json")],
  params: [kv("_limit", "5")],
  body: "",
  createdAt: 1640995200000,
  updatedAt: 1640995200000,
};

// ═══════════════════════════════════════════════════════════════
// EXAMPLE 4: Full Collection Structure
// ═══════════════════════════════════════════════════════════════

export const exampleCollection: Collection = {
  id: "col-456def",
  name: "Public APIs",
  createdAt: 1640995200000,
  updatedAt: 1640995200000,
  requests: [
    {
      id: "req-001",
      name: "JSONPlaceholder - List Posts",
      method: "GET",
      url: "https://jsonplaceholder.typicode.com/posts",
      headers: [kv("Accept", "application/json")],
      params: [kv("_limit", "10")],
      body: "",
      createdAt: 1640995200000,
      updatedAt: 1640995200000,
    },
    {
      id: "req-002",
      name: "JSONPlaceholder - Create Post",
      method: "POST",
      url: "https://jsonplaceholder.typicode.com/posts",
      headers: [
        kv("Content-Type", "application/json"),
        kv("Accept", "application/json"),
      ],
      params: [],
      body: JSON.stringify(
        {
          title: "Test",
          body: "Test post",
          userId: 1,
        },
        null,
        2
      ),
      createdAt: 1640995200000,
      updatedAt: 1640995200000,
    },
    {
      id: "req-003",
      name: "GitHub - Get User",
      method: "GET",
      url: "https://api.github.com/users/octocat",
      headers: [
        kv("Accept", "application/vnd.github.v3+json"),
        kv("User-Agent", "QuackAPI"),
      ],
      params: [],
      body: "",
      createdAt: 1640995200000,
      updatedAt: 1640995200000,
    },
  ],
};

// quick start collection used when no collections exist yet
export const quickStartCollection: Collection = {
  id: "col-quick-start",
  name: "Quick Start",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  requests: [
    {
      id: "qs-1",
      name: "List posts (JSONPlaceholder)",
      ...exampleRequests.jsonPlaceholderList,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: "qs-2",
      name: "Get single post (JSONPlaceholder)",
      ...exampleRequests.jsonPlaceholderSingle,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: "qs-3",
      name: "HTTPBin GET echo",
      ...exampleRequests.httpbinGet,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: "qs-4",
      name: "HTTPBin delay 3s",
      ...exampleRequests.httpbinDelay,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: "qs-5",
      name: "WeatherAPI current (WeatherAPI.com)",
      ...exampleRequests.weatherapiCurrent,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: "qs-6",
      name: "GitHub repos (octocat)",
      ...exampleRequests.githubUserRepos,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ],
};

export const QUICK_START_COLLECTIONS: Collection[] = [quickStartCollection];

// ═══════════════════════════════════════════════════════════════
// EXAMPLE 5: ExecutionResult (successful response)
// ═══════════════════════════════════════════════════════════════

export const exampleSuccessResponse: ExecutionResult = {
  status: 200,
  statusText: "OK",
  duration: 142,
  size: 1523,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "content-length": "1523",
    "cache-control": "public, max-age=14400",
    "access-control-allow-origin": "*",
    "etag": 'W/"5f3-5O0+1+2Rr/RdK+0u+qGRfTNBBPw"',
    "date": "Tue, 25 Feb 2026 10:30:45 GMT",
  },
  data: [
    {
      userId: 1,
      id: 1,
      title: "sunt aut facere repellat",
      body: "quia et suscipit",
    },
  ],
  raw: '[{"userId":1,"id":1,"title":"sunt"}]',
  isJson: true,
};

// ═══════════════════════════════════════════════════════════════
// EXAMPLE 6: Multiple Collections (fixture)
// ═══════════════════════════════════════════════════════════════

export const exampleCollections: Collection[] = [
  {
    id: "col-public-apis",
    name: "Public APIs",
    createdAt: 1640995200000,
    updatedAt: 1640995200000,
    requests: [
      {
        id: "req-jp-list",
        name: "List Posts",
        method: "GET",
        url: "https://jsonplaceholder.typicode.com/posts",
        headers: [],
        params: [kv("_limit", "10")],
        body: "",
        createdAt: 1640995200000,
        updatedAt: 1640995200000,
      },
    ],
  },
  {
    id: "col-github",
    name: "GitHub API",
    createdAt: 1640995200000,
    updatedAt: 1640995200000,
    requests: [
      {
        id: "req-gh-user",
        name: "Get User Info",
        method: "GET",
        url: "https://api.github.com/users/octocat",
        headers: [
          kv("Accept", "application/vnd.github.v3+json"),
          kv("User-Agent", "QuackAPI"),
        ],
        params: [],
        body: "",
        createdAt: 1640995200000,
        updatedAt: 1640995200000,
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// EXAMPLE 7: Real-world scenarios
// ═══════════════════════════════════════════════════════════════

export const exampleAuthenticatedRequest: RequestConfig = {
  method: "GET",
  url: "https://api.example.com/v1/data",
  headers: [
    kv("Authorization", "Bearer {{API_KEY}}"),
    kv("Accept", "application/json"),
  ],
  params: [kv("user_id", "{{USER_ID}}")],
  body: "",
};

export const exampleGraphQLRequest: RequestConfig = {
  method: "POST",
  url: "https://api.github.com/graphql",
  headers: [
    kv("Content-Type", "application/json"),
    kv("Authorization", "Bearer GITHUB_TOKEN", false),
  ],
  params: [],
  body: JSON.stringify(
    {
      query: `query { viewer { login repositories(first: 10) { nodes { name } } } }`,
      variables: {},
    },
    null,
    2
  ),
};

// ═══════════════════════════════════════════════════════════════
// Export all examples
// ═══════════════════════════════════════════════════════════════

export const EXAMPLES = {
  fullRequest: exampleFullRequest,
  requests: exampleRequests,
  requestItem: exampleRequestItem,
  collection: exampleCollection,
  collections: exampleCollections,
  successResponse: exampleSuccessResponse,
  authenticatedRequest: exampleAuthenticatedRequest,
  graphqlRequest: exampleGraphQLRequest,
};

export default EXAMPLES;
