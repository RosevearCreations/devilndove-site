# Development Roadmap

## Completed 20 items in this pass — Build 137

1. Extended `/api/admin/search-console-import` with filtered GET summaries for page, query, country, device, date range, impressions, average position range, and result limit.
2. Added Search Console batch live-row counts so imported CSV batches can be checked against staged rows.
3. Added safe batch delete/revert for Search Console imports using `action: delete_batch`.
4. Added confirmation-gated batch deletion in the Operations UI so a mistaken CSV import can be removed without touching public pages.
5. Added private `seo_opportunity_actions` table for reviewable SEO work items.
6. Added generated title suggestions capped for search-result clarity.
7. Added generated meta-description prompts that require human review before public copy changes.
8. Added internal-link recommendation notes for matching opportunity queries to related local/shop/collection pages.
9. Added duplicate prevention for generated SEO actions using a stable action key per page/query pair.
10. Added action-status updates for private SEO tasks: open, in progress, done, or ignored.
11. Added Search Console filter controls to `/admin/operations/`.
12. Added “Generate private SEO actions” to turn filtered opportunity rows into a managed task list.
13. Added reviewable SEO action table with priority, query, page, suggested title, suggested meta, and link note.
14. Added mobile-friendly CSS for Search Console filters, action rows, and danger/revert buttons.
15. Expanded Release Sanity with an SEO opportunity action-list check.
16. Expanded the local predeploy sanity script so Search Console filter/revert/action assets are verified before zipping.
17. Updated SQL schema files with `seo_opportunity_actions` and supporting indexes.
18. Added a Build 137 migration-ledger marker to `database_upgrade_current_pass.sql`.
19. Updated active Markdown files so the handoff, schema notes, sanity notes, roadmap, and known gaps match the current build.
20. Ran JavaScript syntax, HTML H1/meta, CSS, public-data privacy, SQL smoke, predeploy sanity, and ZIP integrity checks before packaging.

## Next logical 20 steps after Build 137

1. Deploy Build 137 and apply/record `database_upgrade_current_pass.sql`.
2. Open `/admin/operations/` and test Search Console filters with a small imported CSV batch.
3. Use the new Delete/revert batch action on a test batch before importing a large file.
4. Generate private SEO actions from one filtered opportunity set only.
5. Review generated title/meta suggestions manually before editing any public page.
6. Add an export CSV button for `seo_opportunity_actions` so the task list can be shared or archived.
7. Add page-level “current title/current meta/current H1” comparison beside generated SEO actions.
8. Add an “apply to draft SEO fields” helper for product pages only, keeping public publish separate.
9. Add Search Console trend charts for clicks/impressions/position once dated imports accumulate.
10. Add sitemap-to-Search-Console coverage comparison.
11. Add product SEO bulk tools for missing title, description, canonical, OG image, and Product JSON-LD readiness.
12. Add a dedicated product media library page with filters for unassigned, duplicate URL, missing alt, weak score, and product-linked assets.
13. Add one-click attach/detach controls for media assets.
14. Add high-confidence Amazon bulk approval with rollback notes and duplicate detection.
15. Add payment application workflow for matching payments to orders/invoices.
16. Add HST/GST review worksheet for taxable sales, input tax credits, and remittance readiness.
17. Add period close/lock and reopen controls.
18. Add accountant export packaging with ledgers, journals, reconciliations, tax summaries, and attachment index.
19. Continue mobile testing for the grouped menu and larger admin tables.
20. Continue checking one H1, local wording, mobile CSS, schema drift, and public `/data/` privacy on every pass.

Current sync: 2026-05-18 — Build 137 Search Console filtering, safe batch revert, private SEO opportunity actions, and release-sanity coverage.


## Completed 20 items in this pass — Build 136

1. Added an admin-only `/api/admin/search-console-import` endpoint for Search Console CSV staging.
2. Added CSV file upload support for Search Console exports.
3. Added pasted-CSV support for small/manual Search Console imports.
4. Added safe CSV parsing that handles quoted commas and blank rows.
5. Added flexible column mapping for Page, Query, Clicks, Impressions, CTR, Position, Country, Device, and Date.
6. Added Search Console import batch tracking with source file, site property, row count, notes, and importing admin user.
7. Added top-page Search Console summaries by clicks, impressions, CTR, and average position.
8. Added SEO opportunity query summaries for terms with impressions and average positions roughly between 4 and 20.
9. Added Operations > Search Console CSV Import panel.
10. Added mobile-friendly Search Console import form layout.
11. Added Search Console import results tables for top pages, opportunity queries, and recent batches.
12. Added Release Sanity coverage for the new Search Console import endpoint.
13. Added current-pass SQL self-healing table/index definitions for Search Console staging tables.
14. Added a Build 136 migration ledger marker.
15. Preserved the compact grouped mobile menu from the previous passes.
16. Preserved product editor draft/image upload fixes from the recent product workflow passes.
17. Preserved media/R2 diagnostics and product image health checks.
18. Updated schema notes for the Search Console staging workflow.
19. Updated active Markdown files so the current build and next steps stay in sync.
20. Ran syntax, H1/meta, CSS, reference, SQL, privacy, and ZIP integrity checks before packaging.

## Next logical 20 steps after Build 136

1. Deploy Build 136 and apply/record `database_upgrade_current_pass.sql`.
2. Open `/admin/operations/` and run Search Console CSV Import.
3. Export a small Search Console page/query CSV and import only a few rows first.
4. Confirm the top-pages table shows clicks, impressions, CTR, and average position.
5. Use the SEO opportunities table to pick one page/query pair for title/meta refinement.
6. Compare the opportunity page against its current H1, title, and meta description.
7. Add a Search Console delete/revert batch action before doing large imports.
8. Add filters for date range, page path, query text, country, and device.
9. Add a local SEO recommendations panel that converts query opportunities into suggested page-title/meta/internal-link tasks.
10. Add Search Console trend charts once enough dated rows are imported.
11. Add a sitemap-to-Search-Console coverage comparison.
12. Add product SEO bulk tools for missing title, description, canonical, OG image, and Product JSON-LD readiness.
13. Add a dedicated product media library page with filters for unassigned, duplicate URL, missing alt, weak score, and product-linked assets.
14. Add one-click attach/detach controls for media assets.
15. Add high-confidence Amazon bulk approval with rollback notes and duplicate detection.
16. Add payment application workflow for matching payments to orders/invoices.
17. Add HST/GST review worksheet for taxable sales, input tax credits, and remittance readiness.
18. Add period close/lock and reopen controls.
19. Add accountant export packaging with ledgers, journals, reconciliations, tax summaries, and attachment index.
20. Continue checking one H1, local wording, mobile CSS, and public `/data/` privacy on every pass.

Current sync: 2026-05-18 — Build 136 Search Console CSV import/review workflow, SEO opportunity summaries, and release-sanity coverage.

## Completed 20 items in this pass — Build 135

1. Carried forward the media-upload public URL fallback so uploads return `https://assets.devilndove.com/...` when no explicit R2 public base variable is set.
2. Added upload diagnostics to `/api/admin/media-upload` responses so admins can see the public base source and bucket binding used.
3. Added `/api/admin/media-diagnostics` for admin-only R2/media configuration checks.
4. Added Operations > Media / R2 Diagnostics with bucket binding, public base URL, sample URL, and recent media asset review.
5. Added optional latest-public-URL verification from the Media / R2 Diagnostics panel.
6. Added `/api/admin/product-image-health` for product featured image, gallery image, alt text, and media public URL coverage checks.
7. Added Operations > Product Image Health with missing-image product samples and weak-alt-text image samples.
8. Added Release Sanity checks for the new media diagnostics endpoint.
9. Added Release Sanity checks for the new product image health endpoint.
10. Added a live Product editor draft-readiness checklist that separates draft, review, and publish readiness.
11. Added a one-click slug-from-name helper inside the Product editor checklist.
12. Added a Move draft to review helper that verifies name, type, slug, category, price, and image before setting the review-ready draft state.
13. Added a reusable image library picker inside the Product editor.
14. Connected the image library picker to `/api/admin/media-assets` so existing R2 uploads can be reused instead of uploaded again.
15. Added image-library tiles that can fill the featured image or next empty gallery image URL field.
16. Updated the inline Product editor upload panel so edit-mode uploads attach to the currently loaded product instead of always being unassigned.
17. Exposed the currently loaded product id to product editor helpers through form dataset/window state.
18. Fixed product edit payloads so merchandise origin, sale channel, external listing details, condition, era, and sourcing notes are saved during updates.
19. Added CSS for the checklist, reusable image picker, mobile image-library tiles, and media diagnostics metric cards.
20. Updated schema files, active Markdown, the migration-ledger marker, and local predeploy sanity checks for Build 135 assets.

## Next logical 20 steps after Build 135

1. Deploy Build 135 and open `/admin/products/` on desktop and phone.
2. Test image upload again and confirm the returned URL starts with `https://assets.devilndove.com/`.
3. Run Operations > Media / R2 Diagnostics and confirm the bucket binding is connected.
4. Add an explicit `PRODUCT_MEDIA_PUBLIC_BASE_URL=https://assets.devilndove.com` environment variable if the diagnostics panel says it is using the default fallback.
5. Create a draft with only product name/type and confirm the checklist shows draft-ready but review/publish incomplete.
6. Use Fill slug from name and confirm the slug field updates cleanly.
7. Upload one new image while editing an existing product and confirm it attaches to that product.
8. Use the reusable image library picker to assign an existing media asset to a draft product.
9. Run Operations > Product Image Health and fix the first products without featured/gallery images.
10. Fill short alt text rows shown by Product Image Health before publishing products.
11. Add a bulk alt-text helper that creates draft alt text from product name, material, colour, and category.
12. Add a real product media library page with filters for unassigned, duplicate URL, missing alt, weak score, and product-linked assets.
13. Add one-click attach/detach controls for media assets from the media library page.
14. Add a safe product publish wizard that requires passing the checklist before setting `status=active` and `review_status=published`.
15. Add product SEO bulk tools for missing title, description, canonical, OG image, and JSON-LD readiness.
16. Continue Search Console CSV import UI and page/query reporting.
17. Continue Amazon duplicate detection, manual relinking, and high-confidence bulk approval with rollback notes.
18. Continue accounting work: payment application, HST review, journal automation, period close/lock controls, and accountant export packaging.
19. Continue local SEO refinement using one clear H1, clear title/meta pairs, and Ontario/Southern Ontario wording on relevant public pages.
20. Keep CSS/mobile sanity checks in every pass because admin panels are becoming large and phone layout can drift.


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


## Build 138 completed 20-step pass — social posting queue, process-photo workflow, and platform readiness

1. Added an admin-only Social Posting Queue in `/admin/operations/` for job/process photos and summaries.
2. Added `/api/admin/social-post-queue` with review-first create, refresh, status update, manual-post recording, and recent-media draft generation actions.
3. Added `social_platform_connections` so Facebook, Instagram, TikTok, X, YouTube, and Pinterest can be tracked separately.
4. Added `social_post_queue` to hold captions, image URLs, hashtags, target platforms, review status, schedule notes, and source/job references.
5. Added `social_post_attempts` to record manual posts now and future API attempts later.
6. Seeded platform readiness rows as manual/copy-ready until official OAuth tokens, app permissions, and review are configured.
7. Added a “Draft from recent media” button so recently uploaded product/job images can become a reviewed social post draft.
8. Added copy-to-clipboard support for captions so posts can be published manually today without exposing platform tokens.
9. Added manual posted-record flow so published Facebook/Instagram/TikTok/X URLs can be linked back to the queue.
10. Added approve/ready/archive controls so posts are not pushed accidentally.
11. Added source type/source ID fields for job updates, product stories, workshop updates, events, and customer deliveries.
12. Added platform-specific checkbox targeting for Facebook, Instagram, TikTok, X, YouTube, and Pinterest.
13. Added mobile-safe CSS for the social queue form and tables.
14. Added social queue checks to Release Sanity.
15. Added runtime incident logging for social queue load/save failures.
16. Added admin audit logging for social queue actions.
17. Added schema entries to the current migration, full schema, store schema, and growth/SEO extension schema set.
18. Added Build 138 migration-ledger marker.
19. Preserved compact mobile navigation, product image workflow, Search Console action queue, and schema-drift protections from prior builds.
20. Updated active Markdown handoff, roadmap, known gaps, sanity, schema, SEO, and repo documents.

## Next logical 20 steps after Build 138

1. Deploy Build 138 and run `database_upgrade_current_pass.sql`.
2. Open `/admin/operations/` and confirm Social Posting Queue loads.
3. Queue one test post from a real job/process photo and copy it manually to Facebook or Instagram.
4. Record the resulting public post URL back into the queue as a manual post.
5. Test “Draft from recent media” after uploading product/job photos.
6. Decide which profiles are official for Devil n Dove: Facebook Page, Instagram account, TikTok, X, YouTube, Pinterest, and any others.
7. Add profile URLs to `social_platform_connections` in the admin UI or a follow-up editor.
8. Add a platform credential settings screen that stores only non-secret public status in D1 and keeps secrets in Cloudflare environment variables.
9. Add Meta/Facebook Page OAuth connection diagnostics before attempting any API publishing.
10. Add Instagram Content Publishing API diagnostics after Meta/Instagram account setup is confirmed.
11. Add TikTok Content Posting API diagnostics only after TikTok developer app approval and verified media URL/domain rules are ready.
12. Add X API diagnostics only after confirming current pricing and write permissions still fit the business.
13. Add per-platform caption length checks and media-ratio warnings before approval.
14. Add short-video/Reels/TikTok-specific media checks for duration, aspect ratio, and thumbnail readiness.
15. Add a content calendar view that groups queued posts by scheduled week.
16. Add product/job link helpers that pull image, title, price, and short summary automatically into a social draft.
17. Add reusable caption templates for “making story,” “finished product,” “behind the scenes,” “oops/funny shop moment,” and “local market/event.”
18. Add UTM-tagged links so social posts can be measured in analytics.
19. Add social performance import fields later for clicks, likes, comments, saves, shares, and platform post URLs.
20. Continue payment application, HST review, period close, accountant export, and Search Console SEO action workflows.
