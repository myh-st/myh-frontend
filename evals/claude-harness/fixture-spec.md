# Fixture build spec (shared by all fixture builders)

You are building a small, NEUTRAL "existing product" frontend fixture that will later be handed to a
coding agent with a redesign/refactor task. The fixture is the "before" state. It must look like a
plausible, working-but-naive legacy frontend backed by a frozen backend contract.

Reference implementation (read ALL of it first, and mirror its structure/style exactly):
  /tmp/claude-0/evalrun/fixtures/hospital-operations/
  - README.md             (product description, commands, backend contract table, routes, test selectors)
  - src/api/http.ts       (shared, copy unchanged from _base)
  - src/api/types.ts      (BACKEND CONTRACT types, header comment "Do not edit")
  - src/api/client.ts     (BACKEND CONTRACT typed client)
  - src/api/client.test.ts(contract tests that call the mock backend directly)
  - src/mock/framework.ts (shared, copy unchanged from _base)
  - src/mock/data.ts      (seed data)
  - src/mock/routes.ts    (route handlers; must export `routes` and `resetMockData`)
  - src/App.tsx           (naive legacy UI)
  - src/App.test.tsx      (one existing UI test using data-testid selectors)

Steps:
1. `cp -R /tmp/claude-0/evalrun/fixtures/_base /tmp/claude-0/evalrun/fixtures/<CASE_ID>` (base already contains
   package.json, lockfile, configs, framework.ts, http.ts, main.tsx, index.css, index.html).
2. Write the case-specific files listed above (README.md, types.ts, client.ts, client.test.ts, data.ts, routes.ts,
   App.tsx, App.test.tsx). Do NOT add dependencies. Do not change package.json, configs, framework.ts, http.ts, main.tsx.
3. `cd` into it and run `pnpm install --offline` (fall back to `pnpm install` if offline fails), then
   `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. All four MUST pass. Fix until they do.
4. Do not create a git repo. Do not create any `.claude` or `.agents` directory. Delete `dist/` at the end.

Hard rules for neutrality (very important — this is a benchmark fixture):
- The legacy App.tsx must be functional but naive: fetch data with useEffect, render plain tables/divs,
  inline styles with fixed pixel widths, status shown only by color in at least one place, no loading/empty/
  error handling, `window.prompt`/`window.confirm` or no confirmation for mutations, minimal semantics.
  Roughly 80–150 lines. It must still exercise the main read endpoints and at least one mutation.
- Do NOT include any design guidance, TODO lists, UX suggestions, accessibility hints, or comments about how the UI
  should be improved. No mention of skills, agents, MYH, Sawasdee, benchmarks, or evaluation anywhere.
- Backend-owned files (src/api/**, src/mock/**) must carry the header comment that they are backend-owned / do not edit,
  like the reference.
- Mock backend must support the framework scenarios (empty/error/forbidden/stale/slow/partial) where they make sense:
  `empty` → list endpoints return []; `forbidden` → /api/me returns a lower-privilege role (mutations are already 403'd
  by the framework); `partial` → at least one aggregate endpoint returns a field like `unavailableSources: [...]` or a
  per-item `dataStatus: 'stale' | 'unavailable'`. Mutations must use optimistic-concurrency `version` and return 409
  STALE_VERSION on mismatch, 422 VALIDATION on bad input, and return the server-authoritative updated resource.
- Server owns authorization: `/api/me` (or equivalent) returns role and/or per-resource `permissions`/`allowedActions`
  arrays; handlers enforce them (return 403 when not allowed), not just the UI.
- Seed data: realistic, domain-specific, 6–15 primary records with varied states, including long text values.
- README "Backend contract" section: endpoint table with request/response notes and error codes, routes list, and the
  data-testid selectors the existing tests depend on. State that `src/api/**` and `src/mock/**` are backend-owned.
- Keep everything TypeScript-strict and ESLint-clean.

When finished, reply with: the file list, the endpoint table, the routes, test selectors, and the final output lines of
lint/typecheck/test/build.
