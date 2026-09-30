/**
 * In-browser stand-in for the real backend. It intercepts `fetch` calls to `/api/*`
 * so the frontend can be developed and tested without the service running.
 *
 * BACKEND-OWNED: this directory mirrors the production service behaviour and is
 * maintained by the backend team. Frontend changes must not modify it.
 *
 * Scenarios (append `?scenario=<name>` to the page URL, or set localStorage.mockScenario):
 *   default   – normal data
 *   empty     – list endpoints return no items
 *   error     – GET requests fail with 503
 *   forbidden – the session has a read-only role; mutations return 403
 *   stale     – mutations return 409 STALE_VERSION (someone else changed the record)
 *   slow      – every response is delayed by ~2.5s
 *   partial   – endpoints that aggregate several upstreams report some as unavailable
 */
export type Scenario = 'default' | 'empty' | 'error' | 'forbidden' | 'stale' | 'slow' | 'partial';

export interface MockRequest {
  method: string;
  path: string;
  params: Record<string, string>;
  query: URLSearchParams;
  body: unknown;
  scenario: Scenario;
}

export interface MockResponse {
  status: number;
  body?: unknown;
}

export type Handler = (req: MockRequest) => MockResponse;

export interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  pattern: string; // e.g. /api/cases/:id
  handler: Handler;
}

const SCENARIOS: Scenario[] = ['default', 'empty', 'error', 'forbidden', 'stale', 'slow', 'partial'];

export function currentScenario(): Scenario {
  if (typeof window === 'undefined') return 'default';
  const fromUrl = new URLSearchParams(window.location.search).get('scenario');
  let fromStorage: string | null = null;
  try {
    fromStorage = window.localStorage.getItem('mockScenario');
  } catch {
    fromStorage = null;
  }
  const s = (fromUrl ?? fromStorage ?? 'default') as Scenario;
  return SCENARIOS.includes(s) ? s : 'default';
}

function match(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split('/').filter(Boolean);
  const a = path.split('/').filter(Boolean);
  if (p.length !== a.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(a[i]);
    else if (p[i] !== a[i]) return null;
  }
  return params;
}

export function createBackend(routes: Route[], opts: { latencyMs?: number } = {}) {
  return async function handle(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, 'http://localhost');
    const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const scenario = currentScenario();
    const latency = scenario === 'slow' ? 2500 : opts.latencyMs ?? 250;
    await new Promise((r) => setTimeout(r, latency));

    let body: unknown = undefined;
    if (init?.body && typeof init.body === 'string') {
      try {
        body = JSON.parse(init.body);
      } catch {
        body = init.body;
      }
    }

    const json = (status: number, payload?: unknown) =>
      new Response(payload === undefined ? null : JSON.stringify(payload), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });

    if (scenario === 'error' && method === 'GET') {
      return json(503, { code: 'UPSTREAM_UNAVAILABLE', message: 'Service temporarily unavailable' });
    }
    if (scenario === 'forbidden' && method !== 'GET') {
      return json(403, { code: 'FORBIDDEN', message: 'Your role does not permit this action' });
    }
    if (scenario === 'stale' && method !== 'GET') {
      return json(409, { code: 'STALE_VERSION', message: 'This record was changed by someone else. Reload to see the latest version.' });
    }

    for (const route of routes) {
      if (route.method !== method) continue;
      const params = match(route.pattern, url.pathname);
      if (!params) continue;
      const res = route.handler({ method, path: url.pathname, params, query: url.searchParams, body, scenario });
      return json(res.status, res.body);
    }
    return json(404, { code: 'NOT_FOUND', message: `No route for ${method} ${url.pathname}` });
  };
}

export function installBackend(routes: Route[], opts?: { latencyMs?: number }) {
  const handle = createBackend(routes, opts);
  const realFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const path = new URL(raw, window.location.origin).pathname;
    if (path.startsWith('/api/')) return handle(input, init);
    return realFetch(input, init);
  };
}
