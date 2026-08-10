# Build 245 Changed Files

Build 245 starts from the user-supplied live archive `devilndove-site-main(20260809-191040).zip`, folds in the completed Build 244 D1 inventory/fractional-usage work that was not fully present in that live archive, then adds the admin-auth, request-pressure, product-media, readiness and documentation changes described below.

## Primary runtime changes

- Admin auth/degraded mode: `public/js/site-auth-ui.js`, `public/js/admin-self-protect.js`, `public/js/admin.js`.
- Deferred/staggered dashboard reads: `public/js/admin-dashboard-summary.js`, `public/js/admin-today-tasks.js`, `public/js/admin-dashboard-smoke-badges.js`, `public/js/admin-dashboard-preflight-badge.js`.
- Inventory efficiency/inline editing: `functions/api/admin/inventory-bootstrap.js`, `functions/api/admin/site-item-inventory.js`, `public/js/admin-site-item-inventory.js`, plus retained Build 244 catalog/product-resource/Creative Project fractional-usage paths.
- Product supporting-image recovery: `functions/api/admin/product-detail.js`, `public/js/admin-edit-product.js`, `functions/api/admin/product-images.js`.
- Product Readiness drill-down/fallback: `functions/api/admin/today-tasks.js`, `functions/api/admin/product-readiness.js`, `public/js/admin-product-readiness.js`.
- Admin contrast/mobile polish: `css/styles.css`.
- Cache/runtime refresh: `sw.js` to shell v22 and Build 245 query-version updates on affected admin HTML pages.

## Schema/data authority

- New current migration: `database_build245_admin_media_resilience.sql`.
- `database_upgrade_current_pass.sql` is byte-identical to the Build 245 migration.
- Aggregate schemas synchronized: `database_full_schema.sql`, `database_schema.sql`, `database_store_schema.sql`.
- Retained current/historical numbered migrations include `database_build244_inventory_authority_fractional_usage.sql` and earlier migrations.
- Read-only production checks: `BUILD245_D1_VERIFICATION.sql`.
- Build 245 adds `product_media_integrity_snapshots`, `admin_api_health_observations`, product-media lookup indexes and current app-policy settings. It contains the complete Build 244 D1 inventory/fractional transition and uses no TEMP/DROP helper.

## Validation/audit tooling

- `scripts/build245_admin_media_resilience_regression.py`
- `scripts/build245_database_case_audit.py`
- `scripts/build245_public_page_audit.py`
- `scripts/build245_asset_reference_audit.py`
- `scripts/deployment_preflight_static_check.py`
- `scripts/final_deployment_blocker_check.py`
- retained Build 243/244/241 regressions adjusted where needed so the current-pass migration can advance without invalidating historical foundation checks.
- audit outputs: `data/site/build245-public-page-audit.json`, `data/site/build245-asset-reference-audit.json`, refreshed `data/site/deployment-preflight.json`.

## Current Markdown updated

- Canonical: `AI_HANDOFF.md`, `PROJECT_STATUS_AND_ROADMAP.md`.
- Pointers/index: `AI_CONTEXT.md`, `NEW_CHAT_STATUS.md`, `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `MARKDOWN_INDEX.md`.
- Schema/release/deployment: `DATABASE_SCHEMA_REFERENCE.md`, `STARTUP_GO_LIVE_GUIDE.md`, `CLOUDFLARE_ENVIRONMENT_CHECKLIST_DETAILED.md`, `PRELAUNCH_PROCESS_PLAYBOOKS.md`, `POST_DEPLOY_SMOKE_TEST.md`, `RELEASE_NOTES.md`, `README.md`, `SANITY_HEALTH_CHECK.md`.
- Auth/media/SEO/competitive: `AUTH_LOGIN_500_TROUBLESHOOTING.md`, `IMAGES.md`, `IMAGES_REQUIRED.md`, `LOCAL_SEO_PLAYBOOK.md`, `COMPETITIVE.md`.
- Specialist cross-project notes: `CONTENT_AUTOMATION_STUDIO.md`, `CREATIVE_AUTOMATION_STUDIO.md`, `OPERATIONAL_CONTINUITY_BUILD240.md`, `PACKAGING_STUDIO.md`, `SOCIAL_PUBLISHING_CONNECTION_GUIDE.md`.

## Markdown retirement/consolidation

Superseded root `BUILD*.md` release records and the old public visual-audit Build note were moved/retained under `docs/archive/build-history/`. Only the current Build 245 changed-files/validation pair remains at root. Fixed specialist source/reference docs retain their historical Build labels when that label describes the specialist authority rather than current application status. The empty root `java.md` file was removed.

## Retained Build 244 integration

The latest live source did not contain the full generated Build 244 transition, so Build 245 also carries the Build 244 changes to D1 catalog/inventory authority, lower-case controlled classifications, fractional/log-only/reusable usage, Creative Project/Product Resources consumption, catalog-sync JSON de-authoritization and their associated scripts/data. This is intentional and is reflected in the current Build 245 migration rather than requiring two deployment migrations.
