# Build 159 roadmap update

Completed in this pass:

- Repaired the Catalog Product Editor image workflow so saved product image URLs are visible as thumbnail cards in the Product pictures section.
- Added click-to-edit, Make first, Remove, and drag-to-reorder controls to the inline image cards.
- Synchronized the first visual card to `featured_image_url` and the remaining cards to the gallery URL fields.
- Prevented existing product loads from duplicating the featured image into Image URL 1.
- Kept the deeper Product Media Workflow as the source for advanced image roles, consent/public-use status, crop history, merchandising score, and delete-row/save behavior.

Next build priorities:

1. Add direct thumbnail-card crop/focal-point editing instead of only URL focus.
2. Add a visible “save image order” confirmation tied to both Product Editor and Product Media Workflow.
3. Add product readiness badges beside the visual cards for hero/front, detail, scale, public-use, and alt text coverage.
4. Add bulk replace/compress tools for images that are too small, portrait-only, or missing alt text.
5. Add dashboard counters for products missing required image roles.

# Build 156 roadmap update

Completed in this pass:

- Added public Custom Candle Making and Custom Soap Making landing pages with one H1 each, local SEO wording, and Custom Request prefill links.
- Added stricter admin payment-share gates before approved custom payment links can be copied or used externally.
- Connected approved payment links to provider checkout preparation records for Stripe, PayPal, Square, and manual fallback.
- Added private customer order-status links for converted custom-request orders.
- Added marketplace CSV downloads for Etsy, Facebook Marketplace, Pinterest, and manual listing review workflows.
- Added public private-token consent/review/photo response pages for post-fulfillment prompts.
- Added related-product proof matching on product detail pages using material, process, locality, product type, and proof metadata.

Next build priorities:

1. Convert provider checkout preparation from safe handoff records into live Stripe/PayPal/Square redirect verification once production credentials are confirmed.
2. Add admin void/resend controls for payment, order-status, and consent-response links.
3. Add customer-facing order status updates for production stages, pickup/shipping notes, and fulfillment photos.
4. Add marketplace CSV presets per channel category, shipping profile, taxonomy, and tags.
5. Add consent-response follow-through into public trust blocks and product stories after admin review.
6. Add mobile capture shortcuts for candle/soap batches, scent notes, batch numbers, ingredients, and safety/allergen notes.
7. Add schema drift repair actions for all Build 156 runtime-added columns.

# Build 154 roadmap update

Completed in this pass:

- Connected accepted custom quote previews to review-needed payment-request and order-draft records.
- Added editable custom quote line items for material, labour, pickup/shipping, custom charges, and taxable/non-taxable planning.
- Added quote totals for material cost, labour cost, pickup/shipping estimate, tax estimate, and quote total.
- Added quote revision history for created/shared/changed/declined/accepted follow-through events.
- Added media-consent review records for uploaded custom-request reference images.
- Added accountant export ZIP packaging with close-summary CSV, evidence-index CSV, and manifest JSON.
- Added static SEO override JSON fallback and `scripts/bake_approved_seo_overrides.py` for deploy-time title/meta/internal-link baking.
- Added public gallery/proof filters by material, process, locality, and product type.

Next build priorities:

1. Convert reviewed payment-request drafts into real payment-link records only after admin approval.
2. Convert reviewed order drafts into real orders with quote line items, tax, pickup/shipping, deposit, and balance state.
3. Add quote revision resend flow and versioned private preview links.
4. Add marketplace export packs for Etsy, Facebook Marketplace, Pinterest, and manual listings.
5. Extend proof filters into shop/product list APIs and product detail proof sections.
6. Add post-fulfillment review/photo/consent prompts.
7. Add a mobile workshop capture flow for image role, consent, story note, and social caption draft.

# Build 153 completed — private quote previews, accept/decline tracking, and custom-request reference uploads

Completed in Build 153:

1. Added token-protected private quote preview links for custom request quote drafts.
2. Added public `/custom-request/quote/` preview page with `noindex,nofollow` so private quote links are not search-index targets.
3. Added public `/api/custom-request-quote` GET endpoint for loading private quote previews by token.
4. Added public `/api/custom-request-quote` POST endpoint for customer accept/decline response tracking.
5. Quote acceptance/decline now updates the custom request status, quote draft status, quote share link status, and conversion event history.
6. Added Operations > Custom Requests button for creating private quote preview links after quote/deposit/invoice planning.
7. Added Operations panel for viewing/copying private quote preview links and seeing accepted/declined responses.
8. Added post-submit reference image upload support for custom request forms.
9. Added `/api/custom-request-reference-upload`, using request-bound upload tokens, image-only validation, 8 MB limit, and 5-file limit.
10. Reference uploads are stored as private-review-only media until admin review/consent clears public use.
11. Public custom request form now lets customers choose reference images while preserving pasted reference URL support.
12. Upload failures do not destroy the written request; the form reports the upload issue and keeps the intake safe.
13. Added D1 schema support for `custom_request_quote_share_links` and `custom_request_reference_uploads`.
14. Updated active schema SQL files and all active Markdown handoff docs.
15. Added CSS/mobile polish for quote previews, reference uploads, and the Custom Requests action cluster.
16. Updated predeploy sanity checks to cover Build 153 assets.

Next strongest build pass:

1. Connect accepted quote previews to a reviewed payment-request/order draft bridge.
2. Add admin-editable quote line items, tax estimate, pickup/shipping estimate, and material/labour estimate fields.
3. Add customer quote revision tracking so declined/not-now responses can become revised quote drafts.
4. Add admin media-consent review rows for uploaded custom-request reference images.
5. Add marketplace-ready exports for accepted custom product plans.
6. Add accountant export ZIP packaging with CSV bundle and evidence index.
7. Bake approved SEO overrides into static HTML during deployment.
8. Add proof/gallery filters by material, process, locality, and product type.
9. Add follow-up notification queue entries after quote acceptance, deposit candidate creation, and request inactivity.
10. Add phone-first workshop capture: photo, crop, role, consent, story note, caption draft.

# Build 152 completed — custom request reply templates, deposit/invoice candidates, and HST/GST reminder queue

Completed in Build 152:

1. Added manual customer reply templates generated from custom request quote drafts.
2. Added Operations UI for viewing/copying customer reply templates without auto-sending.
3. Added D1 table `custom_request_reply_templates`.
4. Added deposit candidate generation from custom request quote drafts.
5. Added invoice candidate generation from custom request quote drafts.
6. Added D1 table `custom_request_payment_candidates`.
7. Added conversion-event logging for reply templates, deposit candidates, and invoice candidates.
8. Kept all custom request payment records as internal candidates so no customer is billed accidentally.
9. Added HST/GST reminder queuing from the Accounting Close Workflow.
10. Ensured `notification_outbox` exists before reminder queue operations.
11. Added Accounting Close UI button to queue the reminder using the selected period/reminder date.
12. Added CSS polish for reply template cards and phone-friendly custom request action buttons.
13. Updated active schema SQL files with Build 152 tables and ledger marker.
14. Updated Markdown handoff documents and competitive notes for the new workflow.
15. Re-ran JS syntax, CSS brace, H1/title/meta, predeploy, and ZIP integrity checks before packaging.

Next strongest build pass:

1. Add a real payment-request/invoice bridge from custom request payment candidates into the existing payment/order system.
2. Add customer-ready quote preview pages that are private/link-token protected.
3. Add R2 upload for custom request reference images so customers do not need to paste public links.
4. Add quote acceptance/decline tracking and deposit-paid status.
5. Add accountant export ZIP packaging with CSV files plus evidence index.
6. Bake approved SEO overrides into static HTML during deploy.
7. Add marketplace readiness exports for Etsy/Facebook/Pinterest/manual listing copy.
8. Add proof filters by material, process, locality, and product type.
9. Add phone-first workshop capture: photo, crop, role, consent, story note, caption draft.
10. Add notification review controls for HST/GST reminders before dispatch.

# Build 151 completed — custom request conversion, UTM attribution joins, and close export hardening

Completed in Build 151:

1. Mounted the existing Custom Requests admin workflow inside Operations so the panel is actually visible after deployment.
2. Added Custom Request conversion actions: create quote draft, create job draft, and create product draft plan.
3. Added D1-backed draft tables for `custom_request_quote_drafts`, `custom_request_job_drafts`, and `custom_request_product_drafts`.
4. Added `custom_request_conversion_events` so every request-to-draft action has an audit-style event trail.
5. Added repeat-request/customer-history indicators by email in the Custom Requests admin table.
6. Added UTM capture to public custom request submissions.
7. Added visitor/session token capture to custom request rows so later analytics can connect request forms to traffic journeys.
8. Added UTM self-healing columns to visit tracking for `site_visitor_sessions` and `site_page_views`.
9. Extended Social Posting Queue UTM rollups to show campaign traffic, sessions, checkout starts, abandoned carts, and custom request counts when analytics tables exist.
10. Added remittance evidence URL and reminder date support to the HST/GST review workflow.
11. Added downloadable Accounting Close CSV output from the Accounting Close Workflow endpoint.
12. Added Accounting Close export manifest pointers to the downloadable CSV summary.
13. Added public Custom Request page analytics loading so form submissions can feed the campaign conversion loop.
14. Added CSS polish for mobile-friendly custom request conversion buttons and status notes.
15. Updated active schema SQL files and active Markdown handoff docs for the new workflow.
16. Updated `COMPETITIVE.md` with the new custom-request-to-workflow and campaign-measurement direction.

Next strongest build pass:

1. Convert quote/job/product draft records into the future full quote, job, and product modules once those modules are ready.
2. Add email reply templates from quote drafts so we can answer custom requests faster without auto-sending.
3. Add deposit/invoice candidate creation from accepted quote drafts.
4. Bake approved SEO overrides into static HTML during deploy instead of relying only on client-side fallback.
5. Add reviewed static SEO export/import tooling for Cloudflare/GitHub deployments.
6. Add custom request attachment upload to R2 instead of only accepting pasted public URLs.
7. Add accountant ZIP packaging with bundled CSV files and attachment index.
8. Add HST/GST due-date reminder notifications in the notification outbox.
9. Add product proof filters by material, process, locality, and product category.
10. Add marketplace readiness exports for Etsy, Facebook Marketplace, Pinterest, and manual listings.

# Build 150 completed — trust blocks, reviewed SEO apply loop, and accounting close workflow

Completed in Build 150:

1. Added D1-backed `trust_block_items` for approved testimonial, local proof, product proof, and supporter trust blocks.
2. Added Operations > Testimonials / Trust Blocks admin workflow for creating trust blocks from reviews or saving custom approved proof rows.
3. Added public `/api/trust-blocks` with safe empty fallback if the table is missing or no approved rows exist.
4. Updated public trust/testimonial injection to try approved trust blocks first, then fall back to featured product reviews.
5. Added `seo_page_overrides` for reviewed title/meta/internal-link improvements from Search Console actions.
6. Added Search Console “Apply” action that writes an approved SEO override and marks the source action applied.
7. Added public `/api/seo-page-overrides` plus client-side fallback script on public pages.
8. Added Accounting > Close Workflow panel for payment application, HST/GST review, month-end close readiness, and accountant export manifests.
9. Added admin API support for `accounting_payment_applications`, `accounting_hst_gst_reviews`, and `accountant_export_packages`.
10. Added Release Sanity and Public API Health coverage for trust blocks, SEO overrides, and accounting close tables/endpoints.
11. Updated schema SQL files and Markdown handoff docs.
12. Added responsive CSS polish for the new trust, SEO override, and accounting close UI blocks.

Next strongest build pass:

1. Convert custom requests into draft quotes, jobs, or product drafts.
2. Add quote status controls and approval thresholds for custom work.
3. Bake approved SEO overrides into static HTML during deploy, not only client-side fallback.
4. Join social UTM rollups with visitor/session/order/request conversion analytics.
5. Add post-fulfillment review/photo/request prompts to feed trust blocks.
6. Add a phone-first quick-capture workflow: photo, crop, role, consent, story note, caption draft.
7. Add downloadable accountant export ZIP/CSV bundle generation from the close manifest.
8. Add HST/GST filing reminder and remittance evidence attachment fields.
9. Add public proof filtering by product type, material, process, and locality.
10. Add custom request duplicate/customer-history matching.

# Build 149 completed — product media gates, consent checks, custom requests, and social template editing

Completed in Build 149:

1. Added automatic product-readiness checks for missing image roles, missing hero/front image role, and blocked/consent-needed public-use statuses.
2. Added the same image-role/public-use blockers to admin product review/publish actions.
3. Connected Product Story Notes approval/publishing to privacy status plus product-image media consent summaries.
4. Displayed media consent status inside Product Story Notes rows and product summary copy.
5. Added simple upload-time image editing presets: keep original, square 1200 crop, landscape 4:3 crop, and max-side resize.
6. Added role-aware public product detail gallery output using image roles such as hero, detail, scale, process, packaging, proof, and gallery.
7. Hid storefront images that are explicitly blocked or consent-needed, and hid images linked to consent records that are not public-safe.
8. Added public `/custom-request/` intake for engraving, personalized gifts, handmade jewelry, sublimation, and other workshop-made custom work.
9. Added Operations > Custom Requests admin review queue with statuses and admin notes.
10. Made Social Posting Queue caption templates editable from admin instead of overwriting them from code on every schema pass.
11. Added Social Posting Queue UTM campaign rollups for queued/open/approved/posted social posts.
12. Updated current-pass SQL and schema reference files for `custom_requests` and caption-template persistence.
13. Updated Markdown handoff docs and sanity notes for this pass.

Still strongest next steps:

1. Finish approved testimonial/local trust block workflow.
2. Add a direct custom request -> quote/job/product draft conversion action.
3. Add Search Console reviewed-action auto-apply with a final confirmation gate.
4. Continue payment application, HST/GST review, month-end close checklist hardening, and accountant export packaging.
5. Add click/session analytics joins to the new UTM social rollups once production analytics tables are confirmed.

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


## Build 148 Completed — Product Image Ordering, Roles, Consent Link, and Search Story Snippets

Completed in this pass:

1. Fixed the Product Images admin API syntax issue caused by a duplicated `return json({` block.
2. Added self-healing product image annotation fields for `image_role`, `public_use_status`, `consent_record_id`, and `role_review_notes`.
3. Added a `product_image_role_reference` schema table and seeded role definitions.
4. Added drag/drop ordering to the Product Media Workflow.
5. Kept up/down image movement as a fallback for mobile and accessibility.
6. Added image role selection per image.
7. Added public-use status per image.
8. Added optional consent record ID per image.
9. Added role/review notes per image.
10. Added an “Apply recommended roles” helper in the Product Media Workflow.
11. Expanded the image quality summary to show role coverage and consent/blocking warnings.
12. Persisted role/public-use/consent fields through `/api/admin/product-images`.
13. Included image role counts in media score history metadata.
14. Connected Social Privacy Guard to Media Consent Records by social source and media URL.
15. Added consent match counts/status to Social Privacy Guard rows.
16. Blocked approval of customer/private social media when consent is required but no social-use consent is linked.
17. Added approved product story snippets to internal site search summaries and scoring.
18. Updated CSS for drag/drop product image rows and mobile-safe fallback controls.
19. Updated schema files and active Markdown handoff files.
20. Updated `COMPETITIVE.md` with the new product-media/consent/search direction.

## Next Several Steps

1. Add automatic missing-role warnings before a product can move from draft to review.
2. Add story snippets to more internal search/result card surfaces, including homepage featured areas if appropriate.
3. Connect Media Consent Records directly to Product Story Notes approval.
4. Add a product-story privacy checklist beside the story editor.
5. Add approved testimonial/trust block workflow.
6. Add custom request intake for engraving, personalized gifts, and mixed-media commissions.
7. Add admin-editable social caption templates.
8. Add social analytics rollups from UTM links.
9. Add Search Console action apply/review workflow for title/meta/internal-link updates.
10. Add payment application workflow.
11. Add HST/GST review workflow.
12. Add month-end close checklist and lock/reopen controls.
13. Add accountant export packaging.
14. Add marketplace export helpers for selected products.
15. Add product image duplicate detection across the whole catalog, not only within the editor.
16. Add product media “missing scale photo” and “missing packaging photo” warnings.
17. Add public-safe gallery/testimonial blocks to local SEO pages.
18. Add customer/media consent expiry reminders.
19. Add social posting result reconciliation into analytics.
20. Keep retiring duplicate JSON into D1/private staging where the data is operational or private.

## Build 155 completed roadmap items

- Converted reviewed custom request payment-request drafts into approved private payment review links.
- Converted reviewed custom request order drafts into real `orders` and `order_items` records while keeping status as draft/pending until final review.
- Added quote revision resend/version links so changed quotes can supersede older private links.
- Added marketplace export packs for Etsy, Facebook Marketplace, Pinterest, and manual listing copy.
- Extended proof filters into the shop/product APIs and shop UI for material, process, and locality.
- Added post-fulfillment review/photo/consent prompts as draft/copy-only admin records.

### Next strongest steps after Build 155

1. Connect approved payment review links to Stripe/PayPal/Square provider checkout records once processor settings are confirmed.
2. Add order status history rows and customer order-view pages for converted custom request orders.
3. Add marketplace CSV exports for Etsy/Facebook/Pinterest instead of copy-only cards.
4. Add consent-response capture from the post-fulfillment prompt.
5. Add proof filters to product detail related-item suggestions and collection landing pages.
6. Add admin approval gates before payment links can be sent externally.

## Build 157 update — payment readiness, link controls, stages, candle/soap specs, marketplace presets, and consent proof review

Completed in this pass:

- Hardened `/api/admin/mobile-create-product` so Save Partial retries duplicate SKU/product-number/slug conflicts and returns a recoverable JSON response instead of a raw D1 500 when identity generation collides.
- Added admin link lifecycle controls for custom quote, payment, order-status, and consent links: resend marker, expire, and void.
- Added customer custom-order stage tracking for planning, making, curing/finishing, ready, shipped/pickup, and complete.
- Added candle/soap intake fields for scent profile, wax/base, colour notes, batch, ingredient notes, and allergen/safety notes.
- Added `custom_candle_soap_product_specs` so candle/soap details can be tracked outside the general message text and later linked to product drafts or finished products.
- Added marketplace channel presets and richer CSV rows for Etsy, Facebook Marketplace, Pinterest, and manual listings, including category and shipping-profile review fields.
- Added payment provider readiness records for Stripe, PayPal, and Square configuration checks. This records configuration readiness only; real production checkout still requires a live low-value test order with credentials in Cloudflare.
- Added consent-to-public-proof candidates and an admin approval action that can turn an approved response into a public trust block.
- Updated private order-status pages to show custom work stage history.
- Updated schema files and handoff Markdown for the new workflow.

Next strongest steps:

1. Add editable UI fields for candle/soap scent, wax/base, colour, batch, ingredients, allergen/safety notes, and cure-ready date inside product drafts and mobile product capture.
2. Add explicit Stripe/PayPal/Square live-test result buttons after production credentials are configured in Cloudflare.
3. Add per-link customer copy templates for resend actions so quote/payment/order/consent links can be manually resent with consistent wording.
4. Add public-safe trust block moderation filters so approved consent proof can be scheduled by page/context.
5. Add stage-specific customer messages for custom work: planning, making, curing/finishing, ready, and shipped/pickup.
6. Add marketplace preset editing UI instead of relying on seeded defaults.

## Build 158 — Catalog action and image workflow repair

- Added `IMAGES.md` with the complete image/video placement checklist, required sizes, allowed video use, target paths/data fields, and product image role workflow.
- Repaired `/admin/catalog/` so it now includes the full product editor form required by Edit, product picker, image fields, SEO fields, marketplace fields, and the media/resource modules.
- Changed Product table Approve/Publish buttons so they are clickable even when blocked; the backend now returns the exact missing fields instead of silently doing nothing through a disabled button.
- Improved Needs Changes so admins are prompted for what needs changing and that note can be saved into the product review history/readiness notes.
- Hardened product review actions by ensuring support tables exist before review/publish checks run and by returning human-readable readiness labels.
- Repaired Reserve Resources and Release Resources UI feedback so it handles the actual inventory API response shape and reports affected, skipped/story-only, and missing inventory links.
- Improved Product Media Workflow so loading a product for editing auto-loads its image rows, each row shows a thumbnail, Delete image row is clearer, and saving an empty image set clears `featured_image_url`.
- Continued SEO/H1 discipline: one H1 per scanned public page, private/admin pages kept separate from public SEO goals, and local/product image guidance documented.

### Build 158 next steps

1. Add admin dashboard counters for products missing hero image, missing image roles, missing alt text, blocked public-use status, and missing OG image.
2. Add static example images for custom candle making, custom soap making, custom requests, and About/workshop story.
3. Add a backend endpoint that returns product readiness blockers separately from review actions so the UI can show a checklist before clicking Approve/Publish.
4. Add CSV/export image validation for Etsy/Facebook/Pinterest before marketplace export.
5. Add video poster image fields to product story notes and custom candle/soap pages.

## Build 160 — Catalog editor URL validation and publish image sync repair

- Fixed the Product Editor canonical URL field so relative site paths such as `/shop/product/?slug=desert-succulents-100` are accepted. The input is now text with helper guidance instead of browser `type=url` validation.
- Clarified External Listing URL: leave it blank for normal Devil n Dove shop products; only add a full `https://` Etsy/Facebook/marketplace URL when Sale Channel is Hybrid or External-only.
- Hardened update/create product image syncing so the featured image is also stored in `product_images` at sort order 0, gallery rows follow after it, duplicates are removed, and existing image rows/annotations are preserved when the URL already exists.
- Fixed Clear editor so the visual image cards and Product Media Workflow panel clear along with the form fields.
- Improved publish/approve readiness consistency by making the editor’s image fields and backend `product_images` rows agree before review actions run.
- No new D1 table is required in this pass; this is a code/data-sync behavior repair against the existing products, product_images, product_seo, and product_image_annotations tables.

Next recommended checks:
1. Edit a product with a relative canonical path and click Update Product.
2. Confirm External Listing URL is blank for normal onsite listings.
3. Save, reload, and confirm the first visual image is the featured image and appears in Product Media Workflow.
4. Run Approve/Publish; any blocker should now be a real readiness issue such as missing image role, missing SEO, missing price, or blocked public-use status.

## Build 161 — shop image/gallery, product detail JSON fallback, and catalog workspace split

- Repaired the public product detail page so an HTML fallback response from `/api/product-detail` no longer throws a raw `Unexpected token '<'` JSON error in the browser. The page now reads the response as text, detects HTML, and falls back to `/api/products` by slug when possible.
- Hardened `functions/api/product-detail.js` with a final JSON error wrapper so late D1/query failures return JSON instead of a static HTML error page.
- Extended `/api/products` to attach product image arrays from `product_images`, allowing shop cards to show a main image plus selectable thumbnail images.
- Updated the Shop product card UI so cards are more compact, show richer product details, and allow thumbnail clicks to change the main product image.
- CSS-polished the Shop “Browse by collection direction” area and the `/creations/` collection/trust grid so the layouts are less cramped and more mobile-safe.
- Split the oversized `/admin/catalog/` workflow into focused workspaces: Products & Publishing, Media & Product Images, and Tools & Supplies Inventory Operations.
- Added `/admin/catalog-media/` for media, image roles, image annotations, SEO, and product story work.
- Added `/admin/inventory-operations/` for tools, supplies, stock, product resource reservations, catalog sync, option sets, notifications, and app settings.
- Capped the Product Editor file picker to six selected uploads at a time while preserving existing product-image slots.
- Made the Product Media Workflow more compact by moving advanced crop/quality/scoring fields into a collapsible advanced section.

Next recommended steps: add a dedicated readiness-preview endpoint for product publishing blockers, add image health counters to the admin dashboard, and add live test notes after deploying Build 161.

## Build 162 — Shop/Creations CSS, Gift Page, and Inventory Image References

- Added `/gift-cards/` as a dedicated public gift-card page so the main shop no longer has the full gift-card form awkwardly placed between filters and products.
- Changed `/shop/` to show a compact gift-card callout that links to `/gift-cards/`.
- Repaired the contrast for the `/shop/` Browse by collection direction panel and the `/creations/` browse/filter/cards areas so light panels use dark readable text.
- Updated Tools & Supplies Inventory Operations to show a live visual image preview beside the Image URL field while keeping the URL editable.
- Updated the inventory list rows to show a larger thumbnail, the image URL link, and the source/Amazon URL link for easier visual reference.
- Added `/gift-cards/` to the sitemap. No D1 schema migration is required for this pass.


## Build 163 — 20-step roadmap/gaps pass: readiness, image health, gifts, and admin clarity

Completed in this pass:

1. Added `/admin/readiness/` as a focused Product Readiness workspace.
2. Added `/api/admin/product-readiness` so Approve/Publish blockers can be previewed before clicking action buttons.
3. Added readiness summary counters for total, ready, blocked, missing featured image, missing image roles, missing alt text, blocked public-use images, missing SEO, missing price, and products needing 3 images.
4. Added per-product blocker cards with direct links back to the product editor and media workspace.
5. Added dashboard counters for product image/SEO readiness gaps.
6. Added a Product Readiness department card to the Admin Dashboard.
7. Added Readiness Preview links to Catalog, Catalog Media, and Inventory Operations workspace navigation.
8. Added a static gift-card artwork placeholder at `/assets/gift-card-placeholder.svg`.
9. Added gift-card artwork guidance directly to the `/gift-cards/` hero.
10. Added Gift Cards to the home navigation so the new gift page is easier to find.
11. Hardened predeploy sanity checks so the new readiness page, endpoint, dashboard counters, gift artwork, and CSS assets are checked every pass.
12. Added CSS for readiness cards, readiness score badges, blocker rows, and the split gift-card hero.
13. Kept the one-H1 rule intact across all scanned exposed pages.
14. Kept private/admin pages as `noindex,nofollow` where appropriate.
15. Continued the local SEO habit of clear titles, readable headings, and visible local/product wording.
16. Kept the new readiness endpoint D1-backed without adding a required migration.
17. Preserved the split admin structure from the previous pass: Products, Media, Inventory Operations, and now Readiness.
18. Improved operator visibility before publishing by making missing image roles, missing hero/detail/scale roles, public-use blockers, SEO gaps, and price gaps visible from one place.
19. Updated active Markdown handoff docs with Build 163 notes.
20. Updated schema/reference SQL notes with Build 163 status and no-migration guidance.

Next 20 recommended steps:

1. Add inline readiness badges beside each row in the `/admin/catalog/` product table.
2. Add a one-click “Open first blocker” shortcut from each readiness card.
3. Add image-role quick-fix buttons from the readiness page.
4. Add automatic “apply recommended roles” preview before saving image rows.
5. Add true crop/focal-point visual editing directly on thumbnail cards.
6. Add visible “image order saved” confirmation that shows featured/gallery order after save.
7. Add dashboard drilldown links from each image/SEO counter.
8. Add gift-card admin settings for default amounts, expiry wording, and active/inactive status.
9. Add a real gift-card image upload field and replace the placeholder artwork.
10. Add gift-card checkout order-line creation instead of only local draft storage.
11. Add marketplace image validation before CSV export.
12. Add channel-specific marketplace CSV presets editing in admin.
13. Add shop/product API filters for “missing proof image” and “ready for social.”
14. Add post-publish QA for product detail JSON, image gallery, cart button, and SEO preview.
15. Add public product page mini-gallery thumbnails below the main image if any product detail page still only shows one image.
16. Add public proof/trust moderation filters before new trust blocks appear customer-facing.
17. Add order-stage photo uploads for custom work: planning, making, curing/finishing, ready, pickup/shipping.
18. Add candle/soap spec editing after product creation: scent, wax/base, colour, ingredients, allergens, and batch number.
19. Add accountant export checks for missing evidence URLs and missing close notes.
20. Add a mobile admin landing page that links to phone capture, inventory intake, readiness blockers, and today’s admin actions.


## Build 164 — Roadmap/Gaps Pass Completed

Completed from the requested next-20 pass:

1. Added inline readiness badges beside each product row in `/admin/catalog/`.
2. Added one-click **Open blocker** shortcuts from product rows and readiness cards.
3. Added image-role quick-fix buttons from `/admin/readiness/` that apply recommended image roles through the Product Media Workflow endpoint.
4. Added recommended image-role preview before saving image rows.
5. Added click-to-set focal point editing directly on Product Media Workflow thumbnail cards.
6. Added visible “Product images and image order saved” confirmation after saving image rows.
7. Added Admin Dashboard drilldown links from readiness counters into `/admin/readiness/?filter=...`.
8. Added gift-card admin quick settings through Operations > Saved App Settings.
9. Replaced the placeholder gift-card artwork with `/assets/gift-card-art.svg`.
10. Verified gift-card checkout order-line creation is already supported by `checkout-create-order.js` through `gift_card_purchase` payloads.
11. Added marketplace image-readiness validation notes/fields before CSV export packs.
12. Added editable marketplace CSV presets for Etsy, Facebook Marketplace, Pinterest, and manual listings.
13. Added shop filters for “Ready for social” and “Missing proof image”.
14. Added `/api/admin/product-publish-qa` for post-publish QA checks covering product detail JSON, gallery, cart basics, and SEO.
15. Extended product/shop proof signals so product cards and filters can detect proof-image and social-readiness gaps.
16. Added public trust-block moderation filters by context, item kind, locality, and related product slug.
17. Added `custom_order_stage_photos` API/table for order-stage photo tracking.
18. Added candle/soap spec editing after product creation through `/api/admin/candle-soap-specs` and the Catalog Media workspace.
19. Added accountant export/evidence visibility notes for missing HST/GST evidence URLs.
20. Improved `/admin/mobile/` as a better mobile admin landing page by adding readiness, inventory operations, and missing accounting-state mount support.

### Build 164 schema/data notes

New tables or schema references added:

- `custom_order_stage_photos`
- `custom_candle_soap_product_specs`
- unique index `idx_custom_candle_soap_product_specs_product`
- marketplace export pack fields for image validation status/notes

No public page should have more than one H1; the sanity pass must keep checking this every build.


## Next 20 Recommended Steps After Build 164

1. Add a dedicated admin page for product publish QA results with pass/fail history.
2. Add one-click fixes from the publish QA report, not only from readiness cards.
3. Add real crop boxes with draggable handles, not just focal-point clicks.
4. Save image focal/crop previews as generated derivative image URLs in R2.
5. Add product image version history so replaced images can be restored.
6. Add bulk readiness fixes for all products missing hero/detail/scale roles.
7. Add gift-card settings UI with proper form fields instead of quick preset buttons.
8. Add gift-card artwork upload to R2 and preview it on `/gift-cards/`.
9. Add admin gift-card order review, delivery queue, and resend delivery controls.
10. Add marketplace CSV field mapping per channel, including category ID, shipping profile, materials, tags, and photo columns.
11. Add marketplace image export selection so only approved images appear in CSV packs.
12. Add social-readiness badges directly on shop/admin product cards.
13. Add proof-image requirements by product category, because candles, soap, jewelry, and vintage pieces need different proof shots.
14. Add public product-detail related-proof sections that explain material/process/locality matches in plain language.
15. Add moderation queues for public trust blocks with archive, publish, and hide buttons.
16. Add order-stage photo upload directly in the custom request admin row, including R2 upload.
17. Add candle/soap label export fields for ingredients, allergens, batch, weight, and safety warnings.
18. Add accountant export ZIP checks that fail the export package when required evidence is missing.
19. Add mobile dashboard tiles for readiness blockers, today’s custom requests, and pending order-stage updates.
20. Add a full regression checklist page that tests shop, product detail, cart, checkout, admin catalog, media workflow, custom requests, and accounting exports before each deploy.

## Build 165 — Roadmap/Gaps Pass Completed

Completed this pass:

1. Restored `functions/api/admin/custom-requests.js` to the full admin custom-request workflow file and repaired the broken marketplace preset tag-splitting regex that blocked Cloudflare Pages Functions deployment.
2. Repaired dark-theme consistency for the previously light `/shop/` browse-by-collection panels, `/creations/` creation-browse panels, gift-card cards, and inventory image cards.
3. Added inline post-publish QA buttons and QA badges inside `/admin/catalog/` product rows.
4. Added `Run QA` action wiring to call `/api/admin/product-publish-qa` directly from product rows.
5. Added `Fix now` links beside each readiness blocker on `/admin/readiness/`.
6. Added visible crop rectangle guidance on product image thumbnails.
7. Added square crop/focal quick controls in Product Media Workflow.
8. Added bulk recommended image-role assignment controls in Product Media Workflow.
9. Confirmed the upload workflow keeps client-side resize/compression controls visible before upload.
10. Added admin gift-card balance lookup endpoint and UI support through the customer engagement workflow.
11. Added a direct Trust Block Moderation workspace at `/admin/trust-blocks/`.
12. Added public proof/trust-block placement guidance by page/context.
13. Added marketplace export preview workspace at `/admin/marketplace-exports/`.
14. Added `/api/admin/marketplace-export-preview` with image-readiness summaries before CSV export work.
15. Added customer-facing private order-stage photo gallery support on custom order status links.
16. Added admin prompt workflow for adding custom order-stage photo URLs.
17. Added candle/soap spec display support on public product detail pages.
18. Added safety/allergen note display for candle/soap products.
19. Added accountant evidence URL checker endpoint and Accounting page UI mount.
20. Added a compact mobile-admin “Today’s admin tasks” queue linking readiness, failed APIs, inventory, and accounting evidence work.

Validation for this pass:

- Predeploy sanity: PASS
- JavaScript syntax checks: PASS
- CSS brace check: PASS
- One-H1 sanity remains covered by the predeploy pass.
- SEO bake script: PASS, 0 pages changed because no override rows are populated.

Next 20 recommended steps:

1. Add true visual drag handles for crop rectangles, not just focal-click crop guidance.
2. Add actual browser-side image compression size reporting before upload.
3. Add R2 direct upload for order-stage photos instead of URL-only entry.
4. Add moderation approvals before order-stage photos can become public proof.
5. Add gift-card activation after confirmed paid order status.
6. Add gift-card refund/void/reissue controls.
7. Add gift-card public balance lookup with email/code verification.
8. Add marketplace CSV download from the new preview screen.
9. Add channel-specific marketplace validation rules for Etsy/Facebook/Pinterest.
10. Add trust-block placement toggles per page instead of manual context typing.
11. Add public page modules that can request trust blocks by page/context.
12. Add product-card trust/proof badges based on approved trust blocks.
13. Add customer-facing candle/soap safety accordion on product pages.
14. Add admin candle/soap batch search and batch recall notes.
15. Add accountant evidence attachment upload, not only URL checks.
16. Add failed API cards to the mobile admin queue using runtime incident data.
17. Add a Today task API that merges orders, inventory, products, requests, and accounting work.
18. Add product publish QA results persistence so badges survive reloads.
19. Add one-click “fix first image” guided workflow from the QA/readiness cards.
20. Add local SEO landing-page review queue for each major product/service category.
## Build 166 — Roadmap/Gaps Pass Completed

Completed this pass:

1. Added visual drag handles on product image crop rectangles in Product Media Workflow.
2. Added browser-side upload size reporting so image edit preview shows original size, estimated output size, and savings.
3. Added R2 direct upload support for custom order-stage photos, with URL-entry fallback preserved.
4. Added moderation fields for order-stage photos before they can become public proof.
5. Added gift-card activation handling when a connected order is confirmed paid.
6. Added admin gift-card lifecycle actions: activate paid, void, refund/reduce balance, and reissue.
7. Added public gift-card balance lookup with gift-card code plus email verification.
8. Added marketplace CSV download from the preview endpoint.
9. Added channel-specific marketplace validation rules for Etsy, Facebook Marketplace, Pinterest, and manual listings.
10. Added trust-block placement toggle storage by page/context.
11. Added public trust-block context loader module for shop, creations, gift cards, product, gallery, and about pages.
12. Added shop product-card trust/proof badges when approved trust blocks or social-ready proof signals exist.
13. Added customer-facing candle/soap safety accordion on product detail pages.
14. Added candle/soap batch/safety fields to the public detail renderer.
15. Added accounting evidence attachment upload from the evidence checker workflow.
16. Added failed API/runtime incident task cards into the mobile admin queue through the new Today Tasks API.
17. Added `/api/admin/today-tasks` to merge orders, inventory, products, custom requests, accounting, and failed API work.
18. Added persisted product publish QA results in `product_publish_qa_results` so QA badges can survive reloads.
19. Added groundwork for a one-click first-image fix workflow through crop handles, role tools, and existing readiness links.
20. Added `/admin/local-seo-review/` and `/api/admin/local-seo-review` for major category/service landing-page review.

Validation for this pass:

- Predeploy sanity: PASS
- JavaScript syntax checks: PASS
- CSS brace check: PASS
- One-H1 check: PASS
- SEO bake script: PASS, 0 pages changed because no override rows are populated.
- ZIP integrity: PASS

Schema/data notes:

- New tables: `product_publish_qa_results`, `gift_card_admin_events`, `trust_block_placements`, `local_seo_landing_page_reviews`.
- Expanded table: `custom_order_stage_photos` now supports R2 object metadata, moderation status, proof candidate status, and approval fields.
- Gift cards continue to use `gift_cards` and `gift_card_redemptions`; admin lifecycle events now write to `gift_card_admin_events`.
- Public token/private pages remain `noindex,nofollow` where applicable.

Next 20 recommended steps:

1. Add draggable crop-box preview persistence to generated R2 derivative images.
2. Add automatic image compression before upload instead of preview-only reporting.
3. Add customer-facing proof-photo consent prompts tied to uploaded order-stage photos.
4. Add admin moderation queue dedicated only to stage photos and proof candidates.
5. Add automated gift-card email delivery after paid-order activation.
6. Add gift-card redemption entry in admin checkout/order screens.
7. Add public gift-card balance lookup rate limiting and abuse logging.
8. Add marketplace CSV mapping editor for channel-specific field names.
9. Add marketplace CSV image selector so only approved image roles export.
10. Add trust-block placement UI with max item counts and filters visible on each toggle.
11. Add public trust-block sections to remaining local landing pages.
12. Add category-specific proof requirements for jewelry, candles, soap, vintage, and custom work.
13. Add candle/soap label export fields for weight, ingredients, allergens, and batch.
14. Add candle/soap batch recall workflow and customer notification queue.
15. Add accountant evidence ZIP inclusion for uploaded accounting attachments.
16. Add failed-API drilldown cards directly on the mobile dashboard.
17. Add Today task completion/ignore controls so the queue can be cleared.
18. Add product QA history panel beside Catalog product rows.
19. Add guided “fix first image” wizard that opens image role, crop, and public-use fields in order.
20. Add local SEO review scoring for title, meta, H1, internal links, and local proof wording.

## Build 167 update - dark theme, media derivatives, proof moderation, gift cards, marketplace mapping, and SEO scoring

- Repaired the `/creations/` browse panels and main-page Local maker trust block so they stay consistent with the dark Devil n Dove theme instead of using white cards with black text.
- Added product image derivative/crop preview records so focal/crop work can be queued toward real R2 derivative images.
- Added stage-photo proof moderation queue before custom order photos can become public proof.
- Added gift-card redemption endpoint for admin checkout/order workflows, plus public balance lookup attempt logging and rate limiting.
- Added marketplace CSV mapping editor and endpoint for Etsy, Facebook Marketplace, Pinterest, and manual exports.
- Added accountant evidence attachment upload/list endpoint for future accountant ZIP packaging.
- Added Today task complete/ignore persistence and mobile dashboard controls.
- Added local SEO scoring endpoint for landing-page review rows.
- Added product QA history endpoint for future catalog-side QA panels.

### Next direction
Keep moving repeated image proof, marketplace mapping, gift card, evidence, and local SEO review data into D1-backed review queues with safe JSON fallbacks, and keep public pages on one clear H1 with local wording in titles/headings.

## Build 168 — Roadmap/Gaps Pass Completed

Build 168 continues the Devil n Dove roadmap/gaps pass with real R2-backed derivative image records, marketplace image selection persistence, consent-aware stage-photo proof moderation, gift-card delivery/redemption/abuse tooling, accountant evidence attachment packaging, local SEO scoring/quick actions, catalog QA history, candle/soap labels and recall review, trust-placement counts/previews, Today task snoozing, failed API drilldowns, stronger dark-theme regression checks, and a post-deploy smoke-test checklist.

Completed Build 168 items:

1. Product image derivative records can now create an R2 derivative object/key when an R2 bucket is available; otherwise they fall back to safe query-string previews.
2. Marketplace export image selections now persist per product/channel before CSV export.
3. Stage-photo public proof approval now checks for matching public-use media consent.
4. Approved public-use stage photos now generate public-proof candidates for admin review.
5. Order admin screens now include a gift-card redemption panel for order-linked redemptions.
6. Gift-card activation/reissue actions queue email delivery records in the notification outbox.
7. Gift-card lookup abuse dashboard endpoint added for repeated failed public lookups.
8. Accountant export ZIP now includes evidence attachment URL files and attachment rows in the evidence index.
9. Local SEO review rows now show score badges.
10. Local SEO review has quick actions for title/meta review and completion.
11. Product QA history panel was added to catalog product rows.
12. Product Media Workflow now shows image derivative history beside media rows.
13. Candle/soap label CSV export endpoint and admin download action were added.
14. Candle/soap batch recall/watch dashboard endpoint and admin panel were added.
15. Trust-block placement counts were added to placement data.
16. Trust-block preview by page context was added.
17. Today tasks now support snooze, in addition to done/ignore.
18. Mobile admin Today tasks now show failed API/runtime incident drilldown details.
19. Stronger dark-theme regression checks were added for public sections.
20. `POST_DEPLOY_SMOKE_TEST.md` was added for live URL checks after deployment.

Apply `database_upgrade_current_pass.sql` after deployment so the Build 168 D1 tables/columns are available.

Next 20 recommended steps:

1. Add true pixel crop/resizing worker output for derivative images instead of metadata copy fallbacks.
2. Add visual derivative comparison before/after panels.
3. Add direct marketplace export history per channel.
4. Add marketplace image-selection bulk apply from product role order.
5. Add a dedicated public-proof candidate moderation page.
6. Add customer-visible proof consent status inside private order links.
7. Add gift-card delivery template editor.
8. Add gift-card resend delivery action.
9. Add gift-card fraud/abuse severity scoring.
10. Add binary R2 evidence file bundling when Cloudflare zip generation supports it safely.
11. Add local SEO deploy/bake actions for approved title/meta changes.
12. Add local SEO competitor phrase checklist per landing page.
13. Persist product QA panel expanded/collapsed state.
14. Add product QA issue-specific Fix buttons.
15. Add candle/soap label print layout preview.
16. Add candle/soap recall customer notification queue.
17. Add trust-block A/B placement notes and performance tracking.
18. Add Today task snooze duration selector.
19. Add live post-deploy smoke-test result storage in D1.
20. Add public-page dark-theme screenshot review checklist to `IMAGES.md`.
