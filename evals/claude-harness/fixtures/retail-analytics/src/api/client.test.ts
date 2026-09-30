import { createBackend } from '../mock/framework';
import { routes, resetMockData, setMockSession } from '../mock/routes';

const backend = createBackend(routes, { latencyMs: 0 });
const call = async (url: string, init?: RequestInit) => {
  const r = await backend(`http://localhost${url}`, init);
  return { status: r.status, body: await r.json() };
};
const range = 'from=2026-07-01&to=2026-09-28';
const withScenario = async <T,>(scenario: string, fn: () => Promise<T>) => {
  localStorage.setItem('mockScenario', scenario);
  try {
    return await fn();
  } finally {
    localStorage.removeItem('mockScenario');
  }
};

describe('Reporting API contract', () => {
  beforeEach(() => resetMockData());

  it('returns deterministic daily timeseries with an aligned comparison period', async () => {
    const a = await call(`/api/reports/timeseries?${range}&granularity=day`);
    const b = await call(`/api/reports/timeseries?${range}&granularity=day`);
    expect(a.status).toBe(200);
    expect(a.body.points).toHaveLength(90);
    expect(a.body.comparisonPoints).toHaveLength(90);
    expect(a.body.comparisonRange).toEqual({ from: '2026-04-02', to: '2026-06-30' });
    expect(a.body.totals.grossMargin).toBeGreaterThan(0);
    expect(a.body.totals.grossMargin).toBeLessThan(1);
    expect(a.body).toEqual(b.body);
  });

  it('buckets weekly points on Mondays and validates the range', async () => {
    const r = await call(`/api/reports/timeseries?${range}&granularity=week&region=r-mw`);
    expect(r.body.points.every((p: { date: string }) => new Date(`${p.date}T00:00:00Z`).getUTCDay() === 1)).toBe(true);
    const bad = await call('/api/reports/timeseries?from=2026-09-10&to=2026-09-01');
    expect(bad.status).toBe(422);
    expect(bad.body.code).toBe('VALIDATION');
  });

  it('breaks down revenue by region, sorted descending, margin as a percentage', async () => {
    const r = await call(`/api/reports/breakdown?${range}&dimension=region&metric=revenue`);
    expect(r.body.rows.map((x: { key: string }) => x.key).sort()).toEqual(['r-mw', 'r-ne', 'r-se', 'r-w']);
    const revenues = r.body.rows.map((x: { revenue: number }) => x.revenue);
    expect(revenues).toEqual([...revenues].sort((x, y) => y - x));
    expect(r.body.rows[0].marginPct).toBeGreaterThan(1);
  });

  it('filters anomalies by date range and store (category and segment anomalies apply to every store)', async () => {
    const all = await call(`/api/reports/anomalies?${range}`);
    expect(all.body).toHaveLength(8);
    const one = await call(`/api/reports/anomalies?${range}&store=st-401`);
    expect(one.body.map((a: { id: string }) => a.id)).toEqual(['an-3110', 'an-3098', 'an-3091', 'an-3073', 'an-3066']);
  });

  it('reports missing stores in the partial scenario', async () => {
    const r = await withScenario('partial', () => call(`/api/reports/breakdown?${range}&dimension=store`));
    expect(r.body.dataQuality.status).toBe('partial');
    expect(r.body.dataQuality.missingStores).toEqual(['st-302', 'st-402']);
    expect(r.body.rows.some((x: { key: string }) => x.key === 'st-302')).toBe(false);
  });

  it('returns store detail with category rows and no comparison for a new store', async () => {
    const r = await call('/api/reports/stores/st-303?from=2026-07-01&to=2026-09-28');
    expect(r.body.categories).toHaveLength(6);
    const fresh = await call('/api/reports/stores/st-303?from=2026-06-13&to=2026-07-12');
    expect(fresh.body.comparisonTotals).toBeNull();
    expect((await call('/api/reports/stores/st-999?from=2026-07-01&to=2026-09-28')).status).toBe(404);
  });

  it('scopes regional managers to their regions', async () => {
    setMockSession('regional_manager');
    const r = await call(`/api/reports/breakdown?${range}&dimension=region`);
    expect(r.body.rows.map((x: { key: string }) => x.key)).toEqual(['r-se']);
    expect((await call(`/api/reports/timeseries?${range}&region=r-ne`)).status).toBe(403);
    expect((await call('/api/reports/stores/st-101?from=2026-07-01&to=2026-09-28')).status).toBe(403);
  });

  it('queues an export that becomes ready after two polls', async () => {
    const body = { filters: { from: '2026-07-01', to: '2026-09-28', region: 'r-ne' }, format: 'csv', dataVersion: 318 };
    const created = await call('/api/exports', { method: 'POST', body: JSON.stringify(body) });
    expect(created.status).toBe(202);
    expect(created.body.status).toBe('queued');
    const id = created.body.exportId;
    expect((await call(`/api/exports/${id}`)).body.status).toBe('running');
    const ready = await call(`/api/exports/${id}`);
    expect(ready.body.status).toBe('ready');
    expect(ready.body.rowCount).toBeGreaterThan(0);
    expect(ready.body.downloadUrl).toContain(id);
    expect(ready.body.filtersApplied.regions).toEqual(['r-ne']);
  });

  it('rejects exports with a stale data version, bad input or a viewer role', async () => {
    const post = (b: unknown) => call('/api/exports', { method: 'POST', body: JSON.stringify(b) });
    const filters = { from: '2026-07-01', to: '2026-09-28' };
    const stale = await post({ filters, format: 'csv', dataVersion: 317 });
    expect(stale.status).toBe(409);
    expect(stale.body.code).toBe('STALE_VERSION');
    expect((await post({ filters, format: 'pdf', dataVersion: 318 })).status).toBe(422);
    setMockSession('viewer');
    expect((await post({ filters, format: 'csv', dataVersion: 318 })).status).toBe(403);
    const me = await withScenario('forbidden', () => call('/api/me'));
    expect(me.body.role).toBe('viewer');
  });
});
