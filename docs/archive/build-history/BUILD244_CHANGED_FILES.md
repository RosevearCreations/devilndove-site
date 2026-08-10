# Build 244 Changed Files

Build 244 moves tool/supply runtime authority into D1 and adds realistic fractional material usage. This record lists the material changes; historical Build records remain archived.

## Database/schema

- `database_build244_inventory_authority_fractional_usage.sql` — new current migration; no TEMP/DROP; 897 legacy master rows copied to D1 without overwriting reviewed provenance rows; missing catalog rows are populated into operational inventory; safe legacy usage profiles seeded.
- `database_upgrade_current_pass.sql` — byte-identical Build 244 current migration.
- `database_full_schema.sql` — Build 244 aggregate application, fractional stock/movement/project quantity affinities and usage sidecars.
- `database_schema.sql` — current Build 244 scope/project usage evidence.
- `database_store_schema.sql` — current Build 244 scope and fractional product-resource quantity.
- `DATABASE_SCHEMA_REFERENCE.md` — current D1 authority/fractional-use reference.
- `BUILD244_D1_VERIFICATION.sql` — read-only post-migration ledger/settings/count/duplicate/profile verification queries.

## Inventory/catalog APIs

- `functions/api/admin/site-item-inventory.js` — fractional/log-only/reusable use, unit conversion, usage movement audit, D1-only bounded reconciliation, editable classification and duplicate consolidation.
- `functions/api/admin/_productResourcesData.js` — D1 search + fractional quantities/usage profiles.
- `functions/api/admin/product-resource-search.js` — bounded server-side D1 catalog search.
- `functions/api/admin/product-resources.js` — Build 244 resource contract.
- `functions/api/admin/catalog-sync.js` — runtime tool/supply JSON re-import disabled.
- `functions/api/tools.js`, `functions/api/supplies.js` — D1 runtime authority; JSON only emergency fallback after D1 read failure.
- `functions/api/admin/mobile-create-product.js` — fractional material quantities.
- `functions/api/admin/product-release-preflight.js` — no forced whole-unit product resource usage.

## Creative Project/client

- `functions/api/admin/creative-process.js` — fractional/log-only/reusable project usage and reversal evidence.
- `public/js/admin-creative-process.js` — actual usage-unit entry and stock-conversion explanation.
- `public/js/admin-site-item-inventory.js` — server-side catalog search, inline classification edit, fractional quantities, usage tracking controls, mica example, bounded maintenance reconciliation and browser-safe messaging.
- `public/js/admin-product-resources.js` — fractional resource quantities.
- `public/js/admin-mobile-product.js` — fractional mobile material quantities.
- `public/js/admin-catalog-sync.js` — D1 authority explanation and legacy-import restrictions.

## UI/cache

- `css/styles.css` — Build 244 usage-help/classification polish while retaining Build 243 contrast/mobile fixes.
- `sw.js` — shell v21.
- `admin/inventory-operations/index.html`, `admin/mobile-inventory/index.html`, `admin/products/index.html`, `admin/creative-process/index.html` — Build 244 cache-busters for changed assets.

## Validation/scripts

- `scripts/build244_inventory_authority_fractional_usage_regression.py`
- `scripts/build244_public_page_audit.py`
- `scripts/build244_asset_reference_audit.py`
- `scripts/build244_database_case_audit.py`
- `scripts/build243_inventory_resilience_regression.py` — historical current-migration identity assertion made later-build aware without weakening Build 243 behavioral checks.
- `scripts/deployment_preflight_static_check.py`, `scripts/final_deployment_blocker_check.py`, `scripts/build241_caip_large_media_intake_test.mjs` — advanced current-release expectations to Build 244 while retaining historical regressions.

## Current Markdown

- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`
- `MARKDOWN_INDEX.md`
- `AI_CONTEXT.md`
- `NEW_CHAT_STATUS.md`
- `DEVELOPMENT_ROADMAP.md`
- `KNOWN_GAPS_AND_RISKS.md`
- `DATABASE_SCHEMA_REFERENCE.md`
- `STARTUP_GO_LIVE_GUIDE.md`
- `SANITY_HEALTH_CHECK.md`
- `RELEASE_NOTES.md`
- `README.md`
- `BUILD244_CHANGED_FILES.md`
- `BUILD244_VALIDATION.md`
