/** BACKEND CONTRACT – generated from the HR Onboarding API OpenAPI spec. Do not edit. */
export type Role = 'hr_partner' | 'hiring_manager' | 'viewer';
export type HireStatus = 'on_track' | 'at_risk' | 'blocked' | 'completed';
export type TaskCategory = 'it' | 'payroll' | 'legal' | 'facilities' | 'training';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type DocumentStatus = 'requested' | 'received' | 'verified' | 'rejected';
export type ExceptionKind = 'missing_info' | 'document_rejected' | 'overdue' | 'system_error';
export type DataStatus = 'ok' | 'stale' | 'unavailable';

/** Actions the current user may perform on a hire. Enforced server-side. */
export type HireAction = 'update_tasks' | 'request_info' | 'resolve_exceptions' | 'decide_approvals';

/** Fields that can be requested from a new hire via an info request. */
export type InfoField =
  | 'legalName'
  | 'personalEmail'
  | 'phone'
  | 'dateOfBirth'
  | 'nationalId'
  | 'homeAddress'
  | 'bankAccount'
  | 'taxForm'
  | 'emergencyContact';

export interface Me {
  id: string;
  name: string;
  email: string;
  title: string;
  role: Role;
}

export interface Cohort {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  location: string;
  /** Number of hires in the cohort visible to the current user. */
  hireCount: number;
}

export interface PersonRef {
  id: string;
  name: string;
}

export interface HireSummary {
  id: string;
  displayName: string;
  roleTitle: string;
  department: string;
  cohortId: string;
  startDate: string; // YYYY-MM-DD
  manager: PersonRef;
  progress: { done: number; total: number };
  /** Blocked tasks + unresolved exceptions. */
  blockers: number;
  status: HireStatus;
}

/** Personal data. Returned to any user who can read the hire. */
export interface PiiBlock {
  legalName: string;
  personalEmail: string;
  phone: string;
  dateOfBirth: string; // YYYY-MM-DD
  nationalIdMasked: string;
}

export interface Approval {
  step: string;
  approver: string;
  status: ApprovalStatus;
  comment?: string;
  decidedAt?: string;
}

export interface ChecklistTask {
  id: string;
  title: string;
  category: TaskCategory;
  owner: string;
  dueDate: string; // YYYY-MM-DD
  status: TaskStatus;
  /** Task ids that must be `done` before this task can start or complete. */
  dependsOn: string[];
  requiresApproval: boolean;
  approval?: Approval;
}

export interface HireDocument {
  id: string;
  name: string;
  status: DocumentStatus;
  rejectionReason?: string;
  updatedAt: string;
}

export interface OnboardingException {
  id: string;
  kind: ExceptionKind;
  message: string;
  openedAt: string;
  resolved: boolean;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface InfoRequest {
  id: string;
  fields: InfoField[];
  message: string;
  requestedBy: string;
  requestedAt: string;
  status: 'open' | 'answered';
}

export interface HireDetail extends HireSummary {
  version: number;
  pii: PiiBlock;
  tasks: ChecklistTask[];
  documents: HireDocument[];
  exceptions: OnboardingException[];
  infoRequests: InfoRequest[];
  allowedActions: HireAction[];
  /** Upstream systems that could not be reached; affected sections may be empty. */
  unavailableSources: string[];
}

export interface NextAction {
  taskId: string;
  label: string;
  owner: string;
  dueDate: string;
}

export interface ManagerSummaryItem {
  hireId: string;
  displayName: string;
  roleTitle: string;
  startDate: string;
  status: HireStatus;
  blockers: number;
  nextAction: NextAction | null;
  dataStatus: DataStatus;
}

export interface ManagerSummary {
  generatedAt: string;
  items: ManagerSummaryItem[];
  unavailableSources: string[];
}
