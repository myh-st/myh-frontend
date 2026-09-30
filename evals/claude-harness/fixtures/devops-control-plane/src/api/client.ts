/** BACKEND CONTRACT – Beacon Incident Platform API client. Do not edit. */
import { get, send } from './http';
import type {
  Execution,
  ExecuteRemediationResponse,
  IncidentDetail,
  IncidentStatus,
  IncidentSummary,
  Investigation,
  LogEntry,
  LogLevel,
  Me,
  MetricsResponse,
  Remediation,
  Service,
  StartInvestigationRequest,
  StartInvestigationResponse,
  TraceSpan,
} from './types';

const enc = encodeURIComponent;

function qs(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const api = {
  me: () => get<Me>('/api/me'),
  services: () => get<Service[]>('/api/services'),

  incidents: (filters: { status?: IncidentStatus } = {}) => get<IncidentSummary[]>(`/api/incidents${qs(filters)}`),
  incident: (id: string) => get<IncidentDetail>(`/api/incidents/${enc(id)}`),

  logs: (id: string, filters: { service?: string; level?: LogLevel } = {}) =>
    get<LogEntry[]>(`/api/incidents/${enc(id)}/telemetry/logs${qs(filters)}`),
  metrics: (id: string, filters: { service?: string } = {}) =>
    get<MetricsResponse>(`/api/incidents/${enc(id)}/telemetry/metrics${qs(filters)}`),
  traces: (id: string) => get<TraceSpan[]>(`/api/incidents/${enc(id)}/telemetry/traces`),

  startInvestigation: (id: string, body: StartInvestigationRequest) =>
    send<StartInvestigationResponse>('POST', `/api/incidents/${enc(id)}/investigations`, body),
  investigation: (investigationId: string) => get<Investigation>(`/api/investigations/${enc(investigationId)}`),

  remediations: (id: string) => get<Remediation[]>(`/api/incidents/${enc(id)}/remediations`),
  approveRemediation: (remediationId: string, body: { version: number }) =>
    send<Remediation>('POST', `/api/remediations/${enc(remediationId)}/approve`, body),
  executeRemediation: (remediationId: string, body: { version: number; approvalId: string }) =>
    send<ExecuteRemediationResponse>('POST', `/api/remediations/${enc(remediationId)}/execute`, body),

  execution: (executionId: string) => get<Execution>(`/api/executions/${enc(executionId)}`),
  rollbackExecution: (executionId: string, body: { version: number }) =>
    send<Execution>('POST', `/api/executions/${enc(executionId)}/rollback`, body),
};
