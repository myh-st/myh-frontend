/**
 * BACKEND-OWNED: seed data mirroring the HR Onboarding service fixtures.
 * Maintained by the backend team. Do not edit from frontend work.
 */
import type {
  ApprovalStatus,
  ChecklistTask,
  Cohort,
  DocumentStatus,
  HireDetail,
  HireDocument,
  InfoRequest,
  Me,
  OnboardingException,
  PersonRef,
  PiiBlock,
  TaskCategory,
  TaskStatus,
} from '../api/types';

/** Stored shape; derived fields (progress, blockers, status, allowedActions) are computed per request. */
export type HireRecord = Omit<HireDetail, 'progress' | 'blockers' | 'status' | 'allowedActions' | 'unavailableSources'>;

export const users: Me[] = [
  { id: 'u-hr-01', name: 'Priya Raman', email: 'priya.raman@arrive.example', title: 'Senior HR Business Partner', role: 'hr_partner' },
  { id: 'u-mgr-01', name: 'Daniel Okafor', email: 'daniel.okafor@arrive.example', title: 'Director of Engineering, Payments', role: 'hiring_manager' },
  { id: 'u-mgr-02', name: 'Mei Lin Tan', email: 'meilin.tan@arrive.example', title: 'Head of Design', role: 'hiring_manager' },
  { id: 'u-mgr-03', name: 'Sofia Álvarez-Whitfield', email: 'sofia.alvarez@arrive.example', title: 'VP Data & Platform', role: 'hiring_manager' },
  { id: 'u-view-01', name: 'Tom Hughes', email: 'tom.hughes@arrive.example', title: 'Recruiting Coordinator', role: 'viewer' },
];

const mgr = (id: string): PersonRef => {
  const u = users.find((x) => x.id === id)!;
  return { id: u.id, name: u.name };
};

const now = Date.now();
const DAY = 86_400_000;
/** YYYY-MM-DD, `n` days from today. */
export const day = (n: number) => new Date(now + n * DAY).toISOString().slice(0, 10);
const ts = (daysAgo: number, hour = 9) => new Date(now - daysAgo * DAY - (now % DAY) + hour * 3_600_000).toISOString();

export const cohortSeeds: Omit<Cohort, 'hireCount'>[] = [
  { id: 'c-2026-09', name: 'September 2026 intake', startDate: day(-10), location: 'Bangkok HQ' },
  { id: 'c-2026-10a', name: 'October 2026 – Wave A', startDate: day(5), location: 'Bangkok HQ + Remote (APAC)' },
  { id: 'c-2026-10b', name: 'October 2026 – Wave B', startDate: day(12), location: 'London & Stockholm offices' },
  { id: 'c-2026-10c', name: 'October 2026 – Wave C (Leadership & Specialist hires)', startDate: day(19), location: 'Hybrid – multiple locations' },
];

const MANAGER = '__manager__';
const TEMPLATE: {
  id: string;
  title: string;
  category: TaskCategory;
  owner: string;
  offset: number;
  dependsOn: string[];
  approval?: { step: string; approver: string };
}[] = [
  { id: 'tsk-contract', title: 'Countersign employment contract', category: 'legal', owner: 'People Operations', offset: -21, dependsOn: [] },
  { id: 'tsk-rtw', title: 'Verify right-to-work documents', category: 'legal', owner: 'People Operations', offset: -10, dependsOn: ['tsk-contract'] },
  { id: 'tsk-bgcheck', title: 'Background check clearance', category: 'legal', owner: 'Priya Raman', offset: -7, dependsOn: ['tsk-contract'], approval: { step: 'HR partner review', approver: 'Priya Raman' } },
  { id: 'tsk-payroll', title: 'Create payroll record and validate bank details', category: 'payroll', owner: 'Payroll team', offset: -5, dependsOn: ['tsk-rtw'] },
  { id: 'tsk-bonus', title: 'Sign off signing-bonus disbursement', category: 'payroll', owner: MANAGER, offset: -3, dependsOn: ['tsk-payroll'], approval: { step: 'Hiring manager sign-off', approver: MANAGER } },
  { id: 'tsk-laptop', title: 'Provision laptop, SSO account and company email', category: 'it', owner: 'IT Service Desk', offset: -3, dependsOn: ['tsk-contract'] },
  { id: 'tsk-access', title: 'Grant role-based system access (GitHub, Jira, Salesforce, data warehouse as applicable to role)', category: 'it', owner: 'IT Service Desk', offset: -1, dependsOn: ['tsk-laptop', 'tsk-bgcheck'] },
  { id: 'tsk-badge', title: 'Issue building badge and assign desk', category: 'facilities', owner: 'Workplace team', offset: -2, dependsOn: ['tsk-rtw'] },
  { id: 'tsk-buddy', title: 'Assign onboarding buddy and share first-week plan', category: 'training', owner: MANAGER, offset: -1, dependsOn: [] },
  { id: 'tsk-security', title: 'Complete security awareness & data-privacy training', category: 'training', owner: 'New hire', offset: 5, dependsOn: ['tsk-laptop'] },
];

function checklist(
  manager: PersonRef,
  startOffset: number,
  statuses: Partial<Record<string, TaskStatus>>,
  approvals: Partial<Record<string, { status: ApprovalStatus; comment?: string }>> = {},
): ChecklistTask[] {
  return TEMPLATE.map((t) => {
    const status = statuses[t.id] ?? 'todo';
    const task: ChecklistTask = {
      id: t.id,
      title: t.title,
      category: t.category,
      owner: t.owner === MANAGER ? manager.name : t.owner,
      dueDate: day(startOffset + t.offset),
      status,
      dependsOn: t.dependsOn,
      requiresApproval: !!t.approval,
    };
    if (t.approval) {
      const a = approvals[t.id];
      const derived: ApprovalStatus = status === 'done' ? 'approved' : status === 'blocked' ? 'rejected' : 'pending';
      task.approval = {
        step: t.approval.step,
        approver: t.approval.approver === MANAGER ? manager.name : t.approval.approver,
        status: a?.status ?? derived,
        ...(a?.comment ? { comment: a.comment } : {}),
        ...((a?.status ?? derived) !== 'pending' ? { decidedAt: ts(2, 14) } : {}),
      };
    }
    return task;
  });
}

const DOC_NAMES: Record<string, string> = {
  'doc-offer': 'Signed offer letter',
  'doc-id': 'Passport or national ID card',
  'doc-tax': 'Tax declaration form',
  'doc-bank': 'Bank account details form',
  'doc-degree': 'Degree certificate (highest qualification)',
};

function documents(statuses: Partial<Record<string, DocumentStatus>>, reasons: Partial<Record<string, string>> = {}): HireDocument[] {
  return Object.keys(DOC_NAMES).map((id, i) => {
    const status = statuses[id] ?? 'requested';
    const d: HireDocument = { id, name: DOC_NAMES[id], status, updatedAt: ts(6 - i, 10 + i) };
    if (reasons[id]) d.rejectionReason = reasons[id];
    return d;
  });
}

const pii = (legalName: string, personalEmail: string, phone: string, dateOfBirth: string, last4: string): PiiBlock => ({
  legalName,
  personalEmail,
  phone,
  dateOfBirth,
  nationalIdMasked: `•••• •••• ${last4}`,
});

const ALL_DONE = Object.fromEntries(TEMPLATE.map((t) => [t.id, 'done' as TaskStatus]));

export function seedHires(): HireRecord[] {
  const daniel = mgr('u-mgr-01');
  const meilin = mgr('u-mgr-02');
  const sofia = mgr('u-mgr-03');
  const noEx: OnboardingException[] = [];
  const noReq: InfoRequest[] = [];

  return [
    {
      id: 'H-1001', displayName: 'Aroon Chaiyaporn', roleTitle: 'Senior Backend Engineer, Payments Platform', department: 'Engineering', cohortId: 'c-2026-10a', startDate: day(5), manager: daniel, version: 4,
      pii: pii('Aroon Chaiyaporn', 'aroon.chaiyaporn@gmail.com', '+66 81 234 5678', '1991-04-12', '4821'),
      tasks: checklist(daniel, 5, { 'tsk-contract': 'done', 'tsk-rtw': 'done', 'tsk-bgcheck': 'done', 'tsk-laptop': 'done', 'tsk-buddy': 'done', 'tsk-payroll': 'in_progress', 'tsk-badge': 'in_progress' }),
      documents: documents({ 'doc-offer': 'verified', 'doc-id': 'verified', 'doc-tax': 'received', 'doc-bank': 'received', 'doc-degree': 'verified' }),
      exceptions: noEx, infoRequests: noReq,
    },
    {
      id: 'H-1002', displayName: 'Maximilian Hohenberger-Castellanos', roleTitle: 'Principal Product Designer, Onboarding & Identity Verification Experiences', department: 'Design', cohortId: 'c-2026-10a', startDate: day(5), manager: meilin, version: 7,
      pii: pii('Maximilian Alexander Hohenberger-Castellanos', 'max.hohenberger.castellanos@protonmail.com', '+49 151 2345 6789', '1987-11-02', '0937'),
      tasks: checklist(meilin, 5, { 'tsk-contract': 'done', 'tsk-rtw': 'in_progress', 'tsk-laptop': 'done', 'tsk-buddy': 'done' }),
      documents: documents(
        { 'doc-offer': 'verified', 'doc-id': 'rejected', 'doc-tax': 'requested', 'doc-bank': 'received', 'doc-degree': 'received' },
        { 'doc-id': 'Scan is cropped: the machine-readable zone at the bottom of the passport photo page is cut off and the expiry date is not legible. Please re-upload a full-page colour scan.' },
      ),
      exceptions: [
        { id: 'EX-301', kind: 'document_rejected', message: 'Passport scan rejected by verification vendor (MRZ unreadable). Right-to-work check cannot be completed until a new scan is received.', openedAt: ts(2, 11), resolved: false },
      ],
      infoRequests: noReq,
    },
    {
      id: 'H-1003', displayName: 'Fatima Al-Sayed', roleTitle: 'Data Analyst, Revenue Operations', department: 'Finance', cohortId: 'c-2026-10a', startDate: day(5), manager: sofia, version: 5,
      pii: pii('Fatima Noor Al-Sayed', 'fatima.alsayed92@outlook.com', '+971 50 123 4567', '1992-06-30', '7714'),
      tasks: checklist(sofia, 5, { 'tsk-contract': 'done', 'tsk-rtw': 'done', 'tsk-bgcheck': 'done', 'tsk-laptop': 'blocked', 'tsk-payroll': 'done', 'tsk-buddy': 'in_progress' }),
      documents: documents({ 'doc-offer': 'verified', 'doc-id': 'verified', 'doc-tax': 'verified', 'doc-bank': 'verified', 'doc-degree': 'received' }),
      exceptions: [
        { id: 'EX-302', kind: 'system_error', message: 'Okta provisioning job failed: "User already exists in directory with conflicting employeeNumber". IT ticket INC-58213 raised; account cannot be created until the duplicate contractor record is merged.', openedAt: ts(1, 8), resolved: false },
      ],
      infoRequests: noReq,
    },
    {
      id: 'H-1004', displayName: 'Jonas Berg', roleTitle: 'Customer Support Specialist (Nordics)', department: 'Customer Support', cohortId: 'c-2026-10b', startDate: day(12), manager: daniel, version: 3,
      pii: pii('Jonas Erik Berg', 'jonas.berg@hotmail.se', '+46 70 123 45 67', '1996-01-19', '3308'),
      tasks: checklist(daniel, 12, { 'tsk-contract': 'done', 'tsk-rtw': 'in_progress' }),
      documents: documents({ 'doc-offer': 'verified', 'doc-id': 'received', 'doc-bank': 'requested' }),
      exceptions: [
        { id: 'EX-303', kind: 'missing_info', message: 'Bank details form is missing IBAN and account holder name; payroll cannot be set up for the first pay run.', openedAt: ts(3, 15), resolved: false },
      ],
      infoRequests: [
        { id: 'IR-88', fields: ['bankAccount', 'taxForm'], message: 'Hi Jonas, please complete the bank details form (IBAN + account holder) and upload your Swedish tax declaration.', requestedBy: 'Priya Raman', requestedAt: ts(3, 16), status: 'open' },
      ],
    },
    {
      id: 'H-1005', displayName: 'Kanya Wongsakul', roleTitle: 'Engineering Manager, Merchant Onboarding', department: 'Engineering', cohortId: 'c-2026-09', startDate: day(-3), manager: daniel, version: 12,
      pii: pii('Kanya Wongsakul', 'kanya.w@gmail.com', '+66 89 876 5432', '1985-09-08', '1156'),
      tasks: checklist(daniel, -3, { 'tsk-contract': 'done', 'tsk-rtw': 'done', 'tsk-bgcheck': 'done', 'tsk-payroll': 'done', 'tsk-laptop': 'done', 'tsk-badge': 'done', 'tsk-buddy': 'done', 'tsk-access': 'in_progress' }),
      documents: documents({ 'doc-offer': 'verified', 'doc-id': 'verified', 'doc-tax': 'verified', 'doc-bank': 'verified', 'doc-degree': 'verified' }),
      exceptions: [
        { id: 'EX-304', kind: 'overdue', message: 'Role-based access (GitHub org admin, PagerDuty, Jira project lead) still not granted 4 days after due date; new manager cannot approve team pull requests.', openedAt: ts(1, 9), resolved: false },
      ],
      infoRequests: noReq,
    },
    {
      id: 'H-1006', displayName: "Liam O'Connor", roleTitle: 'Account Executive, Mid-Market', department: 'Sales', cohortId: 'c-2026-09', startDate: day(-10), manager: meilin, version: 15,
      pii: pii("Liam Patrick O'Connor", 'liam.oconnor.work@gmail.com', '+353 87 123 4567', '1993-03-22', '6690'),
      tasks: checklist(meilin, -10, ALL_DONE),
      documents: documents({ 'doc-offer': 'verified', 'doc-id': 'verified', 'doc-tax': 'verified', 'doc-bank': 'verified', 'doc-degree': 'verified' }),
      exceptions: [
        { id: 'EX-290', kind: 'overdue', message: 'Security training not completed by day 5.', openedAt: ts(6, 9), resolved: true, resolution: 'Completed on day 6 after reminder.', resolvedBy: 'Priya Raman', resolvedAt: ts(4, 12) },
      ],
      infoRequests: noReq,
    },
    {
      id: 'H-1007', displayName: 'Nguyen Thi Minh Chau', roleTitle: 'QA Engineer', department: 'Engineering', cohortId: 'c-2026-10b', startDate: day(12), manager: sofia, version: 2,
      pii: pii('Nguyen Thi Minh Chau', 'minhchau.nguyen@yahoo.com', '+84 90 123 4567', '1998-12-05', '2045'),
      tasks: checklist(sofia, 12, { 'tsk-contract': 'done', 'tsk-laptop': 'in_progress' }),
      documents: documents({ 'doc-offer': 'verified', 'doc-id': 'received', 'doc-degree': 'received' }),
      exceptions: noEx, infoRequests: noReq,
    },
    {
      id: 'H-1008', displayName: 'Oluwaseun Adeyemi-Brightwater', roleTitle: 'Legal Counsel, Commercial Contracts & Data Protection', department: 'Legal', cohortId: 'c-2026-10c', startDate: day(19), manager: daniel, version: 3,
      pii: pii('Oluwaseun Temitope Adeyemi-Brightwater', 'seun.adeyemi.brightwater@gmail.com', '+44 7700 900123', '1989-07-14', '5572'),
      tasks: checklist(daniel, 19, { 'tsk-contract': 'done', 'tsk-rtw': 'done' }),
      documents: documents({ 'doc-offer': 'verified', 'doc-id': 'verified', 'doc-degree': 'received' }),
      exceptions: noEx, infoRequests: noReq,
    },
    {
      id: 'H-1009', displayName: 'Sara Lindqvist', roleTitle: 'Office Coordinator', department: 'Workplace', cohortId: 'c-2026-10b', startDate: day(12), manager: meilin, version: 6,
      pii: pii('Sara Maria Lindqvist', 'sara.lindqvist@icloud.com', '+46 73 987 65 43', '1995-05-27', '8812'),
      tasks: checklist(meilin, 12, { 'tsk-contract': 'done', 'tsk-rtw': 'done', 'tsk-bgcheck': 'done', 'tsk-laptop': 'done', 'tsk-badge': 'blocked' }),
      documents: documents({ 'doc-offer': 'verified', 'doc-id': 'verified', 'doc-tax': 'received', 'doc-bank': 'received' }),
      exceptions: [
        { id: 'EX-305', kind: 'system_error', message: 'Badge system (Stockholm office) rejected the access profile: floor 4 access group no longer exists after the office move.', openedAt: ts(2, 13), resolved: false },
      ],
      infoRequests: noReq,
    },
    {
      id: 'H-1010', displayName: 'Rahul Mehta', roleTitle: 'Site Reliability Engineer', department: 'Engineering', cohortId: 'c-2026-10c', startDate: day(19), manager: sofia, version: 2,
      pii: pii('Rahul Anil Mehta', 'rahul.mehta.sre@gmail.com', '+91 98765 43210', '1990-02-11', '4409'),
      tasks: checklist(sofia, 19, {}),
      documents: documents({ 'doc-offer': 'received' }),
      exceptions: [
        { id: 'EX-306', kind: 'overdue', message: 'Employment contract not countersigned; the offer expires in 3 days.', openedAt: ts(1, 10), resolved: false },
      ],
      infoRequests: noReq,
    },
  ];
}
