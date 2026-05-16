# Repo Base Guide — Devil n Dove

Current sync: 2026-05-14 — Build 125.

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

## Build 125 note

Build 125 keeps Amazon order/cost data private, adds admin review/apply controls for Amazon staging rows, records inventory cost history, expands reconciliation and journal guardrails, and adds local-intent SEO pages plus `sitemap.xml`. Keep schema files and active Markdown updated on every pass.

## Operations runtime review - Build 126

`/admin/operations/` now includes the Security / Runtime Incidents panel. The panel reads `/api/admin/runtime-incidents?group=1`, shows grouped repeated errors, and lets an admin mark selected incident rows as reviewing, resolved, ignored, or reopened.

## Build 128 endpoint guardrail

When adding new product columns to public APIs, do not reference them directly in static SQL until D1 migrations are verified live. Use adaptive column checks or direct no-row column verification so public pages keep rendering during staged schema upgrades.
