# Devil n Dove Build 233 Validation

Build 233 is a code-only authentication resource-limit, Worker-startup and temporary-session-retention hotfix. Local checks can prove the bounded route, reduced eager payload and browser decision rules; an owner-controlled production login and Cloudflare invocation record are still required before the Critical Startup login gate can pass.

## Local result

- Build 233 regression: PASS. A successful mocked administrator login executes exactly two D1 operations—one indexed user read and one batch containing session insert plus last-login update; `/api/auth/me` executes one indexed `session_token` verification query.
- Login POST runs no `sqlite_master`, `PRAGMA table_info`, schema creation, all-session scan or new-session reread.
- Invalid JSON returns 400 before D1; normal GET diagnostics perform no D1 query; full diagnostics require `?diagnostic=full`.
- A mocked 503 session-verification failure retains the browser session and emits degraded evidence; a mocked 401 clears it.
- The private Amazon reference helper preserves all 897 rows and both known first ASINs, but is 211,860 bytes instead of the prior 1,122,689-byte eager object source. A local Node diagnostic reduced cold module import from about 19.5 ms/2.0 MB heap growth to about 4.4 ms/0.75 MB; this is directional evidence, not a substitute for Cloudflare Metrics.
- Toolshed/supplies data expands only after an authenticated inventory route asks for that area. Login, session verification, Product Detail, autosave and product-removal code do not expand it.
- Wrangler 3.114.17 compiled the complete Pages Functions Worker successfully at 3,920,429 bytes (881,286 bytes gzip), down from the earlier 4,889,900-byte uncompressed bundle while retaining every route.
- Retained Build 231 autosave/reload, Build 232 removal and Build 230 visual/Startup/schema regressions pass.
- Build 233 adds no migration; current-pass SQL remains the byte-identical D1-safe Build 230 migration.

## Repeat locally

1. Run `node scripts/build233_login_resource_test.mjs`; it must include the 897-match demand-loaded result.
2. Run `node scripts/build231_product_autosave_test.mjs`, `node scripts/build232_product_removal_test.mjs` and `node scripts/build230_visual_manifest_test.mjs`.
3. Keep Build 229 and earlier regression files as historical evidence; their old hard-coded build-label assertions are not current-build commands.
4. Run the JavaScript syntax, public-page one-H1/metadata, CSS balance, static predeploy, deployment-preflight and final-blocker checks.
5. Execute all three aggregate schemas in disposable SQLite and apply `database_upgrade_current_pass.sql` twice. Build 233 must introduce no ledger row or explicit SQL transaction statement.
6. Compile Pages Functions with Wrangler and generate/checksum the exact archive.

## Production proof — do not skip

1. Deploy the complete Build 233 package and hard refresh until `devilndove-shell-v14` is active.
2. Open `/admin/startup-readiness/`, select **All statuses**, open `login_logout_recovery`, and follow all fourteen numbered steps exactly.
3. Confirm normal GET `/api/auth/login` returns binding-only `auth_login_bounded_v1` JSON without a D1 query.
4. Confirm owner-controlled POST login returns 200, `X-DD-Auth-Profile: auth_login_bounded_v1`, correct role/cookie and redirect; confirm `/api/auth/me` returns `auth_session_bounded_v1`; never save a password or token as evidence.
5. Correlate the UTC timestamp with Cloudflare Metrics/Logs. Any `exceededCpu`, `exceededMemory` or 1102 keeps the gate Failed/Blocked. The packed Amazon data must not be expanded by these authentication routes.
6. Prove wrong-password 401, normal `/api/auth/me` refresh, temporary blocked-me session retention/recovery, deliberate logout, password reset, two-browser logout-all and deliberate test expiry.
7. Save deployment ID, timestamp, route/status/code/profile, browser/device and non-secret Cloudflare invocation outcome. Reopen the gate after an auth deployment, D1 binding/schema change, password/session policy change or recurrence.

Cloudflare references: [Error 1102](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1102/), [Pages Functions metrics](https://developers.cloudflare.com/pages/functions/metrics/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), and [D1 batch behaviour](https://developers.cloudflare.com/d1/worker-api/d1-database/).
