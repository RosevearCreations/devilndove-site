# Build 172 D1 migration ledger hotfix

## Summary

- Fixed the build 171 `schema_migration_ledger` marker insert so it includes the required `file_name` value.
- Added `database_build171_ledger_repair.sql` for live databases where the build 171 schema additions already ran but the final ledger marker failed.
- Corrected schema drift expectations from `schema_migration_ledger_id` to the actual `schema_migration_id` column.

## Changed files

- `database_build171_ledger_repair.sql`
- `database_upgrade_current_pass.sql`
- `database_schema.sql`
- `database_full_schema.sql`
- `database_store_schema.sql`
- `functions/api/admin/schema-drift-report.js`
- `DATABASE_SCHEMA_REFERENCE.md`
- `DEVELOPMENT_ROADMAP.md`
- `KNOWN_GAPS_AND_RISKS.md`
- `SANITY_HEALTH_CHECK.md`
- `RELEASE_NOTES.md`
- `data/site/release-notes.json`

## D1 migration summary

- No destructive schema change.
- Run `database_build171_ledger_repair.sql` only if the build 171 D1 console run already created the new tables/columns but stopped at `NOT NULL constraint failed: schema_migration_ledger.file_name`.
- For a fresh deploy, use the updated `database_upgrade_current_pass.sql`; its build 171 marker now includes `file_name`.

## Required post-deploy actions

- If the live database already received the build 171 schema additions, apply only `database_build171_ledger_repair.sql` rather than rerunning the full upgrade.
- Reopen `/admin/schema-drift-report/` or the schema sanity area and confirm `schema_migration_ledger` is no longer flagged for the wrong primary-key column.

# Build 171 admin safety and release readiness

## Summary

- Binary-safe accountant evidence ZIP support with explicit R2 fetch flag.
- Dark-theme evidence review/upload admin page.
- Product QA direct editor focus links.
- Gift-card provider adapter logs and customer history cards.
- Marketplace export diff, replay, and whole-channel rollback controls.
- R2 derivative route health check panel.
- Recall approval gate before customer notification drafts.
- Local SEO bake JSON export and competitor phrase score history.
- Desktop Today filters and smoke-test dashboard badges.
- Release notes and safe deploy package admin pages.

## Changed files

- `DATABASE_SCHEMA_REFERENCE.md`
- `DEVELOPMENT_ROADMAP.md`
- `IMAGES.md`
- `KNOWN_GAPS_AND_RISKS.md`
- `README.md`
- `RELEASE_NOTES.md`
- `SANITY_HEALTH_CHECK.md`
- `admin/catalog-media/index.html`
- `admin/dark-theme-evidence/index.html`
- `admin/index.html`
- `admin/members/index.html`
- `admin/release-notes/index.html`
- `admin/safe-deploy-package/index.html`
- `admin/trust-blocks/index.html`
- `css/styles.css`
- `data/site/local-seo-bake-actions.json`
- `data/site/release-notes.json`
- `database_full_schema.sql`
- `database_schema.sql`
- `database_store_schema.sql`
- `database_upgrade_current_pass.sql`
- `functions/api/admin/accounting-close-workflow.js`
- `functions/api/admin/candle-soap-recalls.js`
- `functions/api/admin/dark-theme-evidence.js`
- `functions/api/admin/gift-card-delivery-send.js`
- `functions/api/admin/local-seo-bake-actions.js`
- `functions/api/admin/local-seo-competitor-phrases.js`
- `functions/api/admin/marketplace-export-preview.js`
- `functions/api/admin/post-deploy-smoke-tests.js`
- `functions/api/admin/product-publish-qa.js`
- `functions/api/admin/public-proof-candidates.js`
- `functions/api/admin/r2-derivative-settings.js`
- `functions/api/admin/release-notes.js`
- `functions/api/admin/safe-deploy-package.js`
- `functions/api/admin/today-tasks.js`
- `public/js/admin-accounting-close-workflow.js`
- `public/js/admin-candle-soap-specs.js`
- `public/js/admin-dark-theme-evidence.js`
- `public/js/admin-dashboard-smoke-badges.js`
- `public/js/admin-edit-product.js`
- `public/js/admin-gift-card-customer-history.js`
- `public/js/admin-gift-cards.js`
- `public/js/admin-local-seo-review.js`
- `public/js/admin-marketplace-export-preview.js`
- `public/js/admin-post-deploy-smoke-tests.js`
- `public/js/admin-products.js`
- `public/js/admin-public-proof-candidates.js`
- `public/js/admin-r2-derivative-settings.js`
- `public/js/admin-release-notes.js`
- `public/js/admin-safe-deploy-package.js`
- `public/js/admin-today-tasks.js`
- `public/js/admin-trust-block-placement-preview.js`
- `scripts/generate_release_notes.py`

## D1 migration summary

- dark_theme_screenshot_evidence columns
- gift_card_provider_send_logs
- r2_derivative_health_checks
- local_seo_competitor_phrase_score_history
- marketplace rollback/history columns
- public proof consent/promotion columns
- candle/soap recall send_review_status

## Required post-deploy actions

- Apply `database_upgrade_current_pass.sql`.
- Open `/admin/safe-deploy-package/` and confirm schema, changed files, and post-deploy actions.
- Run the post-deploy smoke-test quick-run from the admin dashboard.
- Review `/admin/dark-theme-evidence/`, `/admin/release-notes/`, Local SEO bake JSON export, and R2 derivative health checks.
