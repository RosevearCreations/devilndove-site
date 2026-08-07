# Devil n Dove Login 500/503 — Build 233 Evidence-First Troubleshooting

## Confirmed facts

- Devil n Dove authentication uses Cloudflare Pages Functions and D1, not Supabase.
- The selected D1 database has current `users` and `sessions` tables.
- It does **not** have a legacy `members` table.
- A prior multi-statement repair attempt must not be repeated. Do not use `PRAGMA foreign_keys = OFF`, do not rename `sessions`, and do not create/import a `members` table without evidence.
- Build 233 login POST performs no schema discovery, executes one indexed user read plus one atomic D1 batch, and returns `auth_login_bounded_v1` on success.
- The largest known cross-route startup payload—897 Amazon inventory match rows plus eager Maps—is now compressed and demand-loaded only by authenticated inventory work; login and `/api/auth/me` do not expand it.
- A temporary `/api/auth/me` 5xx/network failure is not an invalid session and must not clear browser credentials; a real 401/403 still does.

## Safe next evidence

1. In the browser, open DevTools → Network.
2. Attempt login once.
3. Select the failed `POST /api/auth/login` request.
4. Record only HTTP status, response JSON `code`/profile, safe `detail`, and `X-DD-Auth-Profile` when present.
5. Inspect the same UTC timestamp in Cloudflare Pages Function Metrics/Logs and record `exceededCpu`, `exceededMemory`, 1102 or normal/error outcome.
6. If Cloudflare terminated the Worker and returned HTML, do not copy the HTML. Record deployment ID, timestamp, route and invocation outcome.

Never copy passwords, request bodies, cookies, `Authorization` headers, bearer tokens, session tokens, or reset links.

## Useful code categories

- `AUTH_INVALID_CREDENTIALS`: normal wrong-email/password result; should be 401/403, not 500.
- `AUTH_USER_LOOKUP_FAILED`: inspect the Production `DB` binding/current `users` table; use the full diagnostic only after this structured code.
- `AUTH_SESSION_CREATE_FAILED`: the account verified but the atomic session/last-login D1 batch failed and rolled back; inspect only that error.
- `AUTH_LOGIN_UNEXPECTED_FAILURE`: inspect function stack/log after confirming the safe detail.
- `AUTH_DB_BINDING_MISSING` or `AUTH_SCHEMA_INCOMPLETE`: verify `DB` D1 binding and actual table columns.
- Cloudflare HTML 503/1102 with no application code: use Metrics/Logs because the terminated Worker may not run application catch/error handling.

## Safe Build 233 checks

1. Open `/api/auth/login`; expect 200 JSON, `auth_login_bounded_v1` and `binding_only` without a D1 query.
2. Use `/api/auth/login?diagnostic=full` only after a structured schema/binding error, never during every login attempt.
3. Run `node scripts/build233_login_resource_test.mjs`; it must pass with two mocked D1 operations and the 897-match compressed-payload round trip.
4. Follow the fourteen `login_logout_recovery` steps in Startup Readiness before marking login ready.

## Prohibited response

Do not apply a schema migration based on a generic browser `500` or Cloudflare `503`. The table listing must be compared with the current Build 241 schema boundary; Build 233 itself was code-only. Repair only the exact fault proven by the structured Function response or matching Cloudflare invocation. Do not raise plan limits as a substitute for the bounded-path proof.
