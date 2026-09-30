/** BACKEND CONTRACT – generated from the Beacon Incident Platform OpenAPI spec. Do not edit. */
export type Role = 'responder' | 'incident_commander' | 'observer';

export interface Me {
  id: string;
  name: string;
  email: string;
  role: Role;
  teams: string[];
}

// ---------------------------------------------------------------- services
export type Health = 'healthy' | 'degraded' | 'down';
export type SloStatus = 'meeting' | 'at_risk' | 'breached';

export interface OnCall {
  name: string;
  handle: string;
  /** ISO timestamp when the current on-call shift ends. */
  until: string;
}

export interface Slo {
  objective: string;
  /** Target as a percentage, e.g. 99.95 */
  target: number;
  /** Measured value over the rolling 28-day window. */
  current: number;
  errorBudgetRemainingPct: number;
  status: SloStatus;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  tier: 1 | 2 | 3;
  health: Health;
  owningTeam: string;
  onCall: OnCall;
  slo: Slo;
  openIncidentIds: string[];
}

// ---------------------------------------------------------------- incidents
export type Severity = 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4';
export type IncidentStatus = 'investigating' | 'identified' | 'mitigating' | 'resolved';
export type IncidentAction = 'start_investigation' | 'approve_remediation' | 'execute_remediation' | 'rollback_execution';

export interface IncidentSummary {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  /** Service ids. */
  affectedServices: string[];
  commander: string | null;
  startedAt: string;
  resolvedAt: string | null;
}

export type TimelineEventKind = 'alert' | 'status_change' | 'note' | 'deploy' | 'investigation' | 'remediation';

export interface TimelineEvent {
  id: string;
  at: string;
  kind: TimelineEventKind;
  actor: string;
  message: string;
}

export interface IncidentDetail extends IncidentSummary {
  version: number;
  summary: string;
  customerImpact: string;
  timeline: TimelineEvent[];
  latestInvestigationId: string | null;
  /** Actions the current user may perform on this incident. Enforced server-side. */
  allowedActions: IncidentAction[];
}

// ---------------------------------------------------------------- telemetry
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  ts: string;
  service: string;
  level: LogLevel;
  host: string;
  message: string;
  traceId: string | null;
}

export type MetricName = 'latency_p99_ms' | 'error_rate_pct' | 'saturation_pct';

export interface MetricPoint {
  ts: string;
  value: number;
}

export interface MetricSeries {
  service: string;
  metric: MetricName;
  unit: 'ms' | '%';
  /** Alerting threshold for the metric, if one is configured. */
  threshold: number | null;
  points: MetricPoint[];
}

export interface MetricsResponse {
  from: string;
  to: string;
  stepSeconds: number;
  series: MetricSeries[];
  /** Telemetry backends that could not be queried; their series are missing from `series`. */
  unavailableSources: string[];
}

export interface TraceSpan {
  traceId: string;
  spanId: string;
  service: string;
  operation: string;
  startedAt: string;
  durationMs: number;
  status: 'ok' | 'error';
  errorMessage: string | null;
}

// ---------------------------------------------------------------- investigations
export type InvestigationStatus = 'running' | 'completed' | 'failed';
export type EvidenceKind = 'log' | 'metric' | 'trace' | 'deploy';

export interface Evidence {
  kind: EvidenceKind;
  /** Stable reference, e.g. `trace:4bf92f35…` or `deploy:payments-gateway@v2.41.0`. */
  ref: string;
  excerpt: string;
}

export interface Hypothesis {
  id: string;
  summary: string;
  /** 0..1 */
  confidence: number;
  evidence: Evidence[];
}

export interface StartInvestigationRequest {
  version: number;
  /** Optional subset of the incident's affected services to focus on. */
  services?: string[];
}

export interface StartInvestigationResponse {
  investigationId: string;
  status: 'running';
  /** Billable model usage estimate for this run. */
  estimatedCostUsd: number;
  /** Incident after the investigation event was recorded (new `version`). */
  incident: IncidentDetail;
}

export interface Investigation {
  id: string;
  incidentId: string;
  status: InvestigationStatus;
  model: string;
  startedAt: string;
  completedAt: string | null;
  estimatedCostUsd: number;
  actualCostUsd: number | null;
  hypotheses: Hypothesis[];
  error: string | null;
}

// ---------------------------------------------------------------- remediations
export type RemediationKind = 'rollback_deploy' | 'scale_out' | 'restart_pods' | 'toggle_flag';
export type Risk = 'low' | 'medium' | 'high';
export type RemediationStatus = 'proposed' | 'approved' | 'executing' | 'succeeded' | 'failed' | 'rolled_back';

export interface RemediationTarget {
  service: string;
  environment: string;
  cluster: string;
}

export interface Approval {
  approvalId: string;
  approvedBy: string;
  approvedAt: string;
}

export interface Remediation {
  id: string;
  incidentId: string;
  version: number;
  title: string;
  kind: RemediationKind;
  target: RemediationTarget;
  risk: Risk;
  mutating: true;
  requiresApproval: true;
  reversible: boolean;
  expectedImpact: string;
  steps: string[];
  status: RemediationStatus;
  approval: Approval | null;
  lastExecutionId: string | null;
}

export interface ExecuteRemediationResponse {
  executionId: string;
  remediation: Remediation;
}

export type ExecutionStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'rolled_back';
export type StepStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'skipped' | 'rolled_back';

export interface StepResult {
  index: number;
  title: string;
  status: StepStatus;
  startedAt: string | null;
  finishedAt: string | null;
  output: string | null;
}

export interface ChangeRecord {
  resource: string;
  field: string;
  before: string;
  after: string;
}

export interface ExecutionReceipt {
  executionId: string;
  startedAt: string;
  finishedAt: string;
  changes: ChangeRecord[];
  auditRef: string;
}

export interface Execution {
  id: string;
  remediationId: string;
  incidentId: string;
  version: number;
  status: ExecutionStatus;
  requestedBy: string;
  approvalId: string;
  queuedAt: string;
  steps: StepResult[];
  /** Present once the execution reaches a terminal state. */
  receipt: ExecutionReceipt | null;
}
