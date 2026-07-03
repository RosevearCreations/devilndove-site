# Devil n Dove Login 500 — Evidence-First Troubleshooting

## Confirmed facts

- Devil n Dove authentication uses Cloudflare Pages Functions and D1, not Supabase.
- The selected D1 database has current `users` and `sessions` tables.
- It does **not** have a legacy `members` table.
- A prior multi-statement repair attempt must not be repeated. Do not use `PRAGMA foreign_keys = OFF`, do not rename `sessions`, and do not create/import a `members` table without evidence.

## Safe next evidence

1. In the browser, open DevTools → Network.
2. Attempt login once.
3. Select the failed `POST /api/auth/login` request.
4. Copy only the response JSON `code`, safe `detail`, and HTTP status.
5. Inspect the same timestamp in Cloudflare Pages Function logs.

Never copy passwords, request bodies, cookies, `Authorization` headers, bearer tokens, session tokens, or reset links.

## Useful code categories

- `AUTH_INVALID_CREDENTIALS`: normal wrong-email/password result; should be 401/403, not 500.
- `AUTH_SESSION_CREATE_FAILED`: inspect only the specific D1 session insert error.
- `AUTH_SESSION_READ_FAILED`: inspect only the specific session lookup error.
- `AUTH_LOGIN_UNEXPECTED_FAILURE`: inspect function stack/log after confirming the safe detail.
- `AUTH_DB_BINDING_MISSING` or `AUTH_SCHEMA_INCOMPLETE`: verify `DB` D1 binding and actual table columns.

## Prohibited response

Do not apply a schema migration based on a generic browser `500`. The table listing already confirms the current schema. Repair only the exact fault proven by the Function response or Cloudflare log.
