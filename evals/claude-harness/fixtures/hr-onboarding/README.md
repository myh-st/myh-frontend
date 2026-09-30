# Arrive — employee onboarding workspace (frontend)

React + TypeScript + Vite single-page app used by HR partners and hiring managers to track new hires
from signed offer to first week: checklist tasks, documents, approvals and onboarding exceptions.

## Commands

```bash
pnpm dev        # http://localhost:5173 (mock backend is installed automatically)
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Backend contract (owned by the HR Onboarding API team)

The following are **backend-owned** and must not be changed by frontend work:

- `src/api/**` – typed client, request/response shapes, error codes
- `src/mock/**` – in-browser mirror of the production service used for dev/test

Mock scenarios: append `?scenario=empty|error|forbidden|stale|slow|partial` to any URL.

Mock session user: defaults to the HR partner (`u-hr-01`). Set `localStorage.mockUser` to `u-mgr-01`,
`u-mgr-02` or `u-mgr-03` to act as a hiring manager, or `u-view-01` for a viewer.

### Endpoints

All mutations take the hire's current `version` and return the full, server-authoritative `HireDetail`
(with `version` incremented) on success. Errors are `{ code, message }`.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/me` | current user: `id`, `name`, `email`, `title`, `role` (`hr_partner`, `hiring_manager`, `viewer`) |
| GET | `/api/cohorts` | start-date cohorts with `hireCount` (visible hires only) |
| GET | `/api/hires?cohort=&status=` | hire summaries: `displayName`, `roleTitle`, `department`, `startDate`, `manager`, `progress {done,total}`, `blockers`, `status` (`on_track`/`at_risk`/`blocked`/`completed`). 422 `VALIDATION` on unknown status |
| GET | `/api/hires/:id` | detail incl. `version`, `pii` (legal name, personal email, phone, date of birth, masked national ID), `tasks`, `documents`, `exceptions`, `infoRequests`, `allowedActions`, `unavailableSources`. 403 `FORBIDDEN` for a hiring manager viewing someone else's report; 404 `NOT_FOUND` |
| PATCH | `/api/hires/:id/tasks/:taskId` | body `{ version, status }` → 200 `HireDetail`; 409 `STALE_VERSION`; 409 `DEPENDENCY_INCOMPLETE` (moving to `in_progress`/`done` while a `dependsOn` task is not done); 409 `APPROVAL_PENDING` (`done` on a task whose approval is not approved); 422 `VALIDATION`; 403 `FORBIDDEN` |
| POST | `/api/hires/:id/info-requests` | body `{ version, fields: InfoField[], message }` → 200 `HireDetail`; 422 on empty/unknown fields or blank message; 409; 403 (HR partners only) |
| POST | `/api/hires/:id/exceptions/:exId/resolve` | body `{ version, resolution }` → 200 `HireDetail`; 422 on blank resolution or already resolved; 409; 403 (HR partners only) |
| POST | `/api/hires/:id/approvals/:taskId` | body `{ version, decision: 'approve' \| 'reject', comment }` → 200 `HireDetail` (approve → task `done`, reject → task `blocked`); comment required to reject (422); 409 `STALE_VERSION` / `DEPENDENCY_INCOMPLETE`; 403 unless the current user is the task's `approval.approver` |
| GET | `/api/manager/summary` | `{ generatedAt, items: [{ hireId, displayName, roleTitle, startDate, status, blockers, nextAction, dataStatus }], unavailableSources }`; hiring managers see their reports, HR partners see all hires; 403 for viewers |

`InfoField` = `legalName | personalEmail | phone | dateOfBirth | nationalId | homeAddress | bankAccount | taxForm | emergencyContact`.

Authorization is enforced by the server and surfaced per hire as `allowedActions`
(`update_tasks`, `request_info`, `resolve_exceptions`, `decide_approvals`):

- `hr_partner` – all hires; may update any task, request info, resolve exceptions, and decide approvals assigned to them.
- `hiring_manager` – only hires whose `manager.id` is theirs; may update tasks they own and decide approvals assigned to them.
- `viewer` – read-only (the `forbidden` scenario downgrades the session to `viewer`).

Derived fields are computed by the server: `blockers` = blocked tasks + unresolved exceptions; `status` is
`completed` when every task is done, `blocked` when any task is blocked, `at_risk` when there is an unresolved
exception or an overdue task, otherwise `on_track`.

In the `partial` scenario `GET /api/hires/:id` returns `documents: []` with `unavailableSources: ['document_vault']`,
and `GET /api/manager/summary` reports `unavailableSources: ['it_provisioning']` with `dataStatus: 'unavailable'`
on hires that have outstanding IT tasks.

### Routes

- `/` → redirects to `/hires`
- `/hires` – hires list with cohort filter
- `/hires/:id` – hire detail (checklist, documents, exceptions)
- `/manager` – hiring-manager summary

Existing automated tests rely on `data-testid="hire-row"` and `data-testid="cohort-filter"`
(`data-testid="task-checkbox"` is also present on the hire detail checklist).
