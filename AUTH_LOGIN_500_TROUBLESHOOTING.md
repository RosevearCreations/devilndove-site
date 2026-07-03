# Devil n Dove login failure troubleshooting — Build 204

## What the current browser error means

A browser entry such as:

```text
auth.js:136 POST /api/auth/login 500 (Internal Server Error)
```

means the browser reached the Cloudflare Pages Function. It does **not** mean that the password field, browser cache, or login button caused the fault.

Devil n Dove uses **Cloudflare Pages Functions + Cloudflare D1**, with the D1 binding named `DB`. It does not use Supabase.

## First check: safely identify the database layout

Open this URL in a signed-out browser after deploying this build:

```text
https://devilndove-site.pages.dev/api/auth/login
```

Expected JSON includes an `auth_database.code` value:

| Code | Meaning | Correct action |
|---|---|---|
| `AUTH_READY` | Pages Function, D1 binding, and current auth columns are available. | Retry login. If it fails, use the `detail` field in the failed response plus the Pages Function log. |
| `AUTH_DB_BINDING_MISSING` | The Function cannot access `env.DB`. | In Pages > Settings > Bindings, connect the Production D1 database with the exact binding name `DB`. |
| `AUTH_LEGACY_SCHEMA` | The original `members` table and hashed-token `sessions` layout are still active. | Run `database_auth_legacy_to_current_repair.sql` exactly once after a D1 backup/export. |
| `AUTH_SCHEMA_INCOMPLETE` | Current tables are missing required columns. | Run `database_auth_runtime_diagnostics.sql`, then use the reviewed current D1 schema or a targeted repair. |
| `AUTH_DB_UNREACHABLE` | The D1 binding exists but D1 did not answer a query. | Check the Function log and D1 status/binding. |

## Confirmed legacy-layout repair

Run this only when the endpoint returns `AUTH_LEGACY_SCHEMA`.

1. Open **Cloudflare Dashboard → Storage & Databases → D1 → `devilndove-prod` → Console**.
2. Export or back up the database first.
3. Run `database_auth_runtime_diagnostics.sql` and save the output.
4. Run `database_auth_legacy_to_current_repair.sql` once.
5. Reopen `/api/auth/login`. It should show `AUTH_READY`.
6. Login again. Legacy sessions are archived and users must sign in afresh, but existing user email addresses and password hashes are retained.

Do not use this repair if `sessions` is already the current table shape. It deliberately renames a legacy `sessions` table to `sessions_legacy_build204` so the old audit information remains available.

## Capture an unexpected failure

The login page now displays the server `code` and safe `hint`. For a remaining `AUTH_LOGIN_UNEXPECTED_FAILURE`:

1. Press `F12` → **Network**.
2. Enable **Preserve log**.
3. Attempt login once.
4. Select the failed `auth/login` request and open **Response**.
5. Copy the JSON `code`, `hint`, and `detail`; do not copy session tokens, passwords, or cookie values.
6. Open Cloudflare **Workers & Pages → devilndove-site → Logs**, find the matching `auth_login_failed` entry, and compare its error.


## Build 205 correction: D1 Console repair execution

The prior Build 204 legacy-schema repair script must **not** be run in the Cloudflare D1 Console because it started with `PRAGMA foreign_keys = OFF`. D1 keeps foreign-key enforcement enabled inside its implicit transactions; use the replacement file `database_auth_legacy_to_current_repair_d1_console.sql` instead.

Run its numbered blocks separately: precheck, member copy, session-table swap, then postcheck. Do not use `BEGIN TRANSACTION`, `COMMIT`, or `PRAGMA foreign_keys = OFF` in the D1 Console for this repair. The browser login form now displays the safe server `detail` field, and the Function returns `AUTH_SESSION_CREATE_FAILED` or `AUTH_SESSION_READ_FAILED` if D1 reaches a session-table error after password verification.
