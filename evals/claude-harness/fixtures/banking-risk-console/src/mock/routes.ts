/**
 * BACKEND-OWNED: route handlers mirroring the Fraud Case Service.
 * Authorization, validation, concurrency and audit emission live here, not in the UI.
 * Maintained by the backend team. Frontend changes must not modify it.
 */
import type { MockResponse, Route, Scenario } from './framework';
import type {
  AlertStatus,
  AuditEvent,
  CaseAction,
  CaseDetail,
  CaseStatus,
  DecisionOutcome,
  FreezeReceipt,
  FreezeRequest,
  FreezeRequestAction,
  Me,
  Severity,
  UserRef,
} from '../api/types';
import {
  auditorMe,
  impactOf,
  me,
  roles,
  seedAlerts,
  seedAudit,
  seedCases,
  seedFreezeRequests,
  users,
  type CaseRecord,
  type FreezeRecord,
} from './data';

let alerts = seedAlerts();
let cases = seedCases();
let freezeRequests = seedFreezeRequests();
let audit = seedAudit();
let seq = { freezeRequest: 420, freeze: 77121, reference: 4418, audit: 1000 };

export function resetMockData() {
  alerts = seedAlerts();
  cases = seedCases();
  freezeRequests = seedFreezeRequests();
  audit = seedAudit();
  seq = { freezeRequest: 420, freeze: 77121, reference: 4418, audit: 1000 };
}

const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low'];
const ALERT_STATUSES: AlertStatus[] = ['new', 'in_case', 'closed'];
const OUTCOMES: DecisionOutcome[] = ['confirmed_fraud', 'not_fraud', 'needs_more_info'];
const DECIDABLE: CaseStatus[] = ['open', 'under_review', 'decision_recorded'];
const FREEZABLE: CaseStatus[] = ['open', 'under_review', 'decision_recorded'];

const err = (status: number, code: string, message: string): MockResponse => ({ status, body: { code, message } });
const notFound = (what: string) => err(404, 'NOT_FOUND', `${what} not found`);
const stale = () => err(409, 'STALE_VERSION', 'This record was changed by someone else. Reload to see the latest version.');
const invalid = (message: string) => err(422, 'VALIDATION', message);
const nowIso = () => new Date().toISOString();
const ref = (u: UserRef): UserRef => ({ id: u.id, name: u.name });

const currentUser = (scenario: Scenario): Me => (scenario === 'forbidden' ? auditorMe : me);
const canInvestigate = (u: Me) => u.role === 'investigator' || u.role === 'senior_investigator';

function emit(caseId: string, actor: UserRef, action: AuditEvent['action'], details: string) {
  audit.push({
    id: `AUD-${String(++seq.audit).padStart(5, '0')}`,
    caseId,
    at: nowIso(),
    actor: { ...ref(actor), role: roles[actor.id] ?? 'investigator' },
    action,
    details,
  });
}

function caseActions(c: CaseRecord, u: Me): CaseAction[] {
  if (!canInvestigate(u)) return [];
  const out: CaseAction[] = [];
  const mayDecide = u.role === 'senior_investigator' || c.assignee?.id === u.id;
  if (mayDecide && DECIDABLE.includes(c.status)) out.push('record_decision');
  const hasActiveAccounts = c.relatedEntities.some((e) => e.type === 'account' && e.accountStatus === 'active');
  if (FREEZABLE.includes(c.status) && !c.activeFreezeRequestId && c.decision?.outcome !== 'not_fraud' && hasActiveAccounts) {
    out.push('request_freeze');
  }
  const active = freezeRequests.find((f) => f.id === c.activeFreezeRequestId);
  if (active && active.status === 'pending_approval' && u.role === 'senior_investigator' && active.requestedBy.id !== u.id) {
    out.push('approve_freeze', 'reject_freeze');
  }
  return out;
}

function freezeActions(f: FreezeRecord, u: Me): FreezeRequestAction[] {
  if (f.status !== 'pending_approval' || u.role !== 'senior_investigator' || f.requestedBy.id === u.id) return [];
  return ['approve', 'reject'];
}

function projectCase(c: CaseRecord, scenario: Scenario): CaseDetail {
  const u = currentUser(scenario);
  const base: CaseDetail = { ...c, allowedActions: caseActions(c, u), unavailableSources: [] };
  if (scenario !== 'partial') return base;
  return {
    ...base,
    unavailableSources: ['device_intelligence'],
    transactions: c.transactions.map((t) => ({ ...t, device: null })),
    relatedEntities: c.relatedEntities.map((e) => (e.type === 'device' || e.type === 'ip' ? { ...e, dataStatus: 'unavailable' } : e)),
  };
}

const projectFreeze = (f: FreezeRecord, scenario: Scenario): FreezeRequest => ({ ...f, allowedActions: freezeActions(f, currentUser(scenario)) });

const restoreStatus = (c: CaseRecord): CaseStatus =>
  c.decision ? (c.decision.outcome === 'needs_more_info' ? 'under_review' : 'decision_recorded') : 'open';

const isText = (v: unknown, min: number): v is string => typeof v === 'string' && v.trim().length >= min;

export const routes: Route[] = [
  { method: 'GET', pattern: '/api/me', handler: ({ scenario }) => ({ status: 200, body: currentUser(scenario) }) },
  {
    method: 'GET',
    pattern: '/api/alerts',
    handler: ({ query, scenario }) => {
      if (scenario === 'empty') return { status: 200, body: [] };
      const severity = query.get('severity');
      const status = query.get('status');
      const minConfidenceRaw = query.get('minConfidence');
      if (severity && !SEVERITIES.includes(severity as Severity)) return invalid(`Unknown severity "${severity}"`);
      if (status && !ALERT_STATUSES.includes(status as AlertStatus)) return invalid(`Unknown status "${status}"`);
      const minConfidence = minConfidenceRaw === null || minConfidenceRaw === '' ? null : Number(minConfidenceRaw);
      if (minConfidence !== null && (Number.isNaN(minConfidence) || minConfidence < 0 || minConfidence > 1)) {
        return invalid('minConfidence must be a number between 0 and 1');
      }
      let list = [...alerts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      if (severity) list = list.filter((a) => a.severity === severity);
      if (status) list = list.filter((a) => a.status === status);
      if (minConfidence !== null) list = list.filter((a) => a.confidence >= minConfidence);
      if (scenario === 'partial') list = list.map((a) => (a.source.kind === 'model' ? { ...a, dataStatus: 'stale' } : a));
      return { status: 200, body: list };
    },
  },
  {
    method: 'GET',
    pattern: '/api/cases/:id',
    handler: ({ params, scenario }) => {
      const c = cases.find((x) => x.id === params.id);
      return c ? { status: 200, body: projectCase(c, scenario) } : notFound('Case');
    },
  },
  {
    method: 'GET',
    pattern: '/api/cases/:id/audit',
    handler: ({ params, scenario }) => {
      if (!cases.some((x) => x.id === params.id)) return notFound('Case');
      if (scenario === 'empty') return { status: 200, body: [] };
      const list = audit.filter((e) => e.caseId === params.id).sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
      return { status: 200, body: list };
    },
  },
  {
    method: 'POST',
    pattern: '/api/cases/:id/decision',
    handler: ({ params, body, scenario }) => {
      const c = cases.find((x) => x.id === params.id);
      if (!c) return notFound('Case');
      const u = currentUser(scenario);
      if (!canInvestigate(u) || (u.role !== 'senior_investigator' && c.assignee?.id !== u.id)) {
        return err(403, 'FORBIDDEN', 'Only the assigned investigator or a senior investigator can record a decision');
      }
      const b = (body ?? {}) as { version?: unknown; outcome?: unknown; rationale?: unknown };
      if (typeof b.version !== 'number') return invalid('version is required');
      if (b.version !== c.version) return stale();
      if (!OUTCOMES.includes(b.outcome as DecisionOutcome)) return invalid('outcome must be confirmed_fraud, not_fraud or needs_more_info');
      if (!isText(b.rationale, 20)) return invalid('rationale must be at least 20 characters');
      if (!DECIDABLE.includes(c.status)) return err(409, 'INVALID_STATE', `A decision cannot be recorded while the case is ${c.status}`);
      const outcome = b.outcome as DecisionOutcome;
      c.decision = { outcome, rationale: b.rationale.trim(), decidedBy: ref(u), decidedAt: nowIso() };
      c.status = outcome === 'needs_more_info' ? 'under_review' : 'decision_recorded';
      c.version += 1;
      c.updatedAt = nowIso();
      emit(c.id, u, 'decision_recorded', `Outcome: ${outcome}`);
      return { status: 200, body: projectCase(c, scenario) };
    },
  },
  {
    method: 'POST',
    pattern: '/api/cases/:id/freeze-requests',
    handler: ({ params, body, scenario }) => {
      const c = cases.find((x) => x.id === params.id);
      if (!c) return notFound('Case');
      const u = currentUser(scenario);
      if (!u.permissions.includes('request_freeze')) return err(403, 'FORBIDDEN', 'Your role does not permit requesting a freeze');
      const b = (body ?? {}) as { version?: unknown; accountIds?: unknown; reason?: unknown };
      if (typeof b.version !== 'number') return invalid('version is required');
      if (b.version !== c.version) return stale();
      if (!Array.isArray(b.accountIds) || b.accountIds.length === 0) return invalid('Select at least one account to freeze');
      const accounts = c.relatedEntities.filter((e) => e.type === 'account');
      for (const id of b.accountIds as unknown[]) {
        const acc = accounts.find((a) => a.id === id);
        if (!acc) return invalid(`Account ${String(id)} is not linked to this case`);
        if (acc.accountStatus === 'frozen') return invalid(`Account ${acc.id} is already frozen`);
      }
      if (!isText(b.reason, 20)) return invalid('reason must be at least 20 characters');
      if (!caseActions(c, u).includes('request_freeze')) {
        return err(409, 'INVALID_STATE', `A freeze cannot be requested while the case is ${c.status}`);
      }
      const ids = [...new Set(b.accountIds as string[])];
      const fr: FreezeRecord = {
        id: `FRZ-0${++seq.freezeRequest}`,
        caseId: c.id,
        version: 1,
        status: 'pending_approval',
        requestedBy: ref(u),
        requestedAt: nowIso(),
        reason: b.reason.trim(),
        scope: {
          accounts: ids.map((id) => ({ id, label: accounts.find((a) => a.id === id)?.label ?? id })),
          estimatedImpact: impactOf(ids),
        },
        reviewedBy: null,
        reviewedAt: null,
        rejectionReason: null,
        receipt: null,
      };
      freezeRequests.push(fr);
      c.status = 'freeze_pending_approval';
      c.freezeRequestIds = [...c.freezeRequestIds, fr.id];
      c.activeFreezeRequestId = fr.id;
      c.version += 1;
      c.updatedAt = nowIso();
      const imp = fr.scope.estimatedImpact;
      emit(
        c.id,
        u,
        'freeze_requested',
        `Freeze request ${fr.id} for ${ids.join(', ')} (${imp.pendingPayments} pending payments, ${imp.scheduledTransfers} scheduled transfers, ${imp.cardsAffected} cards)`,
      );
      return { status: 201, body: projectFreeze(fr, scenario) };
    },
  },
  {
    method: 'GET',
    pattern: '/api/freeze-requests/:id',
    handler: ({ params, scenario }) => {
      const f = freezeRequests.find((x) => x.id === params.id);
      return f ? { status: 200, body: projectFreeze(f, scenario) } : notFound('Freeze request');
    },
  },
  {
    method: 'POST',
    pattern: '/api/freeze-requests/:id/approve',
    handler: ({ params, body, scenario }) => {
      const f = freezeRequests.find((x) => x.id === params.id);
      if (!f) return notFound('Freeze request');
      const c = cases.find((x) => x.id === f.caseId);
      if (!c) return notFound('Case');
      const u = currentUser(scenario);
      const b = (body ?? {}) as { version?: unknown };
      if (typeof b.version !== 'number') return invalid('version is required');
      if (f.requestedBy.id === u.id) return err(403, 'SELF_APPROVAL_NOT_ALLOWED', 'You cannot approve a freeze you requested. A different senior investigator must approve it.');
      if (u.role !== 'senior_investigator') return err(403, 'FORBIDDEN', 'Only a senior investigator can approve a freeze');
      if (f.status !== 'pending_approval') return err(409, 'INVALID_STATE', `Freeze request is already ${f.status}`);
      if (b.version !== f.version) return stale();
      const at = nowIso();
      const receipt: FreezeReceipt = {
        freezeId: `FZ-${++seq.freeze}`,
        executedAt: at,
        accountsFrozen: f.scope.accounts.map((a) => a.id),
        referenceNo: `SNT-2026-${String(++seq.reference).padStart(6, '0')}`,
      };
      f.status = 'executed';
      f.version += 1;
      f.reviewedBy = ref(u);
      f.reviewedAt = at;
      f.receipt = receipt;
      c.relatedEntities = c.relatedEntities.map((e) => (receipt.accountsFrozen.includes(e.id) ? { ...e, accountStatus: 'frozen' } : e));
      c.status = 'frozen';
      c.activeFreezeRequestId = null;
      c.version += 1;
      c.updatedAt = at;
      emit(c.id, u, 'freeze_approved', `Freeze request ${f.id} approved`);
      emit(c.id, users.system, 'freeze_executed', `Freeze ${receipt.freezeId} executed on ${receipt.accountsFrozen.length} account(s) (ref ${receipt.referenceNo})`);
      return { status: 200, body: { receipt, request: projectFreeze(f, scenario), case: projectCase(c, scenario) } };
    },
  },
  {
    method: 'POST',
    pattern: '/api/freeze-requests/:id/reject',
    handler: ({ params, body, scenario }) => {
      const f = freezeRequests.find((x) => x.id === params.id);
      if (!f) return notFound('Freeze request');
      const c = cases.find((x) => x.id === f.caseId);
      if (!c) return notFound('Case');
      const u = currentUser(scenario);
      const b = (body ?? {}) as { version?: unknown; reason?: unknown };
      if (typeof b.version !== 'number') return invalid('version is required');
      if (f.requestedBy.id === u.id) return err(403, 'SELF_APPROVAL_NOT_ALLOWED', 'You cannot review a freeze you requested.');
      if (u.role !== 'senior_investigator') return err(403, 'FORBIDDEN', 'Only a senior investigator can reject a freeze');
      if (f.status !== 'pending_approval') return err(409, 'INVALID_STATE', `Freeze request is already ${f.status}`);
      if (b.version !== f.version) return stale();
      if (!isText(b.reason, 10)) return invalid('reason must be at least 10 characters');
      const at = nowIso();
      f.status = 'rejected';
      f.version += 1;
      f.reviewedBy = ref(u);
      f.reviewedAt = at;
      f.rejectionReason = b.reason.trim();
      c.status = restoreStatus(c);
      c.activeFreezeRequestId = null;
      c.version += 1;
      c.updatedAt = at;
      emit(c.id, u, 'freeze_rejected', `Freeze request ${f.id} rejected: ${f.rejectionReason}`);
      return { status: 200, body: projectFreeze(f, scenario) };
    },
  },
];
