/** BACKEND-OWNED seed data for the Agent Runtime mock. Do not edit. */
import type { ConversationSummary, Me, Message, RunDetail, RunStep, WorkspaceScope } from '../api/types';

export const me: Me = {
  id: 'u-204',
  name: 'Dana Whitfield',
  email: 'dana.whitfield@northwind-freight.example',
  role: 'operator',
  tenantId: 't-northwind',
  permissions: ['conversations:write', 'runs:cancel', 'actions:approve', 'actions:retry'],
};

export const memberMe: Me = { ...me, role: 'member', permissions: ['conversations:write', 'runs:cancel'] };

const now = Date.now();
const iso = (mins: number) => new Date(now + mins * 60_000).toISOString();

export function seedScope(): WorkspaceScope {
  return {
    tenant: { id: 't-northwind', name: 'Northwind Freight', region: 'eu-west-1' },
    dataSources: [
      { id: 'ds-confluence', name: 'Engineering & Ops Wiki', kind: 'wiki', access: 'read', lastSyncedAt: iso(-18), dataStatus: 'fresh' },
      { id: 'ds-gdrive-revops', name: 'Revenue Ops shared drive', kind: 'drive', access: 'read', lastSyncedAt: iso(-42), dataStatus: 'fresh' },
      { id: 'ds-salesforce', name: 'Salesforce (Accounts, Opportunities)', kind: 'crm', access: 'read', lastSyncedAt: iso(-7), dataStatus: 'fresh' },
      { id: 'ds-zendesk', name: 'Zendesk support tickets', kind: 'ticketing', access: 'read', lastSyncedAt: iso(-11), dataStatus: 'fresh' },
      { id: 'ds-snowflake', name: 'Snowflake – analytics.finance & analytics.product', kind: 'warehouse', access: 'read', lastSyncedAt: iso(-65), dataStatus: 'fresh' },
      { id: 'ds-github', name: 'GitHub – platform monorepo (read-only)', kind: 'code', access: 'read', lastSyncedAt: iso(-25), dataStatus: 'fresh' },
    ],
    tools: [
      { id: 'tool-jira-search', name: 'Search issues', system: 'Jira', mode: 'read', requiresApproval: false, description: 'JQL search across INTEG, OPS and SEC projects.' },
      { id: 'tool-jira-create', name: 'Create issue', system: 'Jira', mode: 'write', requiresApproval: true, description: 'Creates an issue in INTEG, OPS or SEC. Reporter is set to the approving user.' },
      { id: 'tool-sf-query', name: 'Query records', system: 'Salesforce', mode: 'read', requiresApproval: false, description: 'SOQL read access to Account, Opportunity and Contact.' },
      { id: 'tool-sf-update', name: 'Update record', system: 'Salesforce', mode: 'write', requiresApproval: true, description: 'Field-level updates on Account and Opportunity. Forecast fields are audited.' },
      { id: 'tool-netsuite-invoices', name: 'List invoices', system: 'NetSuite', mode: 'read', requiresApproval: false, description: 'Read invoices and credit memos for the current and previous fiscal year.' },
      { id: 'tool-slack-post', name: 'Post message', system: 'Slack', mode: 'write', requiresApproval: true, description: 'Posts to public channels the workspace bot has been invited to.' },
    ],
    policyNotes: [
      'Write actions against external systems are never executed without approval from an operator or admin.',
      'Answers may only cite approved data sources listed in this workspace. Personal drives and DMs are excluded.',
      'Customer PII from Zendesk is redacted before it reaches the model; ticket numbers and company names are kept.',
      'Monthly model spend is capped per tenant. Runs are rejected once the budget is exhausted.',
    ],
    budget: { limitUsd: 1500, usedUsd: 1184.37, periodStart: '2026-09-01T00:00:00.000Z', periodEnd: '2026-09-30T23:59:59.999Z' },
    unavailableSources: [],
  };
}

export function seedConversations(): ConversationSummary[] {
  return [
    { id: 'c-102', title: 'ACME Logistics renewal blocker – EDI integration', createdAt: iso(-190), updatedAt: iso(-6), createdBy: 'Dana Whitfield', lastRunId: 'run-7702', lastRunStatus: 'awaiting_approval' },
    { id: 'c-107', title: 'Onboarding checklist for new SRE hires including on-call shadowing, runbook access, PagerDuty rotations, production access reviews and the first-90-days learning plan', createdAt: iso(-260), updatedAt: iso(-240), createdBy: 'Dana Whitfield', lastRunId: 'run-7699', lastRunStatus: 'cancelled' },
    { id: 'c-108', title: 'Which wiki pages still reference the deprecated v1 billing API?', createdAt: iso(-400), updatedAt: iso(-395), createdBy: 'Dana Whitfield', lastRunId: 'run-7695', lastRunStatus: 'completed' },
    { id: 'c-105', title: 'Reconcile April invoices against NetSuite', createdAt: iso(-1500), updatedAt: iso(-1495), createdBy: 'Dana Whitfield', lastRunId: 'run-7688', lastRunStatus: 'failed' },
    { id: 'c-104', title: 'Draft postmortem for INC-2291 (payment webhook delays)', createdAt: iso(-2900), updatedAt: iso(-2880), createdBy: 'Dana Whitfield', lastRunId: 'run-7671', lastRunStatus: 'completed' },
    { id: 'c-103', title: 'SOC 2 evidence gaps before auditor call', createdAt: iso(-4400), updatedAt: iso(-4390), createdBy: 'Dana Whitfield', lastRunId: 'run-7655', lastRunStatus: 'completed' },
    { id: 'c-101', title: 'Q3 churn drivers – EMEA mid-market', createdAt: iso(-8700), updatedAt: iso(-8690), createdBy: 'Dana Whitfield', lastRunId: 'run-7610', lastRunStatus: 'completed' },
    { id: 'c-106', title: 'Reassign Globex account owner after territory change', createdAt: iso(-12000), updatedAt: iso(-11980), createdBy: 'Dana Whitfield', lastRunId: 'run-7591', lastRunStatus: 'completed' },
  ];
}

const cite = {
  zendesk48213: { sourceId: 'ds-zendesk', title: 'Ticket #48213 – ASN files rejected since Tuesday', excerpt: 'Since the mapping update on the 22nd every 856 ASN we send to ACME DC-4 is rejected with segment error HL*03. Their renewal sign-off is on hold until this is fixed.', url: 'https://northwind.zendesk.example/agent/tickets/48213' },
  sfAcme: { sourceId: 'ds-salesforce', title: 'Opportunity: ACME Logistics – FY27 Renewal', excerpt: 'Stage: Negotiation/Review · Amount: €412,000 · Close date: 2026-10-15 · Next step: Send revised order form', url: 'https://northwind.lightning.force.example/lightning/r/Opportunity/0065g00000XyZ12/view' },
  wikiEdi: { sourceId: 'ds-confluence', title: 'EDI mapping release notes v4.12', excerpt: 'HL loop hierarchy changed for multi-pallet shipments. Partners on legacy X12 4010 parsers may reject nested HL segments.', url: 'https://wiki.northwind.example/display/INTEG/EDI+mapping+v4.12' },
  churnDeck: { sourceId: 'ds-gdrive-revops', title: 'Q3 Retention Review (EMEA).pptx', excerpt: 'Mid-market logo churn 4.1% vs 2.7% plan. Top cited reasons: carrier coverage in Iberia, invoice disputes, onboarding time > 45 days.', url: 'https://drive.example/file/d/1Q3-emea-retention' },
  churnSql: { sourceId: 'ds-snowflake', title: 'analytics.product.account_health_weekly', excerpt: '38 of 61 churned EMEA mid-market accounts had ≥3 invoice disputes in the 90 days before cancellation.', url: 'https://snowflake.example/worksheets/account_health_weekly' },
  soc2Tracker: { sourceId: 'ds-gdrive-revops', title: 'SOC 2 Type II – evidence tracker 2026', excerpt: 'CC6.2 access reviews: Q2 evidence missing for Snowflake and NetSuite. CC7.3 incident response tabletop: scheduled, not yet run.', url: 'https://drive.example/file/d/soc2-evidence-2026' },
  soc2Wiki: { sourceId: 'ds-confluence', title: 'Security – Quarterly access review procedure', excerpt: 'Reviews are exported from each system and signed off by the system owner within 10 business days of quarter end.', url: 'https://wiki.northwind.example/display/SEC/Access+reviews' },
  inc2291: { sourceId: 'ds-confluence', title: 'INC-2291 incident channel export', excerpt: '14:02 webhook queue depth 48k · 14:09 consumer autoscaling capped at 6 replicas · 15:31 cap raised to 20, backlog drained 16:12', url: 'https://wiki.northwind.example/display/OPS/INC-2291' },
  incCode: { sourceId: 'ds-github', title: 'platform/deploy/webhooks-consumer/hpa.yaml', excerpt: 'maxReplicas: 6  # sized for 2025 peak volumes', url: 'https://github.example/northwind/platform/blob/main/deploy/webhooks-consumer/hpa.yaml' },
  billingV1: { sourceId: 'ds-confluence', title: 'Partner API – Getting started (v1)', excerpt: 'POST /v1/billing/charges is the recommended way to create a one-off charge.', url: 'https://wiki.northwind.example/display/API/Getting+started' },
  globex: { sourceId: 'ds-salesforce', title: 'Account: Globex Corporation', excerpt: 'Owner: Priya Natarajan · Territory: DACH-Enterprise (changed 2026-06-01)', url: 'https://northwind.lightning.force.example/lightning/r/Account/0015g00000Glbx01/view' },
};

export function seedMessages(): Message[] {
  const m = (id: string, conversationId: string, role: 'user' | 'assistant', content: string, createdAt: string, runId: string | null, citations: Message['citations'] = []): Message => ({
    id,
    conversationId,
    role,
    authorName: role === 'user' ? 'Dana Whitfield' : 'Atlas',
    content,
    createdAt,
    runId,
    citations,
  });
  return [
    m('m-1001', 'c-101', 'user', 'What were the main drivers of EMEA mid-market churn in Q3? Use the retention review and the account health data, and tell me which ones we can actually act on this quarter.', iso(-8700), 'run-7610'),
    m('m-1002', 'c-101', 'assistant', 'Mid-market logo churn in EMEA was 4.1% against a 2.7% plan. Three drivers stand out: (1) invoice disputes – 38 of 61 churned accounts had three or more disputes in the 90 days before cancelling; (2) onboarding time above 45 days for accounts signed in Q1; (3) carrier coverage gaps in Iberia. Invoice disputes and onboarding time are actionable this quarter; carrier coverage depends on the 2027 network plan.', iso(-8690), 'run-7610', [cite.churnDeck, cite.churnSql]),
    m('m-1003', 'c-103', 'user', 'The SOC 2 auditor call is on Thursday. Which controls are still missing evidence, and who owns each gap?', iso(-4400), 'run-7655'),
    m('m-1004', 'c-103', 'assistant', 'Two controls have open evidence gaps. CC6.2 (quarterly access reviews): Q2 exports are missing for Snowflake (owner: Data Platform, Lars Eriksen) and NetSuite (owner: Finance Systems, Amara Osei); the procedure requires sign-off within 10 business days of quarter end, so both are overdue. CC7.3 (incident response testing): the tabletop exercise is scheduled for 14 October but has not been run, so only the plan can be shown on Thursday. All other controls in the tracker are marked "collected".', iso(-4390), 'run-7655', [cite.soc2Tracker, cite.soc2Wiki]),
    m('m-1005', 'c-104', 'user', 'Draft a blameless postmortem for INC-2291. Include a timeline, contributing factors and follow-up actions. Keep it under a page.', iso(-2900), 'run-7671'),
    m('m-1006', 'c-104', 'assistant', 'INC-2291 – Payment webhook delays (draft)\n\nImpact: partner payment confirmations were delayed by up to 2h10m between 14:02 and 16:12 UTC.\n\nTimeline: 14:02 queue depth alert (48k messages) · 14:09 consumer autoscaling reached its cap of 6 replicas · 15:31 cap raised to 20 · 16:12 backlog drained.\n\nContributing factors: the HPA maxReplicas value was set before the Q2 volume increase and was never revisited; the queue-depth alert paged the payments team rather than the platform on-call.\n\nFollow-ups: load-test the consumer at 3× peak; move the cap into the capacity review checklist; route queue-depth alerts to platform on-call.', iso(-2880), 'run-7671', [cite.inc2291, cite.incCode]),
    m('m-1007', 'c-105', 'user', 'Reconcile April invoices against NetSuite and list any invoice where the billed amount differs from the contracted rate card by more than 2%.', iso(-1500), 'run-7688'),
    m('m-1008', 'c-108', 'user', 'Which wiki pages still reference the deprecated v1 billing API?', iso(-400), 'run-7695'),
    m('m-1009', 'c-108', 'assistant', 'I found one page that still recommends the v1 billing API: "Partner API – Getting started (v1)", which tells partners to use POST /v1/billing/charges. No other pages in the Engineering & Ops Wiki reference /v1/billing.', iso(-395), 'run-7695', [cite.billingV1]),
    m('m-1010', 'c-107', 'user', 'Put together an onboarding checklist for new SRE hires: on-call shadowing, runbook access, PagerDuty rotations, production access reviews and a first-90-days learning plan.', iso(-260), 'run-7699'),
    m('m-1011', 'c-102', 'user', 'What is the current status of the ACME Logistics renewal?', iso(-190), 'run-7698'),
    m('m-1012', 'c-102', 'assistant', 'The ACME Logistics FY27 renewal (€412,000) is in Negotiation/Review with a close date of 15 October. Their operations lead opened Zendesk ticket #48213 on Tuesday: every 856 ASN sent to their DC-4 has been rejected since the EDI mapping update, and they have put renewal sign-off on hold until it is fixed.', iso(-185), 'run-7698', [cite.sfAcme, cite.zendesk48213]),
    m('m-1013', 'c-102', 'user', "Please open a Jira ticket for the integrations team with the details from the support thread, and move the ACME renewal opportunity in Salesforce to 'At Risk' with next step 'Waiting on EDI fix (see Jira)'.", iso(-9), 'run-7702'),
    m('m-1014', 'c-106', 'user', 'Globex moved to the DACH-Enterprise territory in June. Reassign the Globex account in Salesforce to the DACH-Enterprise owner.', iso(-12000), 'run-7591'),
    m('m-1015', 'c-106', 'assistant', 'Done. The Globex Corporation account owner was changed from Tom Becker to Priya Natarajan (DACH-Enterprise). Receipt: Salesforce record 0015g00000Glbx01.', iso(-11980), 'run-7591', [cite.globex]),
  ];
}

const step = (id: string, kind: RunStep['kind'], title: string, start: number, end: number | null, detail: string, status: RunStep['status'] = 'completed'): RunStep => ({
  id,
  kind,
  title,
  status,
  startedAt: iso(start),
  finishedAt: end === null ? null : iso(end),
  detail,
});

export function seedRuns(): RunDetail[] {
  const base = { startedBy: 'Dana Whitfield', allowActions: true, proposedActions: [], unavailableSources: [], allowedActions: [] as 'cancel'[] };
  return [
    {
      ...base,
      id: 'run-7610', conversationId: 'c-101', status: 'completed', createdAt: iso(-8700), updatedAt: iso(-8690), allowActions: false,
      estimate: { costUsd: 0.184, tokens: 12240 },
      steps: [
        step('s-1', 'retrieve', 'Search approved sources', -8700, -8699, 'Revenue Ops shared drive: 4 documents · Snowflake: 1 table'),
        step('s-2', 'tool_read', 'Query analytics.product.account_health_weekly', -8699, -8696, 'SELECT … WHERE region = \'EMEA\' AND segment = \'mid-market\' – 61 rows'),
        step('s-3', 'reason', 'Draft answer', -8696, -8690, 'Ranked drivers by share of churned ARR'),
      ],
      answer: { text: 'Mid-market logo churn in EMEA was 4.1% against a 2.7% plan. Three drivers stand out: invoice disputes, onboarding time above 45 days, and carrier coverage gaps in Iberia.', citations: [cite.churnDeck, cite.churnSql] },
      receipt: { runId: 'run-7610', completedAt: iso(-8690), actions: [], totalCostUsd: 0.171 },
    },
    {
      ...base,
      id: 'run-7655', conversationId: 'c-103', status: 'completed', createdAt: iso(-4400), updatedAt: iso(-4390), allowActions: false,
      estimate: { costUsd: 0.092, tokens: 6130 },
      steps: [
        step('s-1', 'retrieve', 'Search approved sources', -4400, -4399, 'Revenue Ops shared drive: 2 documents · Engineering & Ops Wiki: 3 pages'),
        step('s-2', 'reason', 'Draft answer', -4399, -4390, 'Cross-checked tracker rows against the access review procedure'),
      ],
      answer: { text: 'Two controls have open evidence gaps: CC6.2 (Snowflake and NetSuite Q2 access reviews) and CC7.3 (incident response tabletop not yet run).', citations: [cite.soc2Tracker, cite.soc2Wiki] },
      receipt: { runId: 'run-7655', completedAt: iso(-4390), actions: [], totalCostUsd: 0.088 },
    },
    {
      ...base,
      id: 'run-7671', conversationId: 'c-104', status: 'completed', createdAt: iso(-2900), updatedAt: iso(-2880),
      estimate: { costUsd: 0.231, tokens: 15400 },
      steps: [
        step('s-1', 'retrieve', 'Search approved sources', -2900, -2899, 'Engineering & Ops Wiki: incident export · GitHub: 2 files'),
        step('s-2', 'tool_read', 'Jira: search OPS for INC-2291 follow-ups', -2899, -2897, 'JQL: project = OPS AND labels = INC-2291 – 0 issues'),
        step('s-3', 'reason', 'Draft postmortem', -2897, -2880, 'Blameless template, 1 page'),
      ],
      answer: { text: 'INC-2291 – Payment webhook delays (draft). Impact, timeline, contributing factors and follow-ups are in the message above.', citations: [cite.inc2291, cite.incCode] },
      receipt: { runId: 'run-7671', completedAt: iso(-2880), actions: [], totalCostUsd: 0.244 },
    },
    {
      ...base,
      id: 'run-7688', conversationId: 'c-105', status: 'failed', createdAt: iso(-1500), updatedAt: iso(-1495),
      estimate: { costUsd: 0.412, tokens: 27460 },
      steps: [
        step('s-1', 'retrieve', 'Search approved sources', -1500, -1499, 'Revenue Ops shared drive: rate card 2026 (v3)'),
        step('s-2', 'tool_read', 'NetSuite: list invoices for April 2026', -1499, -1495, 'NetSuite connector timed out after 120s (SuiteQL page 7 of ~19). No partial results were kept.', 'failed'),
        step('s-3', 'reason', 'Compare invoices to rate card', -1495, -1495, 'Skipped because an earlier step failed', 'skipped'),
      ],
      receipt: { runId: 'run-7688', completedAt: iso(-1495), actions: [], totalCostUsd: 0.036 },
    },
    {
      ...base,
      id: 'run-7695', conversationId: 'c-108', status: 'completed', createdAt: iso(-400), updatedAt: iso(-395), allowActions: false,
      estimate: { costUsd: 0.041, tokens: 2730 },
      steps: [
        step('s-1', 'retrieve', 'Search approved sources', -400, -399, 'Engineering & Ops Wiki: 1 page matched "/v1/billing"'),
        step('s-2', 'reason', 'Draft answer', -399, -395, ''),
      ],
      answer: { text: 'One page still recommends the v1 billing API: "Partner API – Getting started (v1)".', citations: [cite.billingV1] },
      receipt: { runId: 'run-7695', completedAt: iso(-395), actions: [], totalCostUsd: 0.039 },
    },
    {
      ...base,
      id: 'run-7699', conversationId: 'c-107', status: 'cancelled', createdAt: iso(-260), updatedAt: iso(-240),
      estimate: { costUsd: 0.318, tokens: 21200 },
      steps: [
        step('s-1', 'retrieve', 'Search approved sources', -260, -258, 'Engineering & Ops Wiki: 11 pages · GitHub: runbooks/ (23 files)'),
        step('s-2', 'reason', 'Draft checklist', -258, -240, 'Cancelled by Dana Whitfield', 'skipped'),
      ],
      receipt: { runId: 'run-7699', completedAt: iso(-240), actions: [], totalCostUsd: 0.057 },
    },
    {
      ...base,
      id: 'run-7698', conversationId: 'c-102', status: 'completed', createdAt: iso(-190), updatedAt: iso(-185), allowActions: false,
      estimate: { costUsd: 0.063, tokens: 4210 },
      steps: [
        step('s-1', 'retrieve', 'Search approved sources', -190, -189, 'Salesforce: 1 opportunity · Zendesk: 1 ticket'),
        step('s-2', 'reason', 'Draft answer', -189, -185, ''),
      ],
      answer: { text: 'The ACME Logistics FY27 renewal is in Negotiation/Review; sign-off is on hold pending the EDI ASN rejection issue (Zendesk #48213).', citations: [cite.sfAcme, cite.zendesk48213] },
      receipt: { runId: 'run-7698', completedAt: iso(-185), actions: [], totalCostUsd: 0.061 },
    },
    {
      ...base,
      id: 'run-7702', conversationId: 'c-102', status: 'awaiting_approval', createdAt: iso(-9), updatedAt: iso(-6),
      estimate: { costUsd: 0.147, tokens: 9820 },
      steps: [
        step('s-1', 'retrieve', 'Search approved sources', -9, -9, 'Zendesk: ticket #48213 (14 comments) · Engineering & Ops Wiki: EDI mapping release notes v4.12'),
        step('s-2', 'tool_read', 'Salesforce: read opportunity 0065g00000XyZ12', -9, -8, 'StageName = Negotiation/Review · NextStep = Send revised order form · ForecastCategory = Commit'),
        step('s-3', 'tool_read', 'Jira: search INTEG for existing ACME / HL segment issues', -8, -8, 'JQL: project = INTEG AND text ~ "ACME" AND created >= -30d – 0 issues (no duplicate found)'),
        step('s-4', 'reason', 'Plan changes', -8, -6, 'Prepared 2 write actions; both require approval under workspace policy'),
      ],
      answer: {
        text: 'I found the support thread (Zendesk #48213) and the related mapping change (EDI v4.12 nested HL loops). There is no existing INTEG ticket for this. I have prepared two changes, both waiting for approval: a new INTEG bug with the reproduction details from the thread, and an update to the ACME FY27 renewal opportunity that moves it to At Risk and changes the forecast category from Commit to Best Case. The forecast change will be visible in this week\'s EMEA commit call.',
        citations: [cite.zendesk48213, cite.wikiEdi, cite.sfAcme],
      },
      proposedActions: [
        {
          id: 'act-7702-1', version: 1, tool: 'tool-jira-create', system: 'Jira', operation: 'create_issue', target: 'Project INTEG (Integrations)',
          summary: 'Create bug "EDI 856 ASN rejected by ACME Logistics DC-4 after v4.12 HL loop change"',
          diff: [
            { field: 'Issue type', before: null, after: 'Bug' },
            { field: 'Priority', before: null, after: 'High' },
            { field: 'Summary', before: null, after: 'EDI 856 ASN rejected by ACME Logistics DC-4 after v4.12 HL loop change' },
            { field: 'Description', before: null, after: 'Since the v4.12 mapping release every 856 ASN sent to ACME Logistics DC-4 is rejected with segment error HL*03. ACME parses X12 4010 and does not accept nested HL loops for multi-pallet shipments. Customer impact: renewal sign-off (€412k) on hold. Source: Zendesk #48213.' },
            { field: 'Labels', before: null, after: 'customer-escalation, edi, acme-logistics' },
          ],
          risk: 'low', estimatedCostUsd: 0.002, reversible: true, requiresApproval: true, status: 'proposed', decidedBy: null, decisionReason: null, allowedActions: [],
        },
        {
          id: 'act-7702-2', version: 1, tool: 'tool-sf-update', system: 'Salesforce', operation: 'update_record', target: 'Opportunity 0065g00000XyZ12 · ACME Logistics – FY27 Renewal',
          summary: 'Move opportunity to At Risk, change forecast category and next step',
          diff: [
            { field: 'StageName', before: 'Negotiation/Review', after: 'At Risk' },
            { field: 'ForecastCategoryName', before: 'Commit', after: 'Best Case' },
            { field: 'NextStep', before: 'Send revised order form', after: 'Waiting on EDI fix (see Jira)' },
          ],
          risk: 'high', estimatedCostUsd: 0.002, reversible: true, requiresApproval: true, status: 'proposed', decidedBy: null, decisionReason: null, allowedActions: [],
        },
      ],
    },
    {
      ...base,
      id: 'run-7591', conversationId: 'c-106', status: 'completed', createdAt: iso(-12000), updatedAt: iso(-11980),
      estimate: { costUsd: 0.058, tokens: 3870 },
      steps: [
        step('s-1', 'retrieve', 'Search approved sources', -12000, -11999, 'Salesforce: 1 account · Revenue Ops shared drive: territory map 2026'),
        step('s-2', 'reason', 'Plan changes', -11999, -11995, 'Prepared 1 write action'),
        step('s-3', 'tool_write', 'Salesforce: update_record', -11982, -11980, 'Account 0015g00000Glbx01 updated'),
      ],
      answer: { text: 'The Globex Corporation account owner should move from Tom Becker to Priya Natarajan (DACH-Enterprise).', citations: [cite.globex] },
      proposedActions: [
        {
          id: 'act-7591-1', version: 3, tool: 'tool-sf-update', system: 'Salesforce', operation: 'update_record', target: 'Account 0015g00000Glbx01 · Globex Corporation',
          summary: 'Change account owner to Priya Natarajan',
          diff: [{ field: 'OwnerId', before: 'Tom Becker', after: 'Priya Natarajan' }],
          risk: 'medium', estimatedCostUsd: 0.002, reversible: true, requiresApproval: true, status: 'succeeded', decidedBy: 'Marcus Okafor', decisionReason: null, allowedActions: [],
        },
      ],
      receipt: { runId: 'run-7591', completedAt: iso(-11980), actions: [{ actionId: 'act-7591-1', status: 'succeeded', externalRef: '0015g00000Glbx01' }], totalCostUsd: 0.061 },
    },
  ];
}

export interface ActionOutcome {
  status: 'succeeded' | 'failed';
  externalRef?: string;
  error?: string;
  /** Reference returned if the action is retried after failing. */
  retryExternalRef?: string;
}

/** What the connected systems will return when a given action executes. Retries always succeed. */
export function seedOutcomes(): Record<string, ActionOutcome> {
  return {
    'act-7702-1': { status: 'succeeded', externalRef: 'INTEG-1187' },
    'act-7702-2': { status: 'failed', error: 'UNABLE_TO_LOCK_ROW: unable to obtain exclusive access to this record (Opportunity 0065g00000XyZ12). Another process is updating it.', retryExternalRef: '0065g00000XyZ12' },
  };
}
