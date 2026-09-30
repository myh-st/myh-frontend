# Bridge — connectors (frontend)

React + TypeScript + Vite single-page app where organization admins connect Bridge to external systems
(cloud storage, collaboration tools, CRMs, databases and custom APIs) and monitor the health of those connections.
Members of the organization can view connections but cannot change them.

## Commands

```bash
pnpm dev        # http://localhost:5173 (mock backend is installed automatically)
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Backend contract (owned by the Connector Service team)

The following are **backend-owned** and must not be changed by frontend work:

- `src/api/**` – typed client, request/response shapes, error codes
- `src/mock/**` – in-browser mirror of the production service used for dev/test

Mock scenarios: append `?scenario=empty|error|forbidden|stale|slow|partial` to any URL.

- `empty` – no connections exist yet (the catalog is still returned)
- `error` – every GET fails with 503 `UPSTREAM_UNAVAILABLE`
- `forbidden` – `/api/me` returns a `member`; every connection has `allowedActions: []`; mutations return 403
- `stale` – every mutation returns 409 `STALE_VERSION`
- `slow` – ~2.5 s latency on every call
- `partial` – health telemetry is unavailable/stale for some connections (`dataStatus`), and
  `/impact` returns `unavailableSources: ['workflow-service']` with an empty `dependentWorkflows`

### Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/api/me` | current user: `role` (`admin` or `member`), `permissions` (`connections:read`, `connections:manage`) |
| GET | `/api/connectors/catalog` | connector types: `type`, `name`, `vendor`, `category`, `description`, `authMethod` (`oauth`/`api_key`/`service_account`/`basic`), `availableScopes[{id,label,access}]`, `supportsDirection`, `endpointField`, `credentialFields[{key,label,secret}]` |
| GET | `/api/connections?status=&type=` | connections. Never contains secrets — only `secretConfigured`. Includes `status`, `account`, `grantedScopes`, `direction`, `lastSuccessfulSyncAt`, `lastTestAt`, `lastTestResult`, `error?{code,message,occurredAt,remediation}`, `version`, `dataStatus`, `allowedActions` |
| GET | `/api/connections/:id` | connection detail: list fields + `endpoint`, `credentialsRotatedAt`, `events[]`; 404 `NOT_FOUND` |
| GET | `/api/connections/:id/impact` | what a disconnect affects: `dependentWorkflows[]`, `syncJobs`, `dataRetained`, `retentionDays`, `unavailableSources?` |
| POST | `/api/connections` | body `{ type, displayName, scopes, direction, endpoint?, credentials? }`. `oauth` → 202 `{ authorizationUrl, pendingConnectionId, expiresAt }`; other auth methods → 201 connection (credentials are write-only). 422 `VALIDATION` with `fieldErrors`; 403 `FORBIDDEN` |
| POST | `/api/connections/:id/test` | → 200 `{ result: 'ok'\|'failed', latencyMs, checkedAt, error?, connection }`; 409 `INVALID_STATE` when disconnected; 403 |
| POST | `/api/connections/:id/reauthorize` | OAuth only → 200 `{ authorizationUrl, expiresAt }`; 422 for non-OAuth; 403 |
| POST | `/api/connections/:id/reconnect` | body `{ version }` → 200 updated connection detail; 409 `STALE_VERSION`; 409 `INVALID_STATE` (expired token, no stored credentials, already connected); 403 |
| PATCH | `/api/connections/:id/credentials` | body `{ version, credentials }` (rotate, write-only; non-OAuth only) → 200 updated connection detail; 409 `STALE_VERSION`; 422 `VALIDATION`; 403 |
| DELETE | `/api/connections/:id?version=` | → 200 `{ disconnectedAt, revokedScopes, affectedSyncJobs, connection }`; revokes scopes and purges stored secrets; 409 `STALE_VERSION`; 409 `INVALID_STATE`; 403 |

Error body: `{ code, message, fieldErrors? }`. Codes: `NOT_FOUND`, `FORBIDDEN`, `VALIDATION`, `STALE_VERSION`,
`INVALID_STATE`, `UPSTREAM_UNAVAILABLE`.

Authorization is enforced by the server. `member` users can read the catalog, connections and impact but every
mutation returns 403. Each connection's `allowedActions` lists what the current user may do in its current state.

### Routes

- `/` → redirects to `/connectors`
- `/connectors` – connections list and add form
- `/connectors/:connectionId` – connection detail

Existing automated tests rely on `data-testid="connection-row"`, `data-testid="connector-type-select"`,
`data-testid="add-name"`, `data-testid="add-scopes"`, `data-testid="add-endpoint"` and
`data-testid="cred-<credentialFields.key>"`.
