# Build 173 deployment preflight and D1 safety

## Summary

- Added a dedicated Deployment Preflight admin page for D1 migration safety, public one-H1/title/meta checks, CSS drift checks, static JSON fallback checks, and local SEO wording review.
- Added an admin-only deployment-preflight API that warns when Build 171 schema objects exist but the Build 171 ledger marker is missing, so we avoid rerunning unsafe ALTER TABLE blocks.
- Added a safe additive Build 173 D1 migration file for deployment-preflight run history and ledger recording.
- Added a no-network static deployment preflight script that writes data/site/deployment-preflight.json for release/admin review.
- Updated schema sanity/drift/migration-ledger expectations to include deployment_preflight_runs and the Build 171/173 migration markers.
- Updated dashboard and Operations navigation so the new preflight page is easy to find before deploy.

## Changed files

- `NEW_CHAT_STATUS.md`
- `AI_CONTEXT.md`
- `DATABASE_SCHEMA_REFERENCE.md`
- `DEVELOPMENT_ROADMAP.md`
- `KNOWN_GAPS_AND_RISKS.md`
- `POST_DEPLOY_SMOKE_TEST.md`
- `README.md`
- `RELEASE_NOTES.md`
- `SANITY_HEALTH_CHECK.md`
- `admin/deployment-preflight/index.html`
- `admin/index.html`
- `admin/operations/index.html`
- `css/styles.css`
- `data/site/deployment-preflight.json`
- `data/site/release-notes.json`
- `database_build173_deployment_preflight.sql`
- `database_full_schema.sql`
- `database_schema.sql`
- `database_store_schema.sql`
- `database_upgrade_current_pass.sql`
- `functions/api/admin/db-sanity.js`
- `functions/api/admin/deployment-preflight.js`
- `functions/api/admin/migration-ledger.js`
- `functions/api/admin/schema-drift-report.js`
- `public/js/admin-deployment-preflight.js`
- `scripts/deployment_preflight_static_check.py`
- `scripts/generate_release_notes.py`
- `admin/dark-theme-evidence/index.html`
- `admin/release-notes/index.html`
- `admin/safe-deploy-package/index.html`

## D1 migration summary

- New optional/additive migration file: database_build173_deployment_preflight.sql.
- Creates deployment_preflight_runs for saved preflight snapshots.
- Records build_173_deployment_preflight_release_safety in schema_migration_ledger with required file_name populated.
- No destructive schema changes.
- database_build173_deployment_preflight.sql now creates schema_migration_ledger if missing before recording the Build 173 marker.

## Required post-deploy actions

- If the live database already received Build 171 schema additions but missed the ledger marker, run database_build171_ledger_repair.sql first.
- Run database_build173_deployment_preflight.sql once after deploy to enable saved preflight snapshots.
- Open /admin/deployment-preflight/ and run/save a snapshot before promoting the branch live.
- Review any warnings for public-page local wording, CSS drift, static JSON fallback health, and missing migration markers.

## Validation

- Static deployment preflight passed with zero blockers and zero warnings in this zip.
- All JavaScript files added/changed passed node --check during package validation.
- Public HTML scan confirmed no exposed page has more than one H1.
- CSS brace balance and JSON parse validation passed before packaging.
