# Repo Base Guide — Devil n Dove

Current sync: 2026-05-14 — Build 124.

## Main paths
- `/functions/api/` — Cloudflare Pages Functions.
- `/public/js/` — active client/admin JavaScript.
- `/admin/` — admin department pages.
- `/data/` — approved fallback/seed/export data.
- `/css/styles.css` — shared styling.
- `/database_*.sql` — schema and migration references.
- `/archive/` — historical/retired files.

## Admin pages touched this pass
- `/admin/operations/` — Migration Ledger and Release Sanity panels.
- `/admin/accounting/` — Statement Provider Profiles panel and imports provider dropdown.

## API files added or updated this pass
- `functions/api/admin/migration-ledger.js`
- `functions/api/admin/release-sanity.js`
- `functions/api/admin/accounting-statement-provider-profiles.js`
- `functions/api/admin/accounting-statement-imports.js`
- `functions/api/admin/_accountingStatementImports.js`
- `functions/api/admin/db-sanity.js`
- `functions/api/admin/site-item-inventory.js`

## Browser scripts added or updated this pass
- `public/js/admin-migration-ledger.js`
- `public/js/admin-release-sanity.js`
- `public/js/admin-accounting-statement-profiles.js`
- `public/js/admin-accounting-imports.js`
- `public/js/admin-accounting-backend.js`

## Keep private
Do not commit or deploy raw Amazon order CSVs, account exports, private reports, or accountant-only documents to public static paths.
