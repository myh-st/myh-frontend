# Ward Ops — coordinator console (frontend)

React + TypeScript + Vite single-page app used by hospital bed/flow coordinators.

## Commands

```bash
pnpm dev        # http://localhost:5173 (mock backend is installed automatically)
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Backend contract (owned by the Patient Flow service team)

The following are **backend-owned** and must not be changed by frontend work:

- `src/api/**` – typed client, request/response shapes, error codes
- `src/mock/**` – in-browser mirror of the production service used for dev/test

Mock scenarios: append `?scenario=empty|error|forbidden|stale|slow|partial` to any URL.

### Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/api/me` | current user, role (`coordinator` or `viewer`), permitted wards |
| GET | `/api/wards` | wards with bed counts by status |
| GET | `/api/alerts?ward=&urgency=` | open operational alerts (queue) |
| GET | `/api/alerts/:id` | alert detail incl. handoff history, `version` |
| POST | `/api/alerts/:id/acknowledge` | body `{ version, note? }` → 200 updated alert; 409 `STALE_VERSION`; 403 `FORBIDDEN` |
| POST | `/api/alerts/:id/escalate` | body `{ version, reason, target }` → 200 updated alert; 409; 403 |

Authorization is enforced by the server. `viewer` users can read but not acknowledge/escalate.

### Routes

- `/` → redirects to `/alerts`
- `/alerts` – alert queue
- `/alerts/:id` – alert detail

Existing automated tests rely on `data-testid="alert-row"` and `data-testid="ward-filter"`.
