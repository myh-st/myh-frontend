/** BACKEND CONTRACT – Fraud Case Service API client. Do not edit. */
import { get, send } from './http';
import type {
  AlertFilters,
  AlertSummary,
  ApproveFreezeResponse,
  AuditEvent,
  CaseDetail,
  DecisionOutcome,
  FreezeRequest,
  Me,
} from './types';

const enc = encodeURIComponent;

export const api = {
  me: () => get<Me>('/api/me'),
  alerts: (filters: AlertFilters = {}) => {
    const q = new URLSearchParams();
    if (filters.severity) q.set('severity', filters.severity);
    if (filters.minConfidence !== undefined) q.set('minConfidence', String(filters.minConfidence));
    if (filters.status) q.set('status', filters.status);
    const qs = q.toString();
    return get<AlertSummary[]>(`/api/alerts${qs ? `?${qs}` : ''}`);
  },
  case: (id: string) => get<CaseDetail>(`/api/cases/${enc(id)}`),
  audit: (caseId: string) => get<AuditEvent[]>(`/api/cases/${enc(caseId)}/audit`),
  recordDecision: (caseId: string, body: { version: number; outcome: DecisionOutcome; rationale: string }) =>
    send<CaseDetail>('POST', `/api/cases/${enc(caseId)}/decision`, body),
  requestFreeze: (caseId: string, body: { version: number; accountIds: string[]; reason: string }) =>
    send<FreezeRequest>('POST', `/api/cases/${enc(caseId)}/freeze-requests`, body),
  freezeRequest: (id: string) => get<FreezeRequest>(`/api/freeze-requests/${enc(id)}`),
  approveFreeze: (id: string, body: { version: number }) =>
    send<ApproveFreezeResponse>('POST', `/api/freeze-requests/${enc(id)}/approve`, body),
  rejectFreeze: (id: string, body: { version: number; reason: string }) =>
    send<FreezeRequest>('POST', `/api/freeze-requests/${enc(id)}/reject`, body),
};
