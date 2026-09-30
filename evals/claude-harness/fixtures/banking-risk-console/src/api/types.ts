/** BACKEND CONTRACT – generated from the Fraud Case Service OpenAPI spec. Do not edit. */
export type Role = 'investigator' | 'senior_investigator' | 'auditor';
export type Permission = 'view_cases' | 'record_decision' | 'request_freeze' | 'approve_freeze' | 'view_audit';

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type AlertStatus = 'new' | 'in_case' | 'closed';
export type AlertSourceKind = 'rule' | 'model';
export type DataStatus = 'current' | 'stale' | 'unavailable';
export type DataSource = 'core_banking' | 'card_processor' | 'device_intelligence' | 'hypothesis_service';

export type CaseStatus = 'open' | 'under_review' | 'decision_recorded' | 'freeze_pending_approval' | 'frozen' | 'closed';
export type CaseAction = 'record_decision' | 'request_freeze' | 'approve_freeze' | 'reject_freeze';
export type DecisionOutcome = 'confirmed_fraud' | 'not_fraud' | 'needs_more_info';

export type Channel = 'mobile_app' | 'internet_banking' | 'promptpay' | 'card_present' | 'card_not_present' | 'atm' | 'branch';
export type EntityType = 'account' | 'device' | 'ip' | 'counterparty';
export type EvidenceType = 'transaction' | 'device' | 'ip' | 'counterparty' | 'behavioural' | 'rule_hit' | 'network';

export type FreezeRequestStatus = 'pending_approval' | 'executed' | 'rejected';
export type FreezeRequestAction = 'approve' | 'reject';

export type AuditAction =
  | 'case_opened'
  | 'alert_linked'
  | 'case_assigned'
  | 'hypothesis_generated'
  | 'decision_recorded'
  | 'freeze_requested'
  | 'freeze_approved'
  | 'freeze_rejected'
  | 'freeze_executed'
  | 'case_closed';

export interface UserRef {
  id: string;
  name: string;
}

export interface Me extends UserRef {
  role: Role;
  team: string;
  /** Server-computed. The UI must not infer permissions from `role`. */
  permissions: Permission[];
}

export interface Money {
  /** Major units (e.g. baht), two decimal places. */
  amount: number;
  currency: string;
}

export interface AlertSummary {
  id: string;
  createdAt: string;
  severity: Severity;
  /** Model / rule confidence in the range 0–1. */
  confidence: number;
  source: { kind: AlertSourceKind; name: string; version: string };
  title: string;
  amount: Money;
  /** Masked customer reference. Full identity is not exposed to this app. */
  customerRef: string;
  caseId: string | null;
  status: AlertStatus;
  /** `stale` when the scoring upstream has not refreshed this alert recently. */
  dataStatus: DataStatus;
}

export interface Transaction {
  id: string;
  at: string;
  direction: 'debit' | 'credit';
  amount: Money;
  channel: Channel;
  counterparty: { name: string; accountRef: string; institution: string };
  /** null when the device-intelligence source is unavailable or the channel has no device. */
  device: { id: string; label: string; firstSeenAt: string } | null;
  geo: { city: string; country: string; ip: string | null } | null;
  flagged: boolean;
  flagReason: string | null;
}

export interface RelatedEntity {
  id: string;
  type: EntityType;
  label: string;
  linkReason: string;
  riskLevel: 'high' | 'medium' | 'low';
  dataStatus: DataStatus;
  /** Present for `account` entities only (accounts held at this bank). */
  accountStatus?: 'active' | 'frozen';
}

export interface HypothesisBasis {
  evidenceType: EvidenceType;
  /** Id of a transaction, related entity, alert or rule this evidence refers to. */
  ref: string;
  /** Relative contribution, 0–1. */
  weight: number;
  description: string;
}

export interface Hypothesis {
  summary: string;
  confidence: number;
  basis: HypothesisBasis[];
  modelVersion: string;
  generatedAt: string;
}

export interface Decision {
  outcome: DecisionOutcome;
  rationale: string;
  decidedBy: UserRef;
  decidedAt: string;
}

export interface CaseDetail {
  id: string;
  version: number;
  title: string;
  status: CaseStatus;
  severity: Severity;
  customerRef: string;
  assignee: UserRef | null;
  openedAt: string;
  updatedAt: string;
  alertIds: string[];
  transactions: Transaction[];
  relatedEntities: RelatedEntity[];
  /** null when no hypothesis has been generated or the hypothesis service is unavailable. */
  hypothesis: Hypothesis | null;
  decision: Decision | null;
  freezeRequestIds: string[];
  activeFreezeRequestId: string | null;
  /** Server-computed for the current user. */
  allowedActions: CaseAction[];
  /** Upstreams that could not be reached while assembling this case. */
  unavailableSources: DataSource[];
}

export interface AuditEvent {
  id: string;
  caseId: string;
  at: string;
  actor: UserRef & { role: Role | 'system' };
  action: AuditAction;
  details: string;
}

export interface EstimatedImpact {
  pendingPayments: number;
  scheduledTransfers: number;
  cardsAffected: number;
}

export interface FreezeReceipt {
  freezeId: string;
  executedAt: string;
  accountsFrozen: string[];
  referenceNo: string;
}

export interface FreezeRequest {
  id: string;
  caseId: string;
  version: number;
  status: FreezeRequestStatus;
  requestedBy: UserRef;
  requestedAt: string;
  reason: string;
  scope: {
    accounts: { id: string; label: string }[];
    estimatedImpact: EstimatedImpact;
  };
  reviewedBy: UserRef | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  receipt: FreezeReceipt | null;
  /** Server-computed for the current user. */
  allowedActions: FreezeRequestAction[];
}

export interface ApproveFreezeResponse {
  receipt: FreezeReceipt;
  request: FreezeRequest;
  case: CaseDetail;
}

export interface AlertFilters {
  severity?: Severity;
  minConfidence?: number;
  status?: AlertStatus;
}
