/** BACKEND CONTRACT – Case Management API client. Do not edit. */
import { get, send } from './http';
import type { CaseDetail, CaseFilters, CaseSummary, DecisionInput, InfoRequestInput, Me, ServiceType } from './types';

const casePath = (id: string) => `/api/cases/${encodeURIComponent(id)}`;

export const api = {
  me: () => get<Me>('/api/me'),
  serviceTypes: () => get<ServiceType[]>('/api/service-types'),
  cases: (filters: CaseFilters = {}) => {
    const q = new URLSearchParams();
    if (filters.assignee) q.set('assignee', filters.assignee);
    if (filters.serviceType) q.set('serviceType', filters.serviceType);
    if (filters.state) q.set('state', filters.state);
    if (filters.q) q.set('q', filters.q);
    const qs = q.toString();
    return get<CaseSummary[]>(`/api/cases${qs ? `?${qs}` : ''}`);
  },
  case: (id: string) => get<CaseDetail>(casePath(id)),
  requestInfo: (id: string, body: InfoRequestInput) => send<CaseDetail>('POST', `${casePath(id)}/info-requests`, body),
  decide: (id: string, body: DecisionInput) => send<CaseDetail>('POST', `${casePath(id)}/decisions`, body),
  approveDecision: (id: string, decisionId: string, body: { version: number }) =>
    send<CaseDetail>('POST', `${casePath(id)}/decisions/${encodeURIComponent(decisionId)}/approve`, body),
  returnDecision: (id: string, decisionId: string, body: { version: number; comment: string }) =>
    send<CaseDetail>('POST', `${casePath(id)}/decisions/${encodeURIComponent(decisionId)}/return`, body),
};
