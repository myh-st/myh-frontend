# Beacon — incident control plane (frontend)

React + TypeScript + Vite single-page app used by on-call responders and incident commanders to follow
live incidents, look at service health and telemetry, run AI root-cause investigations and apply
approved remediations to production infrastructure.

## Commands

```bash
pnpm dev        # http://localhost:5173 (mock backend is installed automatically)
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Backend contract (owned by the Incident Platform team)

The following are **backend-owned** and must not be changed by frontend work:

- `src/api/**` – typed client, request/response shapes, error codes
- `src/mock/**` – in-browser mirror of the production service, incident, telemetry and remediation APIs used for dev/test

Mock scenarios: append `?scenario=empty|error|forbidden|stale|slow|partial` to any URL.

| Scenario | Effect |
|---|---|
| `empty` | list endpoints (services, incidents, logs, traces, metric series, remediations) return `[]` |
| `error` | every GET returns 503 `UPSTREAM_UNAVAILABLE` |
| `forbidden` | `/api/me` returns role `observer`, `allowedActions` is `[]`, all mutations return 403 `FORBIDDEN` |
| `stale` | all mutations return 409 `STALE_VERSION` |
| `slow` | every response is delayed ~2.5s |
| `partial` | metrics endpoint omits saturation series and reports `unavailableSources: ['k8s-metrics-eu-west-1']` |

### Endpoints

Error body shape: `{ code, message }`. Common codes: 404 `NOT_FOUND`, 403 `FORBIDDEN`, 409 `STALE_VERSION`,
409 `INVALID_STATE`, 422 `VALIDATION`, 503 `UPSTREAM_UNAVAILABLE`.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/me` | current user: `role` (`responder`, `incident_commander` or `observer`), teams |
| GET | `/api/services` | services with `health` (`healthy`/`degraded`/`down`), `tier`, `owningTeam`, `onCall`, `slo` (`meeting`/`at_risk`/`breached`, error budget) |
| GET | `/api/incidents?status=` | incident summaries (`SEV1`–`SEV4`, `investigating`/`identified`/`mitigating`/`resolved`, affected services, commander, `startedAt`), newest first; 422 on unknown status |
| GET | `/api/incidents/:id` | detail incl. `version`, `summary`, `customerImpact`, `timeline[]`, `latestInvestigationId`, `allowedActions[]` |
| GET | `/api/incidents/:id/telemetry/logs?service=&level=` | log entries (`debug`/`info`/`warn`/`error`); 422 if service not affected or level unknown |
| GET | `/api/incidents/:id/telemetry/metrics?service=` | `{ from, to, stepSeconds, series[], unavailableSources[] }`; series for `latency_p99_ms`, `error_rate_pct`, `saturation_pct` with `threshold` |
| GET | `/api/incidents/:id/telemetry/traces` | slow / error spans |
| POST | `/api/incidents/:id/investigations` | body `{ version, services? }` → 202 `{ investigationId, status: 'running', estimatedCostUsd, incident }`. **Billable model call.** 409 `STALE_VERSION`; 409 `INVESTIGATION_IN_PROGRESS`; 422; 403 |
| GET | `/api/investigations/:id` | `running` → `completed` (with `hypotheses[]` of `{ summary, confidence, evidence[{ kind: log/metric/trace/deploy, ref, excerpt }] }`) or `failed` (with `error`), plus `actualCostUsd` |
| GET | `/api/incidents/:id/remediations` | proposed remediations: `kind` (`rollback_deploy`/`scale_out`/`restart_pods`/`toggle_flag`), `target { service, environment, cluster }`, `risk`, `mutating`, `requiresApproval`, `reversible`, `expectedImpact`, `steps[]`, `status`, `approval`, `version` |
| POST | `/api/remediations/:id/approve` | body `{ version }` → 200 updated remediation with `approval.approvalId`. `incident_commander` only (403 otherwise); 409 `STALE_VERSION`; 409 `INVALID_STATE` if not `proposed` |
| POST | `/api/remediations/:id/execute` | body `{ version, approvalId }` → 202 `{ executionId, remediation }`. 409 `STALE_VERSION`; 409 `INVALID_STATE` if not approved; 422 if `approvalId` mismatches; 403 |
| GET | `/api/executions/:id` | `queued`/`running`/`succeeded`/`failed`/`rolled_back`, `steps[]` results, `receipt { executionId, startedAt, finishedAt, changes[], auditRef }` once terminal, `version` |
| POST | `/api/executions/:id/rollback` | body `{ version }` → 200 execution with status `rolled_back`. 409 `STALE_VERSION`; 409 `INVALID_STATE` if not reversible or still running; 403 |

Authorization is enforced by the server. `observer` users can read but not mutate; only `incident_commander`
can approve remediations; resolved incidents allow no actions. `allowedActions` on the incident detail lists
what the current user may do (`start_investigation`, `approve_remediation`, `execute_remediation`,
`rollback_execution`).

Mock behaviour: investigations complete on the second poll of `GET /api/investigations/:id` (the one for
`INC-4809` fails). Executions advance one step per poll of `GET /api/executions/:id`; `RM-911` fails at
step 2. Server-side events (investigation results, execution progress) append to the incident timeline and
bump the incident `version`.

### Routes

- `/` → redirects to `/incidents`
- `/incidents` – incident list
- `/incidents/:id` – incident detail (telemetry, investigation, remediations)
- `/services` – service catalog and health

Existing automated tests rely on `data-testid="incident-row"` and `data-testid="status-filter"`.
The services page renders `data-testid="service-row"`.
