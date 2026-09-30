import { createBackend } from '../mock/framework';
import { routes, resetMockData } from '../mock/routes';

const backend = createBackend(routes, { latencyMs: 0 });
const call = async (url: string, init?: RequestInit) => {
  const r = await backend(`http://localhost${url}`, init);
  return { status: r.status, body: await r.json() };
};

describe('Patient Flow API contract', () => {
  beforeEach(() => resetMockData());

  it('filters alerts by ward and urgency', async () => {
    const { body } = await call('/api/alerts?ward=w-med3&urgency=critical');
    expect(body.map((a: { id: string }) => a.id)).toEqual(['AL-2027']);
  });

  it('rejects acknowledge with a stale version', async () => {
    const r = await call('/api/alerts/AL-2041/acknowledge', { method: 'POST', body: JSON.stringify({ version: 1 }) });
    expect(r.status).toBe(409);
    expect(r.body.code).toBe('STALE_VERSION');
  });

  it('escalates with a reason and known target', async () => {
    const r = await call('/api/alerts/AL-2041/escalate', {
      method: 'POST',
      body: JSON.stringify({ version: 3, reason: 'No ICU capacity', target: 'Site manager' }),
    });
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('escalated');
  });
});
