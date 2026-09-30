# Surface patterns

## Operational console

Goal: let users find state and complete the next task with minimal visual competition.

Preferred shape:

1. Compact page header: title, one-line purpose, primary action if needed.
2. Filters/search close to the data they affect.
3. One primary list, table, queue, or detail surface.
4. Secondary evidence/details behind disclosure or a subordinate inspector.
5. Server-authorized actions near the resource state they mutate.

Avoid:

- a dashboard of many equal cards when users need to operate on one resource;
- decorative gradients, glass panels, and large empty hero copy;
- duplicated status summaries that disagree with the underlying data.

## Dashboard / welcome

A dashboard may have more personality, but it still needs a clear job.

Recommended composition:

- personalized or time-aware greeting when the data is reliable;
- concise product/assistant entry point;
- 3–4 KPI cards with trend or context, not raw counts only;
- one recent-activity or operational section that leads into real work;
- optional mascot/illustration isolated to the hero.

If a mascot or theme is selectable, preserve keyboard control, visible focus, `aria-pressed`/expanded state, and a stable user preference. Theme changes should affect a bounded set of tokens rather than restyling the whole product unpredictably.

## Auth / login

- Keep the auth card compact and vertically balanced.
- Make brand recognition strong but not louder than the sign-in action.
- Use a calm photographic/abstract background with foreground contrast protection when desired.
- Keep SSO/password options clearly separated and keyboard-accessible.
- Primary controls should be at least 44 px high on touch-oriented screens.
- Errors appear next to the action context and are announced appropriately.

## Agent / chat

Do not reduce an enterprise Agent to a generic chat box.

Separate:

- conversation / user intent;
- current authorized context;
- execution progress;
- approval requests;
- results/evidence;
- receipts/recovery.

The conversation should be readable, while execution state remains inspectable even if messages are long. Prefer concise result blocks and evidence links over multi-paragraph narration.

## Approval / destructive action

Before confirmation show:

- exact operation;
- project/resource scope;
- immutable change summary;
- side effects / data movement;
- risk classification if applicable;
- estimated/reserved cost when applicable;
- approval policy;
- reversibility/rollback information;
- explicit confirm and cancel actions.

Never use ambiguous labels such as `Continue` for a high-impact mutation when the actual action can be named.

## Builder / workflow canvas

- Canvas or workflow is the primary surface.
- Inspector is contextual and subordinate.
- Node states and invalid connections have non-color cues.
- Zoom, pan, selection, keyboard behavior, and focus remain predictable.
- Avoid floating controls that obscure content on 375/768 px.
- Persist authoritative workflow changes only through explicit save/publish semantics.

## Data-dense review

For tables, extracted fields, QA review, or document comparison:

- prioritize scanability and alignment;
- keep status/badges compact;
- freeze only the columns that materially aid comparison;
- show source/evidence close to the reviewed value;
- keep edit/review state explicit;
- use inline validation without shifting large portions of the page;
- allow a stacked card/list representation on small screens rather than forcing a desktop table to overflow.


## Connector / integration hub

Use a catalog or list structure when users are discovering and managing integrations.

Show, where relevant:

- connection state with text/icon cues, not color alone;
- authenticated account/workspace identity without exposing secrets;
- granted scopes and data direction;
- last successful sync or connection test;
- degraded, expired, and reconnect/reauthorize states;
- explicit connect, test, reconnect, reauthorize, and disconnect/revoke actions.

Keep secret values write-only. High-impact revoke/disconnect actions should name the affected connector, scope, and consequence before confirmation.

## Control plane / incident response

Use this for DevOps, reliability, security operations, or other incident-driven work.

Prioritize:

1. active incident/health state and ownership;
2. the affected service/resource context;
3. telemetry/evidence such as logs, metrics, traces, events, or audit records;
4. hypothesis/investigation state;
5. proposed remediation;
6. approval/confirmation for mutating remediation;
7. authoritative execution receipt, rollback, and recovery state.

Do not make the dashboard KPI layer compete with the selected incident. AI-generated hypotheses remain evidence-backed suggestions; server state owns execution authority.
