import { createBackend } from '../mock/framework';
import { routes, resetMockData } from '../mock/routes';

const backend = createBackend(routes, { latencyMs: 0 });
const call = async (url: string, init?: RequestInit) => {
  const r = await backend(`http://localhost${url}`, init);
  return { status: r.status, body: await r.json() };
};
const post = (url: string, body: unknown) => call(url, { method: 'POST', body: JSON.stringify(body) });

describe('Fraud Case Service API contract', () => {
  beforeEach(() => resetMockData());
  afterEach(() => window.localStorage.removeItem('mockScenario'));

  it('filters alerts by severity and minimum confidence', async () => {
    const { body } = await call('/api/alerts?severity=critical&minConfidence=0.9');
    expect(body.map((a: { id: string }) => a.id)).toEqual(['AL-90415', 'AL-90310']);
  });

  it('rejects an out-of-range confidence filter', async () => {
    const r = await call('/api/alerts?minConfidence=1.5');
    expect(r.status).toBe(422);
    expect(r.body.code).toBe('VALIDATION');
  });

  it('rejects a decision with a stale version', async () => {
    const r = await post('/api/cases/CASE-3107/decision', { version: 2, outcome: 'confirmed_fraud', rationale: 'Customer confirmed no transfers were made.' });
    expect(r.status).toBe(409);
    expect(r.body.code).toBe('STALE_VERSION');
  });

  it('records a decision and emits an audit event server-side', async () => {
    const short = await post('/api/cases/CASE-3107/decision', { version: 4, outcome: 'confirmed_fraud', rationale: 'yes' });
    expect(short.status).toBe(422);
    const r = await post('/api/cases/CASE-3107/decision', { version: 4, outcome: 'confirmed_fraud', rationale: 'Customer confirmed by call-back that none of the four transfers were made by them.' });
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('decision_recorded');
    expect(r.body.version).toBe(5);
    const audit = await call('/api/cases/CASE-3107/audit');
    expect(audit.body.at(-1).action).toBe('decision_recorded');
  });

  it('creates a freeze request that needs a second approver', async () => {
    const r = await post('/api/cases/CASE-3107/freeze-requests', {
      version: 4,
      accountIds: ['ACC-2201', 'ACC-7310'],
      reason: 'Account takeover in progress; stop further outbound transfers.',
    });
    expect(r.status).toBe(201);
    expect(r.body.status).toBe('pending_approval');
    expect(r.body.scope.estimatedImpact).toEqual({ pendingPayments: 2, scheduledTransfers: 4, cardsAffected: 2 });
    expect(r.body.allowedActions).toEqual([]);
    const c = await call('/api/cases/CASE-3107');
    expect(c.body.status).toBe('freeze_pending_approval');
    expect(c.body.activeFreezeRequestId).toBe(r.body.id);
  });

  it('does not allow the requester to approve their own freeze', async () => {
    const r = await post('/api/freeze-requests/FRZ-0417/approve', { version: 1 });
    expect(r.status).toBe(403);
    expect(r.body.code).toBe('SELF_APPROVAL_NOT_ALLOWED');
  });

  it('executes a freeze approved by a different senior investigator', async () => {
    const r = await post('/api/freeze-requests/FRZ-0419/approve', { version: 1 });
    expect(r.status).toBe(200);
    expect(r.body.receipt.accountsFrozen).toEqual(['ACC-0932']);
    expect(r.body.receipt.referenceNo).toMatch(/^SNT-2026-\d{6}$/);
    expect(r.body.case.status).toBe('frozen');
    const audit = await call('/api/cases/CASE-3102/audit');
    expect(audit.body.map((e: { action: string }) => e.action)).toContain('freeze_executed');
  });

  it('returns a read-only auditor session in the forbidden scenario', async () => {
    window.localStorage.setItem('mockScenario', 'forbidden');
    expect((await call('/api/me')).body.role).toBe('auditor');
    expect((await call('/api/cases/CASE-3107')).body.allowedActions).toEqual([]);
  });
});
