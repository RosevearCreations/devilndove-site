# Development Roadmap — Current Working Plan

Current sync: 2026-05-15 — Build 130 products API all-tiers fallback hotfix, schema-drift resilience, and SEO/sanity pass.

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



## Build 129 completed 20-step pass

1. Added `/api/admin/schema-drift-report` so live D1 schema drift can be checked from admin before endpoints fail publicly.
2. Added an Operations **D1 Schema Drift Report** panel with required/recommended column status by table.
3. Added `/api/admin/public-api-health` to test the public JSON APIs used by shop, product detail, Tools, and Supplies.
4. Added an Operations **Public API Health** panel so `/api/products` regressions can be caught right after deploy.
5. Added product schema drift snapshot checks into Release Sanity.
6. Added direct `/api/products` public endpoint health into Release Sanity.
7. Added runtime incident cleanup support for old resolved/ignored rows.
8. Added a cleanup control to the Runtime Incidents panel with a 7-365 day safety range.
9. Added private `amazon_purchase_import_batches` tracking for admin-imported Amazon CSV batches.
10. Added `/api/admin/amazon-purchase-import` so Amazon CSV rows can be pasted/imported into private D1 staging from admin.
11. Added an Amazon CSV staging import panel to `/admin/catalog/`.
12. Added `amazon_url` support for staged Amazon rows so product links survive the private import process.
13. Added Amazon match confidence explanations in the review queue so safe/review/weak rows are easier to understand before approval.
14. Kept Amazon costs/order data out of public `/data/` paths; the new import path writes only to private D1 staging.
15. Updated Operations page mounts/scripts for schema drift, API health, migration ledger, release sanity, and runtime incidents.
16. Updated Catalog page scripts so Amazon CSV import sits before the Amazon review/apply queue.
17. Updated `database_upgrade_current_pass.sql` with Build 129 batch table and migration-ledger marker while avoiding unsafe unconditional `ALTER TABLE ADD COLUMN` statements.
18. Updated `database_amazon_purchase_import_staging.sql` and `database_full_schema.sql` with Build 129 Amazon import batch tracking.
19. Updated active Markdown handoff, roadmap, schema, sanity, and known-gaps documentation.
20. Ran JavaScript syntax, one-H1/title/meta, missing local asset, CSS brace, and SQL smoke checks for the new build.


## Next 20 steps after Build 129

1. Deploy Build 129 and apply/record `database_upgrade_current_pass.sql` in the D1 migration ledger.
2. Open `/admin/operations/` and run **D1 Schema Drift Report** before approving any future schema-sensitive code.
3. Open `/admin/operations/` and run **Public API Health** immediately after deployment.
4. Confirm `/api/products` shows a non-error authority and does not create fresh runtime incidents.
5. Use Runtime Incidents cleanup only after real recurring errors are fixed and old resolved/ignored rows are no longer useful.
6. Paste/import a very small Amazon CSV sample through the new Catalog import panel and verify pending rows appear in the review queue.
7. Add duplicate-detection to the Amazon import endpoint using order id + ASIN + title + amount so accidental double imports are blocked.
8. Add manual inventory relinking in the Amazon review queue for rows whose best match is wrong or missing.
9. Add bulk approve for only high-confidence safe Amazon rows, with a hard confirmation and preview total.
10. Add an Amazon import summary by inventory item, supplier, order date, and tax totals for accountant review.
11. Add payment application screens connecting orders, deposits, payouts, refunds, fees, gift cards, and journal entries.
12. Expand journal-line automation for sales, discounts, shipping income, shipping expense, COGS, inventory adjustments, fees, refunds, write-offs, and HST.
13. Add HST/GST review worksheet with taxable sales, exempt sales, collected tax, ITCs, adjustments, and remittance totals.
14. Add period close/lock/reopen controls with checklist, reason fields, and audit records.
15. Build accountant export package v2 with GL, trial balance, P&L, HST worksheet, statement summaries, attachments index, and unresolved issue log.
16. Add product variants/options for colour, material, size, customization, SKU, stock, price, and media.
17. Add media lifecycle controls for replace, retire, alt text, crop, public/private flag, and broken-link scans.
18. Add structured data review for Product, BreadcrumbList, Organization, WebSite, and key local-intent pages.
19. Add Search Console metric import fields/screens for clicks, impressions, CTR, position, page, query, and local landing page performance.
20. Continue moving duplicated JSON/DB operational data toward D1 as the source of truth with public-safe JSON as fallback/export only.

## Build 130 completed hotfix items

1. Investigated the recurring `/api/products` incidents that increased from 7 to 8 after the previous public API patch.
2. Confirmed the incident pair still came from `products_primary_query_failed` followed by `products_fallback_query_failed`.
3. Rebuilt `/api/products` so optional candidate columns are no longer added to the verified column set.
4. Changed products/tax/SEO column detection to use strict D1 `PRAGMA table_info` metadata, with `SELECT * LIMIT 1` only as a sample fallback.
5. Added a final `SELECT * FROM products LIMIT 500` recovery tier that filters/sorts in JavaScript instead of referencing optional SQL columns.
6. Stopped logging a runtime incident for the primary query if a lower fallback tier succeeds.
7. Stopped logging a runtime incident for the product-only fallback if the final select-star tier succeeds.
8. Preserved safe empty-result behavior only for true all-tier product failures.
9. Kept product filter groups working from normalized fallback products.
10. Hardened `/api/product-detail` to use strict actual columns rather than candidate optional product columns.
11. Preserved one-H1 SEO checks and local-search page structure from earlier builds.
12. Updated `database_upgrade_current_pass.sql` with the Build 130 migration-ledger marker.
13. Updated active Markdown handoff files so the fix and next validation steps are documented.
14. Re-ran JavaScript syntax checks after the endpoint changes.
15. Re-ran exposed-page H1/title/meta checks.
16. Re-ran missing local asset reference checks.
17. Re-ran CSS brace drift checks.
18. Re-ran ZIP integrity checks before packaging.
19. Kept Amazon import/review and inventory cost-history features from Build 129.
20. Prepared the new deployable Build 130 ZIP.

## Next 20 steps after Build 130

1. Deploy Build 130 and open `/api/products` directly.
2. Confirm the response has `ok: true` and does not show `summary.authority: "error"`.
3. Acceptable temporary authorities are `d1_adaptive_query`, `d1_product_only_fallback_query`, or `d1_select_star_fallback`.
4. Refresh `/admin/operations/` > Runtime Incidents and confirm the `/api/products` grouped count does not increase after fresh page loads.
5. If Build 130 returns `d1_select_star_fallback`, run D1 Schema Drift Report and schedule the missing product-column migration later.
6. Mark the old `/api/products` incident groups resolved only after the count stops increasing.
7. Open Gallery, Creations, Shop, and Product Detail pages and verify they still show products/images.
8. Run Public API Health from Operations after deployment.
9. Run Release Sanity from Operations after deployment.
10. Record the Build 130 marker in the Migration Ledger.
11. Continue Amazon CSV staging import testing with a tiny file before approving many rows.
12. Continue approving only safe Amazon purchase matches into inventory cost history.
13. Add a public-products schema compatibility card to Operations if `d1_select_star_fallback` remains active for more than one deploy.
14. Add product-image fallback enrichment if products display without featured images.
15. Add a safe `/api/product-images` health check for gallery/creations image regressions.
16. Add admin guidance for which D1 columns are missing versus optional.
17. Continue compacting duplicate product/catalog fields from JSON into D1 where D1 is now authoritative.
18. Continue accounting work: payment application, journal automation, HST review, close controls, and accountant export packaging.
19. Continue local SEO refinement with one clear H1 per public page.
20. Continue mobile admin improvements for catalog review, inventory counts, and Amazon import approvals.
