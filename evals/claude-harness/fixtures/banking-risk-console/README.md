# Sentinel — fraud investigation console (frontend)

React + TypeScript + Vite single-page app used by bank fraud investigators to triage alerts, work cases,
record decisions and request account freezes.

## Commands

```bash
pnpm dev        # http://localhost:5173 (mock backend is installed automatically)
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Backend contract (owned by the Fraud Case Service team)

The following are **backend-owned** and must not be changed by frontend work:

- `src/api/**` – typed client, request/response shapes, error codes
- `src/mock/**` – in-browser mirror of the production service used for dev/test

Mock scenarios: append `?scenario=empty|error|forbidden|stale|slow|partial` to any URL.

- `forbidden` – `/api/me` returns role `auditor` (read-only); all mutations return 403
- `partial` – case detail reports `unavailableSources: ["device_intelligence"]` (transaction devices are `null`, device/IP entities have `dataStatus: "unavailable"`); model-sourced alerts have `dataStatus: "stale"`
- `empty` – `/api/alerts` and `/api/cases/:id/audit` return `[]`

The seeded session user is **Ploy K.** (`senior_investigator`).

### Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/api/me` | current user: `id`, `name`, `role` (`investigator` \| `senior_investigator` \| `auditor`), `team`, `permissions[]` |
| GET | `/api/alerts?severity=&minConfidence=&status=` | alerts sorted newest first. `severity` critical/high/medium/low, `minConfidence` 0–1, `status` new/in_case/closed. Each alert: `confidence`, `source {kind: rule\|model, name, version}`, `amount`, masked `customerRef`, `caseId` (nullable), `dataStatus`. 422 `VALIDATION` on bad filter values |
| GET | `/api/cases/:id` | case with `version`, `status`, `assignee`, `transactions[]`, `relatedEntities[]` (with `linkReason`), `hypothesis` (nullable: `summary`, `confidence`, `basis[]`, `modelVersion`, `generatedAt`), `decision` (nullable), `activeFreezeRequestId`, server-computed `allowedActions[]`, `unavailableSources[]`. 404 `NOT_FOUND` |
| GET | `/api/cases/:id/audit` | server-emitted audit events, oldest first (`actor`, `action`, `at`, `details`). Read-only: the UI never writes audit events |
| POST | `/api/cases/:id/decision` | body `{ version, outcome: confirmed_fraud\|not_fraud\|needs_more_info, rationale (≥20 chars) }` → 200 updated case. 403 `FORBIDDEN`; 409 `STALE_VERSION`; 409 `INVALID_STATE`; 422 `VALIDATION` |
| POST | `/api/cases/:id/freeze-requests` | body `{ version, accountIds[], reason (≥20 chars) }` → 201 freeze request (`status: pending_approval`, `requestedBy`, `scope.accounts`, `scope.estimatedImpact {pendingPayments, scheduledTransfers, cardsAffected}`); case becomes `freeze_pending_approval`. Requires `request_freeze` permission (403 `FORBIDDEN`); 409 `STALE_VERSION`; 409 `INVALID_STATE`; 422 `VALIDATION` |
| GET | `/api/freeze-requests/:id` | freeze request incl. `version`, `status` (pending_approval/executed/rejected), `receipt` (when executed), server-computed `allowedActions[]` (`approve`, `reject`) |
| POST | `/api/freeze-requests/:id/approve` | body `{ version }` → 200 `{ receipt: {freezeId, executedAt, accountsFrozen, referenceNo}, request, case }`; case becomes `frozen`. Only a `senior_investigator` who is **not** the requester: 403 `SELF_APPROVAL_NOT_ALLOWED` / 403 `FORBIDDEN`; 409 `INVALID_STATE`; 409 `STALE_VERSION` |
| POST | `/api/freeze-requests/:id/reject` | body `{ version, reason (≥10 chars) }` → 200 updated freeze request; case returns to its prior working status. Same authorization rules as approve; 409; 422 |

Authorization is enforced by the server. `auditor` users can read cases and audit history but cannot mutate anything.
All mutations emit audit events server-side.

Seeded freeze requests: `FRZ-0419` (CASE-3102, requested by Anan W., pending — approvable by the session user),
`FRZ-0417` (CASE-3098, requested by the session user, pending — self-approval is rejected), `FRZ-0409` (executed), `FRZ-0402` (rejected).

### Routes

- `/` → redirects to `/alerts`
- `/alerts` – alert queue
- `/cases/:id` – case detail

Existing automated tests rely on `data-testid="alert-row"` and `data-testid="severity-filter"`.
The case page also exposes `data-testid="txn-row"` and `data-testid="freeze-button"`.
