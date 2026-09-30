/** BACKEND CONTRACT – generated from the Case Management API OpenAPI spec. Do not edit. */
export type Role = 'case_officer' | 'supervisor' | 'read_only';
export type Locale = 'th' | 'en';

/** Text supplied in both official languages. */
export interface LocalizedText {
  th: string;
  en: string;
}

/** Text that is always available in Thai; English is present only when the applicant supplied it. */
export interface ThaiText {
  th: string;
  en?: string;
}

export type DecisionKind = 'approve' | 'reject' | 'waive_fee';

export type CaseState =
  | 'submitted'
  | 'in_review'
  | 'awaiting_info'
  | 'pending_supervisor'
  | 'approved'
  | 'rejected'
  | 'closed';

export type SlaStatus = 'on_track' | 'due_soon' | 'breached';

/** Actions the server permits the current user to perform on a case right now. */
export type CaseAction = 'request_info' | 'decide' | 'approve_decision' | 'return_decision';

export type EvidenceKind =
  | 'national_id'
  | 'house_registration'
  | 'company_affidavit'
  | 'power_of_attorney'
  | 'site_plan'
  | 'building_drawings'
  | 'engineer_licence'
  | 'land_title'
  | 'health_certificate'
  | 'bank_book'
  | 'premises_photo'
  | 'other';

export interface StaffRef {
  id: string;
  name: LocalizedText;
}

export interface Me extends StaffRef {
  role: Role;
  preferredLocale: Locale;
  office: LocalizedText;
}

export interface RequiredDocument {
  kind: EvidenceKind;
  name: LocalizedText;
}

export interface ServiceType {
  id: string;
  name: LocalizedText;
  /** Statutory processing time in calendar days, counted from submission. */
  slaDays: number;
  feeThb: number;
  /** Decisions an officer may record for this service type. */
  decisions: DecisionKind[];
  /** Decisions that are not final until a supervisor approves them. */
  decisionsRequiringApproval: DecisionKind[];
  requiredDocuments: RequiredDocument[];
}

export interface CaseSummary {
  id: string;
  serviceType: string;
  applicantName: ThaiText;
  state: CaseState;
  assignee: StaffRef | null;
  submittedAt: string;
  slaDueAt: string;
  slaStatus: SlaStatus;
  lastActivityAt: string;
  /** Present only when SLA/activity values come from a cached upstream copy. */
  dataStatus?: 'stale' | 'unavailable';
}

export type RegistryCheckStatus = 'verified' | 'mismatch' | 'unavailable';

export interface Applicant {
  kind: 'individual' | 'juristic_person';
  name: ThaiText;
  /** Masked 13-digit national ID or juristic registration number. */
  idNumberMasked: string;
  phone: string;
  email: string | null;
  address: ThaiText;
  correspondenceLocale: Locale;
  registryCheck: { status: RegistryCheckStatus; checkedAt: string | null };
}

export interface ApplicationField {
  key: string;
  label: LocalizedText;
  value: ThaiText;
}

export interface EvidenceDocument {
  id: string;
  name: LocalizedText;
  kind: EvidenceKind;
  uploadedAt: string;
  /** null = not yet checked by an officer. */
  verified: boolean | null;
  sizeKb: number;
}

export interface InfoRequestItem {
  documentKind: EvidenceKind;
  note: string;
}

export interface InfoRequest {
  id: string;
  requestedAt: string;
  requestedBy: StaffRef;
  items: InfoRequestItem[];
  messageTh: string;
  messageEn: string;
  responseDueAt: string;
  status: 'open' | 'responded' | 'expired';
  respondedAt: string | null;
}

export interface DecisionReview {
  by: StaffRef;
  at: string;
  outcome: 'approved' | 'returned';
  comment: string | null;
}

export interface Decision {
  id: string;
  decision: DecisionKind;
  reasonTh: string;
  reasonEn: string;
  decidedBy: StaffRef;
  decidedAt: string;
  status: 'pending_approval' | 'final' | 'returned';
  review: DecisionReview | null;
}

export type AuditAction =
  | 'case_submitted'
  | 'case_assigned'
  | 'document_verified'
  | 'document_rejected'
  | 'info_requested'
  | 'info_received'
  | 'decision_recorded'
  | 'decision_submitted_for_approval'
  | 'decision_approved'
  | 'decision_returned'
  | 'case_closed';

export interface AuditEntry {
  id: string;
  at: string;
  /** Staff member, or `{ id: 'system' }` for automatic events. */
  actor: StaffRef;
  action: AuditAction;
  details: LocalizedText;
}

export interface CaseDetail extends CaseSummary {
  version: number;
  applicant: Applicant;
  fields: ApplicationField[];
  evidence: EvidenceDocument[];
  infoRequests: InfoRequest[];
  decisions: Decision[];
  pendingDecision: Decision | null;
  /** Server-generated, oldest first. */
  audit: AuditEntry[];
  allowedActions: CaseAction[];
  /** Upstream sources that could not be reached while building this response (e.g. `civil_registry`). */
  unavailableSources: string[];
}

export interface CaseFilters {
  assignee?: 'me' | 'all';
  serviceType?: string;
  state?: CaseState;
  q?: string;
}

export interface InfoRequestInput {
  version: number;
  items: InfoRequestItem[];
  messageTh: string;
  messageEn: string;
  responseDueAt: string;
}

export interface DecisionInput {
  version: number;
  decision: DecisionKind;
  reasonTh: string;
  reasonEn: string;
}
