/**
 * BACKEND-OWNED: route handlers mirroring the production Case Management API.
 * Maintained by the backend team. Frontend changes must not modify it.
 *
 * Mock session user: append `?user=officer|officer2|supervisor|viewer` to the page URL
 * (or set localStorage.mockUser). Defaults to `officer`.
 */
import type { MockResponse, Route, Scenario } from './framework';
import type { AuditAction, CaseAction, CaseDetail, CaseState, CaseSummary, Decision, DecisionKind, EvidenceKind, Me, StaffRef } from '../api/types';
import { DOC_NAMES, computeSlaStatus, seedCases, serviceTypes, users, type CaseRecord } from './data';

let cases: CaseRecord[] = seedCases();
let userOverride: string | null = null;
let seq = 100;

export function resetMockData() {
  cases = seedCases();
  userOverride = null;
  seq = 100;
}

/** Test helper: act as a different session user (`officer`, `officer2`, `supervisor`, `viewer`). */
export function setMockUser(alias: string | null) {
  userOverride = alias;
}

const ALIASES: Record<string, string> = { officer: 'u-off-01', officer2: 'u-off-02', supervisor: 'u-sup-01', viewer: 'u-ro-01' };

function sessionUser(scenario: Scenario): Me {
  let alias = userOverride;
  if (!alias && typeof window !== 'undefined') {
    alias = new URLSearchParams(window.location.search).get('user');
    if (!alias) {
      try {
        alias = window.localStorage.getItem('mockUser');
      } catch {
        alias = null;
      }
    }
  }
  const user = users.find((u) => u.id === ALIASES[alias ?? 'officer']) ?? users[0];
  return scenario === 'forbidden' ? { ...user, role: 'read_only' } : user;
}

const ref = (u: Me): StaffRef => ({ id: u.id, name: u.name });
const err = (status: number, code: string, message: string): MockResponse => ({ status, body: { code, message } });
const notFound = () => err(404, 'NOT_FOUND', 'Case not found');
const stale = () => err(409, 'STALE_VERSION', 'This case was changed by someone else. Reload to see the latest version.');
const invalid = (message: string) => err(422, 'VALIDATION', message);
const blank = (v: unknown) => typeof v !== 'string' || !v.trim();

const OPEN_STATES: CaseState[] = ['submitted', 'in_review', 'awaiting_info'];

function canWork(user: Me, c: CaseRecord) {
  if (user.role === 'supervisor') return true;
  return user.role === 'case_officer' && c.assignee?.id === user.id;
}

function allowedActions(user: Me, c: CaseRecord): CaseAction[] {
  const actions: CaseAction[] = [];
  if (canWork(user, c)) {
    if (c.state === 'submitted' || c.state === 'in_review') actions.push('request_info');
    if (OPEN_STATES.includes(c.state)) actions.push('decide');
  }
  if (user.role === 'supervisor' && c.state === 'pending_supervisor' && c.pendingDecision && c.pendingDecision.decidedBy.id !== user.id) {
    actions.push('approve_decision', 'return_decision');
  }
  return actions;
}

const isStaleSource = (c: CaseRecord, scenario: Scenario) => scenario === 'partial' && c.serviceType === 'svc-building-permit';

function summary(c: CaseRecord, scenario: Scenario): CaseSummary {
  const s: CaseSummary = {
    id: c.id,
    serviceType: c.serviceType,
    applicantName: c.applicantName,
    state: c.state,
    assignee: c.assignee,
    submittedAt: c.submittedAt,
    slaDueAt: c.slaDueAt,
    slaStatus: computeSlaStatus(c.state, c.slaDueAt),
    lastActivityAt: c.lastActivityAt,
  };
  if (isStaleSource(c, scenario)) s.dataStatus = 'stale';
  return s;
}

function detail(c: CaseRecord, user: Me, scenario: Scenario): CaseDetail {
  const d: CaseDetail = {
    ...(JSON.parse(JSON.stringify(c)) as CaseRecord),
    slaStatus: computeSlaStatus(c.state, c.slaDueAt),
    allowedActions: allowedActions(user, c),
    unavailableSources: [],
  };
  if (scenario === 'partial') {
    d.unavailableSources = ['civil_registry'];
    d.applicant.registryCheck = { status: 'unavailable', checkedAt: null };
    if (isStaleSource(c, scenario)) d.dataStatus = 'stale';
  }
  return d;
}

function touch(c: CaseRecord, user: Me, action: AuditAction, th: string, en: string) {
  const at = new Date().toISOString();
  c.audit = [...c.audit, { id: `AUD-${++seq}`, at, actor: ref(user), action, details: { th, en } }];
  c.lastActivityAt = at;
  c.version += 1;
}

const DECISION_LABEL: Record<DecisionKind, { th: string; en: string }> = {
  approve: { th: 'อนุญาต', en: 'Approve' },
  reject: { th: 'ไม่อนุญาต', en: 'Reject' },
  waive_fee: { th: 'อนุญาตพร้อมยกเว้นค่าธรรมเนียม', en: 'Approve with fee waiver' },
};
const finalState = (d: DecisionKind): CaseState => (d === 'reject' ? 'rejected' : 'approved');

export const routes: Route[] = [
  { method: 'GET', pattern: '/api/me', handler: ({ scenario }) => ({ status: 200, body: sessionUser(scenario) }) },
  { method: 'GET', pattern: '/api/service-types', handler: ({ scenario }) => ({ status: 200, body: scenario === 'empty' ? [] : serviceTypes }) },
  {
    method: 'GET',
    pattern: '/api/cases',
    handler: ({ query, scenario }) => {
      if (scenario === 'empty') return { status: 200, body: [] };
      const user = sessionUser(scenario);
      let list = cases;
      const assignee = query.get('assignee');
      const serviceType = query.get('serviceType');
      const state = query.get('state');
      const q = query.get('q')?.trim().toLowerCase();
      if (assignee && assignee !== 'me' && assignee !== 'all') return invalid('assignee must be "me" or "all"');
      if (assignee === 'me') list = list.filter((c) => c.assignee?.id === user.id);
      if (serviceType) list = list.filter((c) => c.serviceType === serviceType);
      if (state) list = list.filter((c) => c.state === state);
      if (q) {
        list = list.filter((c) =>
          [c.id, c.applicantName.th, c.applicantName.en ?? ''].some((v) => v.toLowerCase().includes(q)),
        );
      }
      return { status: 200, body: list.map((c) => summary(c, scenario)) };
    },
  },
  {
    method: 'GET',
    pattern: '/api/cases/:id',
    handler: ({ params, scenario }) => {
      const c = cases.find((x) => x.id === params.id);
      return c ? { status: 200, body: detail(c, sessionUser(scenario), scenario) } : notFound();
    },
  },
  {
    method: 'POST',
    pattern: '/api/cases/:id/info-requests',
    handler: ({ params, body, scenario }) => {
      const c = cases.find((x) => x.id === params.id);
      if (!c) return notFound();
      const user = sessionUser(scenario);
      if (!canWork(user, c)) return err(403, 'FORBIDDEN', 'You are not permitted to act on this case');
      const b = (body ?? {}) as { version?: number; items?: { documentKind?: string; note?: string }[]; messageTh?: string; messageEn?: string; responseDueAt?: string };
      if (b.version !== c.version) return stale();
      if (c.state !== 'submitted' && c.state !== 'in_review') return err(409, 'INVALID_STATE', `Cannot request information while case is ${c.state}`);
      if (blank(b.messageTh)) return invalid('messageTh is required');
      if (blank(b.messageEn)) return invalid('messageEn is required');
      if (!Array.isArray(b.items)) return invalid('items must be an array');
      if (b.items.some((i) => !i.documentKind || !(i.documentKind in DOC_NAMES))) return invalid('Unknown documentKind in items');
      const due = b.responseDueAt ? new Date(b.responseDueAt).getTime() : NaN;
      if (Number.isNaN(due) || due <= Date.now()) return invalid('responseDueAt must be a future date');
      c.infoRequests = [
        ...c.infoRequests,
        {
          id: `IR-${c.id.slice(-4)}-${c.infoRequests.length + 1}`,
          requestedAt: new Date().toISOString(),
          requestedBy: ref(user),
          items: b.items.map((i) => ({ documentKind: i.documentKind as EvidenceKind, note: i.note ?? '' })),
          messageTh: b.messageTh!.trim(),
          messageEn: b.messageEn!.trim(),
          responseDueAt: new Date(due).toISOString(),
          status: 'open',
          respondedAt: null,
        },
      ];
      c.state = 'awaiting_info';
      const kinds = b.items.map((i) => DOC_NAMES[i.documentKind as EvidenceKind]);
      touch(
        c,
        user,
        'info_requested',
        `ขอข้อมูลเพิ่มเติม${kinds.length ? `: ${kinds.map((k) => k.th).join(', ')}` : ''}`,
        `Requested additional information${kinds.length ? `: ${kinds.map((k) => k.en).join(', ')}` : ''}`,
      );
      return { status: 200, body: detail(c, user, scenario) };
    },
  },
  {
    method: 'POST',
    pattern: '/api/cases/:id/decisions',
    handler: ({ params, body, scenario }) => {
      const c = cases.find((x) => x.id === params.id);
      if (!c) return notFound();
      const user = sessionUser(scenario);
      if (!canWork(user, c)) return err(403, 'FORBIDDEN', 'You are not permitted to act on this case');
      const b = (body ?? {}) as { version?: number; decision?: DecisionKind; reasonTh?: string; reasonEn?: string };
      if (b.version !== c.version) return stale();
      if (!OPEN_STATES.includes(c.state)) return err(409, 'INVALID_STATE', `Cannot record a decision while case is ${c.state}`);
      const svc = serviceTypes.find((t) => t.id === c.serviceType)!;
      if (!b.decision || !svc.decisions.includes(b.decision)) return invalid('decision is not available for this service type');
      if (blank(b.reasonTh)) return invalid('reasonTh is required');
      if (blank(b.reasonEn)) return invalid('reasonEn is required');
      const needsApproval = svc.decisionsRequiringApproval.includes(b.decision);
      const decision: Decision = {
        id: `DEC-${c.id.slice(-4)}-${c.decisions.length + 1}`,
        decision: b.decision,
        reasonTh: b.reasonTh!.trim(),
        reasonEn: b.reasonEn!.trim(),
        decidedBy: ref(user),
        decidedAt: new Date().toISOString(),
        status: needsApproval ? 'pending_approval' : 'final',
        review: null,
      };
      c.decisions = [...c.decisions, decision];
      const label = DECISION_LABEL[b.decision];
      if (needsApproval) {
        c.state = 'pending_supervisor';
        c.pendingDecision = decision;
        touch(c, user, 'decision_submitted_for_approval', `เสนอ${label.th} รอผู้บังคับบัญชาอนุมัติ`, `Proposed "${label.en}" – awaiting supervisor sign-off`);
      } else {
        c.state = finalState(b.decision);
        c.pendingDecision = null;
        touch(c, user, 'decision_recorded', `มีคำสั่ง${label.th}`, `Decision recorded: ${label.en}`);
      }
      return { status: 200, body: detail(c, user, scenario) };
    },
  },
  {
    method: 'POST',
    pattern: '/api/cases/:id/decisions/:decisionId/approve',
    handler: ({ params, body, scenario }) => {
      const c = cases.find((x) => x.id === params.id);
      if (!c) return notFound();
      const d = c.decisions.find((x) => x.id === params.decisionId);
      if (!d) return err(404, 'NOT_FOUND', 'Decision not found');
      const user = sessionUser(scenario);
      if (user.role !== 'supervisor') return err(403, 'FORBIDDEN', 'Only a supervisor can approve decisions');
      if (d.decidedBy.id === user.id) return err(403, 'FORBIDDEN', 'You cannot approve your own decision');
      const b = (body ?? {}) as { version?: number };
      if (b.version !== c.version) return stale();
      if (c.state !== 'pending_supervisor' || c.pendingDecision?.id !== d.id) return err(409, 'INVALID_STATE', 'This decision is not awaiting approval');
      const reviewed: Decision = { ...d, status: 'final', review: { by: ref(user), at: new Date().toISOString(), outcome: 'approved', comment: null } };
      c.decisions = c.decisions.map((x) => (x.id === d.id ? reviewed : x));
      c.pendingDecision = null;
      c.state = finalState(d.decision);
      const label = DECISION_LABEL[d.decision];
      touch(c, user, 'decision_approved', `อนุมัติคำสั่ง${label.th}`, `Approved decision: ${label.en}`);
      return { status: 200, body: detail(c, user, scenario) };
    },
  },
  {
    method: 'POST',
    pattern: '/api/cases/:id/decisions/:decisionId/return',
    handler: ({ params, body, scenario }) => {
      const c = cases.find((x) => x.id === params.id);
      if (!c) return notFound();
      const d = c.decisions.find((x) => x.id === params.decisionId);
      if (!d) return err(404, 'NOT_FOUND', 'Decision not found');
      const user = sessionUser(scenario);
      if (user.role !== 'supervisor') return err(403, 'FORBIDDEN', 'Only a supervisor can return decisions');
      if (d.decidedBy.id === user.id) return err(403, 'FORBIDDEN', 'You cannot review your own decision');
      const b = (body ?? {}) as { version?: number; comment?: string };
      if (b.version !== c.version) return stale();
      if (c.state !== 'pending_supervisor' || c.pendingDecision?.id !== d.id) return err(409, 'INVALID_STATE', 'This decision is not awaiting approval');
      if (blank(b.comment)) return invalid('comment is required');
      const reviewed: Decision = { ...d, status: 'returned', review: { by: ref(user), at: new Date().toISOString(), outcome: 'returned', comment: b.comment!.trim() } };
      c.decisions = c.decisions.map((x) => (x.id === d.id ? reviewed : x));
      c.pendingDecision = null;
      c.state = 'in_review';
      touch(c, user, 'decision_returned', `ส่งคืนคำสั่งเพื่อทบทวน: ${b.comment!.trim()}`, `Decision returned for review: ${b.comment!.trim()}`);
      return { status: 200, body: detail(c, user, scenario) };
    },
  },
];
