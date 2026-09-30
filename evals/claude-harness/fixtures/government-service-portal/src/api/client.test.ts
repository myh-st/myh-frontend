import { createBackend } from '../mock/framework';
import { routes, resetMockData, setMockUser } from '../mock/routes';

const backend = createBackend(routes, { latencyMs: 0 });
const call = async (url: string, init?: RequestInit) => {
  const r = await backend(`http://localhost${url}`, init);
  return { status: r.status, body: await r.json() };
};
const post = (url: string, body: unknown) => call(url, { method: 'POST', body: JSON.stringify(body) });
const future = () => new Date(Date.now() + 7 * 86_400_000).toISOString();

describe('Case Management API contract', () => {
  beforeEach(() => resetMockData());

  it('filters cases by assignee, state and search text', async () => {
    const mine = await call('/api/cases?assignee=me&state=in_review');
    expect(mine.body.map((c: { id: string }) => c.id)).toEqual(['BKK-2569-004213', 'BKK-2569-004244']);
    const search = await call(`/api/cases?q=${encodeURIComponent('เจริญรุ่งเรือง')}`);
    expect(search.body.map((c: { id: string }) => c.id)).toEqual(['BKK-2569-004150']);
  });

  it('returns server-computed allowed actions', async () => {
    const { body } = await call('/api/cases/BKK-2569-004213');
    expect(body.allowedActions).toEqual(['request_info', 'decide']);
    const other = await call('/api/cases/BKK-2569-004088');
    expect(other.body.allowedActions).toEqual([]);
  });

  it('rejects an info request without a message', async () => {
    const r = await post('/api/cases/BKK-2569-004213/info-requests', { version: 3, items: [], messageTh: '', messageEn: 'x', responseDueAt: future() });
    expect(r.status).toBe(422);
    expect(r.body.code).toBe('VALIDATION');
  });

  it('rejects a mutation with a stale version', async () => {
    const r = await post('/api/cases/BKK-2569-004213/info-requests', { version: 1, items: [], messageTh: 'ก', messageEn: 'a', responseDueAt: future() });
    expect(r.status).toBe(409);
    expect(r.body.code).toBe('STALE_VERSION');
  });

  it('moves a case to awaiting_info when information is requested', async () => {
    const r = await post('/api/cases/BKK-2569-004213/info-requests', {
      version: 3,
      items: [{ documentKind: 'health_certificate', note: 'ใบรับรองแพทย์ฉบับปัจจุบัน' }],
      messageTh: 'กรุณาส่งใบรับรองแพทย์ฉบับปัจจุบัน',
      messageEn: 'Please provide current medical certificates.',
      responseDueAt: future(),
    });
    expect(r.status).toBe(200);
    expect(r.body.state).toBe('awaiting_info');
    expect(r.body.version).toBe(4);
    expect(r.body.audit.at(-1).action).toBe('info_requested');
  });

  it('records a final decision when no approval is required', async () => {
    const r = await post('/api/cases/BKK-2569-004244/decisions', { version: 2, decision: 'approve', reasonTh: 'คุณสมบัติครบ', reasonEn: 'Eligible' });
    expect(r.status).toBe(200);
    expect(r.body.state).toBe('approved');
    expect(r.body.pendingDecision).toBeNull();
  });

  it('routes decisions that need approval to a supervisor', async () => {
    const r = await post('/api/cases/BKK-2569-004213/decisions', { version: 3, decision: 'reject', reasonTh: 'เอกสารไม่ครบ', reasonEn: 'Incomplete documents' });
    expect(r.body.state).toBe('pending_supervisor');
    const decisionId = r.body.pendingDecision.id;
    const denied = await post(`/api/cases/BKK-2569-004213/decisions/${decisionId}/approve`, { version: 4 });
    expect(denied.status).toBe(403);
    setMockUser('supervisor');
    const ok = await post(`/api/cases/BKK-2569-004213/decisions/${decisionId}/approve`, { version: 4 });
    expect(ok.status).toBe(200);
    expect(ok.body.state).toBe('rejected');
  });

  it('lets a supervisor return a pending decision with a comment', async () => {
    setMockUser('supervisor');
    const missing = await post('/api/cases/BKK-2569-004060/decisions/DEC-4060-1/return', { version: 5, comment: ' ' });
    expect(missing.status).toBe(422);
    const r = await post('/api/cases/BKK-2569-004060/decisions/DEC-4060-1/return', { version: 5, comment: 'ขอหลักฐานสถานะมูลนิธิ' });
    expect(r.body.state).toBe('in_review');
    expect(r.body.decisions[0].status).toBe('returned');
  });
});
