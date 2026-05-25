## Completed items in this pass — Build 142

1. Completed `COMPETITIVE.md` as the main competitive strategy document for Devil n Dove.
2. Added source-backed direction for handmade/mixed-media positioning, product storytelling, local SEO, ecommerce UX, and social publishing.
3. Added a competitive feature matrix comparing baseline small shops, stronger shops, and the Devil n Dove target.
4. Added tiered competitive priorities for homepage, product pages, media, mobile UX, local trust, collections, filters, custom requests, testimonials, and marketplace readiness.
5. Added product page, homepage, mobile UX, social, local SEO, content, measurement, and 30/60/90-day implementation blueprints.
6. Added `data/site/competitive-opportunities.json` as a public-safe opportunity seed list.
7. Added D1 table `competitive_opportunities` for tracking strategic opportunities.
8. Added D1 table `competitive_opportunity_events` for status/note history.
9. Added `/api/admin/competitive-roadmap` to seed, list, and update competitive opportunities.
10. Added `public/js/admin-competitive-roadmap.js` for the Operations admin panel.
11. Added Operations > Competitive Roadmap mount and script.
12. Added mobile-friendly CSS for the Competitive Roadmap summary and table panel.
13. Added Release Sanity coverage for the Competitive Roadmap endpoint.
14. Added Release Sanity coverage for competitive-opportunity table seeding and high-priority open counts.
15. Updated the local predeploy sanity script so Competitive Roadmap assets and the completed `COMPETITIVE.md` are checked before packaging.
16. Added competitive roadmap schema to `database_full_schema.sql`.
17. Added competitive roadmap schema and Build 142 ledger marker to `database_upgrade_current_pass.sql`.
18. Added schema notes to `database_growth_analytics_seo_extension.sql` and `database_store_schema.sql`.
19. Updated all active Markdown handoff/status files with the Build 142 direction.
20. Re-ran JavaScript syntax, HTML H1/title/meta, local reference, CSS brace, privacy, SQL smoke, and ZIP integrity checks.

## Next logical steps after Build 142

1. Deploy Build 142 and apply or record `database_upgrade_current_pass.sql`.
2. Open `/admin/operations/` and run **Competitive Roadmap**.
3. Click **Seed defaults** if the D1 table has not populated yet.
4. Mark the items already underway as `in_progress`: mobile menu, social queue, Search Console workflow, product draft readiness, and image health.
5. Use Release Sanity to confirm competitive opportunities are seeded.
6. Start the highest-priority product story work: add story/material/process/care fields into product detail rendering.
7. Expand Product Image Health into separate sale-ready, social-ready, and process-media groups.
8. Add mobile Shop quick chips for New Arrivals, Under $25, One-of-a-Kind, Local Pickup, Vintage Finds, and Custom Gifts.
9. Add the reusable local Southern Ontario trust block to shop, about, contact, local pages, and product detail pages.
10. Add custom request intake for engraving, personalization, and similar-piece requests.
11. Add private testimonials/reviews intake with approval workflow.
12. Add marketplace-safe export readiness checks for Etsy/Facebook/Pinterest/manual posting.
13. Add social analytics rollups from UTM-tagged posts.
14. Add customer/job-media privacy guards before media can be selected for public social posts.
15. Connect Search Console opportunity actions to reviewed title/meta/internal-link updates.
16. Add margin-readiness cards using product price, supplies/tools cost, fees, and shipping assumptions.
17. Continue payment application screens for deposits, orders, refunds, processor fees, payouts, gift cards, and manual adjustments.
18. Continue HST/GST review worksheet and remittance-ready totals.
19. Continue month-end close lock/reopen controls with checklist, review notes, and audit trail.
20. Continue accountant export package v2 with GL, trial balance, P&L, HST worksheet, attachment index, and unresolved issue log.

# Development Roadmap — Devil n Dove

## Completed 20 items in this pass — Build 140

1. Added a dry-run platform payload preview for Social Posting Queue items before any API call is attempted.
2. Added `dry_run_platforms` support to `/api/admin/social-post-queue` so admins can inspect Facebook, Instagram, X, Pinterest, TikTok, and YouTube payloads safely.
3. Added dry-run attempt logging with `dry_run_preview` status so preview history is visible in recent attempts.
4. Added platform-specific caption variants for Facebook, Instagram, TikTok, X, YouTube, and Pinterest while keeping the main caption as the fallback.
5. Added scheduled date/time support to the Social Posting Queue form and queue table.
6. Added schedule blocking so future-scheduled posts are not API-published early unless deliberately forced later by code/admin review.
7. Added duplicate/repost signatures based on title, caption, images, platforms, and link.
8. Added `do_not_repost` guardrails so likely duplicate posts are blocked from API publishing until the warning is cleared by an admin.
9. Added a queue-table “Clear duplicate warning” action for reviewed duplicates.
10. Added media-quality warnings for missing image URLs, non-HTTPS/private media URLs, too many images, and X caption trimming.
11. Added saved dry-run payload JSON and last-dry-run timestamp fields for auditability.
12. Added social queue summary counts for scheduled posts, due posts, dry-run previews, and duplicate warnings.
13. Expanded Release Sanity to report social scheduled/dry-run counts and warn on duplicate/repost flags.
14. Expanded the platform readiness UI into a clearer credential checklist.
15. Improved the Social Posting Queue mobile layout, dry-run preview display, warnings, and wide table handling.
16. Updated social queue schema references in `database_full_schema.sql`, `database_store_schema.sql`, `database_growth_analytics_seo_extension.sql`, and `database_upgrade_current_pass.sql`.
17. Added a Build 140 schema migration ledger marker.
18. Updated `scripts/predeploy_sanity_check.py` so dry-run and caption-variant social assets are checked before packaging.
19. Preserved the previous product/media/mobile/Search Console/storefront fallback work while adding the new social publishing safety layer.
20. Updated active Markdown files with the Build 140 handoff, risks, sanity notes, schema notes, local SEO note, and next steps.

## Next logical 20 steps after Build 140

1. Deploy Build 140 and apply or record `database_upgrade_current_pass.sql`.
2. Open `/admin/operations/` and refresh Social Posting Queue.
3. Queue one harmless crafting-process post with one public image URL.
4. Use **Dry run** before any publish attempt and verify the platform payload preview looks correct.
5. Set a future schedule and confirm **Publish APIs** records `blocked_scheduled` instead of posting early.
6. Queue a similar duplicate post and confirm the duplicate/repost warning appears.
7. Clear the duplicate warning only after reviewing the caption/image/platform combination.
8. Add one platform credential set at a time in Cloudflare environment variables, starting with Facebook Page or X.
9. Run dry-run previews after each credential change before pressing Publish APIs.
10. Add a richer job/project timeline source so crafting-process posts can be generated from job records rather than a blank form.
11. Add platform-specific image/video rules, especially aspect ratio and duration checks for Instagram, TikTok, YouTube Shorts, and Pinterest.
12. Add retry/backoff notes for API failures and rate-limit responses.
13. Add a public-safe “workshop story” block that can reuse approved social captions without exposing admin notes.
14. Add social-post performance fields for manual engagement tracking until API analytics are available.
15. Add Google Business Profile post/photo planning as a manual checklist because GBP posting/media workflows differ from the other platforms.
16. Continue Search Console CSV import testing and generate private SEO actions only from real opportunity rows.
17. Add product SEO bulk tools for missing title, description, canonical, OG image, and Product JSON-LD readiness.
18. Continue accounting work: payment application, HST/GST review, period close/lock, and accountant export packaging.
19. Keep testing the compact mobile menu, admin tables, and product editor on a real phone after cache clears.
20. Continue checking one H1, local wording, schema drift, CSS drift, public `/data/` privacy, and robust fallbacks on every pass.


## Completed 20 items in this pass — Build 139

1. Added approved-post API publishing attempts to the existing Social Posting Queue.
2. Kept the workflow review-first so crafting/job posts must be approved before any API push attempt.
3. Added platform credential readiness checks for Facebook, Instagram, X, and Pinterest using Cloudflare environment variables only.
4. Added Facebook Page post/photo publishing support when `FACEBOOK_PAGE_ID` and `FACEBOOK_PAGE_ACCESS_TOKEN` are configured.
5. Added Instagram image publishing support through the Meta media-container/media-publish flow when `INSTAGRAM_USER_ID` and a valid Meta/Instagram token are configured.
6. Added X text/link publishing support through the X post endpoint when `X_USER_ACCESS_TOKEN` is configured.
7. Added Pinterest image-pin publishing support when `PINTEREST_ACCESS_TOKEN` and `PINTEREST_BOARD_ID` are configured.
8. Kept TikTok manual/review-first in this pass because the direct upload/publish flow needs separate app approval and upload handling.
9. Kept YouTube manual/review-first in this pass because Shorts/upload publishing needs a separate Google OAuth upload workflow.
10. Added per-platform attempt recording for API posted, failed, credentials missing, manual pending, and blocked-needs-approval outcomes.
11. Added `last_publish_attempt_at` and `api_publish_mode` support to the social queue reference schema.
12. Added richer attempt metadata to the social attempt reference schema, including HTTP status, response IDs, request mode, and published URL.
13. Added a Social API publisher readiness check into Release Sanity.
14. Updated the Operations Social Posting Queue UI with an API Publish button beside approved posts.
15. Updated the Platform Readiness table to show API-ready, missing environment variables, and manual/copy-ready status.
16. Added a Crafting process source type and preserved job/process/product story source labels.
17. Preserved the compact mobile menu, product draft/editor improvements, media diagnostics, Search Console import/actions, sitemap, structured-data, and storefront health tools.
18. Kept social credentials out of D1, JSON, Markdown, and public files; they belong in Cloudflare environment variables only.
19. Updated schema reference files and `database_upgrade_current_pass.sql` with the Build 139 ledger marker.
20. Ran syntax, H1/title/meta, CSS, public-data privacy, SQL smoke, and ZIP integrity checks for the packaged build.

## Next logical 20 steps after Build 139

1. Deploy Build 139 and apply/record `database_upgrade_current_pass.sql`.
2. Open Operations > Social Posting Queue and queue one test crafting-process post.
3. Approve the queued post and test API publishing with no credentials first; confirm attempts record `credentials_missing` instead of failing the whole page.
4. Add only one platform credential set at a time in Cloudflare environment variables, starting with Facebook or X.
5. Create a private social credential checklist in Operations so missing/ready variables are more visible before posting.
6. Add a dry-run preview endpoint that shows the exact platform payload without sending it.
7. Add post scheduling controls so approved posts can be queued for a future date/time.
8. Add per-platform caption variants so X can stay shorter while Instagram/Facebook get longer story captions.
9. Add automatic first-image quality warnings before sending posts to image-heavy platforms.
10. Add a “job progress timeline” source so process updates can be created from a project/job record instead of a blank form.
11. Add a public-safe gallery/story block that can reuse approved social captions without exposing private admin notes.
12. Add TikTok API readiness diagnostics, then implement the direct/post upload flow only after developer app approval and media URL rules are confirmed.
13. Add YouTube Shorts upload diagnostics and upload handling after Google OAuth credentials are safely configured.
14. Add platform rate-limit/backoff handling and retry notes for failed API attempts.
15. Add a “do not post again” duplicate detector for repeated image/caption/platform combinations.
16. Connect product publish/review status to optional social queue generation after a product reaches publish-ready.
17. Add Search Console feedback columns to compare page impressions before/after social and SEO pushes.
18. Add month-end social/export summary for accountant/marketing review.
19. Continue local SEO content tuning page by page while keeping one clear H1 per exposed page.
20. Continue retiring JSON duplication where D1 has become the reliable source of truth.

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

## Build 141 completed 20-step pass — social content calendar, caption templates, UTM links, and continued safety hardening

1. Preserved the Build 140 social queue, dry-run, scheduling, duplicate guardrail, and credential-readiness workflow.
2. Added reusable social caption templates for making stories, finished products, funny shop moments, local updates, laser engraving, and vintage finds.
3. Added `social_caption_templates` to the D1 schema and current migration references.
4. Added template seeding/self-healing inside `/api/admin/social-post-queue` so older D1 installs can recover safely.
5. Added `caption_template_key` to queued social posts.
6. Added `content_pillar` to group posts as behind-the-scenes, finished goods, local presence, custom work, human story, or vintage/collectible content.
7. Added `call_to_action` for each queued social post so captions are less generic.
8. Added `utm_source`, `utm_medium`, `utm_campaign`, and `utm_url` fields to the queue.
9. Added automatic UTM link generation for product/job/social links without overwriting existing UTM values.
10. Updated platform payload generation so UTM URLs are preferred in social dry runs and API attempts.
11. Added a caption-template preview action that returns a generated caption without queueing or posting anything.
12. Added a Social Posting Queue template selector in Operations.
13. Added a “Preview template caption” button before queueing posts.
14. Added a content calendar summary showing upcoming/due/posted/duplicate-warning social rows by date.
15. Added a caption-template reference table inside the Operations panel.
16. Added quick “Use template” buttons that copy template defaults into the queue form.
17. Expanded Release Sanity to check active social caption templates and calendar readiness.
18. Updated full schema/current migration/store/growth schema notes for Build 141.
19. Re-ran JavaScript syntax checks and SQL smoke tests after the social queue changes.
20. Updated active Markdown handoff, roadmap, known gaps, sanity, schema, SEO, and repo documents for this pass.

## Next logical 20 steps after Build 141

1. Deploy Build 141 and run/record `database_upgrade_current_pass.sql`.
2. Open `/admin/operations/` and confirm Social Posting Queue loads with caption templates and the content calendar.
3. Create one test crafting-process post using the “Making story” template.
4. Use “Preview template caption” before queueing so the generated caption can be reviewed.
5. Confirm the generated UTM link is used in dry-run payloads when a related link is provided.
6. Queue one local Ontario update and confirm hashtags/content pillar are locally relevant.
7. Dry-run the post and confirm Facebook/Instagram/X/Pinterest payloads look correct before API publishing.
8. Keep TikTok and YouTube manual until their upload flows and app approvals are configured.
9. Add a weekly/monthly social calendar view that can filter by content pillar and platform.
10. Add one-click product-story drafts from Product editor records, pulling image, title, price, short description, and product URL.
11. Add one-click workshop/process drafts from recent media uploads with selected images.
12. Add per-platform image ratio/size checks for Instagram, TikTok, Pinterest, and X before approval.
13. Add a reusable caption-template editor so templates can be adjusted from admin without code changes.
14. Add UTM analytics rollup so social-post campaigns can be tied to `/api/site-search-event`/visitor analytics later.
15. Add platform post-performance import fields for clicks, likes, comments, shares, saves, and video views.
16. Add a “do not post before/after” customer privacy checkbox for job/customer-related media.
17. Continue payment application screens for deposits, orders, refunds, processor fees, payouts, gift cards, and manual adjustments.
18. Continue HST/GST review worksheet and remittance-ready totals.
19. Continue month-end close lock/reopen controls with checklist, review notes, and audit trail.
20. Continue accountant export package v2 with GL, trial balance, P&L, HST worksheet, attachment index, and unresolved issue log.


## Build 143 — Social Media Privacy Guard + Competitive Execution

Completed in this pass:

1. Added Operations > Social Media Privacy Guard.
2. Added `/api/admin/social-media-privacy-guard`.
3. Added `social_media_privacy_rules` and `social_post_privacy_reviews` schema support.
4. Added default rules for customer/private identifiers, workshop background leaks, product-only media, personal wording review, and visible children/visitors.
5. Added privacy columns to `social_post_queue` through runtime-safe self-healing.
6. Blocked API publishing from Social Posting Queue until the queued post is privacy-approved or marked no-private-media.
7. Added Release Sanity checks for the Social Media Privacy Guard endpoint and open posts needing privacy review.
8. Expanded `COMPETITIVE.md` with competitive execution details, product-page direction, social calendar, trust/privacy posture, marketplace direction, accounting/margin priorities, and immediate/next/later implementation waves.
9. Expanded `data/site/competitive-opportunities.json` with social privacy, product story, and local trust block opportunities.
10. Updated schema files and active Markdown handoff docs.

Next strongest directions:

1. Render product-story blocks publicly on product detail pages.
2. Add a reusable local trust block to Home, About, Shop, Contact, product, and local pages.
3. Add “post this product” from Product editor into Social Posting Queue.
4. Add admin-editable caption templates.
5. Add social analytics rollups from UTM links and manual/API post URLs.
6. Add product media role checklist: main/detail/scale/process/packaging/video.
7. Add customer media consent records for job/customer-specific posts.
8. Add testimonials/review approval workflow.
9. Add marketplace export readiness checks.
10. Continue payment application, HST review, period close, and accountant export packaging.

## Build 144 completed — product story, local trust, and product-to-social workflow

Completed in this pass:

1. Added a public product-story block to product detail pages.
2. Added approved story-note schema through `product_story_public_notes`.
3. Added a safe fallback story generator using existing product fields when no approved story note exists.
4. Added condition/era/sourcing notes to the story block when available.
5. Added linked-tool/supply count and image count into the public story context.
6. Added `data/site/local-trust.json` as a public-safe Southern Ontario trust seed.
7. Added `/public/js/local-trust-block.js` as a reusable local trust renderer.
8. Added the local trust block to the homepage.
9. Added the local trust block to product detail pages.
10. Added mobile-friendly styling for the trust block.
11. Added **Post this product** buttons to the admin product table.
12. Added product-to-social queue payload generation from product rows.
13. Product social posts are queued as drafts, not published automatically.
14. Product social posts use UTM-ready product links through the existing Social Posting Queue.
15. Product social posts continue to pass through privacy review and platform readiness checks.
16. Added Build 144 schema updates to active SQL files.
17. Updated `COMPETITIVE.md` with the new buyer/admin directions.
18. Updated active Markdown handoff/status files for the new workflow.
19. Extended product detail structured/story direction without exposing private import/accounting data.
20. Preserved one-H1/page SEO checks, compact mobile direction, and public `/data/` privacy posture.

## Next several steps after Build 144

1. Build an admin editor for `product_story_public_notes` so story copy can be approved/published without SQL.
2. Add product readiness warnings when public story output is fallback-only.
3. Add story snippets to shop cards and site search results.
4. Add reusable testimonial/trust approval tables and a public testimonial block.
5. Add customer/job/media consent records and connect them to social privacy review.
6. Add a local pickup confidence block to cart and checkout.
7. Add custom request intake for engraving, personalization, ring ideas, and “can you make something similar?” requests.
8. Add marketplace export readiness checks for Etsy/Facebook/Pinterest/manual channels.
9. Add social analytics rollups from UTM-tagged links and posted URLs.
10. Add product media role checklist enforcement for main/detail/scale/process/packaging photos.
11. Add admin-editable social caption templates.
12. Add product story-to-social caption helpers.
13. Add Search Console action completion links back to page/product records.
14. Add dynamic sitemap generation from active D1 product rows once schema health is stable.
15. Add accounting payment application screens.
16. Add HST/GST review worksheet and filing support.
17. Add month-end close lock/reopen controls.
18. Add accountant export packaging.
19. Add inventory depletion simulation from product/resource links.
20. Add marketplace/channel margin previews before publishing or discounting.

## Build 146 completed — product story editor, mobile draft fix, and capture hardening

Completed in this pass:

1. Replaced the mobile product capture API with a safer version that defines `normalizeColorNames`.
2. Kept mobile draft saves JSON-only on failure so browser pages do not show `Unexpected token '<'` style errors.
3. Preserved product draft autosave from the desktop Product editor.
4. Preserved seven-total-image finished-product capture.
5. Preserved sequential image uploads so one bad file does not cancel the full batch.
6. Added `product_story_public_notes` admin editor support.
7. Added `/api/admin/product-story-notes`.
8. Added `/public/js/admin-product-story-notes.js`.
9. Added Product editor mount for story notes.
10. Added story seeding from existing product fields.
11. Added display statuses: draft, review, approved, published, archived.
12. Added story privacy statuses: needs_review, safe, private_detail_removed, blocked.
13. Added story review/internal notes fields.
14. Added safe schema helpers so older D1 databases can add optional story columns at runtime.
15. Updated reference schema files for story source/privacy/review columns.
16. Updated predeploy sanity checks for the new story editor assets.
17. Updated `COMPETITIVE.md` with the new story-led product strategy.
18. Updated Known Gaps with the remaining story/media/accounting risks.
19. Kept one-H1/page, title/meta, CSS, and public-data privacy checks in the deployment workflow.
20. Prepared Build 146 as a deployable handoff with sanity/outstanding items.

### Next several steps

1. Add story snippets to public shop cards and search results.
2. Add image drag/drop ordering in the Product editor.
3. Add duplicate image URL warnings and “same angle” warnings.
4. Add product media role checklist: hero, back, scale, detail, process, packaging, material/tool proof.
5. Add a “Post this product” panel inside the Product editor, not only in the product table.
6. Add customer/job/media consent records for social publishing.
7. Add admin-editable social caption templates.
8. Add social analytics rollups from UTM-tagged links.
9. Add approved testimonial/trust blocks and local proof snippets.
10. Add custom request intake for engraving, personalized gifts, and workshop-made requests.
11. Add Search Console action application workflow that updates titles/meta only after review.
12. Add payment application workflow.
13. Add reconciliation exception closeout.
14. Add HST review worksheets.
15. Add month-end close checklist and lock/reopen controls.
16. Add accountant export packaging.
17. Add Amazon high-confidence bulk approval with duplicate/relink protection.
18. Add inventory movement audit views for product-resource consumption.
19. Add product margin preview before publishing.
20. Add release-health “go/no-go” summary that combines schema drift, public API health, runtime incidents, sitemap, structured data, and image readiness.



## Build 147 completed — shop story snippets, image role checklist, social shortcut, and consent registry

Completed in this pass:

1. Added public story snippet fields to `/api/products` output.
2. Added safe D1 enrichment from approved/privacy-safe `product_story_public_notes` rows.
3. Kept `/api/products` resilient when the story table or columns are missing.
4. Added story snippet text to public shop cards.
5. Added story fields to public shop/search query matching.
6. Added `.shop-card-story` CSS for product story snippets.
7. Added duplicate image URL warnings inside the Product editor.
8. Added a Product image role checklist for seven total product photos.
9. Added the roles: hero/front, detail/texture, scale/context, back/side, process/story, packaging/pickup, material/tool proof.
10. Added a **Post this product** shortcut directly inside the Product editor.
11. Kept Product editor social posts as draft/review-only; they still go through Social Posting Queue and Privacy Guard.
12. Added Operations > Media Consent Records.
13. Added `/api/admin/media-consent-records`.
14. Added `public/js/admin-media-consent-records.js`.
15. Added `media_consent_records` schema/table support.
16. Added consent status/scope/public/social-use fields for safer media approvals.
17. Added media-consent assets to Operations and predeploy sanity checks.
18. Removed the duplicate product-story script include from the Product admin page.
19. Updated `data/site/competitive-opportunities.json` with story snippets, image roles, and consent registry items.
20. Updated active Markdown and schema files for the new direction.

### Next several steps

1. Add drag/drop image ordering in the Product editor.
2. Persist image role labels per product image instead of only using the checklist.
3. Add duplicate/same-angle warnings using image metadata once image scoring is deeper.
4. Add story snippets to internal site search results, not only shop cards.
5. Connect Media Consent Records directly to Social Media Privacy Guard queue items.
6. Connect consent records to Product Story Notes before story approval.
7. Add approved testimonial/trust block workflow.
8. Add custom request intake for engraving, personalized gifts, ring ideas, and “make similar” requests.
9. Add admin-editable social caption templates.
10. Add social analytics rollups from UTM-tagged links.
11. Add Search Console action application workflow that updates titles/meta only after review.
12. Add product margin preview before active/published status.
13. Add inventory depletion simulation from product-resource links.
14. Add payment application workflow.
15. Add reconciliation exception closeout.
16. Add HST/GST review worksheets.
17. Add month-end close checklist and lock/reopen controls.
18. Add accountant export packaging.
19. Add release-health “go/no-go” summary combining schema drift, public API health, runtime incidents, sitemap, structured data, image readiness, and media consent risk.
20. Add marketplace/channel export readiness for Etsy, Facebook Marketplace, Pinterest, and manual copy/paste channels.
