# Devil n Dove Build 233 Changed Files

## Runtime hotfix

- `functions/api/auth/login.js` — request-first validation, binding guard, indexed exact email lookup, bounded two-operation successful path, one atomic D1 batch, no session reread, safe error codes, lightweight default diagnostics and explicit full diagnostics.
- `functions/api/auth/me.js` — one indexed `session_token` verification query, compact selected fields and `auth_session_bounded_v1` response evidence.
- `public/js/site-auth-ui.js` — temporary 5xx/1102/network/malformed session checks retain credentials and show degraded verification; explicit 401/403 still clears access.
- `public/js/login.js` — concise resource-limit recovery guidance and safe retry state.
- `sw.js` — service-worker shell v14 for current authentication helpers.
- `functions/api/admin/_amazonInventoryMatches.js` — 897 private Amazon reference rows compressed by area and expanded only by an authenticated inventory request; removes the prior 1.1 MB eager object/Map startup allocation from unrelated Pages Function routes.
- `functions/api/admin/catalog-sync.js`, `functions/api/admin/site-item-inventory.js` and `functions/api/admin/product-resources.js` — await the demand-loaded reference registry while preserving all match, supplier, cost and purchase-note behaviour.
- `scripts/lazify-amazon-inventory-matches.mjs` — reproducible, idempotent packing utility for the private reference payload.

## Readiness, regression and release evidence

- `scripts/build233_login_resource_test.mjs` — successful-login query budget, no hot-path introspection/session reread, invalid-input early exit, binding-only GET, temporary-503 retention, real-401 clearing, 897-row compressed-payload round trip and code-only schema proof.
- `functions/api/admin/startup-readiness.js` — Build 233 seed plus a fourteen-step Critical login/session/recovery procedure and correction focus.
- `public/js/admin-startup-readiness.js` — synchronized complete 43-gate degraded fallback.
- `scripts/generate-startup-guide.mjs` and `STARTUP_GO_LIVE_GUIDE.md` — Build 233 generated operating copy.
- `BUILD233_VALIDATION.md` — local and production verification procedure.
- `database_schema.sql`, `database_full_schema.sql` and `database_store_schema.sql` — comment-only Build 233 synchronization; table/index definitions and the Build 230 migration boundary are unchanged.
- Current canonical, schema, Cloudflare, release, prelaunch, smoke, sanity, index and retired-pointer Markdown now identify Build 233. Build 232 and earlier Build files remain historical evidence.
- `data/site/release-notes.json`, `data/site/deployment-preflight.json` and `data/site/release-package-manifest.json` — current release metadata after validation/generation.

## Schema boundary

Build 233 adds no D1 table, column, index, seed or migration. `database_upgrade_current_pass.sql` remains byte-identical to `database_build230_visual_image_manifest.sql`. Apply that Build 230 migration only when its ledger key is absent; never reapply it merely because the application build number is 233.
