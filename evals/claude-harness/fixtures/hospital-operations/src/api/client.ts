/** BACKEND CONTRACT – Patient Flow API client. Do not edit. */
import { get, send } from './http';
import type { AlertDetail, AlertSummary, Me, Urgency, Ward } from './types';

export const api = {
  me: () => get<Me>('/api/me'),
  wards: () => get<Ward[]>('/api/wards'),
  alerts: (filters: { ward?: string; urgency?: Urgency } = {}) => {
    const q = new URLSearchParams();
    if (filters.ward) q.set('ward', filters.ward);
    if (filters.urgency) q.set('urgency', filters.urgency);
    const qs = q.toString();
    return get<AlertSummary[]>(`/api/alerts${qs ? `?${qs}` : ''}`);
  },
  alert: (id: string) => get<AlertDetail>(`/api/alerts/${encodeURIComponent(id)}`),
  acknowledge: (id: string, body: { version: number; note?: string }) =>
    send<AlertDetail>('POST', `/api/alerts/${encodeURIComponent(id)}/acknowledge`, body),
  escalate: (id: string, body: { version: number; reason: string; target: string }) =>
    send<AlertDetail>('POST', `/api/alerts/${encodeURIComponent(id)}/escalate`, body),
};
