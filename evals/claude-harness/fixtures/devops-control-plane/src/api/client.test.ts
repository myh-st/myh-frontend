import { createBackend } from '../mock/framework';
import { routes, resetMockData } from '../mock/routes';

const backend = createBackend(routes, { latencyMs: 0 });
const call = async (url: string, init?: RequestInit) => {
  const r = await backend(`http://localhost${url}`, init);
  return { status: r.status, body: await r.json() };
};
const post = (url: string, body: unknown) => call(url, { method: 'POST', body: JSON.stringify(body) });

describe('Beacon Incident Platform API contract', () => {
  beforeEach(() => resetMockData());
  afterEach(() => window.localStorage.removeItem('mockScenario'));

  it('filters incidents by status', async () => {
    const { body } = await call('/api/incidents?status=resolved');
    expect(body.map((i: { id: string }) => i.id)).toEqual(['INC-4803', 'INC-4798']);
  });

  it('exposes allowedActions per role and downgrades to observer when forbidden', async () => {
    expect((await call('/api/incidents/INC-4821')).body.allowedActions).toContain('approve_remediation');
    window.localStorage.setItem('mockScenario', 'forbidden');
    expect((await call('/api/me')).body.role).toBe('observer');
    expect((await call('/api/incidents/INC-4821')).body.allowedActions).toEqual([]);
  });

  it('reports unavailable metric sources in the partial scenario', async () => {
    window.localStorage.setItem('mockScenario', 'partial');
    const { body } = await call('/api/incidents/INC-4821/telemetry/metrics');
    expect(body.unavailableSources).toEqual(['k8s-metrics-eu-west-1']);
  });

  it('runs an investigation that completes after two polls', async () => {
    const start = await post('/api/incidents/INC-4821/investigations', { version: 7 });
    expect(start.status).toBe(202);
    expect(start.body.estimatedCostUsd).toBeGreaterThan(0);
    expect((await call(`/api/investigations/${start.body.investigationId}`)).body.status).toBe('running');
    const done = await call(`/api/investigations/${start.body.investigationId}`);
    expect(done.body.status).toBe('completed');
    expect(done.body.hypotheses[0].evidence.length).toBeGreaterThan(0);
  });

  it('rejects approval with a stale version', async () => {
    const r = await post('/api/remediations/RM-901/approve', { version: 0 });
    expect(r.status).toBe(409);
    expect(r.body.code).toBe('STALE_VERSION');
  });

  it('approves, executes and records a receipt', async () => {
    const approved = await post('/api/remediations/RM-902/approve', { version: 1 });
    expect(approved.body.status).toBe('approved');
    const exec = await post('/api/remediations/RM-902/execute', { version: approved.body.version, approvalId: approved.body.approval.approvalId });
    expect(exec.status).toBe(202);
    let ex = (await call(`/api/executions/${exec.body.executionId}`)).body;
    while (ex.status === 'queued' || ex.status === 'running') ex = (await call(`/api/executions/${exec.body.executionId}`)).body;
    expect(ex.status).toBe('succeeded');
    expect(ex.receipt.changes).toHaveLength(1);
  });

  it('fails RM-911 at step 2 and allows rollback', async () => {
    const approved = await post('/api/remediations/RM-911/approve', { version: 1 });
    const exec = await post('/api/remediations/RM-911/execute', { version: approved.body.version, approvalId: approved.body.approval.approvalId });
    let ex = (await call(`/api/executions/${exec.body.executionId}`)).body;
    while (ex.status === 'queued' || ex.status === 'running') ex = (await call(`/api/executions/${exec.body.executionId}`)).body;
    expect(ex.status).toBe('failed');
    expect(ex.steps[1].status).toBe('failed');
    const rb = await post(`/api/executions/${ex.id}/rollback`, { version: ex.version });
    expect(rb.status).toBe(200);
    expect(rb.body.status).toBe('rolled_back');
  });
});
