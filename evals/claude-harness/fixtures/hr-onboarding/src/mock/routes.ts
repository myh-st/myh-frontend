/**
 * BACKEND-OWNED: route handlers mirroring the HR Onboarding service.
 * Authorization, validation and derived fields are computed here exactly as in production.
 * Maintained by the backend team. Do not edit from frontend work.
 *
 * Mock session user: defaults to the HR partner. Set `localStorage.mockUser` to another user id
 * (see `users` in data.ts, e.g. `u-mgr-01`) to act as a hiring manager.
 */
import type { MockResponse, Route, Scenario } from './framework';
import type {
  Cohort,
  HireAction,
  HireDetail,
  HireStatus,
  HireSummary,
  InfoField,
  ManagerSummary,
  ManagerSummaryItem,
  Me,
  NextAction,
  TaskStatus,
} from '../api/types';
import { cohortSeeds, day, seedHires, users, type HireRecord } from './data';

let hires: HireRecord[] = seedHires();
let sessionOverride: string | null = null;
let seq = 400;

export function resetMockData() {
  hires = seedHires();
  sessionOverride = null;
  seq = 400;
}

/** Test hook: act as the given user id (null → default HR partner). */
export function setMockUser(id: string | null) {
  sessionOverride = id;
}

function sessionUser(scenario: Scenario): Me {
  let id = sessionOverride;
  if (!id && typeof window !== 'undefined') {
    try {
      id = window.localStorage.getItem('mockUser');
    } catch {
      id = null;
    }
  }
  const u = users.find((x) => x.id === id) ?? users[0];
  return scenario === 'forbidden' ? { ...u, role: 'viewer' } : u;
}

const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done', 'blocked'];
const HIRE_STATUSES: HireStatus[] = ['on_track', 'at_risk', 'blocked', 'completed'];
const INFO_FIELDS: InfoField[] = ['legalName', 'personalEmail', 'phone', 'dateOfBirth', 'nationalId', 'homeAddress', 'bankAccount', 'taxForm', 'emergencyContact'];

const err = (status: number, code: string, message: string): MockResponse => ({ status, body: { code, message } });
const notFound = (what: string) => err(404, 'NOT_FOUND', `${what} not found`);
const stale = () => err(409, 'STALE_VERSION', 'This onboarding record was changed by someone else. Reload to see the latest version.');
const forbidden = (message = 'Your role does not permit this action') => err(403, 'FORBIDDEN', message);
const invalid = (message: string) => err(422, 'VALIDATION', message);

const canSee = (me: Me, h: HireRecord) => me.role !== 'hiring_manager' || h.manager.id === me.id;
const visibleHires = (me: Me) => hires.filter((h) => canSee(me, h));

function derive(h: HireRecord): Pick<HireSummary, 'progress' | 'blockers' | 'status'> {
  const today = day(0);
  const done = h.tasks.filter((t) => t.status === 'done').length;
  const blockedTasks = h.tasks.filter((t) => t.status === 'blocked').length;
  const openExceptions = h.exceptions.filter((e) => !e.resolved).length;
  const overdue = h.tasks.some((t) => t.status !== 'done' && t.dueDate < today);
  let status: HireStatus = 'on_track';
  if (done === h.tasks.length) status = 'completed';
  else if (blockedTasks > 0) status = 'blocked';
  else if (openExceptions > 0 || overdue) status = 'at_risk';
  return { progress: { done, total: h.tasks.length }, blockers: blockedTasks + openExceptions, status };
}

function summary(h: HireRecord): HireSummary {
  return {
    id: h.id,
    displayName: h.displayName,
    roleTitle: h.roleTitle,
    department: h.department,
    cohortId: h.cohortId,
    startDate: h.startDate,
    manager: h.manager,
    ...derive(h),
  };
}

function allowedActions(me: Me, h: HireRecord): HireAction[] {
  if (me.role === 'viewer') return [];
  const actions: HireAction[] = [];
  if (me.role === 'hr_partner' || h.tasks.some((t) => t.owner === me.name && !t.requiresApproval)) actions.push('update_tasks');
  if (me.role === 'hr_partner') actions.push('request_info', 'resolve_exceptions');
  if (h.tasks.some((t) => t.approval?.status === 'pending' && t.approval.approver === me.name)) actions.push('decide_approvals');
  return actions;
}

function detail(me: Me, h: HireRecord, scenario: Scenario): HireDetail {
  const partial = scenario === 'partial';
  return {
    ...summary(h),
    version: h.version,
    pii: h.pii,
    tasks: h.tasks,
    documents: partial ? [] : h.documents,
    exceptions: h.exceptions,
    infoRequests: h.infoRequests,
    allowedActions: allowedActions(me, h),
    unavailableSources: partial ? ['document_vault'] : [],
  };
}

function nextAction(me: Me, h: HireRecord): NextAction | null {
  const depsDone = (ids: string[]) => ids.every((d) => h.tasks.find((t) => t.id === d)?.status === 'done');
  const open = h.tasks.filter((t) => t.status !== 'done' && depsDone(t.dependsOn));
  const approval = open.find((t) => t.approval?.status === 'pending' && t.approval.approver === me.name);
  const pick = approval ?? open.find((t) => t.owner === me.name) ?? open.find((t) => t.status === 'blocked') ?? open[0];
  if (!pick) return null;
  const label = pick === approval ? `Approve: ${pick.title}` : pick.title;
  return { taskId: pick.id, label, owner: pick.owner, dueDate: pick.dueDate };
}

type Ctx = { me: Me; hire: HireRecord; body: Record<string, unknown> };

/** Common guard for mutations: hire exists, is visible, role is not viewer, version matches. */
function mutate(
  params: Record<string, string>,
  rawBody: unknown,
  scenario: Scenario,
  fn: (ctx: Ctx) => MockResponse | null,
): MockResponse {
  const me = sessionUser(scenario);
  const hire = hires.find((h) => h.id === params.id);
  if (!hire) return notFound('Hire');
  if (!canSee(me, hire)) return forbidden('You can only manage onboarding for your direct reports');
  if (me.role === 'viewer') return forbidden();
  const body = (rawBody ?? {}) as Record<string, unknown>;
  if (typeof body.version !== 'number') return invalid('version is required');
  if (body.version !== hire.version) return stale();
  const res = fn({ me, hire, body });
  if (res) return res;
  hire.version += 1;
  return { status: 200, body: detail(me, hire, scenario) };
}

export const routes: Route[] = [
  { method: 'GET', pattern: '/api/me', handler: ({ scenario }) => ({ status: 200, body: sessionUser(scenario) }) },
  {
    method: 'GET',
    pattern: '/api/cohorts',
    handler: ({ scenario }) => {
      if (scenario === 'empty') return { status: 200, body: [] };
      const visible = visibleHires(sessionUser(scenario));
      const list: Cohort[] = cohortSeeds.map((c) => ({ ...c, hireCount: visible.filter((h) => h.cohortId === c.id).length }));
      return { status: 200, body: list };
    },
  },
  {
    method: 'GET',
    pattern: '/api/hires',
    handler: ({ query, scenario }) => {
      if (scenario === 'empty') return { status: 200, body: [] };
      const status = query.get('status');
      if (status && !HIRE_STATUSES.includes(status as HireStatus)) return invalid(`Unknown status "${status}"`);
      const cohort = query.get('cohort');
      let list = visibleHires(sessionUser(scenario)).map(summary);
      if (cohort) list = list.filter((h) => h.cohortId === cohort);
      if (status) list = list.filter((h) => h.status === status);
      return { status: 200, body: list };
    },
  },
  {
    method: 'GET',
    pattern: '/api/hires/:id',
    handler: ({ params, scenario }) => {
      const me = sessionUser(scenario);
      const h = hires.find((x) => x.id === params.id);
      if (!h) return notFound('Hire');
      if (!canSee(me, h)) return forbidden('You can only view onboarding for your direct reports');
      return { status: 200, body: detail(me, h, scenario) };
    },
  },
  {
    method: 'PATCH',
    pattern: '/api/hires/:id/tasks/:taskId',
    handler: ({ params, body, scenario }) =>
      mutate(params, body, scenario, ({ me, hire, body: b }) => {
        const task = hire.tasks.find((t) => t.id === params.taskId);
        if (!task) return notFound('Task');
        if (me.role === 'hiring_manager' && task.owner !== me.name) return forbidden('Only the task owner or an HR partner can update this task');
        const status = b.status as TaskStatus;
        if (!TASK_STATUSES.includes(status)) return invalid('status must be one of todo, in_progress, done, blocked');
        if (status === 'in_progress' || status === 'done') {
          const pending = task.dependsOn.map((id) => hire.tasks.find((t) => t.id === id)!).filter((t) => t.status !== 'done');
          if (pending.length) return err(409, 'DEPENDENCY_INCOMPLETE', `Waiting on: ${pending.map((t) => t.title).join('; ')}`);
        }
        if (status === 'done' && task.requiresApproval && task.approval?.status !== 'approved') {
          return err(409, 'APPROVAL_PENDING', `${task.approval?.step ?? 'Approval'} by ${task.approval?.approver ?? 'approver'} is required first`);
        }
        task.status = status;
        return null;
      }),
  },
  {
    method: 'POST',
    pattern: '/api/hires/:id/info-requests',
    handler: ({ params, body, scenario }) =>
      mutate(params, body, scenario, ({ me, hire, body: b }) => {
        if (me.role !== 'hr_partner') return forbidden('Only HR partners can request information from a new hire');
        const fields = b.fields as InfoField[] | undefined;
        if (!Array.isArray(fields) || fields.length === 0) return invalid('Select at least one field to request');
        const unknown = fields.filter((f) => !INFO_FIELDS.includes(f));
        if (unknown.length) return invalid(`Unknown field(s): ${unknown.join(', ')}`);
        const message = typeof b.message === 'string' ? b.message.trim() : '';
        if (!message) return invalid('A message to the new hire is required');
        if (message.length > 1000) return invalid('Message must be 1000 characters or fewer');
        hire.infoRequests = [
          ...hire.infoRequests,
          { id: `IR-${++seq}`, fields: [...new Set(fields)], message, requestedBy: me.name, requestedAt: new Date().toISOString(), status: 'open' },
        ];
        return null;
      }),
  },
  {
    method: 'POST',
    pattern: '/api/hires/:id/exceptions/:exId/resolve',
    handler: ({ params, body, scenario }) =>
      mutate(params, body, scenario, ({ me, hire, body: b }) => {
        if (me.role !== 'hr_partner') return forbidden('Only HR partners can resolve exceptions');
        const ex = hire.exceptions.find((e) => e.id === params.exId);
        if (!ex) return notFound('Exception');
        if (ex.resolved) return invalid('Exception is already resolved');
        const resolution = typeof b.resolution === 'string' ? b.resolution.trim() : '';
        if (!resolution) return invalid('A resolution note is required');
        Object.assign(ex, { resolved: true, resolution, resolvedBy: me.name, resolvedAt: new Date().toISOString() });
        return null;
      }),
  },
  {
    method: 'POST',
    pattern: '/api/hires/:id/approvals/:taskId',
    handler: ({ params, body, scenario }) =>
      mutate(params, body, scenario, ({ me, hire, body: b }) => {
        const task = hire.tasks.find((t) => t.id === params.taskId);
        if (!task) return notFound('Task');
        if (!task.requiresApproval || !task.approval) return invalid('This task does not require approval');
        if (task.approval.approver !== me.name) return forbidden(`Only ${task.approval.approver} can decide this approval`);
        if (task.approval.status !== 'pending') return invalid('This approval has already been decided');
        if (b.decision !== 'approve' && b.decision !== 'reject') return invalid('decision must be "approve" or "reject"');
        const comment = typeof b.comment === 'string' ? b.comment.trim() : '';
        if (b.decision === 'reject' && !comment) return invalid('A comment is required when rejecting');
        const pending = task.dependsOn.map((id) => hire.tasks.find((t) => t.id === id)!).filter((t) => t.status !== 'done');
        if (pending.length) return err(409, 'DEPENDENCY_INCOMPLETE', `Waiting on: ${pending.map((t) => t.title).join('; ')}`);
        const approved = b.decision === 'approve';
        task.approval = { ...task.approval, status: approved ? 'approved' : 'rejected', decidedAt: new Date().toISOString(), ...(comment ? { comment } : {}) };
        task.status = approved ? 'done' : 'blocked';
        return null;
      }),
  },
  {
    method: 'GET',
    pattern: '/api/manager/summary',
    handler: ({ scenario }) => {
      const me = sessionUser(scenario);
      if (me.role === 'viewer') return forbidden('Manager summary is available to hiring managers and HR partners');
      const partial = scenario === 'partial';
      const list = scenario === 'empty' ? [] : visibleHires(me);
      const items: ManagerSummaryItem[] = list.map((h) => {
        const d = derive(h);
        const itPending = h.tasks.some((t) => t.category === 'it' && t.status !== 'done');
        return {
          hireId: h.id,
          displayName: h.displayName,
          roleTitle: h.roleTitle,
          startDate: h.startDate,
          status: d.status,
          blockers: d.blockers,
          nextAction: nextAction(me, h),
          dataStatus: partial && itPending ? 'unavailable' : 'ok',
        };
      });
      const body: ManagerSummary = { generatedAt: new Date().toISOString(), items, unavailableSources: partial ? ['it_provisioning'] : [] };
      return { status: 200, body };
    },
  },
];
