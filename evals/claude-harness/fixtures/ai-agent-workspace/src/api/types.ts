/** BACKEND CONTRACT – generated from the Agent Runtime OpenAPI spec. Do not edit. */
export type Role = 'member' | 'operator' | 'admin';
export type Permission = 'conversations:write' | 'runs:cancel' | 'actions:approve' | 'actions:retry' | 'workspace:admin';

export interface Me {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string;
  /** Server-computed. `member` users can ask questions but cannot approve or retry external mutations. */
  permissions: Permission[];
}

export type DataSourceKind = 'wiki' | 'drive' | 'crm' | 'ticketing' | 'warehouse' | 'code';
export type DataStatus = 'fresh' | 'stale' | 'unavailable';

export interface DataSource {
  id: string;
  name: string;
  kind: DataSourceKind;
  access: 'read';
  lastSyncedAt: string;
  dataStatus: DataStatus;
}

export type ToolMode = 'read' | 'write';

export interface ConnectedTool {
  id: string;
  name: string;
  system: string;
  mode: ToolMode;
  requiresApproval: boolean;
  description: string;
}

export interface Budget {
  limitUsd: number;
  usedUsd: number;
  periodStart: string;
  periodEnd: string;
}

export interface WorkspaceScope {
  tenant: { id: string; name: string; region: string };
  dataSources: DataSource[];
  tools: ConnectedTool[];
  policyNotes: string[];
  budget: Budget;
  /** Ids of data sources that could not be reached when this response was built. */
  unavailableSources: string[];
}

export type RunStatus = 'queued' | 'running' | 'awaiting_approval' | 'completed' | 'partially_failed' | 'failed' | 'cancelled';

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastRunId: string | null;
  lastRunStatus: RunStatus | null;
}

export interface Citation {
  sourceId: string;
  title: string;
  excerpt: string;
  url: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  authorName: string;
  content: string;
  createdAt: string;
  /** Run started by (user message) or produced by (assistant message) this message. */
  runId: string | null;
  citations: Citation[];
}

export interface PostMessageRequest {
  content: string;
  /** When true the agent may propose write actions against connected tools (always subject to approval policy). */
  allowActions: boolean;
}

export interface RunEstimate {
  costUsd: number;
  tokens: number;
}

export interface PostMessageResponse {
  messageId: string;
  runId: string;
  estimate: RunEstimate;
}

export type StepKind = 'retrieve' | 'reason' | 'tool_read' | 'tool_write';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface RunStep {
  id: string;
  kind: StepKind;
  title: string;
  status: StepStatus;
  startedAt: string | null;
  finishedAt: string | null;
  detail: string;
}

export interface RunAnswer {
  text: string;
  citations: Citation[];
}

export type Risk = 'low' | 'medium' | 'high';
export type ActionStatus = 'proposed' | 'approved' | 'rejected' | 'executing' | 'succeeded' | 'failed';
export type ActionPermission = 'approve' | 'reject' | 'retry';

export interface FieldChange {
  field: string;
  before: string | null;
  after: string;
}

export interface ProposedAction {
  id: string;
  /** Optimistic-concurrency token; required by approve / reject / retry. */
  version: number;
  tool: string;
  system: string;
  operation: string;
  target: string;
  summary: string;
  diff?: FieldChange[];
  risk: Risk;
  estimatedCostUsd: number;
  reversible: boolean;
  requiresApproval: boolean;
  status: ActionStatus;
  decidedBy: string | null;
  decisionReason: string | null;
  /** Server-computed for the current user and the action's current status. */
  allowedActions: ActionPermission[];
}

export interface ReceiptAction {
  actionId: string;
  status: ActionStatus;
  externalRef?: string;
  error?: string;
}

export interface RunReceipt {
  runId: string;
  completedAt: string;
  actions: ReceiptAction[];
  totalCostUsd: number;
}

export interface RunDetail {
  id: string;
  conversationId: string;
  status: RunStatus;
  createdAt: string;
  updatedAt: string;
  startedBy: string;
  allowActions: boolean;
  estimate: RunEstimate;
  steps: RunStep[];
  answer?: RunAnswer;
  proposedActions: ProposedAction[];
  receipt?: RunReceipt;
  /** Ids of data sources that could not be searched for this run. */
  unavailableSources: string[];
  /** Server-computed for the current user and the run's current status. */
  allowedActions: 'cancel'[];
}

export type ApiErrorCode =
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'VALIDATION'
  | 'STALE_VERSION'
  | 'INVALID_STATE'
  | 'RUN_IN_PROGRESS'
  | 'BUDGET_EXCEEDED'
  | 'UPSTREAM_UNAVAILABLE';
