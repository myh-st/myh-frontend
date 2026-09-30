/** BACKEND CONTRACT – generated from the Patient Flow OpenAPI spec. Do not edit. */
export type Role = 'coordinator' | 'viewer';
export type Urgency = 'critical' | 'high' | 'medium' | 'low';
export type AlertKind = 'bed_block' | 'delayed_discharge' | 'transfer_waiting' | 'staffing_gap' | 'isolation_required';
export type AlertStatus = 'open' | 'acknowledged' | 'escalated';

export interface Me {
  id: string;
  name: string;
  role: Role;
  wards: string[];
}

export interface Ward {
  id: string;
  name: string;
  beds: { total: number; occupied: number; cleaning: number; blocked: number; available: number };
  waitingAdmissions: number;
  pendingDischarges: number;
}

export interface AlertSummary {
  id: string;
  wardId: string;
  kind: AlertKind;
  urgency: Urgency;
  status: AlertStatus;
  title: string;
  bed?: string;
  /** Minimal patient reference for operational matching. Full identity is not exposed to this app. */
  patientRef?: string;
  owner: string | null;
  openedAt: string;
  dueBy: string;
}

export interface Handoff {
  at: string;
  from: string | null;
  to: string;
  note: string;
}

export interface AlertDetail extends AlertSummary {
  version: number;
  description: string;
  handoffs: Handoff[];
  escalationTargets: string[];
}
