import type { Route } from './framework';
import type { AlertDetail, AlertSummary } from '../api/types';
import { me, wards, seedAlerts } from './data';

let alerts: AlertDetail[] = seedAlerts();
export function resetMockData() {
  alerts = seedAlerts();
}

const summary = (a: AlertDetail): AlertSummary => {
  const { version: _v, description: _d, handoffs: _h, escalationTargets: _e, ...rest } = a;
  return rest;
};

export const routes: Route[] = [
  { method: 'GET', pattern: '/api/me', handler: ({ scenario }) => ({ status: 200, body: scenario === 'forbidden' ? { ...me, role: 'viewer' } : me }) },
  { method: 'GET', pattern: '/api/wards', handler: ({ scenario }) => ({ status: 200, body: scenario === 'empty' ? [] : wards }) },
  {
    method: 'GET',
    pattern: '/api/alerts',
    handler: ({ query, scenario }) => {
      if (scenario === 'empty') return { status: 200, body: [] };
      let list = alerts;
      const ward = query.get('ward');
      const urgency = query.get('urgency');
      if (ward) list = list.filter((a) => a.wardId === ward);
      if (urgency) list = list.filter((a) => a.urgency === urgency);
      return { status: 200, body: list.map(summary) };
    },
  },
  {
    method: 'GET',
    pattern: '/api/alerts/:id',
    handler: ({ params }) => {
      const a = alerts.find((x) => x.id === params.id);
      return a ? { status: 200, body: a } : { status: 404, body: { code: 'NOT_FOUND', message: 'Alert not found' } };
    },
  },
  {
    method: 'POST',
    pattern: '/api/alerts/:id/acknowledge',
    handler: ({ params, body }) => {
      const a = alerts.find((x) => x.id === params.id);
      if (!a) return { status: 404, body: { code: 'NOT_FOUND', message: 'Alert not found' } };
      const b = body as { version: number; note?: string };
      if (b.version !== a.version) return { status: 409, body: { code: 'STALE_VERSION', message: 'Alert changed since you loaded it' } };
      a.status = 'acknowledged';
      a.owner = me.name;
      a.version += 1;
      a.handoffs = [...a.handoffs, { at: new Date().toISOString(), from: a.owner, to: me.name, note: b.note || 'Acknowledged' }];
      return { status: 200, body: a };
    },
  },
  {
    method: 'POST',
    pattern: '/api/alerts/:id/escalate',
    handler: ({ params, body }) => {
      const a = alerts.find((x) => x.id === params.id);
      if (!a) return { status: 404, body: { code: 'NOT_FOUND', message: 'Alert not found' } };
      const b = body as { version: number; reason: string; target: string };
      if (b.version !== a.version) return { status: 409, body: { code: 'STALE_VERSION', message: 'Alert changed since you loaded it' } };
      if (!b.reason?.trim()) return { status: 422, body: { code: 'VALIDATION', message: 'A reason is required' } };
      if (!a.escalationTargets.includes(b.target)) return { status: 422, body: { code: 'VALIDATION', message: 'Unknown escalation target' } };
      a.status = 'escalated';
      a.version += 1;
      a.handoffs = [...a.handoffs, { at: new Date().toISOString(), from: me.name, to: b.target, note: b.reason }];
      a.owner = b.target;
      return { status: 200, body: a };
    },
  },
];
