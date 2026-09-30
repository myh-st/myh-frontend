import type { AlertDetail, Me, Ward } from '../api/types';

export const me: Me = { id: 'u-17', name: 'Nok Srisuk', role: 'coordinator', wards: ['w-med3', 'w-surg2', 'w-icu', 'w-peds'] };

export const wards: Ward[] = [
  { id: 'w-med3', name: 'Medicine 3', beds: { total: 32, occupied: 30, cleaning: 1, blocked: 1, available: 0 }, waitingAdmissions: 6, pendingDischarges: 4 },
  { id: 'w-surg2', name: 'Surgery 2', beds: { total: 28, occupied: 22, cleaning: 2, blocked: 0, available: 4 }, waitingAdmissions: 1, pendingDischarges: 3 },
  { id: 'w-icu', name: 'ICU', beds: { total: 12, occupied: 12, cleaning: 0, blocked: 0, available: 0 }, waitingAdmissions: 2, pendingDischarges: 0 },
  { id: 'w-peds', name: 'Paediatrics', beds: { total: 20, occupied: 11, cleaning: 1, blocked: 2, available: 6 }, waitingAdmissions: 0, pendingDischarges: 2 },
];

const now = Date.now();
const iso = (mins: number) => new Date(now + mins * 60_000).toISOString();

export function seedAlerts(): AlertDetail[] {
  return [
    { id: 'AL-2041', wardId: 'w-icu', kind: 'transfer_waiting', urgency: 'critical', status: 'open', title: 'ED patient waiting for ICU bed > 4h', bed: 'ED-R4', patientRef: 'MRN …4471', owner: null, openedAt: iso(-262), dueBy: iso(-22), version: 3, description: 'Ventilated patient boarding in ED resus. ICU at capacity; step-down candidate identified in bed ICU-07.', handoffs: [ { at: iso(-262), from: null, to: 'ED flow desk', note: 'Bed request raised' }, { at: iso(-120), from: 'ED flow desk', to: 'Night coordinator', note: 'ICU full, awaiting step-down' } ], escalationTargets: ['Site manager', 'ICU consultant on call', 'Director of nursing'] },
    { id: 'AL-2038', wardId: 'w-med3', kind: 'bed_block', urgency: 'high', status: 'open', title: 'Bed M3-14 blocked – equipment fault', bed: 'M3-14', owner: 'Estates', openedAt: iso(-180), dueBy: iso(60), version: 1, description: 'Bed motor failure reported. Estates ticket #88121.', handoffs: [ { at: iso(-180), from: null, to: 'Estates', note: 'Ticket raised' } ], escalationTargets: ['Site manager', 'Estates supervisor'] },
    { id: 'AL-2036', wardId: 'w-med3', kind: 'delayed_discharge', urgency: 'high', status: 'acknowledged', title: 'Discharge delayed – transport not booked', bed: 'M3-03', patientRef: 'MRN …9920', owner: 'Nok Srisuk', openedAt: iso(-95), dueBy: iso(25), version: 4, description: 'Medically fit since 09:00. Patient transport booking missing.', handoffs: [ { at: iso(-95), from: null, to: 'Ward clerk M3', note: 'Raised by ward' }, { at: iso(-40), from: 'Ward clerk M3', to: 'Nok Srisuk', note: 'Coordinator picked up' } ], escalationTargets: ['Transport desk lead', 'Site manager'] },
    { id: 'AL-2033', wardId: 'w-surg2', kind: 'staffing_gap', urgency: 'medium', status: 'open', title: 'Night shift short 1 RN', owner: null, openedAt: iso(-300), dueBy: iso(240), version: 2, description: 'Bank request unfilled. Ratio 1:9 projected from 19:00.', handoffs: [], escalationTargets: ['Nurse bank', 'Director of nursing'] },
    { id: 'AL-2031', wardId: 'w-peds', kind: 'isolation_required', urgency: 'medium', status: 'escalated', title: 'Side room needed for isolation', bed: 'P-09', patientRef: 'MRN …1203', owner: 'Infection control', openedAt: iso(-410), dueBy: iso(-10), version: 6, description: 'Suspected RSV. Currently in 4-bed bay.', handoffs: [ { at: iso(-410), from: null, to: 'Ward P', note: 'Raised' }, { at: iso(-300), from: 'Ward P', to: 'Infection control', note: 'Escalated – no side room' } ], escalationTargets: ['Site manager'] },
    { id: 'AL-2029', wardId: 'w-surg2', kind: 'delayed_discharge', urgency: 'low', status: 'open', title: 'Awaiting pharmacy TTO', bed: 'S2-11', patientRef: 'MRN …5510', owner: 'Pharmacy', openedAt: iso(-60), dueBy: iso(180), version: 1, description: 'Take-home medication not yet dispensed.', handoffs: [], escalationTargets: ['Pharmacy lead'] },
    { id: 'AL-2027', wardId: 'w-med3', kind: 'transfer_waiting', urgency: 'critical', status: 'open', title: 'Stroke patient awaiting HASU transfer', bed: 'M3-21', patientRef: 'MRN …3318', owner: null, openedAt: iso(-75), dueBy: iso(-5), version: 2, description: 'Accepted by HASU, awaiting bed confirmation.', handoffs: [ { at: iso(-75), from: null, to: 'Medicine 3', note: 'Transfer accepted' } ], escalationTargets: ['Site manager', 'Stroke coordinator'] },
  ];
}
