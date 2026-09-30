import { createBackend } from '../mock/framework';
import { routes, resetMockData } from '../mock/routes';

const backend = createBackend(routes, { latencyMs: 0 });
const call = async (url: string, init?: RequestInit) => {
  const r = await backend(`http://localhost${url}`, init);
  return { status: r.status, body: await r.json() };
};
const post = (url: string, body?: unknown) => call(url, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });

async function pollUntil(runId: string, done: (status: string) => boolean) {
  for (let i = 0; i < 20; i++) {
    const { body } = await call(`/api/runs/${runId}`);
    if (done(body.status)) return body;
  }
  throw new Error('run did not settle');
}

describe('Agent Runtime API contract', () => {
  beforeEach(() => resetMockData());

  it('starts a billable run only on message POST and progresses it over polls', async () => {
    const before = await call('/api/workspace/scope');
    const r = await post('/api/conversations/c-101/messages', { content: 'Summarise the churn drivers for the exec review', allowActions: false });
    expect(r.status).toBe(201);
    expect(r.body.estimate.costUsd).toBeGreaterThan(0);
    const after = await call('/api/workspace/scope');
    expect(after.body.budget.usedUsd).toBeGreaterThan(before.body.budget.usedUsd);
    const run = await pollUntil(r.body.runId, (s) => s === 'completed');
    expect(run.answer.citations.length).toBeGreaterThan(0);
    expect(run.proposedActions).toEqual([]);
  });

  it('rejects empty content and a second run while one is active', async () => {
    expect((await post('/api/conversations/c-101/messages', { content: '  ', allowActions: true })).status).toBe(422);
    const busy = await post('/api/conversations/c-102/messages', { content: 'Also post in #sales', allowActions: true });
    expect(busy.status).toBe(409);
    expect(busy.body.code).toBe('RUN_IN_PROGRESS');
  });

  it('rejects approval with a stale version', async () => {
    const r = await post('/api/runs/run-7702/actions/act-7702-1/approve', { version: 0 });
    expect(r.status).toBe(409);
    expect(r.body.code).toBe('STALE_VERSION');
  });

  it('executes approved actions into a partially failed run with a receipt, then retries', async () => {
    const a1 = await post('/api/runs/run-7702/actions/act-7702-1/approve', { version: 1 });
    expect(a1.body.status).toBe('awaiting_approval');
    const a2 = await post('/api/runs/run-7702/actions/act-7702-2/approve', { version: 1 });
    expect(a2.body.status).toBe('running');
    const run = await pollUntil('run-7702', (s) => s === 'partially_failed');
    expect(run.receipt.actions).toEqual([
      { actionId: 'act-7702-1', status: 'succeeded', externalRef: 'INTEG-1187' },
      expect.objectContaining({ actionId: 'act-7702-2', status: 'failed' }),
    ]);
    const failed = run.proposedActions.find((a: { id: string }) => a.id === 'act-7702-2');
    expect(failed.allowedActions).toEqual(['retry']);
    const retry = await post('/api/runs/run-7702/actions/act-7702-2/retry', { version: failed.version });
    expect(retry.status).toBe(200);
    const settled = await pollUntil('run-7702', (s) => s === 'completed');
    expect(settled.receipt.actions[1]).toEqual({ actionId: 'act-7702-2', status: 'succeeded', externalRef: '0065g00000XyZ12' });
  });

  it('requires a reason to reject an action', async () => {
    const r = await post('/api/runs/run-7702/actions/act-7702-2/reject', { version: 1, reason: '' });
    expect(r.status).toBe(422);
    expect(r.body.code).toBe('VALIDATION');
  });
});
