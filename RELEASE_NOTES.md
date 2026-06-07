# Build 176 safe deploy ZIP, live manifest diff, QA previews, and recall locks

## Summary

- Added a real binary-safe Safe Deploy ZIP endpoint at `/api/admin/safe-deploy-package?format=zip`.
- Added live release-manifest comparison, safe package download records, Product QA preview cards, marketplace validation previews, recall notification locks, local SEO link/trend rows, richer LocalBusiness schema bake tracking, rollback checklist rows, and Cloudflare deployment import setup checks.
- Updated schema files, static preflight checks, Release Control UI/API, local business schema JSON, release notes, roadmap, known gaps, and sanity guidance.

## D1 migration summary

Run after Build 175:

1. `database_build171_ledger_repair.sql` only if the Build 171 schema exists but the marker is missing.
2. `database_build173_deployment_preflight.sql`
3. `database_build174_deployment_preflight_detail.sql`
4. `database_build175_release_control.sql`
5. `database_build176_release_safety_controls.sql`

## Required post-deploy actions

- Open `/admin/deployment-preflight/`, run Preflight, save a snapshot, and review Build 176 schema/diff rows.
- Open `/admin/release-control/`, download the Safe Deploy ZIP, run Live Manifest Compare, build QA preview cards, preview marketplace validation, refresh recall locks, seed local SEO links, and create rollback checklist rows.
- Open `/admin/safe-deploy-package/` and confirm the ZIP endpoint plus changed-file list.
- Run `/admin/post-deploy-smoke-tests/` after deploying.

## Validation

- Static deployment preflight regenerated.
- JavaScript syntax checks passed for changed admin/function/public files.
- CSS brace balance, JSON validation, and one-H1 checks are included in final validation.

# Build 175 release control, deeper preflight, and local business schema

## Summary

- Added `/admin/release-control/` and `/api/admin/release-control` for deployment history, manifest comparison records, screenshot evidence jobs, mobile saved views, safe deploy export records, and LocalBusiness schema preview.
- Expanded Deployment Preflight with response-body keyword checks, collection/category checks, sample product-detail checks, Product QA bulk queue visibility, R2 private evidence test rows, accountant checksum rows, gift-card provider webhook rows, marketplace validation/diff rows, recall compliance rows, and mobile/local schema checks.
- Added `database_build175_release_control.sql` and updated schema files, release notes, sanity notes, safe deploy package, roadmap, and known gaps.

## D1 migration summary

Run after Build 174:

1. `database_build171_ledger_repair.sql` only if the Build 171 schema exists but the marker is missing.
2. `database_build173_deployment_preflight.sql`
3. `database_build174_deployment_preflight_detail.sql`
4. `database_build175_release_control.sql`

## Required post-deploy actions

- Open `/admin/deployment-preflight/`, run Preflight, save a snapshot, and review any new Build 175 warnings.
- Open `/admin/release-control/`, seed phone saved views, queue dark-theme screenshot jobs, and review LocalBusiness JSON.
- Open `/admin/safe-deploy-package/` and confirm the schema order and changed-file list.
- Run `/admin/post-deploy-smoke-tests/` after deploying.

## Validation

- Static deployment preflight regenerated.
- JavaScript syntax checks passed for changed admin/function/public files.
- CSS brace balance, JSON validation, and one-H1 checks are included in final validation.

# Build 174 preflight detail, schema diff, and release manifest

## Summary

- Added richer Deployment Preflight detail drawers for public SEO, canonical, schema.org, image-alt, fallback, migration, schema, R2, duplicate ownership, and relationship-integrity checks.
- Added Markdown export for Deployment Preflight support handoff.
- Added post-deploy confirmation workflow rows so admins can mark D1 migration, preflight, public-page review, smoke-test, release-note, and R2/email checks complete.
- Added generated release package manifest support with SHA-256 hashes.
- Added a desktop admin dashboard badge for latest Deployment Preflight status.
- Updated D1 schema files, migration ledger expectations, DB sanity, schema drift, safe deploy package, release notes, sanity notes, roadmap, and known gaps.

## Release package manifest

- Static manifest: `data/site/release-package-manifest.json`
- The manifest is regenerated after release notes so its own hash does not create a documentation loop.

## Changed files

- `AMAZON_MATCHING_NOTES.md`
- `COMPETITIVE.md`
- `LOCAL_SEO_PLAYBOOK.md`
- `IMAGES.md`
- `README.md`
- `AI_CONTEXT.md`
- `DATABASE_SCHEMA_REFERENCE.md`
- `DEVELOPMENT_ROADMAP.md`
- `KNOWN_GAPS_AND_RISKS.md`
- `NEW_CHAT_STATUS.md`
- `POST_DEPLOY_SMOKE_TEST.md`
- `RELEASE_NOTES.md`
- `SANITY_HEALTH_CHECK.md`
- `admin/deployment-preflight/index.html`
- `admin/index.html`
- `data/site/deployment-preflight.json`
- `data/site/release-notes.json`
- `data/site/release-package-manifest.json`
- `database_build174_deployment_preflight_detail.sql`
- `database_full_schema.sql`
- `database_schema.sql`
- `database_store_schema.sql`
- `database_upgrade_current_pass.sql`
- `functions/api/admin/db-sanity.js`
- `functions/api/admin/deployment-preflight.js`
- `functions/api/admin/migration-ledger.js`
- `functions/api/admin/safe-deploy-package.js`
- `functions/api/admin/schema-drift-report.js`
- `public/js/admin-dashboard-preflight-badge.js`
- `public/js/admin-deployment-preflight.js`
- `public/js/admin-safe-deploy-package.js`
- `scripts/deployment_preflight_static_check.py`
- `scripts/generate_release_manifest.py`
- `scripts/generate_release_notes.py`
- `scripts/regenerate_sanity_from_preflight.py`

## D1 migration summary

- New additive migration file: database_build174_deployment_preflight_detail.sql.
- Creates deployment_post_deploy_confirmations for visible post-deploy checklist confirmations.
- Records build_174_preflight_detail_manifest in schema_migration_ledger with file_name populated.
- No destructive schema changes.

## Required post-deploy actions

- Run database_build171_ledger_repair.sql only if Build 171 schema exists but the ledger marker is missing.
- Run database_build173_deployment_preflight.sql, then database_build174_deployment_preflight_detail.sql.
- Open /admin/deployment-preflight/, run Preflight, export Markdown if warnings remain, and save a snapshot.
- Run /admin/post-deploy-smoke-tests/ and then mark post-deploy confirmation rows complete.
- Review /admin/safe-deploy-package/ and data/site/release-package-manifest.json before promoting live.

## Validation

- Static deployment preflight regenerated data/site/deployment-preflight.json.
- Release package manifest generated with SHA-256 hashes.
- JavaScript syntax checks passed for changed admin/public/function files.
- CSS brace balance and one-H1/title/meta checks are included in final validation.
