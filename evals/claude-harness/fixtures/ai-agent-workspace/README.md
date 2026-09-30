# Atlas — enterprise AI workspace (frontend)

React + TypeScript + Vite single-page app where employees ask questions over their company's approved
data sources and let the agent propose changes in connected tools (Jira, Salesforce, Slack, …).
Proposed write actions are executed only after an operator or admin approves them.

## Commands

```bash
pnpm dev        # http://localhost:5173 (mock backend is installed automatically)
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Backend contract (owned by the Agent Runtime team)

The following are **backend-owned** and must not be changed by frontend work:

- `src/api/**` – typed client, request/response shapes, error codes
- `src/mock/**` – in-browser mirror of the production service used for dev/test

Mock scenarios: append `?scenario=empty|error|forbidden|stale|slow|partial` to any URL.

- `empty` – conversation and message lists return `[]`; workspace scope has no data sources or tools
- `error` – every GET returns 503 `UPSTREAM_UNAVAILABLE`
- `forbidden` – `/api/me` returns a `member`; every mutation returns 403 `FORBIDDEN`
- `stale` – every mutation returns 409 `STALE_VERSION`
- `slow` – every response is delayed ~2.5s
- `partial` – scope reports `ds-confluence` as `unavailable` (listed in `unavailableSources`) and `ds-snowflake` as `stale`; runs report `unavailableSources: ['ds-confluence']`

### Endpoints

| Method | Path | Request | Response / errors |
|---|---|---|---|
| GET | `/api/me` | – | `Me`: role `member` \| `operator` \| `admin`, `permissions[]` |
| GET | `/api/workspace/scope` | – | tenant, approved `dataSources[]` (read-only, with `dataStatus`), connected `tools[]` (`mode`, `requiresApproval`), `policyNotes[]`, monthly `budget {limitUsd, usedUsd}`, `unavailableSources[]` |
| GET | `/api/conversations` | – | `ConversationSummary[]`, most recently updated first, incl. `lastRunStatus` |
| POST | `/api/conversations` | `{ title }` | 201 `ConversationSummary`; 422 `VALIDATION` |
| GET | `/api/conversations/:id/messages` | – | `Message[]` (oldest first, with `runId`, `citations`); 404 |
| POST | `/api/conversations/:id/messages` | `{ content, allowActions }` | **Starts a billable model run.** 201 `{ messageId, runId, estimate: { costUsd, tokens } }`; 422 `VALIDATION`; 409 `RUN_IN_PROGRESS` (conversation has a queued/running/awaiting_approval run); 402 `BUDGET_EXCEEDED`; 403; 404 |
| GET | `/api/runs/:id` | – | `RunDetail`: `status`, `steps[]`, `answer?`, `proposedActions[]` (with `version`, `risk`, `diff`, `allowedActions`), `receipt?`, `allowedActions` (`cancel`); 404. Runs advance on each poll. |
| POST | `/api/runs/:id/actions/:actionId/approve` | `{ version }` | 200 updated `RunDetail`; 403 `FORBIDDEN` (member); 409 `STALE_VERSION`; 409 `INVALID_STATE`; 422 |
| POST | `/api/runs/:id/actions/:actionId/reject` | `{ version, reason }` | 200 updated `RunDetail`; 403; 409 `STALE_VERSION` / `INVALID_STATE`; 422 `VALIDATION` (reason required) |
| POST | `/api/runs/:id/actions/:actionId/retry` | `{ version }` | 200 updated `RunDetail` (failed action only); 403; 409 `STALE_VERSION` / `INVALID_STATE`; 422 |
| POST | `/api/runs/:id/cancel` | – | 200 updated `RunDetail`; 409 `INVALID_STATE` (run finished, or an action is executing); 403 |

Run status: `queued` → `running` → (`awaiting_approval` →) `completed` | `partially_failed` | `failed` | `cancelled`.
Once every proposed action has been approved or rejected the run resumes, executes approved actions one at a
time (each adds a `tool_write` step) and issues a `receipt`.

Authorization is enforced by the server. `member` users can ask questions and cancel runs but cannot
approve, reject or retry external actions; the per-action `allowedActions` array reflects this.

Seeded conversation `c-102` has run `run-7702` awaiting approval for a Jira issue creation and a Salesforce
opportunity update. When both are approved the Jira action succeeds (`INTEG-1187`) and the Salesforce action
fails, leaving the run `partially_failed`; retrying the failed action succeeds.

### Routes

- `/` – workspace, no conversation selected
- `/c/:conversationId` – conversation

Existing automated tests rely on `data-testid="conversation-item"`, `data-testid="message"`,
`data-testid="proposed-actions"`.
