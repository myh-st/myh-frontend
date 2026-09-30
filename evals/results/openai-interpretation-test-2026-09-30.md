# OpenAI interpretation transfer test — 2026-09-30

This test asks whether the current MYH Frontend instructions lead to different domain-shaped information architectures while retaining the same principles. It is not an implementation benchmark and does not claim browser-rendered proof.

## EVAL-01 Hospital operations

- **Primary surface:** ward/bed operational queue with urgency and ownership.
- **Secondary surface:** selected-case inspector with handoff history and escalation.
- **MYH invariants retained:** task-first hierarchy, explicit state, non-color urgency cues, responsive list/detail behavior.
- **Anti-overfit result:** no hero, mascot, KPI grid, or chat-first layout is needed.

## EVAL-02 Banking risk & fraud

- **Primary surface:** case triage + evidence timeline + related transactions/entities.
- **Secondary surface:** AI hypothesis with source links.
- **Governed action:** account freeze requires exact scope, second-person approval, confirmation, and receipt.
- **Anti-overfit result:** evidence/case workflow dominates, not dashboard decoration.

## EVAL-03 DevOps incident control plane

- **Primary surface:** active incident and affected service context.
- **Secondary surface:** logs/metrics/traces organized around the selected incident.
- **AI behavior:** root-cause hypothesis separated from remediation execution.
- **Governed action:** proposed remediation requires approval, authoritative execution state, rollback/recovery.
- **Anti-overfit result:** telemetry and incident timeline replace generic KPI-card emphasis.

## EVAL-04 HR onboarding

- **Primary surface:** employee/cohort list + onboarding checklist with dependencies.
- **Secondary surface:** documents, owners, due dates, approval history.
- **Responsive adaptation:** managers see blockers, status, and next action first on mobile.
- **Anti-overfit result:** workflow/checklist structure, not chat or analytics-first.

## EVAL-05 Retail analytics

- **Primary surface:** trend and comparison workspace scoped by date/segment filters.
- **Secondary surface:** drill-down to region/store/category detail.
- **Responsive adaptation:** preserve the decision-driving trend first; move dense comparison behind drill-down on small screens.
- **Anti-overfit result:** charts and comparisons are justified by the domain, while KPI-card count stays restrained.

## EVAL-06 Enterprise AI agent

- **Primary surface:** conversation plus separate structured execution state.
- **Secondary surface:** evidence, current tool/data scope, cost/risk, approvals, receipt.
- **Safety behavior:** page render itself does not trigger billable/model/mutating work.
- **Anti-overfit result:** chat is appropriate here because intent is conversational, but execution is not represented as prose-only messages.

## EVAL-07 Connector hub

- **Primary surface:** connector catalog/list grouped by category and search.
- **Operational state:** connected, degraded, expired, disconnected, granted scopes, data direction, last sync/test.
- **Actions:** connect, test, reauthorize, reconnect, revoke/disconnect; secrets remain write-only.
- **Anti-overfit result:** cards are justified by discovery/catalog semantics rather than used as a default everywhere.

## EVAL-08 Government service case portal

- **Primary surface:** assigned case queue with SLA, state, service type, and ownership.
- **Secondary surface:** evidence and audit trail.
- **Governed action:** supervisor approval for specified decisions; server owns authoritative state.
- **Localization:** Thai/English content and long labels must wrap safely.
- **Anti-overfit result:** case/queue model fits the work rather than copying a generic dashboard.

## Interpretation result

The same skill maps to at least six distinct dominant information-architecture shapes across the eight cases:

1. queue + inspector;
2. case + evidence timeline;
3. incident + telemetry + remediation;
4. workflow/checklist;
5. analytics + drill-down;
6. conversation + execution;
7. connector catalog + health;
8. service case queue + evidence.

That is the intended generalization behavior: shared design principles without forcing a shared screen composition.

## Remaining proof gap

Automatic discovery, A/B lift, rendered implementation quality, and cross-model consistency still require external clean-session runs. Use `evals/CLAUDE_CODE_VALIDATION_PROMPT.md` for the Claude Code portion.
