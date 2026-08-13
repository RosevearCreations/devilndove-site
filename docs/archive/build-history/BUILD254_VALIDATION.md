# Build 254 Validation — Startup Readiness / Smoke-Test Runtime Hardening

## Production symptom addressed

Authenticated requests to both `/api/admin/startup-readiness` and `/api/admin/post-deploy-smoke-tests` were reported returning HTTP 503. Unauthenticated production requests still reached both route handlers and returned the expected 401 response, so the routes themselves were deployed. The failure therefore occurred after authentication in protected runtime/database work.

Build 254 removes two application-side request-path hazards found during review:

1. Startup Readiness rebuilt and returned the complete long-form 46-gate guide plus generated Markdown after status operations, even though the browser already contained the guide.
2. Post-Deploy Smoke Tests attempted table DDL (`CREATE TABLE IF NOT EXISTS`) during normal GET/POST requests.

Build 254 does not claim that these are the only possible causes of a Cloudflare 503. If a 503 remains after deployment, capture the Cloudflare Ray ID and Pages Function invocation/log entry so platform CPU, memory, D1, account-limit or other runtime failures can be distinguished from application logic.

## Build 254 regression

`scripts/build254_startup_smoke_runtime_regression.py`

**Result: 16/16 PASS**

Coverage includes:

- Exactly 46 unique browser-side startup gates remain available.
- Startup API implements the compact `startup_status_v2` contract.
- Startup Worker no longer embeds the complete `STARTUP_ITEMS` guide and remains below the regression size ceiling.
- Single saves return compact patches rather than the entire guide.
- Browser-recovery synchronization uses one `sync_items` batch request.
- The browser merges D1 status into the full static guide.
- Smoke API contains no request-time `CREATE TABLE` operation.
- Quick Run is restricted to same-origin URLs.
- Smoke-result writes use D1 batch persistence.
- Both affected admin pages request `v=254` JavaScript.
- The active current-pass migration is byte-identical to the Build 254 migration.
- Migration ledger/runtime-contract markers are present.
- All aggregate schemas execute with the Build 254 migration applied twice safely.
- Foreign-key verification remains clean.
- Real Startup API module exercised against a D1-shaped Node mock: compact GET, single PATCH-style save and batch sync all pass.
- Real Smoke API module exercised against a D1-shaped Node mock: structured GET passes.

## Retained regressions

- Build 249 kit/component inventory: **25/25 PASS**
- Build 250 product media/per-use persistence: **14/14 PASS**
- Build 251 Product Editor image runtime: **9/9 PASS**
- Build 252 inventory-unit runtime: **10/10 PASS**
- Build 253 linked-item/reset behavior: **18/18 PASS**

## Public/assets

- Public page/SEO audit: **36/36 PASS**, 0 warnings/failures.
- Referenced asset audit: **121 references, 0 missing**.

## JavaScript syntax

Syntax checks passed for:

- `functions/api/admin/startup-readiness.js`
- `functions/api/admin/post-deploy-smoke-tests.js`
- `public/js/admin-startup-readiness.js`
- `public/js/admin-post-deploy-smoke-tests.js`

## Database validation

The following aggregate schemas execute successfully with Build 254 represented and no foreign-key violations:

- `database_full_schema.sql`
- `database_schema.sql`
- `database_store_schema.sql`

The standalone Build 254 migration is idempotent in the regression fixture and may be applied twice without failure. `database_upgrade_current_pass.sql` is byte-identical to the standalone Build 254 migration.

## Deployment procedure

1. Back up production D1.
2. Confirm the Build 250 migration boundary is already installed. Builds 251–253 had no D1 migration.
3. Apply **one** of:
   - `database_build254_startup_smoke_runtime_hardening.sql`, or
   - `database_upgrade_current_pass.sql`.
4. Run `BUILD254_D1_VERIFICATION.sql` read-only verification.
5. Deploy the complete Build 254 package.
6. Hard-refresh `/admin/startup-readiness/` and `/admin/post-deploy-smoke-tests/` and confirm the browser loads the `v=254` bundles.
7. In Startup Readiness, synchronize browser-only changes. The complete 46-gate guide should remain visible and synchronization should occur in a single batch.
8. In Post-Deploy Smoke Tests, reload stored results and run a bounded same-origin Quick Run.
9. If either protected API still returns a true HTTP 503, record the exact time, Cloudflare Ray ID and Pages Function logs before making further code changes.

## Expected API behavior after deployment

Startup Readiness GET returns compact JSON with `contract: "startup_status_v2"` and `guide_included: false`; the browser supplies the static guide. Saves return compact patch data. Smoke-test GET returns structured JSON even when persistence is unavailable, and normal request handling no longer performs schema DDL.
