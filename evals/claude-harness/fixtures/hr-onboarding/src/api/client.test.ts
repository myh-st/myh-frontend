import { createBackend } from '../mock/framework';
import { routes, resetMockData, setMockUser } from '../mock/routes';

const backend = createBackend(routes, { latencyMs: 0 });
const call = async (url: string, init?: RequestInit) => {
  const r = await backend(`http://localhost${url}`, init);
  return { status: r.status, body: await r.json() };
};
const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

describe('HR Onboarding API contract', () => {
  beforeEach(() => resetMockData());

  it('filters hires by cohort and status', async () => {
    const { body } = await call('/api/hires?cohort=c-2026-10a&status=blocked');
    expect(body.map((h: { id: string }) => h.id)).toEqual(['H-1003']);
  });

  it('scopes hiring managers to their direct reports', async () => {
    setMockUser('u-mgr-01');
    const { body } = await call('/api/hires');
    expect(body.map((h: { id: string }) => h.id)).toEqual(['H-1001', 'H-1004', 'H-1005', 'H-1008']);
    expect((await call('/api/hires/H-1002')).status).toBe(403);
  });

  it('rejects completing a task whose dependencies are not done', async () => {
    const r = await call('/api/hires/H-1004/tasks/tsk-payroll', json('PATCH', { version: 3, status: 'done' }));
    expect(r.status).toBe(409);
    expect(r.body.code).toBe('DEPENDENCY_INCOMPLETE');
  });

  it('rejects a task update with a stale version', async () => {
    const r = await call('/api/hires/H-1001/tasks/tsk-payroll', json('PATCH', { version: 1, status: 'done' }));
    expect(r.status).toBe(409);
    expect(r.body.code).toBe('STALE_VERSION');
  });

  it('lets the named approver approve and returns the updated hire', async () => {
    setMockUser('u-mgr-01');
    const r = await call('/api/hires/H-1005/approvals/tsk-bonus', json('POST', { version: 12, decision: 'approve', comment: '' }));
    expect(r.status).toBe(200);
    expect(r.body.version).toBe(13);
    const task = r.body.tasks.find((t: { id: string }) => t.id === 'tsk-bonus');
    expect(task.status).toBe('done');
    expect(task.approval.status).toBe('approved');
  });

  it('validates info requests', async () => {
    const r = await call('/api/hires/H-1004/info-requests', json('POST', { version: 3, fields: [], message: 'Please send' }));
    expect(r.status).toBe(422);
    expect(r.body.code).toBe('VALIDATION');
  });
});
