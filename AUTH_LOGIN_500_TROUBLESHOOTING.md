# Devil n Dove login 500 troubleshooting

## Scope

Devil n Dove login uses **Cloudflare Pages Functions plus Cloudflare D1**. It does not use Supabase.

The login route is:

```text
/api/auth/login
```

The required D1 binding is:

```text
DB
```

The required D1 database tables are:

```text
users
sessions
```

## First check: are Pages Functions active?

Open this URL while signed out:

```text
https://devilndove.com/api/auth/login
```

Expected response: JSON with all of the following:

```json
{
  "functions_active": true,
  "has_db_binding": true,
  "status": "ready"
}
```

If the URL shows the public home page instead of JSON, Cloudflare is serving a static fallback. The `functions` directory is not being deployed from the active project root.

### Cloudflare root-directory check

In **Cloudflare Dashboard → Workers & Pages → devilndove-site → Settings → Builds & deployments**:

1. Confirm **Root directory** points to the folder that directly contains all of these entries:
   - `functions/`
   - `_routes.json`
   - `wrangler.toml`
   - `index.html`
2. Confirm **Build output directory** is `.` for this static Pages project.
3. Trigger a fresh production deployment.
4. Re-open `/api/auth/login` before attempting another login.

> The `functions` directory must be at the Pages project root. A nested archive folder such as `devilndove-site-main/functions/` will not work unless Cloudflare's Root directory is explicitly set to `devilndove-site-main`.

## Second check: D1 binding and schema

When `/api/auth/login` responds with JSON, look at `auth_database`:

| Result | Meaning | Action |
|---|---|---|
| `AUTH_READY` | Function, binding, and core tables are reachable. | Retry the login and inspect the failed request response only if it still fails. |
| `AUTH_DB_BINDING_MISSING` | The function ran, but Production does not expose `env.DB`. | Add/reconnect the D1 binding named `DB`. |
| `AUTH_SCHEMA_INCOMPLETE` | D1 is reachable but `users` or `sessions` is missing. | Run the current application schema, then recheck. |
| `AUTH_DB_UNREACHABLE` | The binding could not query D1. | Inspect Cloudflare Function logs and D1 status/configuration. |

Run `database_auth_runtime_diagnostics.sql` in **Cloudflare Dashboard → Storage & Databases → D1 → devilndove-prod → Console**. It is read-only and does not disclose passwords, tokens, or email addresses.

## Third check: capture the actual login result

On the login page:

1. Press `F12`.
2. Open **Network**.
3. Check **Preserve log**.
4. Submit the login once.
5. Select the failed `auth/login` request.
6. Open **Response**.
7. Copy the `code`, `hint`, and `detail` fields.

The expected non-500 cases are:

| HTTP status | Code | Meaning |
|---:|---|---|
| 400 | `AUTH_EMAIL_REQUIRED`, `AUTH_PASSWORD_REQUIRED`, or `AUTH_INVALID_JSON` | Form/request problem. |
| 401 | `AUTH_INVALID_CREDENTIALS` | Email/password did not match. |
| 403 | `AUTH_ACCOUNT_INACTIVE` | Account exists but is disabled. |
| 500 | `AUTH_DB_*` or `AUTH_LOGIN_UNEXPECTED_FAILURE` | Deployment, D1, schema, or unexpected function error. |

## Do not do these things

- Do not add `DB` as an encrypted text secret. It must be a **D1 database binding**.
- Do not paste a D1 token, password hash, or session token into the browser console or a public ticket.
- Do not create a second `users` or `sessions` table with a different structure. Use the schema included in this project.
