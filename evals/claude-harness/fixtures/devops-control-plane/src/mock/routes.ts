/** BACKEND-OWNED route handlers mirroring the Beacon Incident Platform. Do not edit. */
import type { MockResponse, Route, Scenario } from './framework';
import type {
  Execution,
  IncidentAction,
  IncidentDetail,
  IncidentStatus,
  IncidentSummary,
  Investigation,
  LogLevel,
  MetricName,
  MetricSeries,
  Remediation,
  Role,
  TimelineEventKind,
} from '../api/types';
import {
  executionPlans,
  failingInvestigations,
  genericHypothesis,
  hypotheses,
  logsFor,
  me,
  metricProfiles,
  seedExecutions,
  seedIncidents,
  seedInvestigations,
  seedRemediations,
  services,
  tracesFor,
  type IncidentRecord,
} from './data';

let incidents: IncidentRecord[] = [];
let remediations: Remediation[] = [];
let investigations: Map<string, { inv: Investigation; polls: number }> = new Map();
let executions: Map<string, Execution> = new Map();
let seq = 0;

export function resetMockData() {
  incidents = seedIncidents();
  remediations = seedRemediations();
  investigations = new Map(seedInvestigations().map((inv) => [inv.id, { inv, polls: 99 }]));
  executions = new Map(seedExecutions().map((ex) => [ex.id, ex]));
  seq = 0;
}
resetMockData();

const STATUSES: IncidentStatus[] = ['investigating', 'identified', 'mitigating', 'resolved'];
const LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error'];
const METRICS: MetricName[] = ['latency_p99_ms', 'error_rate_pct', 'saturation_pct'];

const err = (status: number, code: string, message: string): MockResponse => ({ status, body: { code, message } });
const notFound = (what: string) => err(404, 'NOT_FOUND', `${what} not found`);
const stale = (what: string) => err(409, 'STALE_VERSION', `${what} changed since you loaded it. Reload to see the latest version.`);
const nowIso = () => new Date().toISOString();
const nextId = (prefix: string, start: number) => `${prefix}-${start + ++seq}`;
const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

const roleOf = (scenario: Scenario): Role => (scenario === 'forbidden' ? 'observer' : me.role);

function allowedActions(inc: IncidentRecord, role: Role): IncidentAction[] {
  if (role === 'observer' || inc.status === 'resolved') return [];
  const base: IncidentAction[] = ['start_investigation', 'execute_remediation', 'rollback_execution'];
  return role === 'incident_commander' ? ['start_investigation', 'approve_remediation', 'execute_remediation', 'rollback_execution'] : base;
}

const withActions = (inc: IncidentRecord, scenario: Scenario): IncidentDetail => ({ ...inc, allowedActions: allowedActions(inc, roleOf(scenario)) });

const summary = (inc: IncidentRecord): IncidentSummary => {
  const { version: _v, summary: _s, customerImpact: _c, timeline: _t, latestInvestigationId: _l, ...rest } = inc;
  return rest;
};

function record(inc: IncidentRecord, kind: TimelineEventKind, message: string, actor = me.name) {
  inc.timeline = [...inc.timeline, { id: `ev-${inc.timeline.length + 1}`, at: nowIso(), kind, actor, message }];
  inc.version += 1;
}

function guard(incidentId: string, action: IncidentAction, scenario: Scenario): { inc: IncidentRecord } | { error: MockResponse } {
  const inc = incidents.find((i) => i.id === incidentId);
  if (!inc) return { error: notFound('Incident') };
  if (!allowedActions(inc, roleOf(scenario)).includes(action)) {
    const why = inc.status === 'resolved' ? 'Incident is resolved' : 'Your role does not permit this action';
    return { error: err(403, 'FORBIDDEN', why) };
  }
  return { inc };
}

function metricSeries(service: string, metric: MetricName): MetricSeries {
  const fallback: Record<MetricName, [number, number, number | null]> = { latency_p99_ms: [180, 950, null], error_rate_pct: [0.2, 3.5, null], saturation_pct: [40, 62, null] };
  const [baseline, peak, threshold] = metricProfiles[service]?.[metric] ?? fallback[metric];
  const step = 5 * 60_000;
  const end = Date.now();
  const points = Array.from({ length: 12 }, (_, i) => {
    const ramp = i < 3 ? 0 : Math.min(1, (i - 2) / 3);
    const jitter = 1 + (((i * 7 + service.length) % 5) - 2) / 100;
    return { ts: new Date(end - (11 - i) * step).toISOString(), value: round((baseline + (peak - baseline) * ramp) * jitter) };
  });
  return { service, metric, unit: metric === 'latency_p99_ms' ? 'ms' : '%', threshold, points };
}

function advance(ex: Execution) {
  const rem = remediations.find((r) => r.id === ex.remediationId);
  const inc = incidents.find((i) => i.id === ex.incidentId);
  const plan = executionPlans[ex.remediationId] ?? { changes: [] };
  const t = nowIso();
  ex.version += 1;
  if (ex.status === 'queued') {
    ex.status = 'running';
    ex.steps[0] = { ...ex.steps[0], status: 'running', startedAt: t };
    return;
  }
  const i = ex.steps.findIndex((s) => s.status === 'running');
  if (i < 0) return;
  if (plan.failAtStep === i) {
    ex.steps = ex.steps.map((s, j) =>
      j === i ? { ...s, status: 'failed', finishedAt: t, output: plan.failOutput ?? 'Step failed' } : j > i ? { ...s, status: 'skipped' } : s,
    );
    ex.status = 'failed';
    ex.receipt = { executionId: ex.id, startedAt: ex.steps[0].startedAt ?? ex.queuedAt, finishedAt: t, changes: plan.changes, auditRef: `audit://beacon/2026/${ex.id}` };
    if (rem) Object.assign(rem, { status: 'failed', version: rem.version + 1 });
    if (inc) record(inc, 'remediation', `${ex.remediationId} execution ${ex.id} failed at step ${i + 1}: ${ex.steps[i].title}`, 'beacon');
    return;
  }
  ex.steps[i] = { ...ex.steps[i], status: 'succeeded', finishedAt: t, output: `${ex.steps[i].title}: completed` };
  if (i + 1 < ex.steps.length) {
    ex.steps[i + 1] = { ...ex.steps[i + 1], status: 'running', startedAt: t };
    return;
  }
  ex.status = 'succeeded';
  ex.receipt = { executionId: ex.id, startedAt: ex.steps[0].startedAt ?? ex.queuedAt, finishedAt: t, changes: plan.changes, auditRef: `audit://beacon/2026/${ex.id}` };
  if (rem) Object.assign(rem, { status: 'succeeded', version: rem.version + 1 });
  if (inc) record(inc, 'remediation', `${ex.remediationId} execution ${ex.id} succeeded`, 'beacon');
}

export const routes: Route[] = [
  { method: 'GET', pattern: '/api/me', handler: ({ scenario }) => ({ status: 200, body: { ...me, role: roleOf(scenario) } }) },
  { method: 'GET', pattern: '/api/services', handler: ({ scenario }) => ({ status: 200, body: scenario === 'empty' ? [] : services }) },
  {
    method: 'GET',
    pattern: '/api/incidents',
    handler: ({ query, scenario }) => {
      const status = query.get('status');
      if (status && !STATUSES.includes(status as IncidentStatus)) return err(422, 'VALIDATION', `Unknown status "${status}"`);
      if (scenario === 'empty') return { status: 200, body: [] };
      const list = incidents.filter((i) => !status || i.status === status).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
      return { status: 200, body: list.map(summary) };
    },
  },
  {
    method: 'GET',
    pattern: '/api/incidents/:id',
    handler: ({ params, scenario }) => {
      const inc = incidents.find((i) => i.id === params.id);
      return inc ? { status: 200, body: withActions(inc, scenario) } : notFound('Incident');
    },
  },
  {
    method: 'GET',
    pattern: '/api/incidents/:id/telemetry/logs',
    handler: ({ params, query, scenario }) => {
      const inc = incidents.find((i) => i.id === params.id);
      if (!inc) return notFound('Incident');
      const service = query.get('service');
      const level = query.get('level');
      if (level && !LEVELS.includes(level as LogLevel)) return err(422, 'VALIDATION', `Unknown log level "${level}"`);
      if (service && !inc.affectedServices.includes(service)) return err(422, 'VALIDATION', `Service "${service}" is not affected by ${inc.id}`);
      if (scenario === 'empty') return { status: 200, body: [] };
      const logs = logsFor(inc.id).filter((l) => (!service || l.service === service) && (!level || l.level === level));
      return { status: 200, body: logs };
    },
  },
  {
    method: 'GET',
    pattern: '/api/incidents/:id/telemetry/metrics',
    handler: ({ params, query, scenario }) => {
      const inc = incidents.find((i) => i.id === params.id);
      if (!inc) return notFound('Incident');
      const service = query.get('service');
      if (service && !inc.affectedServices.includes(service)) return err(422, 'VALIDATION', `Service "${service}" is not affected by ${inc.id}`);
      const svcs = service ? [service] : inc.affectedServices;
      let series = scenario === 'empty' ? [] : svcs.flatMap((s) => METRICS.map((m) => metricSeries(s, m)));
      const unavailableSources: string[] = [];
      if (scenario === 'partial') {
        series = series.filter((s) => s.metric !== 'saturation_pct');
        unavailableSources.push('k8s-metrics-eu-west-1');
      }
      const to = Date.now();
      return { status: 200, body: { from: new Date(to - 55 * 60_000).toISOString(), to: new Date(to).toISOString(), stepSeconds: 300, series, unavailableSources } };
    },
  },
  {
    method: 'GET',
    pattern: '/api/incidents/:id/telemetry/traces',
    handler: ({ params, scenario }) => {
      const inc = incidents.find((i) => i.id === params.id);
      if (!inc) return notFound('Incident');
      return { status: 200, body: scenario === 'empty' ? [] : tracesFor(inc.id) };
    },
  },
  {
    method: 'POST',
    pattern: '/api/incidents/:id/investigations',
    handler: ({ params, body, scenario }) => {
      const g = guard(params.id, 'start_investigation', scenario);
      if ('error' in g) return g.error;
      const { inc } = g;
      const b = (body ?? {}) as { version?: unknown; services?: unknown };
      if (typeof b.version !== 'number') return err(422, 'VALIDATION', 'version is required');
      if (b.version !== inc.version) return stale('Incident');
      let scope = inc.affectedServices;
      if (b.services !== undefined) {
        if (!Array.isArray(b.services) || b.services.length === 0 || !b.services.every((s) => inc.affectedServices.includes(s as string))) {
          return err(422, 'VALIDATION', 'services must be a non-empty subset of the incident’s affected services');
        }
        scope = b.services as string[];
      }
      const running = [...investigations.values()].find((x) => x.inv.incidentId === inc.id && x.inv.status === 'running');
      if (running) return err(409, 'INVESTIGATION_IN_PROGRESS', `Investigation ${running.inv.id} is still running for this incident`);
      const estimatedCostUsd = round(0.35 + 0.22 * scope.length + 0.01 * logsFor(inc.id).length);
      const inv: Investigation = { id: nextId('INV', 3400), incidentId: inc.id, status: 'running', model: 'rca-large-2026-06', startedAt: nowIso(), completedAt: null, estimatedCostUsd, actualCostUsd: null, hypotheses: [], error: null };
      investigations.set(inv.id, { inv, polls: 0 });
      inc.latestInvestigationId = inv.id;
      record(inc, 'investigation', `AI investigation ${inv.id} started for ${scope.join(', ')} (est. $${estimatedCostUsd.toFixed(2)})`);
      return { status: 202, body: { investigationId: inv.id, status: 'running', estimatedCostUsd, incident: withActions(inc, scenario) } };
    },
  },
  {
    method: 'GET',
    pattern: '/api/investigations/:id',
    handler: ({ params }) => {
      const entry = investigations.get(params.id);
      if (!entry) return notFound('Investigation');
      entry.polls += 1;
      const { inv } = entry;
      if (inv.status === 'running' && entry.polls >= 2) {
        const inc = incidents.find((i) => i.id === inv.incidentId);
        const failure = failingInvestigations[inv.incidentId];
        inv.completedAt = nowIso();
        inv.actualCostUsd = round(inv.estimatedCostUsd * (failure ? 0.35 : 0.93));
        if (failure) {
          inv.status = 'failed';
          inv.error = failure;
        } else {
          inv.status = 'completed';
          inv.hypotheses = hypotheses[inv.incidentId] ?? genericHypothesis(inv.incidentId, inc?.affectedServices[0] ?? 'unknown');
        }
        if (inc) record(inc, 'investigation', `Investigation ${inv.id} ${inv.status}${failure ? '' : ` with ${inv.hypotheses.length} hypotheses`}`, 'beacon');
      }
      return { status: 200, body: inv };
    },
  },
  {
    method: 'GET',
    pattern: '/api/incidents/:id/remediations',
    handler: ({ params, scenario }) => {
      if (!incidents.some((i) => i.id === params.id)) return notFound('Incident');
      return { status: 200, body: scenario === 'empty' ? [] : remediations.filter((r) => r.incidentId === params.id) };
    },
  },
  {
    method: 'POST',
    pattern: '/api/remediations/:id/approve',
    handler: ({ params, body, scenario }) => {
      const rem = remediations.find((r) => r.id === params.id);
      if (!rem) return notFound('Remediation');
      const g = guard(rem.incidentId, 'approve_remediation', scenario);
      if ('error' in g) return g.error;
      const b = (body ?? {}) as { version?: unknown };
      if (typeof b.version !== 'number') return err(422, 'VALIDATION', 'version is required');
      if (b.version !== rem.version) return stale('Remediation');
      if (rem.status !== 'proposed') return err(409, 'INVALID_STATE', `Remediation is ${rem.status}; only proposed remediations can be approved`);
      rem.approval = { approvalId: nextId('APR', 5600), approvedBy: me.name, approvedAt: nowIso() };
      rem.status = 'approved';
      rem.version += 1;
      record(g.inc, 'remediation', `${rem.id} approved: ${rem.title}`);
      return { status: 200, body: rem };
    },
  },
  {
    method: 'POST',
    pattern: '/api/remediations/:id/execute',
    handler: ({ params, body, scenario }) => {
      const rem = remediations.find((r) => r.id === params.id);
      if (!rem) return notFound('Remediation');
      const g = guard(rem.incidentId, 'execute_remediation', scenario);
      if ('error' in g) return g.error;
      const b = (body ?? {}) as { version?: unknown; approvalId?: unknown };
      if (typeof b.version !== 'number' || typeof b.approvalId !== 'string') return err(422, 'VALIDATION', 'version and approvalId are required');
      if (b.version !== rem.version) return stale('Remediation');
      if (rem.status !== 'approved' || !rem.approval) return err(409, 'INVALID_STATE', `Remediation is ${rem.status}; it must be approved before execution`);
      if (b.approvalId !== rem.approval.approvalId) return err(422, 'VALIDATION', 'approvalId does not match the current approval');
      const ex: Execution = {
        id: nextId('EX', 7800), remediationId: rem.id, incidentId: rem.incidentId, version: 1, status: 'queued', requestedBy: me.name, approvalId: rem.approval.approvalId, queuedAt: nowIso(),
        steps: rem.steps.map((title, index) => ({ index, title, status: 'pending', startedAt: null, finishedAt: null, output: null })),
        receipt: null,
      };
      executions.set(ex.id, ex);
      rem.status = 'executing';
      rem.lastExecutionId = ex.id;
      rem.version += 1;
      record(g.inc, 'remediation', `${rem.id} execution ${ex.id} queued on ${rem.target.cluster}`);
      return { status: 202, body: { executionId: ex.id, remediation: rem } };
    },
  },
  {
    method: 'GET',
    pattern: '/api/executions/:id',
    handler: ({ params }) => {
      const ex = executions.get(params.id);
      if (!ex) return notFound('Execution');
      if (ex.status === 'queued' || ex.status === 'running') advance(ex);
      return { status: 200, body: ex };
    },
  },
  {
    method: 'POST',
    pattern: '/api/executions/:id/rollback',
    handler: ({ params, body, scenario }) => {
      const ex = executions.get(params.id);
      if (!ex) return notFound('Execution');
      const g = guard(ex.incidentId, 'rollback_execution', scenario);
      if ('error' in g) return g.error;
      const rem = remediations.find((r) => r.id === ex.remediationId);
      const b = (body ?? {}) as { version?: unknown };
      if (typeof b.version !== 'number') return err(422, 'VALIDATION', 'version is required');
      if (b.version !== ex.version) return stale('Execution');
      if (!rem?.reversible) return err(409, 'INVALID_STATE', 'This remediation is not reversible');
      if (ex.status !== 'failed' && ex.status !== 'succeeded') return err(409, 'INVALID_STATE', `Cannot roll back an execution that is ${ex.status}`);
      const t = nowIso();
      const changes = executionPlans[ex.remediationId]?.changes ?? [];
      ex.steps = ex.steps.map((s) => (s.status === 'succeeded' ? { ...s, status: 'rolled_back', output: `${s.output ?? ''} (reverted)` } : s));
      ex.status = 'rolled_back';
      ex.version += 1;
      ex.receipt = {
        executionId: ex.id,
        startedAt: ex.receipt?.startedAt ?? ex.queuedAt,
        finishedAt: t,
        changes: [...(ex.receipt?.changes ?? []), ...changes.map((c) => ({ ...c, before: c.after, after: c.before }))],
        auditRef: `audit://beacon/2026/${ex.id}`,
      };
      rem.status = 'rolled_back';
      rem.version += 1;
      record(g.inc, 'remediation', `${rem.id} execution ${ex.id} rolled back`);
      return { status: 200, body: ex };
    },
  },
];
