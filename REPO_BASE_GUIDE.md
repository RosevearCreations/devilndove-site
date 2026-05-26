# Build 150 repo note

New Build 150 files and touchpoints:

- `functions/api/admin/testimonial-trust-blocks.js` and `public/js/admin-testimonial-trust-blocks.js`
- `functions/api/trust-blocks.js`
- `functions/api/seo-page-overrides.js` and `public/js/seo-page-overrides.js`
- `functions/api/admin/accounting-close-workflow.js` and `public/js/admin-accounting-close-workflow.js`
- `functions/api/admin/search-console-import.js` now applies reviewed SEO actions.
- `admin/operations/index.html`, `admin/accounting/index.html`, public page scripts, Release Sanity, Public API Health, schema SQL, and Markdown docs were updated.

# Repo Base Guide — Devil n Dove

## Build 140 repo note

Social posting now includes dry-run previews, scheduling, caption variants, duplicate guardrails, and media warnings in `functions/api/admin/social-post-queue.js` and `public/js/admin-social-post-queue.js`. Release Sanity and the predeploy sanity script both check the social queue layer.


## Build 139 repo note

Social posting files now include API publishing attempts inside `functions/api/admin/social-post-queue.js` and UI controls in `public/js/admin-social-post-queue.js`. The Operations page mount remains `socialPostQueueAdminMount`. The workflow is review-first and credential-safe.

# Repo Base Guide

## Build 137 note

After deploying this build, apply or record `database_upgrade_current_pass.sql`. The new Search Console action queue is private D1 data and should not be exported into public static folders. Use `/admin/operations/` to test Search Console filters, batch delete/revert, and generated SEO action items.

## Build 135 repository note

New admin assets: `functions/api/admin/media-diagnostics.js`, `functions/api/admin/product-image-health.js`, `public/js/admin-media-diagnostics.js`, `public/js/admin-product-image-health.js`, and `public/js/admin-product-draft-checklist.js`. Keep these wired into Operations/Product pages during future refactors.


Current sync: 2026-05-18 — Build 137 Search Console filtering, safe batch revert, and private SEO opportunity action queue.

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

## Build 129 operations guide

For each deploy, visit `/admin/operations/` and run D1 Schema Drift Report, Public API Health, Runtime Incidents, Migration Ledger, and Release Sanity. This is now the preferred flow for catching D1 schema drift and public API regressions before testing the storefront manually.

## Build 130 development rule

Public storefront APIs must not assume optional D1 columns exist. Use actual schema checks first, and keep a safe fallback that does not break public pages while migrations catch up.

## Build 131 repo guide update

Use `scripts/predeploy_sanity_check.py` before packaging when possible. For live D1 schema drift, use `/admin/operations/` > Storefront Schema Repair instead of manually guessing `ALTER TABLE` statements. Keep private import/cost/order files outside public static folders.

## Build 132 repository note

Mobile navigation changes live in `/js/main.js` and `/css/styles.css`. Do not duplicate per-page nav markup unless necessary; the shared nav injector should remain the source of truth for public pages. Use the predeploy sanity script before zipping.

## Build 133 note

Build 133 adds admin Operations assets for structured data health, live sitemap preview, and safe storefront value backfill. Keep these panels together on `/admin/operations/` when refactoring admin departments.


## Build 134 note

This pass fixes the Product editor draft workflow: drafts require only name/type, image upload is available from the editor when R2 media storage is configured, create-product failures return JSON instead of HTML 500 pages, and the create endpoint adapts to live D1 product/media/SEO columns.

## Build 138 repo note

Social posting queue files added: `functions/api/admin/social-post-queue.js` and `public/js/admin-social-post-queue.js`. The Operations page mounts the panel and Release Sanity checks the endpoint.


## Build 141 repo note

Current-pass social changes touch `/functions/api/admin/social-post-queue.js`, `/public/js/admin-social-post-queue.js`, `database_upgrade_current_pass.sql`, and schema/reference Markdown. Keep future social platform secrets out of repo files; use Cloudflare environment variables only.


## Build 142 update — Competitive roadmap completed and tracked

- Completed `COMPETITIVE.md` as the active competitive strategy for Devil n Dove, covering positioning, homepage/product-page improvements, mobile UX, local SEO, social workflow, marketplace readiness, product media, trust, and accounting/margin direction.
- Added Operations > Competitive Roadmap so the highest-value items from the document can be seeded into D1, assigned a status, and reviewed during Release Sanity.
- Added `competitive_opportunities` and `competitive_opportunity_events` schema support.
- Added `/data/site/competitive-opportunities.json` as a public-safe roadmap seed file; it contains strategy/action metadata only and no private costs, orders, or customer data.
- Next direction: connect competitive opportunities to product readiness, SEO action completion, social analytics, testimonials, custom requests, and marketplace export checks.
