import { createBackend } from '../mock/framework';
import { routes, resetMockData } from '../mock/routes';

const backend = createBackend(routes, { latencyMs: 0 });
const call = async (url: string, init?: RequestInit) => {
  const r = await backend(`http://localhost${url}`, init);
  const text = await r.text();
  return { status: r.status, body: text ? JSON.parse(text) : undefined, raw: text };
};
const post = (url: string, body?: unknown, method = 'POST') =>
  call(url, { method, body: body === undefined ? undefined : JSON.stringify(body) });

describe('Connector Service API contract', () => {
  beforeEach(() => resetMockData());

  it('filters connections by status', async () => {
    const { body } = await call('/api/connections?status=degraded');
    expect(body.map((c: { id: string }) => c.id)).toEqual(['conn-02', 'conn-06', 'conn-11']);
  });

  it('never returns secrets for api_key connections', async () => {
    const r = await post('/api/connections', {
      type: 'rest_api',
      displayName: 'Status page API',
      scopes: ['http.get'],
      direction: 'inbound',
      endpoint: 'https://status.acme.com/api/v2',
      credentials: { headerName: 'Authorization', apiKey: 'sk_live_very_secret' },
    });
    expect(r.status).toBe(201);
    expect(r.body.secretConfigured).toBe(true);
    expect(r.body.account).toBe('api: status.acme.com');
    const detail = await call(`/api/connections/${r.body.id}`);
    expect(r.raw + detail.raw).not.toContain('sk_live_very_secret');
  });

  it('returns an authorization URL for oauth types', async () => {
    const r = await post('/api/connections', { type: 'box', displayName: 'Box – Design assets', scopes: ['box.files.read'], direction: 'inbound' });
    expect(r.status).toBe(202);
    expect(r.body.authorizationUrl).toMatch(/^https:\/\/account\.box\.com\//);
    expect(r.body.pendingConnectionId).toBeTruthy();
  });

  it('rejects invalid create requests with field errors', async () => {
    const r = await post('/api/connections', { type: 'postgresql', displayName: '', scopes: [], direction: 'bidirectional' });
    expect(r.status).toBe(422);
    expect(r.body.code).toBe('VALIDATION');
    expect(Object.keys(r.body.fieldErrors)).toEqual(
      expect.arrayContaining(['displayName', 'scopes', 'direction', 'endpoint', 'credentials.password']),
    );
  });

  it('rejects disconnect with a stale version and reports impact on success', async () => {
    const stale = await post('/api/connections/conn-05?version=1', undefined, 'DELETE');
    expect(stale.status).toBe(409);
    expect(stale.body.code).toBe('STALE_VERSION');
    const ok = await post('/api/connections/conn-05?version=5', undefined, 'DELETE');
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ revokedScopes: ['db.select'], affectedSyncJobs: 4 });
    expect(ok.body.connection).toMatchObject({ status: 'disconnected', secretConfigured: false, version: 6 });
  });

  it('refuses to reconnect an expired oauth connection', async () => {
    const r = await post('/api/connections/conn-04/reconnect', { version: 7 });
    expect(r.status).toBe(409);
    expect(r.body.code).toBe('INVALID_STATE');
  });

  it('gives members a read-only role and no allowed actions', async () => {
    window.localStorage.setItem('mockScenario', 'forbidden');
    try {
      expect((await call('/api/me')).body.role).toBe('member');
      expect((await call('/api/connections/conn-01')).body.allowedActions).toEqual([]);
    } finally {
      window.localStorage.removeItem('mockScenario');
    }
  });
});
