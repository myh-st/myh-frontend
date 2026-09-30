# Storefront Insights — retail performance analytics (frontend)

React + TypeScript + Vite single-page app used by merchandising analysts and regional managers to review
store sales performance (revenue, gross margin, conversion, returns) across regions, stores, categories and
customer segments.

## Commands

```bash
pnpm dev        # http://localhost:5173 (mock backend is installed automatically)
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Backend contract (owned by the Reporting API team)

The following are **backend-owned** and must not be changed by frontend work:

- `src/api/**` – typed client, request/response shapes, error codes
- `src/mock/**` – in-browser mirror of the production Reporting API used for dev/test

Mock scenarios: append `?scenario=empty|error|forbidden|stale|slow|partial` to any URL.

- `empty` – timeseries points, breakdown rows, anomalies and store category rows are `[]`; totals are zero
- `error` – every GET returns 503 `UPSTREAM_UNAVAILABLE`
- `forbidden` – `/api/me` returns a `viewer`; `POST /api/exports` returns 403
- `stale` – `POST /api/exports` returns 409 `STALE_VERSION`
- `slow` – every response takes ~2.5s
- `partial` – POS data for two stores is missing: `dataQuality.status = 'partial'` with `missingStores` and a `note`;
  those stores are excluded from all figures, and exports that include them end in `failed`

Sales data is generated deterministically (seeded pseudo-random) and loaded up to **2026-09-28**. Queries may use
dates from 2026-04-02 to 2026-09-28, at most 180 days per request. The default range is 2026-07-01 → 2026-09-28.

### Units

| Field | Unit |
|---|---|
| `revenue` | USD |
| `grossMargin`, `conversionRate`, `returnsRate` (timeseries / totals) | fraction 0–1 |
| `marginPct` (breakdown rows) | percentage 0–100, one decimal |
| `conversion`, `returnsRate` (breakdown rows) | fraction 0–1 |
| `deltaVsPrior` | fraction, relative change of the requested `metric` vs the prior period of equal length; `null` if no prior data |
| `magnitudePct` (anomalies) | percent deviation from expected |

### Endpoints

Common filter query params: `from`, `to` (ISO dates, required), `region`, `store`, `category`, `segment`
(`online` \| `in_store` \| `loyalty` \| `new_customers`).

| Method | Path | Notes |
|---|---|---|
| GET | `/api/me` | current user: `role` (`analyst` \| `regional_manager` \| `viewer`), visible `regions`, `permissions` (`reports:read`, `exports:create`) |
| GET | `/api/reports/dimensions` | `regions`, `stores` (id, name, region, format, status, openedOn), `categories`, `segments`, `availableRange`, `defaultRange`, `dataVersion`, `refreshedAt`. Scoped to the user's regions |
| GET | `/api/reports/timeseries?from&to&granularity=day\|week&…filters` | `points[]` `{date, revenue, grossMargin, conversionRate, returnsRate, orders}`, `comparisonPoints[]` (prior period, aligned by index), `totals`, `comparisonTotals`, `range`, `comparisonRange`, `dataQuality`, `dataVersion`. 422 `VALIDATION`; 403 `FORBIDDEN` for a region/store outside the user's scope |
| GET | `/api/reports/breakdown?dimension=region\|store\|category&metric=revenue\|marginPct\|conversion\|returnsRate&from&to&…filters` | `rows[]` `{key, label, revenue, marginPct, conversion, returnsRate, orders, deltaVsPrior}` sorted by `metric` desc, `dataQuality`, `dataVersion`. 422; 403 |
| GET | `/api/reports/anomalies?from&to&…filters` | `[{id, metric, scope {dimension, key, label}, date, direction 'up'\|'down', magnitudePct, explanation}]`, newest first. Category- and segment-scoped anomalies are returned for every store/region filter. 422; 403 |
| GET | `/api/reports/stores/:id?from&to` | `store` (incl. regionName, manager, address, notes, status), `totals`, `comparisonTotals` (`null` for a store with no prior data), `categories[]` (breakdown rows), `dataQuality`, `dataVersion`. 404 `NOT_FOUND`; 403; 422 |
| POST | `/api/exports` | body `{ filters: {from, to, region?, store?, category?, segment?}, format: 'csv'\|'xlsx', dataVersion }` → 202 export job `{exportId, status: 'queued', …}`. 403 `FORBIDDEN` without `exports:create`; 409 `STALE_VERSION` when `dataVersion` ≠ current; 422 `VALIDATION` |
| GET | `/api/exports/:id` | export job `{exportId, status 'queued'\|'running'\|'ready'\|'failed', format, createdAt, filtersApplied (echo, incl. scoped `regions`), dataVersion, rowCount, downloadUrl, error}`. Advances one step per poll: `running`, then `ready` (with `rowCount` + `downloadUrl`) or `failed` (with `error`). 404 |

Error bodies are `{ code, message }`.

Authorization is enforced by the server. `regional_manager` users only see their own regions (other regions/stores
return 403 and are omitted from dimensions and breakdowns). `viewer` users can read reports but cannot export.

### Routes

- `/` – performance overview (totals, region breakdown, anomalies, store list, export)
- `/stores/:id` – store detail (accepts `?from=&to=`)

Existing automated tests rely on `data-testid="metric-box"`, `data-testid="region-row"`,
`data-testid="anomaly-item"` and `data-testid="from-date"`.
