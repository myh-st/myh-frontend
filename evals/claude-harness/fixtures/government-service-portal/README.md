# e-Service Case Portal (ระบบจัดการคำขอบริการ) — case officer console (frontend)

React + TypeScript + Vite single-page app used by district-office case officers and supervisors to review
citizen and business applications submitted through the government e-Service (business registration,
building permits, elderly allowance, land-use certificates, food-shop permits). Content is bilingual
Thai/English.

## Commands

```bash
pnpm dev        # http://localhost:5173 (mock backend is installed automatically)
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Backend contract (owned by the Case Management API team)

The following are **backend-owned** and must not be changed by frontend work:

- `src/api/**` – typed client, request/response shapes, error codes
- `src/mock/**` – in-browser mirror of the production service used for dev/test

Mock scenarios: append `?scenario=empty|error|forbidden|stale|slow|partial` to any URL.
Mock session user: append `?user=officer|officer2|supervisor|viewer` (default `officer`, a `case_officer`).

### Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/api/me` | current user: `role` (`case_officer`, `supervisor`, `read_only`), `preferredLocale` (`th`/`en`), office. `forbidden` scenario → `read_only` |
| GET | `/api/service-types` | `[{ id, name:{th,en}, slaDays, feeThb, decisions[], decisionsRequiringApproval[], requiredDocuments[] }]` |
| GET | `/api/cases?assignee=me\|all&serviceType=&state=&q=` | case summaries: `id`, `serviceType`, `applicantName:{th,en?}`, `state`, `assignee`, `submittedAt`, `slaDueAt`, `slaStatus` (`on_track`/`due_soon`/`breached`), `lastActivityAt`, optional `dataStatus` (`stale`/`unavailable`). `q` matches case number or applicant name (Thai or English). 422 `VALIDATION` on unknown `assignee` |
| GET | `/api/cases/:id` | detail: summary fields + `version`, `applicant` (bilingual, masked ID, `registryCheck`), `fields[]`, `evidence[]` (`verified: true/false/null`), `infoRequests[]`, `decisions[]`, `pendingDecision`, `audit[]` (server-generated, oldest first), `allowedActions[]`, `unavailableSources[]`. 404 `NOT_FOUND` |
| POST | `/api/cases/:id/info-requests` | body `{ version, items:[{documentKind, note}], messageTh, messageEn, responseDueAt }` → 200 updated case, state `awaiting_info`. 403 `FORBIDDEN`; 409 `STALE_VERSION`; 409 `INVALID_STATE` (only from `submitted`/`in_review`); 422 `VALIDATION` (missing `messageTh`/`messageEn`, unknown `documentKind`, `responseDueAt` not in the future) |
| POST | `/api/cases/:id/decisions` | body `{ version, decision, reasonTh, reasonEn }` → 200 updated case. If `decision` is in the service type's `decisionsRequiringApproval` → state `pending_supervisor` with `pendingDecision`; otherwise final (`approve`/`waive_fee` → `approved`, `reject` → `rejected`). 403; 409 `STALE_VERSION`; 409 `INVALID_STATE`; 422 (decision not offered for the service type, missing reason) |
| POST | `/api/cases/:id/decisions/:decisionId/approve` | body `{ version }` → 200 updated case, decision becomes final. Supervisor only; 403 for other roles and for approving one's own decision; 404; 409 `STALE_VERSION`/`INVALID_STATE` |
| POST | `/api/cases/:id/decisions/:decisionId/return` | body `{ version, comment }` → 200 updated case, state back to `in_review`. Supervisor only; 403; 404; 409; 422 (missing `comment`) |

Errors have the shape `{ code, message }` and surface as `ApiError` from `src/api/http.ts`.

Authorization is enforced by the server. `allowedActions` on the case detail (`request_info`, `decide`,
`approve_decision`, `return_decision`) reflects what the current user may do right now: case officers may act
only on cases assigned to them, supervisors on any case, and `read_only` users on none. Every mutation requires
the case `version` it was based on and returns the server-authoritative updated case.

In the `partial` scenario, case detail reports `unavailableSources: ['civil_registry']` (applicant registry check
becomes `unavailable`) and building-permit cases in the list carry `dataStatus: 'stale'`.

### Routes

- `/` → redirects to `/cases`
- `/cases` – case list
- `/cases/:caseId` – case detail (evidence, request info, decision)
- `/cases/:caseId/audit` – audit trail

Existing automated tests rely on `data-testid="case-row"` and `data-testid="assignee-filter"`.
