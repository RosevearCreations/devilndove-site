# Build 254 — Changed Files

Build 254 hardens the Startup Readiness and Post-Deploy Smoke Test request paths after authenticated production requests returned HTTP 503 responses.

## Runtime/API

- `functions/api/admin/startup-readiness.js`
  - Replaced the server-side copy of the complete 46-gate guide with a compact mutable-status API.
  - GET returns only D1-backed status/history fields and a `startup_status_v2` contract marker.
  - Added batch `sync_items` recovery for browser-only changes.
  - POST returns only saved patches instead of rebuilding the full guide and Markdown report.
  - Audit/incident logging is moved off the primary response path with `context.waitUntil()` where available.
  - Handled failures return structured JSON.
- `functions/api/admin/post-deploy-smoke-tests.js`
  - Removed request-time `CREATE TABLE IF NOT EXISTS` work.
  - Added structured degraded/error JSON.
  - Batches smoke-result persistence.
  - Limits Quick Run to same-origin URLs and a bounded URL count.
  - Adds request-body bounds and defensive validation.

## Admin browser code

- `public/js/admin-startup-readiness.js`
  - Keeps the complete 46-gate operating guide client-side.
  - Merges compact D1 status patches into the static guide.
  - Synchronizes all browser-only changes with one batch request.
  - Generates the readiness Markdown report client-side.
  - Adds clearer 503/runtime diagnostics without hiding the built-in guide.
- `public/js/admin-post-deploy-smoke-tests.js`
  - Distinguishes structured API errors from Cloudflare/webpage 503 responses.
  - Adds retry/degraded-storage handling.
  - Keeps Quick Run bounded and integrated with the main UI.
- `admin/startup-readiness/index.html`
  - Cache-busts the Startup Readiness bundle to `v=254`.
- `admin/post-deploy-smoke-tests/index.html`
  - Cache-busts the smoke-test bundle to `v=254`.

## Canonical Startup guide/tooling

- `data/site/startup-readiness-guide.json`
  - New canonical static source for all 46 gate instructions and correction focus text.
- `scripts/generate-startup-guide.mjs`
  - Generates the Markdown guide from the canonical JSON rather than parsing Worker source.
- `scripts/sync-startup-client-fallback.mjs`
  - Synchronizes the browser fallback from the canonical JSON.
- `STARTUP_GO_LIVE_GUIDE.md`
  - Regenerated for Build 254 and the 46-gate compact-status architecture.

## Database/migration

- `database_build254_startup_smoke_runtime_hardening.sql`
  - Creates/ensures smoke-test storage outside the live request path.
  - Adds supporting readiness/smoke indexes.
  - Updates the three affected foundation readiness records.
  - Records the Build 254 runtime contract and migration ledger entry.
- `database_upgrade_current_pass.sql`
  - Byte-identical deployment copy of the Build 254 migration.
- `database_full_schema.sql`
- `database_schema.sql`
- `database_store_schema.sql`
  - Aggregate schema synchronization.
- `BUILD254_D1_VERIFICATION.sql`
  - Read-only post-migration verification queries.

## Regression/release documentation

- `scripts/build254_startup_smoke_runtime_regression.py`
  - Dedicated Build 254 contract/runtime regression.
- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`
- `PRELAUNCH_PROCESS_PLAYBOOKS.md`
- `POST_DEPLOY_SMOKE_TEST.md`
- `RELEASE_NOTES.md`
- `BUILD254_VALIDATION.md`
- `BUILD254_CHANGED_FILES.md`

## Migration boundary

Build 250 must already be present. Builds 251, 252 and 253 were code-only releases and required no D1 migration. Apply **one** Build 254 migration file (`database_build254_startup_smoke_runtime_hardening.sql` or the byte-identical `database_upgrade_current_pass.sql`), not both.
