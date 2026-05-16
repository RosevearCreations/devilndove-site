# Development Roadmap — Current Working Plan

Current sync: 2026-05-14 — Build 125 Amazon purchase review, inventory cost history, reconciliation queue, journal validation, and local SEO pass.

## Completed 20 items in this pass
1. Added `/api/admin/amazon-purchase-review` so private Amazon purchase staging rows can be reviewed from the admin instead of spreadsheets only.
2. Added the Amazon purchase review queue UI to `/admin/catalog/` with search, status filters, approve/apply, hold, and reject controls.
3. Added approved Amazon purchase application that updates linked inventory unit cost, supplier name, ASIN/supplier SKU, Amazon URL, and notes.
4. Added `site_item_inventory_cost_history` so Amazon-approved costs and manual cost changes create history rows instead of silently overwriting the latest cost.
5. Added inventory cost-history recording during Tools/Supplies catalog sync when a synced unit cost changes.
6. Added cost-history recording for manual site-item inventory create/update and bulk cost update workflows.
7. Improved the Tools/Supplies inventory sync result panel so inserted, updated, failed, Amazon URL, unit-cost, stock-default, match-status, and cost-history counts are visible after sync.
8. Hardened Amazon purchase review schema creation with runtime-safe staging-table migrations for applied inventory, applied cost-history, review user, and applied timestamp fields.
9. Hardened Amazon purchase review inventory access with runtime-safe inventory column backfills for older D1 tables.
10. Added audit entries for Amazon purchase review decisions so approve/hold/reject actions are traceable.
11. Expanded reconciliation exceptions with assign-to-user, accountant review flag, resolve, reopen, and richer status handling.
12. Added reconciliation exception queue controls in the Accounting import UI for assign, manual review, accountant review, resolve, reopen, ignore, and notes.
13. Added journal-period validation that checks monthly debit/credit balance before posting.
14. Added journal posting metadata and posting guardrails so unbalanced monthly journals are blocked before being marked posted.
15. Added Accounting report buttons for validating and posting the selected month’s journal entries.
16. Added six local-intent SEO landing pages for handmade jewelry, polymer clay earrings, custom gifts, laser engraving projects, vintage finds, and workshop-made gifts in Ontario/Southern Ontario.
17. Added `sitemap.xml` so the new public local-intent pages and existing public pages have a clean crawl map.
18. Added shared-footer local search links so the new local-intent pages are internally linked from public pages.
19. Added CSS for local-intent cards, related-page links, and mobile-friendly local page calls to action.
20. Updated active schema files and Markdown files, then ran syntax/H1/meta/link sanity checks for the new build.

## Next logical 20 steps
1. Deploy Build 125 and apply `database_upgrade_current_pass.sql` in Cloudflare D1.
2. Open `/admin/operations/`, run Release Sanity, and mark the Build 125 migration ledger entry applied once D1 is confirmed.
3. Open `/admin/catalog/`, run Sync all tools + supplies, and confirm inventory counts plus cost-history counts.
4. Use the Amazon purchase review queue to approve a small batch of obvious safe matches first, then verify cost history and unit-cost display.
5. Add a CSV import endpoint/screen for Amazon staging rows so future Amazon order files can be loaded through admin without manual SQL.
6. Add fuzzy review helpers in the Amazon queue: suggested inventory links, confidence explanation, and “needs human review” grouping.
7. Add an accountant-facing reconciliation export of unresolved exceptions, assigned users, notes, and attached statement references.
8. Finish payment application screens connecting orders, deposits, gift cards, refunds, fees, processor payouts, and journal entries.
9. Expand automatic journal-line generation for sales, discounts, shipping income, shipping expense, COGS, inventory adjustments, fees, refunds, write-offs, and HST.
10. Add period-close lock/reopen controls with close checklist, lock reason, reopen reason, and audit trail.
11. Build the HST review worksheet with taxable sales, exempt sales, collected HST, refunded HST, input credits, adjustments, and remittance-ready totals.
12. Build accountant export package v2 with GL, trial balance, P&L, balance sheet support, HST worksheet, statement import summary, attachments index, and unresolved issue log.
13. Move product/creation management from JSON-first fallback into D1 as the primary source, keeping JSON as export/fallback only.
14. Add product variant tables and UI for colour, size, material, customization status, SKU, stock, price, and media per variant.
15. Add admin-managed public content blocks for Home, Gallery, Shop, About, Featured Creations, and local-intent sections.
16. Add media lifecycle controls for upload, crop, alt text, public/private flag, replacement, retirement, and broken-link scans.
17. Add structured data review for Product, BreadcrumbList, Organization, WebSite, and local contact details on public pages.
18. Add Search Console metric fields/screens for clicks, impressions, CTR, position, page, query, and local-intent landing page performance.
19. Add mobile admin quick actions: draft product, add photos, adjust stock, record expense, scan receipt, add customer note, and review Amazon match.
20. Add a pre-deploy checklist that combines Release Sanity, SQL ledger status, JS syntax check, public-page SEO check, CSS/link check, and privacy/public-data checks.

## Working order recommendation
Do steps 1-6 first because they confirm the new Amazon/private-cost workflow without risking broad inventory changes. Then complete payment application, journal automation, close controls, HST review, and accountant export. After the backend is steadier, continue moving public catalog and media from JSON-first workflows into D1-managed admin screens.

## SEO habit for every pass
Keep one clear H1 per exposed page, keep page titles/meta descriptions specific, and keep local/product/service wording visible in page headings and body copy. Public pages should support real search intent without keyword stuffing.

## Build 126 completed hotfix items

1. Added visible Security / Runtime Incidents panel to Operations.
2. Added grouped runtime incident results by severity, scope, code, and endpoint.
3. Added filters for incident age, severity, review status, and result count.
4. Added selected-row review actions for reviewing, resolved, ignored, and reopened.
5. Added admin notes on incident review actions.
6. Added runtime incident review fields to schema references.
7. Added runtime-safe PRAGMA-based backfills for older D1 tables.
8. Added runtime incident grouping indexes after columns are confirmed.
9. Updated Release Sanity to count only unresolved/unignored error or critical incidents.
10. Added the Operations page script and mount point for the new review panel.
11. Kept the runtime incident API guarded by admin authentication.
12. Added admin audit records for runtime incident review status changes.
13. Preserved no-store cache headers for incident review results.
14. Added JSON detail expansion in the admin incident table.
15. Added grouped view so repeated endpoint failures can be fixed before one-off noise.
16. Documented the D1 SQL query to identify the current 7 incidents.
17. Kept fallback behavior intact; this is visibility/review hardening, not a public-page change.
18. Updated schema docs to reflect review status columns.
19. Updated the sanity handoff docs with the runtime incident triage flow.
20. Packaged Build 126 as a hotfix focused on the sanity warning.

## Next 20 steps after Build 126

1. Use the new Runtime Incidents panel to group the 7 current error/critical rows.
2. Fix the highest-count grouped endpoint first.
3. Resolve or ignore incidents only after confirming the repeated cause is fixed or no longer relevant.
4. Add a retention/cleanup action for old resolved runtime incidents.
5. Add a CSV export for grouped incidents for accountant/developer review.
6. Add a direct deep link from Release Sanity rows to the matching admin panel.
7. Add incident badges to the main Admin dashboard summary.
8. Add a small "last deploy build" setting so incidents can be grouped by build number.
9. Add client-side source maps or file hints for admin JS errors where practical.
10. Add release sanity checks for stale service-worker/browser-cache issues if a PWA layer is later added.
11. Continue Amazon staging import UX for uploading CSV rows directly from admin.
12. Continue payment application workflows.
13. Continue fuller journal-line automation and posting validation.
14. Continue HST/GST filing review worksheets.
15. Continue period close/lock/reopen controls.
16. Continue accountant export packaging.
17. Continue item-level inventory costing and usage-unit review screens.
18. Continue local SEO page expansion with one clear H1 per public page.
19. Continue CSS drift checks on admin tables and mobile panels.
20. Continue migration of duplicated JSON/DB data toward a single source of truth with public-safe JSON fallbacks only.


## Build 127 completed hotfix items

1. Investigated the Release Sanity grouped incidents for `/api/products`.
2. Identified the failure pattern as primary public product query failure followed by fallback query failure.
3. Rebuilt `/api/products` around D1 schema inspection before query construction.
4. Removed hard references to optional tax columns such as `tc.rate_percent`.
5. Kept `tax_rate` support for older/current tax schemas.
6. Made the tax-class join conditional on both `products.tax_class_id` and `tax_classes.tax_class_id`.
7. Made the product SEO join conditional on `product_seo.product_id`.
8. Made SEO keyword search conditional on the SEO join and `product_seo.keywords`.
9. Made product filters skip safely when older D1 schemas are missing optional columns.
10. Fixed missing min/max price parameters being parsed as zero.
11. Made the primary products query adaptive instead of one-size-fits-all.
12. Made the fallback query product-only and adaptive instead of repeating newer schema assumptions.
13. Preserved safe empty-results if the DB binding or products table is unavailable.
14. Added better diagnostics warnings so skipped joins/filters are visible in the API response.
15. Kept runtime incident logging for real primary/fallback failures.
16. Added a local smoke test for an older D1 tax schema with no `rate_percent` column.
17. Updated active Markdown handoff and sanity documentation.
18. Added a Build 127 schema migration ledger marker with no destructive SQL changes.
19. Re-ran JavaScript syntax checks.
20. Re-ran public page H1/title/meta/link and CSS drift sanity checks.

## Next 20 steps after Build 127

1. Deploy Build 127 and verify `/api/products` returns `ok: true`.
2. Re-run Release Sanity and confirm the `/api/products` warning count stops increasing.
3. Mark the old `/api/products` runtime incidents resolved once new requests no longer recreate them.
4. Add a Release Sanity deep link from each warning row to the matching Operations panel filter.
5. Add a lightweight public API health endpoint that checks `/api/products`, `/api/catalog`, and key public JSON fallbacks.
6. Add an admin-visible API schema drift report showing missing optional vs required D1 columns.
7. Continue Amazon CSV staging import UI so new Amazon files can be uploaded safely from admin.
8. Continue Amazon match review helpers with confidence explanation and suggested linked inventory rows.
9. Continue payment application screens connecting orders, deposits, fees, refunds, gift cards, and journals.
10. Continue full journal-line automation and monthly posting validation.
11. Continue HST/GST review worksheet and remittance summary.
12. Continue period close, lock, reopen, and audit trail controls.
13. Continue accountant export packaging with unresolved exceptions and attachments index.
14. Continue product variants/options for colour, size, material, customization, SKU, price, stock, and media.
15. Continue D1-first migration for public product/gallery content with JSON as fallback/export only.
16. Continue media lifecycle tools for replace, retire, alt text, crop, and broken-link scanning.
17. Continue local SEO internal linking and structured data review.
18. Continue mobile admin quick actions for inventory, expenses, receipts, and product drafts.
19. Continue CSS drift review on admin tables and public cards.
20. Continue pre-deploy privacy checks to keep private order/cost data out of public static paths.

## Build 128 completed hotfix items

1. Rechecked the live `/api/products` response that still returned `authority: "error"` after Build 127.
2. Identified the remaining failure as optional product-column leakage: `p.merchandise_origin` was still referenced after live D1 reported it missing.
3. Added direct column verification with `SELECT column FROM table LIMIT 0` instead of trusting `PRAGMA table_info` alone.
4. Added short-lived schema-column caching so the endpoint does not repeat all verification checks on every warm request.
5. Hardened `/api/products` so candidate product, tax, and SEO columns are intersected with direct-select verified columns before SQL is built.
6. Added a product-only fallback path that never references optional newer fields such as merchandise origin, sale channel, external listing data, condition summary, era, or sourcing notes.
7. Preserved safe default output values for optional storefront fields so public pages can still render on older D1 schemas.
8. Kept `tax_rate` support while preventing missing `rate_percent` references from breaking older tax-class tables.
9. Added local mock D1 smoke testing for a schema where `PRAGMA` reports optional columns but direct selection proves they do not actually exist.
10. Confirmed the Build 128 `/api/products` mock test returns `ok: true` and `authority: "d1_adaptive_query"` without leaking `p.merchandise_origin`.
11. Reviewed `/api/product-detail` and found the same schema-drift risk plus a malformed dynamic SQL color column expression.
12. Rebuilt `/api/product-detail` product selection to use the same direct column verification guardrails.
13. Made product detail tax and SEO joins conditional on verified columns.
14. Made product detail inventory quantity tolerate either `inventory_quantity`, `on_hand_quantity`, or neither.
15. Added product-detail safe defaults for newer product fields when the live D1 table has not been upgraded yet.
16. Confirmed product-detail mock testing returns a product on an older product schema without leaking optional columns.
17. Updated the schema/current-pass ledger with a Build 128 code-only compatibility marker.
18. Updated active Markdown handoff docs to explain why Build 128 follows Build 127.
19. Re-ran JavaScript syntax checks after the endpoint changes.
20. Re-ran public page H1/title/meta, missing local asset, and CSS brace sanity checks.

## Next 20 steps after Build 128

1. Deploy Build 128 and open `/api/products` directly before testing public gallery/shop pages.
2. Confirm the response shows `ok: true` with either `authority: "d1_adaptive_query"` or `authority: "d1_product_only_fallback_query"`, not `authority: "error"`.
3. Check `/api/products` does not create a fresh `products_fallback_query_failed` incident after deployment.
4. Open one product-detail page and verify `/api/product-detail?slug=...` returns a product instead of a schema error.
5. Mark the old Build 127 `/api/products` incidents resolved only after fresh requests stop creating new rows.
6. Add a schema drift admin report that clearly lists missing optional columns vs required blocking columns.
7. Add an admin button to run public API health checks for `/api/products`, `/api/product-detail`, `/api/catalog`, and key JSON fallbacks.
8. Add a D1 migration status card that compares expected current schema columns with live D1 columns.
9. Apply or verify the product schema upgrade that adds merchandise origin, sale channel, external listing, condition, era, and sourcing notes columns.
10. Once D1 is upgraded, re-test shop filters for handmade/vintage/collectible origins.
11. Continue the Amazon CSV staging import screen so rows can be uploaded and reviewed fully inside admin.
12. Continue Amazon match confidence explanation and manual link correction tools.
13. Continue payment application screens connecting orders, deposits, fees, refunds, gift cards, and journals.
14. Continue journal-line automation and posting validation toward a clean accountant package.
15. Continue HST/GST review worksheet and remittance summary.
16. Continue period close, lock, reopen, and audit trail controls.
17. Continue product variants/options for colour, material, size, customization, SKU, price, stock, and media.
18. Continue media lifecycle tools for replace, retire, alt text, crop, and broken-link scanning.
19. Continue local SEO internal linking, structured data review, and one-H1 checks on every public page.
20. Continue pre-deploy privacy checks to keep private Amazon/order/cost data out of public static paths.
