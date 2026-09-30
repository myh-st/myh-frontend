/** BACKEND-OWNED route handlers mirroring the Agent Runtime service. Do not edit. */
import type { MockResponse, Route, Scenario } from './framework';
import type { ConversationSummary, Me, Message, ProposedAction, RunAnswer, RunDetail, RunStatus, RunStep, WorkspaceScope } from '../api/types';
import { me, memberMe, seedConversations, seedMessages, seedOutcomes, seedRuns, seedScope, type ActionOutcome } from './data';

let scope: WorkspaceScope = seedScope();
let conversations: ConversationSummary[] = seedConversations();
let messages: Message[] = seedMessages();
let runs: RunDetail[] = seedRuns();
let outcomes: Record<string, ActionOutcome> = seedOutcomes();
let scriptedAnswers: Record<string, RunAnswer> = {};
let seq = 0;

export function resetMockData() {
  scope = seedScope();
  conversations = seedConversations();
  messages = seedMessages();
  runs = seedRuns();
  outcomes = seedOutcomes();
  scriptedAnswers = {};
  seq = 0;
}

const ACTIVE: RunStatus[] = ['queued', 'running', 'awaiting_approval'];
const nowIso = () => new Date().toISOString();
const round = (n: number) => Math.round(n * 10000) / 10000;
const nextId = (prefix: string) => `${prefix}-${9000 + ++seq}`;
const userFor = (scenario: Scenario): Me => (scenario === 'forbidden' ? memberMe : me);

const err = (status: number, code: string, message: string): MockResponse => ({ status, body: { code, message } });
const notFound = (what: string) => err(404, 'NOT_FOUND', `${what} not found`);
const forbidden = () => err(403, 'FORBIDDEN', 'Your role does not permit this action');

function present(run: RunDetail, scenario: Scenario): RunDetail {
  const user = userFor(scenario);
  const canDecide = user.permissions.includes('actions:approve');
  const canRetry = user.permissions.includes('actions:retry');
  const executing = run.proposedActions.some((a) => a.status === 'executing');
  const out: RunDetail = JSON.parse(JSON.stringify(run));
  out.proposedActions = out.proposedActions.map((a) => ({
    ...a,
    allowedActions:
      a.status === 'proposed' && a.requiresApproval && canDecide && run.status === 'awaiting_approval'
        ? ['approve', 'reject']
        : a.status === 'failed' && canRetry && (run.status === 'partially_failed' || run.status === 'failed')
          ? ['retry']
          : [],
  }));
  out.allowedActions = ACTIVE.includes(run.status) && !executing && user.permissions.includes('runs:cancel') ? ['cancel'] : [];
  if (scenario === 'partial') out.unavailableSources = Array.from(new Set([...out.unavailableSources, 'ds-confluence']));
  return out;
}

function sync(run: RunDetail) {
  run.updatedAt = nowIso();
  const c = conversations.find((x) => x.id === run.conversationId);
  if (c && c.lastRunId === run.id) {
    c.lastRunStatus = run.status;
    c.updatedAt = run.updatedAt;
  }
}

function finalize(run: RunDetail) {
  const executed = run.proposedActions.filter((a) => a.status === 'succeeded' || a.status === 'failed');
  const failed = executed.filter((a) => a.status === 'failed').length;
  run.status = failed === 0 ? 'completed' : failed < executed.length ? 'partially_failed' : 'failed';
  run.receipt = {
    runId: run.id,
    completedAt: nowIso(),
    actions: run.proposedActions
      .filter((a) => a.status !== 'proposed')
      .map((a) => ({
        actionId: a.id,
        status: a.status,
        ...(a.status === 'succeeded' && outcomes[a.id]?.externalRef ? { externalRef: outcomes[a.id].externalRef } : {}),
        ...(a.status === 'failed' && outcomes[a.id]?.error ? { error: outcomes[a.id].error } : {}),
      })),
    totalCostUsd: round(run.estimate.costUsd * 0.96 + executed.reduce((sum, a) => sum + a.estimatedCostUsd, 0)),
  };
  if (run.answer && !messages.some((m) => m.runId === run.id && m.role === 'assistant')) {
    messages.push({
      id: nextId('m'),
      conversationId: run.conversationId,
      role: 'assistant',
      authorName: 'Atlas',
      content: run.answer.text,
      createdAt: nowIso(),
      runId: run.id,
      citations: run.answer.citations,
    });
  }
}

/** Each poll of GET /api/runs/:id moves an active run forward by one tick. */
function advance(run: RunDetail) {
  if (run.status !== 'queued' && run.status !== 'running') return;
  const t = nowIso();
  const startStep = (s: RunStep | undefined) => {
    if (!s) return;
    s.status = 'running';
    s.startedAt = t;
  };
  if (run.status === 'queued') {
    run.status = 'running';
    startStep(run.steps.find((s) => s.status === 'pending'));
    return sync(run);
  }
  const executing = run.proposedActions.find((a) => a.status === 'executing');
  const running = run.steps.find((s) => s.status === 'running');
  if (executing) {
    const outcome = outcomes[executing.id] ?? { status: 'succeeded' };
    executing.status = outcome.status;
    executing.version += 1;
    if (running) {
      running.status = outcome.status === 'succeeded' ? 'completed' : 'failed';
      running.finishedAt = t;
      running.detail = outcome.status === 'succeeded' ? `${executing.system} returned ${outcome.externalRef ?? 'OK'}` : (outcome.error ?? 'Unknown error');
    }
    return sync(run);
  }
  if (running) {
    running.status = 'completed';
    running.finishedAt = t;
    if (running.kind === 'reason' && scriptedAnswers[run.id]) run.answer = scriptedAnswers[run.id];
    startStep(run.steps.find((s) => s.status === 'pending'));
    return sync(run);
  }
  const pending = run.steps.find((s) => s.status === 'pending');
  if (pending) {
    startStep(pending);
    return sync(run);
  }
  const approved = run.proposedActions.find((a) => a.status === 'approved');
  if (approved) {
    approved.status = 'executing';
    approved.version += 1;
    run.steps.push({ id: `s-${run.steps.length + 1}`, kind: 'tool_write', title: `${approved.system}: ${approved.operation}`, status: 'running', startedAt: t, finishedAt: null, detail: approved.target });
    return sync(run);
  }
  if (run.proposedActions.some((a) => a.status === 'proposed')) {
    run.status = 'awaiting_approval';
    return sync(run);
  }
  finalize(run);
  sync(run);
}

function planRun(conversationId: string, content: string, allowActions: boolean, estimate: RunDetail['estimate'], author: string): RunDetail {
  const id = nextId('run');
  const t = nowIso();
  const wantsJira = allowActions && /\b(jira|ticket)\b/i.test(content) && /\b(create|open|file|raise|log)\b/i.test(content);
  const wantsSf = allowActions && /\b(salesforce|opportunity|account)\b/i.test(content) && /\b(update|move|change|set|mark|reassign)\b/i.test(content);
  const steps: RunStep[] = [];
  const add = (kind: RunStep['kind'], title: string, detail: string) =>
    steps.push({ id: `s-${steps.length + 1}`, kind, title, status: 'pending', startedAt: null, finishedAt: null, detail });
  const sources = scope.dataSources.filter((d) => d.dataStatus !== 'unavailable');
  add('retrieve', 'Search approved sources', `${sources.length} approved sources searched`);
  if (/\b(jira|ticket|issue)\b/i.test(content)) add('tool_read', 'Jira: search for related issues', 'JQL: text ~ query terms AND created >= -30d – 0 issues');
  if (/\b(salesforce|opportunity|account|renewal)\b/i.test(content)) add('tool_read', 'Salesforce: read matching records', 'SOQL read on Account, Opportunity – 1 record');
  const proposedActions: ProposedAction[] = [];
  const base = { estimatedCostUsd: 0.002, reversible: true, requiresApproval: true, status: 'proposed' as const, decidedBy: null, decisionReason: null, allowedActions: [] };
  if (wantsJira) {
    const actionId = `act-${id.slice(4)}-${proposedActions.length + 1}`;
    proposedActions.push({ ...base, id: actionId, version: 1, tool: 'tool-jira-create', system: 'Jira', operation: 'create_issue', target: 'Project OPS (Operations)', summary: `Create task "${content.slice(0, 80)}"`, diff: [{ field: 'Issue type', before: null, after: 'Task' }, { field: 'Summary', before: null, after: content.slice(0, 120) }], risk: 'low' });
    outcomes[actionId] = { status: 'succeeded', externalRef: `OPS-${3400 + seq}` };
  }
  if (wantsSf) {
    const actionId = `act-${id.slice(4)}-${proposedActions.length + 1}`;
    proposedActions.push({ ...base, id: actionId, version: 1, tool: 'tool-sf-update', system: 'Salesforce', operation: 'update_record', target: 'Opportunity (matched from conversation)', summary: 'Update the matched record as requested', diff: [{ field: 'NextStep', before: null, after: content.slice(0, 120) }], risk: 'medium' });
    outcomes[actionId] = { status: 'succeeded', externalRef: `0065g00000N${1000 + seq}` };
  }
  add('reason', proposedActions.length ? 'Plan changes' : 'Draft answer', proposedActions.length ? `Prepared ${proposedActions.length} write action(s); approval required` : '');
  scriptedAnswers[id] = {
    text: proposedActions.length
      ? `I reviewed the approved sources for your request and prepared ${proposedActions.length} change(s). They will not be applied until an operator approves them.`
      : `Here is what I found in the approved sources for "${content.slice(0, 120)}". The most relevant material is the ${sources[0]?.name ?? 'workspace'} content cited below.`,
    citations: sources.slice(0, 2).map((d) => ({ sourceId: d.id, title: d.name, excerpt: `Matched passage from ${d.name}.`, url: `https://atlas.example/sources/${d.id}` })),
  };
  return { id, conversationId, status: 'queued', createdAt: t, updatedAt: t, startedBy: author, allowActions, estimate, steps, proposedActions, unavailableSources: [], allowedActions: [] };
}

function findAction(params: Record<string, string>) {
  const run = runs.find((r) => r.id === params.id);
  const action = run?.proposedActions.find((a) => a.id === params.actionId);
  return { run, action };
}

export const routes: Route[] = [
  { method: 'GET', pattern: '/api/me', handler: ({ scenario }) => ({ status: 200, body: userFor(scenario) }) },
  {
    method: 'GET',
    pattern: '/api/workspace/scope',
    handler: ({ scenario }) => {
      if (scenario === 'empty') return { status: 200, body: { ...scope, dataSources: [], tools: [] } };
      if (scenario === 'partial') {
        return {
          status: 200,
          body: {
            ...scope,
            dataSources: scope.dataSources.map((d) =>
              d.id === 'ds-confluence' ? { ...d, dataStatus: 'unavailable' } : d.id === 'ds-snowflake' ? { ...d, dataStatus: 'stale', lastSyncedAt: new Date(Date.now() - 30 * 3600_000).toISOString() } : d,
            ),
            unavailableSources: ['ds-confluence'],
          },
        };
      }
      return { status: 200, body: scope };
    },
  },
  {
    method: 'GET',
    pattern: '/api/conversations',
    handler: ({ scenario }) => ({ status: 200, body: scenario === 'empty' ? [] : [...conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) }),
  },
  {
    method: 'POST',
    pattern: '/api/conversations',
    handler: ({ body }) => {
      const title = (body as { title?: unknown } | undefined)?.title;
      if (typeof title !== 'string' || !title.trim()) return err(422, 'VALIDATION', 'A title is required');
      if (title.length > 200) return err(422, 'VALIDATION', 'Title must be 200 characters or fewer');
      const t = nowIso();
      const c: ConversationSummary = { id: nextId('c'), title: title.trim(), createdAt: t, updatedAt: t, createdBy: me.name, lastRunId: null, lastRunStatus: null };
      conversations.push(c);
      return { status: 201, body: c };
    },
  },
  {
    method: 'GET',
    pattern: '/api/conversations/:id/messages',
    handler: ({ params, scenario }) => {
      if (!conversations.some((c) => c.id === params.id)) return notFound('Conversation');
      if (scenario === 'empty') return { status: 200, body: [] };
      return { status: 200, body: messages.filter((m) => m.conversationId === params.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)) };
    },
  },
  {
    method: 'POST',
    pattern: '/api/conversations/:id/messages',
    handler: ({ params, body, scenario }) => {
      const user = userFor(scenario);
      const c = conversations.find((x) => x.id === params.id);
      if (!c) return notFound('Conversation');
      if (!user.permissions.includes('conversations:write')) return forbidden();
      const b = (body ?? {}) as { content?: unknown; allowActions?: unknown };
      if (typeof b.content !== 'string' || !b.content.trim()) return err(422, 'VALIDATION', 'Message content is required');
      if (b.content.length > 8000) return err(422, 'VALIDATION', 'Message content must be 8000 characters or fewer');
      if (typeof b.allowActions !== 'boolean') return err(422, 'VALIDATION', 'allowActions must be a boolean');
      if (c.lastRunStatus && ACTIVE.includes(c.lastRunStatus)) return err(409, 'RUN_IN_PROGRESS', 'This conversation already has an active run. Wait for it to finish or cancel it.');
      const tokens = 2400 + b.content.length * 3;
      const estimate = { costUsd: round(tokens * 0.000015), tokens };
      if (scope.budget.usedUsd + estimate.costUsd > scope.budget.limitUsd) return err(402, 'BUDGET_EXCEEDED', 'The monthly model budget for this workspace has been used up');
      const run = planRun(c.id, b.content.trim(), b.allowActions, estimate, user.name);
      const msg: Message = { id: nextId('m'), conversationId: c.id, role: 'user', authorName: user.name, content: b.content.trim(), createdAt: run.createdAt, runId: run.id, citations: [] };
      runs.push(run);
      messages.push(msg);
      scope.budget.usedUsd = round(scope.budget.usedUsd + estimate.costUsd);
      c.lastRunId = run.id;
      c.lastRunStatus = run.status;
      c.updatedAt = run.createdAt;
      return { status: 201, body: { messageId: msg.id, runId: run.id, estimate } };
    },
  },
  {
    method: 'GET',
    pattern: '/api/runs/:id',
    handler: ({ params, scenario }) => {
      const run = runs.find((r) => r.id === params.id);
      if (!run) return notFound('Run');
      advance(run);
      return { status: 200, body: present(run, scenario) };
    },
  },
  {
    method: 'POST',
    pattern: '/api/runs/:id/actions/:actionId/approve',
    handler: ({ params, body, scenario }) => {
      const user = userFor(scenario);
      const { run, action } = findAction(params);
      if (!run || !action) return notFound('Action');
      if (!user.permissions.includes('actions:approve')) return forbidden();
      const b = (body ?? {}) as { version?: unknown };
      if (typeof b.version !== 'number') return err(422, 'VALIDATION', 'version is required');
      if (b.version !== action.version) return err(409, 'STALE_VERSION', 'This action changed since you loaded it');
      if (action.status !== 'proposed' || run.status !== 'awaiting_approval') return err(409, 'INVALID_STATE', `Action is ${action.status} and can no longer be approved`);
      action.status = 'approved';
      action.decidedBy = user.name;
      action.version += 1;
      if (!run.proposedActions.some((a) => a.status === 'proposed')) run.status = 'running';
      sync(run);
      return { status: 200, body: present(run, scenario) };
    },
  },
  {
    method: 'POST',
    pattern: '/api/runs/:id/actions/:actionId/reject',
    handler: ({ params, body, scenario }) => {
      const user = userFor(scenario);
      const { run, action } = findAction(params);
      if (!run || !action) return notFound('Action');
      if (!user.permissions.includes('actions:approve')) return forbidden();
      const b = (body ?? {}) as { version?: unknown; reason?: unknown };
      if (typeof b.version !== 'number') return err(422, 'VALIDATION', 'version is required');
      if (typeof b.reason !== 'string' || !b.reason.trim()) return err(422, 'VALIDATION', 'A reason is required to reject an action');
      if (b.reason.length > 500) return err(422, 'VALIDATION', 'Reason must be 500 characters or fewer');
      if (b.version !== action.version) return err(409, 'STALE_VERSION', 'This action changed since you loaded it');
      if (action.status !== 'proposed' || run.status !== 'awaiting_approval') return err(409, 'INVALID_STATE', `Action is ${action.status} and can no longer be rejected`);
      action.status = 'rejected';
      action.decidedBy = user.name;
      action.decisionReason = b.reason.trim();
      action.version += 1;
      if (!run.proposedActions.some((a) => a.status === 'proposed')) run.status = 'running';
      sync(run);
      return { status: 200, body: present(run, scenario) };
    },
  },
  {
    method: 'POST',
    pattern: '/api/runs/:id/actions/:actionId/retry',
    handler: ({ params, body, scenario }) => {
      const user = userFor(scenario);
      const { run, action } = findAction(params);
      if (!run || !action) return notFound('Action');
      if (!user.permissions.includes('actions:retry')) return forbidden();
      const b = (body ?? {}) as { version?: unknown };
      if (typeof b.version !== 'number') return err(422, 'VALIDATION', 'version is required');
      if (b.version !== action.version) return err(409, 'STALE_VERSION', 'This action changed since you loaded it');
      if (action.status !== 'failed' || (run.status !== 'partially_failed' && run.status !== 'failed')) return err(409, 'INVALID_STATE', 'Only failed actions on a finished run can be retried');
      const prev = outcomes[action.id];
      outcomes[action.id] = { status: 'succeeded', externalRef: prev?.retryExternalRef ?? prev?.externalRef };
      action.status = 'executing';
      action.version += 1;
      run.steps.push({ id: `s-${run.steps.length + 1}`, kind: 'tool_write', title: `${action.system}: ${action.operation} (retry)`, status: 'running', startedAt: nowIso(), finishedAt: null, detail: action.target });
      run.status = 'running';
      delete run.receipt;
      sync(run);
      return { status: 200, body: present(run, scenario) };
    },
  },
  {
    method: 'POST',
    pattern: '/api/runs/:id/cancel',
    handler: ({ params, scenario }) => {
      const user = userFor(scenario);
      const run = runs.find((r) => r.id === params.id);
      if (!run) return notFound('Run');
      if (!user.permissions.includes('runs:cancel')) return forbidden();
      if (!ACTIVE.includes(run.status)) return err(409, 'INVALID_STATE', `Run is ${run.status} and cannot be cancelled`);
      if (run.proposedActions.some((a) => a.status === 'executing')) return err(409, 'INVALID_STATE', 'An action is executing and cannot be interrupted');
      const t = nowIso();
      for (const s of run.steps) {
        if (s.status === 'running' || s.status === 'pending') {
          s.status = 'skipped';
          s.finishedAt = t;
          s.detail = `Cancelled by ${user.name}`;
        }
      }
      for (const a of run.proposedActions) {
        if (a.status === 'proposed' || a.status === 'approved') {
          a.status = 'rejected';
          a.decisionReason = 'Run cancelled';
          a.decidedBy = user.name;
          a.version += 1;
        }
      }
      run.status = 'cancelled';
      run.receipt = {
        runId: run.id,
        completedAt: t,
        actions: run.proposedActions.map((a) => ({ actionId: a.id, status: a.status })),
        totalCostUsd: round(run.estimate.costUsd * 0.3),
      };
      sync(run);
      return { status: 200, body: present(run, scenario) };
    },
  },
];
