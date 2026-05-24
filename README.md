# Devil n Dove Site

## Build 140 note

This build strengthens the Social Posting Queue for crafting/job process updates. It adds dry-run payload previews, scheduling, per-platform captions, duplicate/repost warnings, media-quality warnings, and Release Sanity coverage before API publishing. Use dry run first; credentials still belong only in Cloudflare environment variables.


## Build 139 note

This build adds a review-first social publisher workflow. Admins can queue crafting/job photos and summaries, approve them, and then attempt API publishing to configured platforms. The site still works in manual/copy mode when no platform credentials are present.

## Build 137 update

This build adds safer Search Console SEO workflow tools in Operations: filtered Search Console summaries, import batch delete/revert, and private SEO opportunity actions. These tools help review page/query opportunities before editing public titles, meta descriptions, headings, or internal links. Apply/record `database_upgrade_current_pass.sql` after deploying.

## Build 135 update

Admin product media workflow now includes Media/R2 Diagnostics, Product Image Health, a Product editor readiness checklist, reusable image picker, and edit-mode upload attachment. Run the Operations diagnostics after deployment before bulk product work.


Current sync: 2026-05-18 — Build 137 Search Console filtering, safe batch revert, and private SEO opportunity action queue.

## Active purpose
This repository powers the Devil n Dove public storefront, admin app, member area, catalog tools, accounting workflow, and Cloudflare Pages Functions backend.

## Active structure
- `/functions/api/` — active Cloudflare Pages Functions API surface.
- `/public/js/` — browser-side admin/member/storefront scripts.
- `/admin/*/index.html` — admin department pages.
- `/data/` — approved JSON fallbacks/import sources that have not yet fully moved to D1.
- `/database_*.sql` — schema references and migration support.
- `/archive/` — retired historical files and snapshots.

## What changed in this build
- Added an admin D1 migration ledger API so applied SQL files can be recorded instead of guessed.
- Added the Operations-page Migration Ledger panel for marking SQL files applied, skipped, failed, or pending review.
- Added an admin release-sanity API that checks public pages, H1/title/meta status, catalog/inventory counts, journal balance, reconciliation exceptions, runtime incidents, and migration status.
- Added the Operations-page Release Sanity panel so pre-deploy checks can be run from the browser.
- Expanded the database sanity API with critical checks, index checks, catalog-vs-inventory counts, journal-balance checks, and migration ledger summary.
- Improved the Accounting Backend sanity UI so failures and supporting details are visible instead of hidden in raw JSON.
- Added schema support for the schema_migration_ledger table across the active SQL reference files and the current-pass migration.
- Added statement provider profile storage for bank, PayPal, Stripe, Square, Etsy, and manual CSV mappings.
- Added an Accounting-page Provider Profiles UI to seed, view, and edit statement import mappings.
- Updated statement import APIs so provider profiles are available to the import screen and seeded when missing.
- Allowed the manual CSV provider as a first-class statement-import provider.
- Added reconciliation match confidence buckets for imported statement totals: exact, likely, partial, and manual_review.
- Improved statement-import auto-match detail JSON so confidence, bucket, imported row count, and difference are recorded for later review.
- Mapped inventory movement aliases into schema-safe movement names while preserving the original name in the movement note.
- Kept Tools/Supplies manual inventory creation from saving blank or zero on-hand quantities; current owned items default to at least 1.
- Added unit_cost_dollars to inventory API responses so admin screens can show 33.99 while D1 stores 3399 cents.
- Added a quick D1 inventory stock/unit fix SQL file for existing rows, including package math such as 1 DTF package = 100 sheets.
- Updated movement CHECK constraints in active schema files so older and newer movement names are represented consistently.
- Refined admin CSS for status pills, sanity panels, and mobile-friendly migration forms.
- Ran syntax and public-page sanity checks: 238 JavaScript files passed node --check, and exposed HTML pages had one H1 plus title/meta description.

## Deploy order
1. Deploy the ZIP.
2. Apply `database_upgrade_current_pass.sql` to D1.
3. Mark the migration in `/admin/operations/`.
4. Run Release Sanity in `/admin/operations/`.
5. Run Tools/Supplies inventory sync in `/admin/catalog/`.
6. Verify Accounting Provider Profiles in `/admin/accounting/`.

## Important active docs
- `DEVELOPMENT_ROADMAP.md` — completed 20 and next 20 logical steps.
- `KNOWN_GAPS_AND_RISKS.md` — current risks and guardrails.
- `SANITY_HEALTH_CHECK.md` — checks for each build.
- `DATABASE_SCHEMA_REFERENCE.md` — schema and migration notes.
- `REPO_BASE_GUIDE.md` — current repo map.
- `REPO_RULES.md` — rules for future passes.
- `LOCAL_SEO_PLAYBOOK.md` — search/local visibility guidance.
- `AI_CONTEXT.md` and `NEW_CHAT_STATUS.md` — handoff notes for a fresh chat.

## Private import safety
Amazon transaction CSVs, review spreadsheets, and private purchase reports must not be deployed in public `/data/` paths. Import approved rows through admin/D1 workflows only.
## Build 125 update

Build 125 adds the Amazon purchase review/apply workflow, inventory cost history, reconciliation exception queue controls, journal validation/posting guardrails, six local-intent SEO pages, sitemap generation, and updated schema/Markdown files. After deployment, apply `database_upgrade_current_pass.sql`, mark the migration in `/admin/operations/`, and run Tools/Supplies sync from `/admin/catalog/`.

## Build 126 hotfix

Build 126 adds an Operations-page runtime incident review panel. Release Sanity warnings for recent runtime errors can now be investigated from the admin UI, grouped by severity/scope/code/endpoint, and reviewed with statuses so fixed or ignored rows stop keeping the warning active.


## Build 127 hotfix

Build 127 hardens the public products API against D1 schema drift. Deploy it when Release Sanity shows repeated `/api/products` incidents such as `products_primary_query_failed` and `products_fallback_query_failed`.

## Build 128 deploy note

Build 128 is a code-only compatibility hotfix for older or partially migrated D1 product schemas. Deploy it if `/api/products` returns a safe empty response with an error such as `no such column: p.merchandise_origin`. After deployment, open `/api/products` and confirm the response is no longer `authority: "error"`.


## Build 129 operator notes

After deploying this build, use `/admin/operations/` to run Schema Drift, Public API Health, Runtime Incidents, Migration Ledger, and Release Sanity. Use `/admin/catalog/` for Tools/Supplies sync, Amazon CSV staging import, and Amazon purchase review/apply.

## Build 130 note

Build 130 is a public catalog resilience hotfix. It keeps the storefront usable when optional product columns are missing from D1 by falling back from adaptive SQL to product-only SQL and finally to a `SELECT *` product read with JavaScript filtering.

## Build 131 deploy note

Build 131 adds Operations > Storefront Schema Repair, expanded Public API Health, and a local predeploy sanity script. After deploying, run `/admin/operations/` checks in this order: Storefront Schema Repair, Public API Health, Runtime Incidents, Migration Ledger, then Release Sanity.

## Build 132 release note

Build 132 improves the public mobile header/menu. The hamburger drawer now uses grouped expandable sections, quick Shop/Search/Cart buttons, better phone sizing, safer focus/close behavior, and mobile admin shortcut polish. Run `python scripts/predeploy_sanity_check.py .` before deploying.

## Build 133 release note

Build 133 adds Operations panels for Structured Data Health, Storefront Value Backfill, and Live Sitemap Preview while preserving the compact grouped mobile menu from Build 132. After deploying, apply/record `database_upgrade_current_pass.sql`, then run the Operations checks and apply safe storefront value backfill only after reviewing the inspect report.


## Build 134 note

This pass fixes the Product editor draft workflow: drafts require only name/type, image upload is available from the editor when R2 media storage is configured, create-product failures return JSON instead of HTML 500 pages, and the create endpoint adapts to live D1 product/media/SEO columns.

## Build 136 status — 2026-05-18

- Added Operations > Search Console CSV Import.
- Added `/api/admin/search-console-import` for private D1 staging of Search Console CSV exports.
- Added top-page and SEO-opportunity summaries for manual title/meta/internal-link review.
- Added Release Sanity coverage and current-pass SQL table/index self-healing for the Search Console staging tables.
- Keep Search Console CSV exports private; do not store them in public `/data/`.

Next deployment checks: apply/record `database_upgrade_current_pass.sql`, open `/admin/operations/`, import a tiny Search Console CSV sample, then run Release Sanity and Public API Health.


## Build 138 highlight

Operations now includes a Social Posting Queue for review-first job/process photo captions and manual publishing records across Facebook, Instagram, TikTok, X, YouTube, and Pinterest.

## Build 141 note

Operations now includes a stronger Social Posting Queue for crafting/process photos and summaries. It supports reusable caption templates, template previews, UTM-tagged related links, a small content calendar, dry runs, scheduling, duplicate warnings, and manual/API publishing records. API publishing still requires platform credentials in Cloudflare environment variables and should be tested one platform at a time.


## Build 142 update — Competitive roadmap completed and tracked

- Completed `COMPETITIVE.md` as the active competitive strategy for Devil n Dove, covering positioning, homepage/product-page improvements, mobile UX, local SEO, social workflow, marketplace readiness, product media, trust, and accounting/margin direction.
- Added Operations > Competitive Roadmap so the highest-value items from the document can be seeded into D1, assigned a status, and reviewed during Release Sanity.
- Added `competitive_opportunities` and `competitive_opportunity_events` schema support.
- Added `/data/site/competitive-opportunities.json` as a public-safe roadmap seed file; it contains strategy/action metadata only and no private costs, orders, or customer data.
- Next direction: connect competitive opportunities to product readiness, SEO action completion, social analytics, testimonials, custom requests, and marketplace export checks.
