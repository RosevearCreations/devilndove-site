# Build 243 Changed Files

Build 243 is the Inventory Operations backend-pressure, recovery, contrast and lower-case classification pass. It is a **D1 migration build** after Build 241.

## Runtime/API changes

- `functions/api/admin/_productResourcesData.js` — bounded current-schema product/resource reads; no private Amazon registry expansion.
- `functions/api/admin/product-resource-bootstrap.js` — lightweight product/link bootstrap.
- `functions/api/admin/product-resource-search.js` — bounded resource search.
- `functions/api/admin/product-resources.js` — compatibility route rebuilt on lightweight helpers; no PRAGMA/Amazon registry expansion.
- `functions/api/admin/site-item-inventory.js` — no request-time schema installation; lower-case controlled writes, case-insensitive active identity guard, structured runtime boundary.
- `functions/api/admin/inventory-lots.js` — removed request-time lot schema creation; current migration owns tables/indexes.
- `functions/api/admin/product-stock-report.js` — removed PRAGMA probing and legacy schema fallbacks; structured migration/unavailable response.
- `functions/api/admin/catalog-option-sets.js` — request-time tax schema install removed.
- `functions/api/admin/_catalog-options.js` — lower-case default/category/colour/shipping option authority and case-insensitive normalization.
- `functions/api/admin/_inventoryCostHistory.js` — history write no longer creates schema during a request.
- `functions/api/admin/amazon-link-preview.js` — controlled Amazon category output normalized lower-case.
- `functions/api/admin/amazon-purchase-review.js` — inventory cost-history request-time installer removed.
- `functions/api/admin/bulk-update-site-inventory.js` — inventory cost-history request-time installer removed.

## Browser/client resilience

- `public/js/auth.js` — shared authenticated JSON read boundary, in-flight GET dedupe, bounded retry/backoff, session cache and stale temporary-error fallback.
- `public/js/site-auth-ui.js` — deduplicated `dd:admin-ready` state emission and separate verified-auth signal.
- `public/js/admin-product-resources.js` — one-shot startup, split bootstrap/search calls, debounced search and targeted reloads.
- `public/js/admin-site-item-inventory.js` — one-shot startup, cached/retried reads, local form draft recovery, duplicate-submit prevention, lower-case controlled form values.
- `public/js/admin-inventory-lots.js` — shared safe JSON boundary and resilient lot reads.
- `public/js/admin-product-stock-report.js` — shared safe/cached bounded stock reads.
- `public/js/admin-catalog-sync.js` — shared safe write-response parser.
- `public/js/admin-catalog-option-manager.js` — shared safe JSON boundary, cached read and lower-case option de-duplication.
- `public/js/admin-notifications.js` — resilient read/write response handling.
- `public/js/admin-app-settings.js` — resilient read/write response handling.
- `public/js/admin-route-usage.js` — route telemetry deferred/one-shot instead of critical startup work.
- `public/js/site-analytics.js` — automatic admin page-view/exit telemetry suppressed.
- `js/main.js` — admin pages do not request the public social feed at startup.
- `css/styles.css` — high-contrast inventory/resource buttons and mobile full-width action controls.
- `sw.js` — shell cache advanced to v20 so current JS/CSS is not trapped behind the old shell.

## D1/schema

- `database_build243_inventory_resilience_case_normalization.sql` — current numbered migration.
- `database_upgrade_current_pass.sql` — byte-identical current migration copy.
- `database_schema.sql` — Build 243 scope note; legacy/core schema does not own full Site Inventory
- `database_full_schema.sql` — complete aggregate with executable Build 243 block
- `database_store_schema.sql` — Build 243 scope note; scoped store schema does not own full Site Inventory
- `DATABASE_SCHEMA_REFERENCE.md`

The migration normalizes controlled classifications to lower case, merges active case-only inventory identities without deleting historical IDs, normalizes persisted option arrays and adds case-insensitive identity/search indexes.

## Tests/audits

- `scripts/build242_inventory_create_regression.py` — retained test updated to recognize the Build 243 wrapped handler/shared parser without weakening the 27-bind assertion.
- `scripts/build243_inventory_resilience_regression.py`
- `scripts/build243_database_case_audit.py`
- `scripts/build243_public_page_audit.py`
- `scripts/build243_asset_reference_audit.py`
- `scripts/deployment_preflight_static_check.py` — current migration/release checks advanced to Build 243.
- `data/site/build243-public-page-audit.json`
- `data/site/build243-asset-reference-audit.json`
- `data/site/deployment-preflight.json`

## Current Markdown/documentation

- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`
- `README.md`
- `MARKDOWN_INDEX.md`
- `AI_CONTEXT.md`
- `NEW_CHAT_STATUS.md`
- `DEVELOPMENT_ROADMAP.md`
- `KNOWN_GAPS_AND_RISKS.md`
- `STARTUP_GO_LIVE_GUIDE.md`
- `SANITY_HEALTH_CHECK.md`
- `RELEASE_NOTES.md`
- `BUILD243_CHANGED_FILES.md`
- `BUILD243_VALIDATION.md`

Superseded Build 240–242 changed-file/validation records are retained under `docs/archive/build-history/`; the two canonical cross-project authorities remain `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`.
