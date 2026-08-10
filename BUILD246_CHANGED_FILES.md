# Build 246 Changed Files

Build 246 starts from the user-supplied live archive `devilndove-site-main(20260810-143956).zip` and advances product editing/deletion, Creative Project deletion/inventory compensation, finished-product production release, CAIP duplicate protection, approved soap packaging/French review, schema authority, validation and current documentation.

## Product lifecycle and media

- `public/js/admin-edit-product.js` — persist/query-recover the active product ID used by Update Product.
- `public/js/admin-create-product.js` — explicit SEO/social image selection/badge in the seven-slot product image manager.
- `functions/api/admin/update-product.js` — preserve existing `product_seo.og_image_url` when the client edit payload temporarily omits it.
- `functions/api/admin/delete-product.js` — classify empty generated Content Studio/CAIP shells as bounded auto-clean candidates; retain meaningful business/history and production references as blockers.
- `public/js/admin-delete-product.js` — explain generated-shell cleanup versus protected history.

## Creative Project / inventory integrity

- `functions/api/admin/creative-automation.js` — delete preview, unreversed inventory-return plan, compensated D1 batch, deletion audit and downstream-reference protection.
- `public/js/admin-creative-automation.js` — explicit delete-and-return messaging/confirmation.
- `functions/api/admin/product-production-release.js` — new finished-product production preview/post endpoint with fractional stock conversion, blockers, idempotency, concurrency compensation and immutable snapshots.
- `functions/api/admin/_productResourcesData.js`, `functions/api/admin/product-resources.js`, `public/js/admin-product-resources.js` — product ingredient/INCI profile editing and Finished Product Production Release UI.

## CAIP and packaging

- `functions/api/_lib/caipMediaIntake.js` — skip exact same-project fingerprint/size duplicates instead of creating duplicate upload rows/parts.
- `functions/api/admin/packaging-studio.js` — approved soap design enforcement, linked product ingredient/INCI seeding and packaging translation-review writes.
- `public/js/admin-packaging-studio.js` — approved-reference visual-only application, no invented ingredient rows, curated French draft workflow, INCI-first draft safety and design lock.

## UI/cache

- `css/styles.css` — Build 246 SEO-image, ingredient-profile, production-release, translation and mobile control styling.
- `sw.js` — service-worker shell v23.
- `admin/products/index.html`, `admin/inventory-operations/index.html`, `admin/packaging-studio/index.html`, `admin/creative-automation/index.html` — Build 246 script/cache references and current release text where applicable.

## Schema/data authority

- New current migration: `database_build246_product_project_production_packaging.sql`.
- `database_upgrade_current_pass.sql` — byte-identical current migration.
- Aggregate schemas synchronized: `database_full_schema.sql`, `database_schema.sql`, `database_store_schema.sql`.
- Read-only production verification: `BUILD246_D1_VERIFICATION.sql`.
- New D1 authorities: `creative_project_deletion_audit`, `product_resource_ingredient_profiles`, `product_production_runs`, `product_production_run_materials`, `packaging_translation_reviews`.

## Validation/release tooling

- `scripts/build246_product_project_packaging_regression.py`.
- `scripts/build246_public_page_audit.py` and `scripts/build246_asset_reference_audit.py`.
- Historical retained regressions updated only so they recognize Build 246 as a later current-migration boundary: `scripts/build241_caip_large_media_intake_test.mjs`, `scripts/build243_inventory_resilience_regression.py`, `scripts/build244_inventory_authority_fractional_usage_regression.py`, `scripts/build245_admin_media_resilience_regression.py`.
- `scripts/deployment_preflight_static_check.py` and current release/blocker evidence synchronized to Build 246.
- Current audit outputs under `data/site/` refreshed for Build 246.

## Current documentation

Canonical/current files updated: `AI_HANDOFF.md`, `PROJECT_STATUS_AND_ROADMAP.md`, `MARKDOWN_INDEX.md`, `AI_CONTEXT.md`, `NEW_CHAT_STATUS.md`, `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `DATABASE_SCHEMA_REFERENCE.md`, `STARTUP_GO_LIVE_GUIDE.md`, `PRELAUNCH_PROCESS_PLAYBOOKS.md`, `POST_DEPLOY_SMOKE_TEST.md`, `CLOUDFLARE_ENVIRONMENT_CHECKLIST_DETAILED.md`, `README.md`, `RELEASE_NOTES.md`, `SANITY_HEALTH_CHECK.md`, `PACKAGING_STUDIO.md`, `DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md`, `CREATIVE_AUTOMATION_STUDIO.md`, `CONTENT_AUTOMATION_STUDIO.md`, `IMAGES.md`, `IMAGES_REQUIRED.md`, `LOCAL_SEO_PLAYBOOK.md`, `COMPETITIVE.md` and the specialist continuity note.

Superseded root Build release prose is retired into `docs/archive/build-history/`; fixed specialist compatibility guides remain available where older links/workflows depend on them.
