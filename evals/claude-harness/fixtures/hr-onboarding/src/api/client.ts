/** BACKEND CONTRACT – HR Onboarding API client. Do not edit. */
import { get, send } from './http';
import type { Cohort, HireDetail, HireStatus, HireSummary, InfoField, ManagerSummary, Me, TaskStatus } from './types';

const hirePath = (id: string) => `/api/hires/${encodeURIComponent(id)}`;

export const api = {
  me: () => get<Me>('/api/me'),
  cohorts: () => get<Cohort[]>('/api/cohorts'),
  hires: (filters: { cohort?: string; status?: HireStatus } = {}) => {
    const q = new URLSearchParams();
    if (filters.cohort) q.set('cohort', filters.cohort);
    if (filters.status) q.set('status', filters.status);
    const qs = q.toString();
    return get<HireSummary[]>(`/api/hires${qs ? `?${qs}` : ''}`);
  },
  hire: (id: string) => get<HireDetail>(hirePath(id)),
  updateTask: (id: string, taskId: string, body: { version: number; status: TaskStatus }) =>
    send<HireDetail>('PATCH', `${hirePath(id)}/tasks/${encodeURIComponent(taskId)}`, body),
  requestInfo: (id: string, body: { version: number; fields: InfoField[]; message: string }) =>
    send<HireDetail>('POST', `${hirePath(id)}/info-requests`, body),
  resolveException: (id: string, exceptionId: string, body: { version: number; resolution: string }) =>
    send<HireDetail>('POST', `${hirePath(id)}/exceptions/${encodeURIComponent(exceptionId)}/resolve`, body),
  decideApproval: (id: string, taskId: string, body: { version: number; decision: 'approve' | 'reject'; comment: string }) =>
    send<HireDetail>('POST', `${hirePath(id)}/approvals/${encodeURIComponent(taskId)}`, body),
  managerSummary: () => get<ManagerSummary>('/api/manager/summary'),
};
