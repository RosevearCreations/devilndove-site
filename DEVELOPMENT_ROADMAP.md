# Development Roadmap

## Completed 20 items in this pass — Build 134

1. Reworked the admin Product editor to be draft-first instead of publish-first.
2. Changed the Create button label to "Save Draft Product" so the workflow matches how partial products are actually created.
3. Added clear draft-mode guidance that SEO, images, pricing, and external links are readiness items, not draft blockers.
4. Relaxed client-side draft validation to require only product name and product type for a new draft.
5. Kept external listing URL required only when a hybrid/external item is no longer in draft mode.
6. Added publish-readiness badges for category, price, featured image, SEO title, and SEO description without blocking draft save.
7. Added an inline Product pictures uploader to the Product editor.
8. The uploader can place the uploaded image into featured image or the next empty gallery image URL field.
9. The uploader sends product draft images through `/api/admin/media-upload` with FormData so JSON Content-Type is not forced on file uploads.
10. Added upload status messaging, preview thumbnail, automatic alt-text suggestion, and mobile-friendly media upload layout.
11. Added JSON-safe response handling in `admin-create-product.js` so HTML 500 pages produce a readable admin message instead of `Unexpected token '<'`.
12. Rebuilt `/api/admin/create-product` with a top-level try/catch so failures return JSON and are logged as runtime incidents.
13. Made `/api/admin/create-product` adaptive to the live `products` table columns instead of assuming every newer storefront column exists.
14. Made product SEO insertion adaptive to the live `product_seo` table columns.
15. Made product image insertion adaptive to the live `product_images` table columns.
16. Added runtime incident logging with `incident_scope: admin_products` and `incident_code: create_product_failed` for failed creates.
17. Allowed draft products to save without image, price, SEO title, SEO description, category, or external listing URL.
18. Kept readiness scoring so incomplete drafts remain not-ready for storefront until missing publish fields are completed.
19. Added product-editor checks to `scripts/predeploy_sanity_check.py` so future passes catch missing draft/media assets.
20. Updated schema files, active Markdown, CSS, and the migration ledger marker for the Build 134 pass.

## Next logical 20 steps after Build 134

1. Deploy Build 134 and open `/admin/products/` on desktop and mobile.
2. Create a draft with only product name and product type to confirm draft mode saves cleanly.
3. Confirm the admin message no longer shows `Unexpected token '<'` if the API fails.
4. If image upload fails, check whether the R2 media bucket binding and public base URL are configured for `/api/admin/media-upload`.
5. Upload one product image from the editor and confirm the returned URL fills the featured/gallery image field.
6. Create another draft with pasted image URLs only to confirm non-upload workflows still work.
7. Open Operations > Runtime Incidents and check for new `admin_products/create_product_failed` rows.
8. If a create-product incident appears, copy its `error_detail` and fix the exact live D1 column/table issue.
9. Run Storefront Schema Repair after deployment if product columns are still missing.
10. Run Storefront Value Backfill after several drafts exist so defaults and SEO placeholder rows can be filled safely.
11. Add an edit-mode version of the same inline image uploader so existing products can receive new images without leaving the editor.
12. Add a product draft checklist card that explains which missing fields block publish readiness.
13. Add a one-click "Move draft to review" action that verifies image/SEO/price/category readiness first.
14. Add an image library picker so uploaded media can be reused across products instead of re-uploaded.
15. Add R2 binding diagnostics to Operations so missing media storage is visible before uploads fail.
16. Add product-image health checks to Public API Health for featured and gallery image coverage.
17. Add product SEO bulk-fix tools for drafts missing title, description, alt text, and local wording.
18. Continue Search Console CSV import UI and page/query SEO performance reporting.
19. Continue accounting work: payment application, HST review, journal automation, period close, and accountant export packaging.
20. Continue local SEO refinement while keeping one clear H1 and mobile-friendly layouts on every exposed page.

Current sync: 2026-05-17 — Build 134 draft-first product editor, inline image upload, JSON-safe create-product errors, and adaptive product create schema handling.

## Completed 20 items in this pass — Build 133

1. Preserved the Build 132 compact mobile drawer and verified the mobile-nav assets are still present.
2. Added `/api/admin/structured-data-health` for admin-only JSON-LD and Product schema readiness checks.
3. Added the Operations > Structured Data Health panel.
4. Added static page JSON-LD checks for Home, Shop, Gallery, About, Tools, Supplies, and local landing pages.
5. Added live product structured-data readiness sampling from `/api/products`.
6. Added `/api/admin/storefront-value-backfill` to inspect blank storefront product defaults.
7. Added safe product value defaults for status, product type, merchandise origin, sale channel, currency, review status, tax/shipping flags, inventory flags, and timestamps.
8. Added missing `product_seo` placeholder row creation for products that do not yet have SEO rows.
9. Added the Operations > Storefront Value Backfill panel with inspect/apply controls.
10. Added `/api/admin/sitemap-preview` to combine priority static pages with live D1 product URLs.
11. Added the Operations > Live Sitemap Preview panel with XML preview.
12. Expanded Release Sanity to check Structured Data Health, Live Sitemap Preview, and storefront default values.
13. Added Search Console CSV staging tables for future page/query performance imports.
14. Updated `database_upgrade_current_pass.sql` with the Build 133 migration marker.
15. Updated full and SEO extension schema files for Search Console staging.
16. Added schema notes to the base/store schema files so the schema set remains synchronized.
17. Expanded the local predeploy sanity script to verify the new Operations admin assets.
18. Confirmed public `/data/` privacy checks still pass after the new SEO/admin work.
19. Re-ran one-H1/title/meta checks across exposed HTML pages.
20. Updated active Markdown files with the completed Build 133 work and the next 20 steps.

## Next logical 20 steps after Build 133

1. Deploy Build 133 and open `/admin/operations/`.
2. Run Storefront Schema Repair first if product columns are still missing.
3. Run Storefront Value Backfill and inspect blank defaults before applying.
4. Apply the safe value backfill only after the inspect report looks reasonable.
5. Run Structured Data Health and repair missing JSON-LD warnings on priority pages first.
6. Run Live Sitemap Preview and compare product URL count with live product count.
7. Decide whether to replace static `sitemap.xml` with a dynamic route or keep regenerating it before deploys.
8. Add a Search Console CSV import screen using the new staging tables.
9. Add Search Console performance charts for clicks, impressions, CTR, and average position by page/query.
10. Add product SEO bulk tools for missing meta title, meta description, image alt text, and Product schema readiness.
11. Add duplicate Amazon staging detection by ASIN, order id, item title, and item total.
12. Add manual Amazon row relinking when a purchase row matched the wrong inventory item.
13. Add high-confidence Amazon bulk approval with a preview/confirm step and rollback notes.
14. Continue payment application screens for deposits, order balances, refunds, processor fees, payouts, and gift cards.
15. Continue journal automation for sales, fees, HST, COGS, inventory movements, shipping, refunds, and write-offs.
16. Build HST/GST review worksheet with taxable sales, input tax credits, adjustments, and remittance checklist.
17. Build period close/lock/reopen controls with audit notes and unresolved issue checks.
18. Build accountant export package v2 with GL, trial balance, P&L, HST worksheet, statement summaries, attachment index, and issue log.
19. Add an admin mobile command palette if Operations/Catalog panels continue to grow.
20. Continue local SEO landing-page refinement using real Search Console data once imports are available.


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

## Build 131 completed 20-step pass — storefront schema repair, API health, and predeploy sanity

1. Added `/api/admin/storefront-schema-repair` as an admin-only D1 schema compatibility inspector.
2. Added a non-destructive repair action that checks live D1 before adding missing product storefront columns.
3. Added safe repair support for older `tax_classes` schemas, including `rate_percent` compatibility.
4. Added safe repair support for missing `product_seo` table/columns.
5. Added storefront compatibility indexes for product slug, category, origin, and sale channel filters.
6. Added `public/js/admin-storefront-schema-repair.js` for an Operations page repair panel.
7. Added the Storefront Schema Repair mount and script to `/admin/operations/`.
8. Expanded Public API Health to check HTML pages, API JSON, sitemap XML, and robots.txt.
9. Expanded Public API Health to treat `summary.authority: "error"` as a true failure.
10. Added D1 row-count snapshot data to Public API Health for products, catalog, inventory, incidents, and migration ledger.
11. Added endpoint-specific next-action guidance in the Public API Health UI.
12. Added Release Sanity coverage for storefront schema repair readiness.
13. Updated Release Sanity actions to point admins to Storefront Schema Repair when product fallbacks remain.
14. Added `scripts/predeploy_sanity_check.py` for local H1/title/meta, local asset, CSS brace, and public-data privacy checks.
15. Updated `database_full_schema.sql` with `tax_classes.rate_percent` and storefront indexes.
16. Updated `database_store_schema.sql` with `tax_classes.rate_percent` and storefront indexes.
17. Updated `database_growth_analytics_seo_extension.sql`/full schema with a product SEO product-id index.
18. Added the Build 131 migration ledger marker to `database_upgrade_current_pass.sql`.
19. Re-ran JavaScript syntax checks and local predeploy sanity checks.
20. Updated all active Markdown handoff, schema, roadmap, SEO, and repo documents for this pass.

## Next logical 20 steps after Build 131

1. Deploy Build 131 and open `/admin/operations/`.
2. Run **Storefront Schema Repair > Inspect repairs** first; review missing product/tax/SEO columns.
3. If the repair report shows safe missing columns, click **Apply safe repairs**.
4. Run **Public API Health** and confirm `/api/products` no longer reports `authority: "error"`.
5. If `/api/products` still uses `d1_select_star_fallback`, inspect product table columns and rerun schema repair.
6. Run **Release Sanity** and confirm product schema repair readiness is pass/warn rather than fail.
7. Recheck Runtime Incidents and resolve only old `/api/products` rows after the count stops increasing.
8. Add a product schema backfill screen that can populate blank `merchandise_origin`, `sale_channel`, and `currency` values.
9. Add admin product-filter QA cards for handmade, vintage, collectible, external-only, and hybrid products.
10. Add product structured-data health checks for required Product fields and image URLs.
11. Add sitemap regeneration from live D1 products/pages instead of static-only sitemap maintenance.
12. Add public search-performance fields for Search Console clicks, impressions, CTR, and position by page/query.
13. Continue Amazon staging import review with manual inventory-link correction and bulk approval safeguards.
14. Continue payment application screens tying orders, deposits, refunds, fees, gift cards, and journal entries together.
15. Continue automatic journal-line generation for sales, fees, shipping, inventory, COGS, refunds, write-offs, and HST.
16. Continue HST/GST review worksheet with collected tax, ITCs, adjustments, and remittance-ready totals.
17. Continue month-end close lock/reopen controls with checklist, reason, and audit trail.
18. Continue accountant export package v2 with GL, trial balance, P&L, balance-sheet support, HST worksheet, attachments, and unresolved exceptions.
19. Continue media lifecycle tools for replace, retire, alt text, crop, public/private flag, and broken-link scans.
20. Continue moving duplicated JSON/DB product and content data toward D1-first management with public-safe JSON fallbacks only.

## Build 132 completed 20-step pass — compact mobile menu and phone layout polish

1. Reworked the shared public navigation so the mobile menu is no longer one long flat list.
2. Added grouped expandable mobile sections: Essentials, Shop & Browse, Workshop, Community, Account, and Local pages.
3. Kept the desktop navigation flat and familiar while limiting it to the main high-value links.
4. Added a mobile quick row for Shop, Search, and Cart so the most useful links are available immediately.
5. Added accessible `details/summary` accordion behavior for grouped mobile navigation without extra dependencies.
6. Added focus-visible styling for mobile menu controls so keyboard users can see where they are.
7. Improved Escape-key and close-button handling for the mobile menu.
8. Added click-outside-to-close behavior for the mobile menu drawer.
9. Preserved active-link highlighting inside both desktop and mobile grouped navigation.
10. Added safer focus restoration when the mobile menu closes.
11. Hardened the mobile drawer height with `100dvh` sizing so it fits better on phone browsers with dynamic address bars.
12. Added sticky mobile drawer heading/close controls so the close action remains easy to reach.
13. Improved small-screen brand/logo sizing so the header does not crowd the menu button.
14. Added mobile horizontal scrolling for admin department shortcut buttons so they no longer create a tall button stack.
15. Added mobile card/hero spacing refinements to reduce cramped layouts on phone screens.
16. Updated `scripts/predeploy_sanity_check.py` to verify compact mobile-nav JavaScript and CSS assets exist.
17. Added a Build 132 marker to `database_upgrade_current_pass.sql` while confirming no D1 structural migration is required.
18. Updated schema files with a no-structure-change Build 132 note so the schema set remains current.
19. Re-ran JavaScript syntax checks, local predeploy sanity checks, CSS brace checks, HTML SEO checks, and missing-reference checks.
20. Updated active Markdown documentation so the mobile navigation change, sanity process, and next steps are recorded.

## Next logical 20 steps after Build 132

1. Deploy Build 132 and test the main menu on a real phone or narrow browser window.
2. Confirm tapping **Menu** opens grouped expandable sections instead of one long flat list.
3. Confirm Shop, Search, and Cart appear in the quick row and are easy to tap.
4. Confirm the menu closes with Close, Escape, outside click/tap, and after selecting a link.
5. Check admin department pages on a phone and confirm shortcut buttons scroll horizontally instead of stacking too tall.
6. Run `/admin/operations/` > Public API Health after deployment.
7. Run `/admin/operations/` > Release Sanity after deployment.
8. Confirm no new runtime incidents appear from public page loads after the mobile-nav update.
9. Run Storefront Schema Repair if `/api/products` still reports fallback/schema warnings.
10. Add a Product structured-data health panel for Product, BreadcrumbList, Organization, and WebSite checks.
11. Add product schema value backfill for blank `merchandise_origin`, `sale_channel`, `currency`, status, and shipping flags.
12. Add sitemap regeneration from live D1 product/page records rather than relying only on static sitemap updates.
13. Add Search Console import fields/screens for page, query, clicks, impressions, CTR, and average position.
14. Continue Amazon CSV import hardening with duplicate detection and manual inventory relinking.
15. Add bulk approval only for very high-confidence Amazon purchase matches with a preview and confirmation step.
16. Continue payment application screens for deposits, orders, refunds, fees, payouts, and gift cards.
17. Continue fuller journal automation and posting validation for sales, fees, HST, COGS, inventory, shipping, refunds, and write-offs.
18. Build the HST/GST review worksheet and remittance review flow.
19. Build period close/lock/reopen controls with audit notes and checklist status.
20. Build accountant export package v2 with GL, trial balance, P&L, HST worksheet, statement summaries, attachment index, and unresolved issue log.
