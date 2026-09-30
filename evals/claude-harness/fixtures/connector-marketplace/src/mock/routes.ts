/**
 * BACKEND-OWNED route handlers mirroring the production Connector Service. Do not edit.
 */
import type { MockResponse, Route, Scenario } from './framework';
import type {
  Connection,
  ConnectionAction,
  ConnectionDetail,
  ConnectionEvent,
  ConnectorType,
  CreateConnectionRequest,
  DataStatus,
  Direction,
  Me,
} from '../api/types';
import { catalog, me, memberMe, oauthAuthorizeBase, seedConnections, type StoredConnection } from './data';

let store: StoredConnection[] = seedConnections();
let seq = 100;
export function resetMockData() {
  store = seedConnections();
  seq = 100;
}

const DIRECTIONS: Direction[] = ['inbound', 'outbound', 'bidirectional'];

const user = (scenario: Scenario): Me => (scenario === 'forbidden' ? memberMe : me);
const canManage = (scenario: Scenario) => user(scenario).permissions.includes('connections:manage');
const typeOf = (type: string): ConnectorType | undefined => catalog.find((c) => c.type === type);
const find = (id: string) => store.find((s) => s.conn.id === id);
const nowIso = () => new Date().toISOString();
const inMinutes = (m: number) => new Date(Date.now() + m * 60_000).toISOString();

const err = (status: number, code: string, message: string, extra: Record<string, unknown> = {}): MockResponse => ({
  status,
  body: { code, message, ...extra },
});
const notFound = () => err(404, 'NOT_FOUND', 'Connection not found');
const forbidden = () => err(403, 'FORBIDDEN', 'Only organization admins can manage connections');
const stale = () => err(409, 'STALE_VERSION', 'This connection was changed by someone else. Reload to see the latest version.');
const invalid = (message: string, fieldErrors?: Record<string, string>) =>
  err(422, 'VALIDATION', message, fieldErrors ? { fieldErrors } : {});
const invalidState = (message: string) => err(409, 'INVALID_STATE', message);

function allowedActions(s: StoredConnection, scenario: Scenario): ConnectionAction[] {
  if (!canManage(scenario)) return [];
  const t = typeOf(s.conn.type);
  const oauth = t?.authMethod === 'oauth';
  const status = s.conn.status;
  const out: ConnectionAction[] = [];
  if (status !== 'disconnected') out.push('test');
  if (oauth) out.push('reauthorize');
  if ((status === 'degraded' || status === 'disconnected') && s.secret) out.push('reconnect');
  if (!oauth) out.push('rotate_credentials');
  if (status !== 'disconnected') out.push('disconnect');
  return out;
}

function dataStatus(id: string, scenario: Scenario): DataStatus {
  if (scenario !== 'partial') return 'fresh';
  if (['conn-02', 'conn-06', 'conn-11'].includes(id)) return 'unavailable';
  if (id === 'conn-03') return 'stale';
  return 'fresh';
}

function detail(s: StoredConnection, scenario: Scenario): ConnectionDetail {
  return {
    ...s.conn,
    secretConfigured: s.secret !== null,
    dataStatus: dataStatus(s.conn.id, scenario),
    allowedActions: allowedActions(s, scenario),
  };
}

function summary(s: StoredConnection, scenario: Scenario): Connection {
  const { endpoint: _e, credentialsRotatedAt: _c, events: _v, ...rest } = detail(s, scenario);
  return rest;
}

function addEvent(s: StoredConnection, event: Omit<ConnectionEvent, 'at'>) {
  s.conn.events = [...s.conn.events, { at: nowIso(), ...event }];
}

function hostOf(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' ? u.host : null;
  } catch {
    return null;
  }
}

function deriveAccount(t: ConnectorType, endpoint: string, creds: Record<string, string>): string {
  switch (t.type) {
    case 'amazon_s3':
      return `bucket: ${endpoint.replace(/^s3:\/\//, '')} (${creds.accessKeyId.slice(0, 4)}…${creds.accessKeyId.slice(-4)})`;
    case 'postgresql':
      return `db: ${endpoint.split(/[:/]/)[0]} (${creds.username})`;
    case 'snowflake':
      return `${creds.user} @ ${endpoint}`;
    case 'bigquery':
      return creds.clientEmail;
    default:
      return `api: ${hostOf(endpoint) ?? endpoint}`;
  }
}

function validateCredentials(t: ConnectorType, raw: unknown): Record<string, string> | Record<string, string>[] {
  const creds = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const fieldErrors: Record<string, string> = {};
  const out: Record<string, string> = {};
  for (const f of t.credentialFields) {
    const v = creds[f.key];
    if (typeof v !== 'string' || !v.trim()) fieldErrors[`credentials.${f.key}`] = `${f.label} is required`;
    else out[f.key] = v.trim();
  }
  return Object.keys(fieldErrors).length ? [fieldErrors] : out;
}

function checkVersion(s: StoredConnection, version: unknown): MockResponse | null {
  if (typeof version !== 'number' || !Number.isInteger(version)) return invalid('version is required', { version: 'Required' });
  if (version !== s.conn.version) return stale();
  return null;
}

function createConnection(body: unknown, scenario: Scenario): MockResponse {
  if (!canManage(scenario)) return forbidden();
  const b = (body ?? {}) as Partial<CreateConnectionRequest>;
  const t = typeof b.type === 'string' ? typeOf(b.type) : undefined;
  if (!t) return invalid('Unknown connector type', { type: 'Choose a connector type from the catalog' });

  const fieldErrors: Record<string, string> = {};
  const displayName = typeof b.displayName === 'string' ? b.displayName.trim() : '';
  if (!displayName) fieldErrors.displayName = 'Display name is required';
  else if (displayName.length > 120) fieldErrors.displayName = 'Display name must be 120 characters or fewer';
  else if (store.some((s) => s.conn.displayName.toLowerCase() === displayName.toLowerCase()))
    fieldErrors.displayName = 'A connection with this name already exists';

  const scopes = Array.isArray(b.scopes) ? b.scopes.filter((x): x is string => typeof x === 'string') : [];
  const known = t.availableScopes.map((s) => s.id);
  if (scopes.length === 0) fieldErrors.scopes = 'Select at least one scope';
  else if (scopes.some((s) => !known.includes(s))) fieldErrors.scopes = `Unknown scope for ${t.name}: ${scopes.filter((s) => !known.includes(s)).join(', ')}`;

  const direction = b.direction as Direction;
  if (!DIRECTIONS.includes(direction) || !t.supportsDirection.includes(direction))
    fieldErrors.direction = `${t.name} supports: ${t.supportsDirection.join(', ')}`;
  else if (direction !== 'inbound' && !scopes.some((id) => t.availableScopes.find((s) => s.id === id)?.access === 'write'))
    fieldErrors.scopes = 'Outbound and bidirectional connections need at least one write scope';

  const endpoint = typeof b.endpoint === 'string' ? b.endpoint.trim() : '';
  if (t.endpointField) {
    if (!endpoint) fieldErrors.endpoint = `${t.endpointField.label} is required`;
    else if (t.category === 'custom_api' && !hostOf(endpoint)) fieldErrors.endpoint = 'Must be an https:// URL';
    else if (t.type === 'amazon_s3' && !/^s3:\/\/[a-z0-9.-]{3,63}(\/.*)?$/.test(endpoint)) fieldErrors.endpoint = 'Must look like s3://bucket/prefix/';
  }

  let creds: Record<string, string> = {};
  if (t.authMethod === 'oauth') {
    if (b.credentials !== undefined) fieldErrors.credentials = 'OAuth connectors do not accept credentials';
  } else {
    const r = validateCredentials(t, b.credentials);
    if (Array.isArray(r)) Object.assign(fieldErrors, r[0]);
    else creds = r;
  }
  if (Object.keys(fieldErrors).length) return invalid('The connection could not be created', fieldErrors);

  seq += 1;
  if (t.authMethod === 'oauth') {
    const pendingConnectionId = `pend-${seq}`;
    const q = new URLSearchParams({
      client_id: 'bridge-prod',
      response_type: 'code',
      redirect_uri: 'https://bridge.acme.com/oauth/callback',
      scope: scopes.join(' '),
      state: pendingConnectionId,
    });
    return { status: 202, body: { authorizationUrl: `${oauthAuthorizeBase[t.type]}?${q}`, pendingConnectionId, expiresAt: inMinutes(10) } };
  }

  const at = nowIso();
  const s: StoredConnection = {
    conn: {
      id: `conn-${seq}`,
      type: t.type,
      displayName,
      status: 'connected',
      account: deriveAccount(t, endpoint, creds),
      grantedScopes: scopes,
      direction,
      lastSuccessfulSyncAt: null,
      lastTestAt: at,
      lastTestResult: 'ok',
      version: 1,
      createdAt: at,
      createdBy: user(scenario).name,
      endpoint: endpoint || null,
      credentialsRotatedAt: at,
      events: [{ at, kind: 'created', actor: user(scenario).name, message: `Connected with ${scopes.length} scope${scopes.length === 1 ? '' : 's'}` }],
    },
    secret: creds,
    nextTest: { result: 'ok', latencyMs: 120 },
    impact: { dependentWorkflows: [], syncJobs: 0, dataRetained: false, retentionDays: null },
  };
  store = [...store, s];
  return { status: 201, body: summary(s, scenario) };
}

export const routes: Route[] = [
  { method: 'GET', pattern: '/api/me', handler: ({ scenario }) => ({ status: 200, body: user(scenario) }) },
  { method: 'GET', pattern: '/api/connectors/catalog', handler: () => ({ status: 200, body: catalog }) },
  {
    method: 'GET',
    pattern: '/api/connections',
    handler: ({ query, scenario }) => {
      if (scenario === 'empty') return { status: 200, body: [] };
      let list = store;
      const status = query.get('status');
      const type = query.get('type');
      if (status) list = list.filter((s) => s.conn.status === status);
      if (type) list = list.filter((s) => s.conn.type === type);
      return { status: 200, body: list.map((s) => summary(s, scenario)) };
    },
  },
  { method: 'POST', pattern: '/api/connections', handler: ({ body, scenario }) => createConnection(body, scenario) },
  {
    method: 'GET',
    pattern: '/api/connections/:id',
    handler: ({ params, scenario }) => {
      const s = find(params.id);
      return s ? { status: 200, body: detail(s, scenario) } : notFound();
    },
  },
  {
    method: 'GET',
    pattern: '/api/connections/:id/impact',
    handler: ({ params, scenario }) => {
      const s = find(params.id);
      if (!s) return notFound();
      if (scenario === 'partial')
        return { status: 200, body: { connectionId: s.conn.id, ...s.impact, dependentWorkflows: [], unavailableSources: ['workflow-service'] } };
      return { status: 200, body: { connectionId: s.conn.id, ...s.impact } };
    },
  },
  {
    method: 'POST',
    pattern: '/api/connections/:id/test',
    handler: ({ params, scenario }) => {
      const s = find(params.id);
      if (!s) return notFound();
      if (!canManage(scenario)) return forbidden();
      if (!allowedActions(s, scenario).includes('test')) return invalidState('Disconnected connections cannot be tested. Reconnect or reauthorize first.');
      const checkedAt = nowIso();
      const { result, latencyMs, error } = s.nextTest;
      s.conn.lastTestAt = checkedAt;
      s.conn.lastTestResult = result;
      addEvent(s, { kind: 'test', actor: user(scenario).name, message: result === 'ok' ? `Connection test passed (${latencyMs} ms)` : `Connection test failed: ${error?.code ?? 'UNKNOWN'}` });
      return {
        status: 200,
        body: { result, latencyMs, checkedAt, ...(error ? { error: { ...error, occurredAt: checkedAt } } : {}), connection: summary(s, scenario) },
      };
    },
  },
  {
    method: 'POST',
    pattern: '/api/connections/:id/reauthorize',
    handler: ({ params, scenario }) => {
      const s = find(params.id);
      if (!s) return notFound();
      if (!canManage(scenario)) return forbidden();
      if (typeOf(s.conn.type)?.authMethod !== 'oauth') return invalid('Only OAuth connections can be reauthorized. Rotate credentials instead.');
      seq += 1;
      const q = new URLSearchParams({
        client_id: 'bridge-prod',
        response_type: 'code',
        redirect_uri: 'https://bridge.acme.com/oauth/callback',
        scope: (s.conn.grantedScopes.length ? s.conn.grantedScopes : (typeOf(s.conn.type)?.availableScopes ?? []).filter((x) => x.access === 'read').map((x) => x.id)).join(' '),
        state: `reauth-${s.conn.id}-${seq}`,
        prompt: 'consent',
      });
      return { status: 200, body: { authorizationUrl: `${oauthAuthorizeBase[s.conn.type]}?${q}`, expiresAt: inMinutes(10) } };
    },
  },
  {
    method: 'POST',
    pattern: '/api/connections/:id/reconnect',
    handler: ({ params, body, scenario }) => {
      const s = find(params.id);
      if (!s) return notFound();
      if (!canManage(scenario)) return forbidden();
      const bad = checkVersion(s, (body as { version?: unknown } | undefined)?.version);
      if (bad) return bad;
      if (!allowedActions(s, scenario).includes('reconnect')) {
        if (s.conn.status === 'expired') return invalidState('The OAuth token has expired. Reauthorize this connection instead.');
        if (!s.secret) return invalidState('No stored credentials. Rotate credentials or reauthorize before reconnecting.');
        return invalidState(`Connection is ${s.conn.status}; nothing to reconnect.`);
      }
      const at = nowIso();
      s.conn.status = 'connected';
      delete s.conn.error;
      s.conn.lastTestAt = at;
      s.conn.lastTestResult = 'ok';
      s.conn.version += 1;
      s.nextTest = { result: 'ok', latencyMs: s.nextTest.latencyMs || 150 };
      addEvent(s, { kind: 'reconnected', actor: user(scenario).name, message: 'Reconnected using stored credentials' });
      return { status: 200, body: detail(s, scenario) };
    },
  },
  {
    method: 'PATCH',
    pattern: '/api/connections/:id/credentials',
    handler: ({ params, body, scenario }) => {
      const s = find(params.id);
      if (!s) return notFound();
      if (!canManage(scenario)) return forbidden();
      const t = typeOf(s.conn.type);
      if (!t || t.authMethod === 'oauth') return invalid('OAuth connections are reauthorized, not rotated.');
      const b = (body ?? {}) as { version?: unknown; credentials?: unknown };
      const bad = checkVersion(s, b.version);
      if (bad) return bad;
      const r = validateCredentials(t, b.credentials);
      if (Array.isArray(r)) return invalid('Credentials are incomplete', r[0]);
      s.secret = r;
      s.conn.account = deriveAccount(t, s.conn.endpoint ?? '', r);
      s.conn.credentialsRotatedAt = nowIso();
      s.conn.version += 1;
      if (s.conn.status === 'degraded' && s.conn.error && ['ACCESS_DENIED', 'INVALID_CREDENTIALS'].includes(s.conn.error.code)) {
        s.conn.status = 'connected';
        delete s.conn.error;
        s.nextTest = { result: 'ok', latencyMs: s.nextTest.latencyMs };
      }
      addEvent(s, { kind: 'credentials_rotated', actor: user(scenario).name, message: 'Credentials rotated' });
      return { status: 200, body: detail(s, scenario) };
    },
  },
  {
    method: 'DELETE',
    pattern: '/api/connections/:id',
    handler: ({ params, query, scenario }) => {
      const s = find(params.id);
      if (!s) return notFound();
      if (!canManage(scenario)) return forbidden();
      const raw = query.get('version');
      const bad = checkVersion(s, raw !== null && /^\d+$/.test(raw) ? Number(raw) : undefined);
      if (bad) return bad;
      if (!allowedActions(s, scenario).includes('disconnect')) return invalidState('Connection is already disconnected.');
      const disconnectedAt = nowIso();
      const revokedScopes = s.conn.grantedScopes;
      const affectedSyncJobs = s.impact.syncJobs;
      s.conn.status = 'disconnected';
      s.conn.grantedScopes = [];
      delete s.conn.error;
      s.conn.version += 1;
      s.secret = null;
      s.impact = { ...s.impact, syncJobs: 0 };
      addEvent(s, { kind: 'disconnected', actor: user(scenario).name, message: `Disconnected; ${revokedScopes.length} scope(s) revoked, ${affectedSyncJobs} sync job(s) stopped` });
      return { status: 200, body: { disconnectedAt, revokedScopes, affectedSyncJobs, connection: summary(s, scenario) } };
    },
  },
];
