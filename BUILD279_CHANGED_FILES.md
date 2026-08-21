# Build 279 — Changed Files

## Runtime / Functions

- `functions/api/track/visit.js` — lightweight fail-open public analytics; removes request-time DDL/schema probes, auth lookup and IP hashing; uses UPSERTs.
- `functions/api/admin/dashboard-summary.js` — compact desktop and `mobile_health` projections instead of the old broad sequential summary work.
- `functions/api/_lib/caipMediaIntake.js` + `_lib/caipMediaIntake.js` — cached readiness, narrow per-part return, periodic session aggregation and retained fail-closed multipart verification.
- `functions/api/admin/caip-media-intake.js` — compact response support for selected control-plane actions.
- `functions/api/admin/caip-media-upload-part.js` — removes redundant schema assertion from every binary part request.
- `functions/api/admin/caip-media-upload-direct.js` — removes redundant direct-upload schema assertion.
- `functions/api/seo-page-overrides.js` — removes routine table-existence probe.
- `functions/api/product-reviews.js` — removes routine table-existence probe.
- `functions/api/trust-blocks.js` — direct safe query/fallback rather than pre-query schema probe.
- `functions/api/featured-products.js` — consolidates and caches optional schema capabilities for five minutes per isolate.

## Browser/admin runtime

- `public/js/site-analytics.js` + root mirror `site-analytics.js` — admin exclusion, 15-minute same-path throttling, bounded checkout abandonment.
- `public/js/checkout.js` — one checkout-start event; recovery-lead writes throttled to 60 seconds plus unload beacon.
- `public/js/auth.js` — Cloudflare CPU/resource-limit errors are never automatically retried.
- `public/js/admin-live-activity.js` — removes 30-second polling; manual refresh only.
- `public/js/admin-dashboard-summary.js` — compact endpoint, longer cache, no retry.
- `public/js/admin-mobile-dashboard.js` — mobile-health endpoint.
- `public/js/admin-today-tasks.js` — bounded cache/no retry.
- `public/js/admin-dashboard-smoke-badges.js` — dashboard smoke status is opt-in.
- `public/js/admin-dashboard-preflight-badge.js` — release/preflight status is opt-in.
- `public/js/admin-caip-media-intake.js` — compact action responses and fewer whole-project refreshes.
- `js/main.js` — Build 279 analytics injector cache version.

## Cloudflare configuration

- `wrangler.toml` — Workers Logs enabled at 100% head sampling; no tracing or compatibility-date change.

## Schema authority

- `database_full_schema.sql` — analytics UTM columns are explicit in fresh table definitions rather than relying on the old runtime self-heal path.
- `database_schema.sql`, `database_store_schema.sql` — Build 279 analytics authority note aligned where relevant; no new production migration.
- `functions/api/_lib/fullSchemaRequirements.js` — regenerated from the Build 279 full schema.
- `BUILD279_D1_VERIFICATION.sql` — read-only production parity check.

## Cache-busted HTML

Build 279 cache-busts shared runtime references so the browser cannot keep old CPU-heavy JavaScript after deployment:

- 93 HTML pages reference `/public/js/auth.js?v=279`.
- 63 HTML pages reference `/public/js/site-analytics.js?v=279`.
- 105 HTML pages reference `/js/main.js?v=279`.
- Checkout references `/public/js/checkout.js?v=279`.
- CAIP intake references `/public/js/admin-caip-media-intake.js?v=279`.

## Tests / documentation

- Added `scripts/build279_worker_efficiency_go_live_test.py`.
- Updated stale build-range assertions in older CAIP/Packaging regressions so they continue validating their original invariants on Build 279.
- Updated `AI_HANDOFF.md`, `PROJECT_STATUS_AND_ROADMAP.md`, `MARKDOWN_INDEX.md`, `RELEASE_NOTES.md`, `DATABASE_SCHEMA_REFERENCE.md` and compatibility pointers.
- Updated CAIP specialist README/roadmap with the Build 279 multipart-efficiency boundary.
- Added `BUILD279_CLOUDFLARE_CPU_VERIFICATION.md`, `BUILD279_DEPLOY_CHECKLIST.md`, `BUILD279_VALIDATION.md`.
