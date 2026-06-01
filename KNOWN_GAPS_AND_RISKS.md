# Build 159 gaps and risks update

Closed or reduced in Build 159:

- Existing Product Editor images are no longer hidden as plain URL-only fields; they now appear as thumbnail cards in the Product pictures area.
- Product Editor image order can now be adjusted visually by dragging cards.
- Featured-image duplication risk is reduced because existing product loads filter the featured image out of the gallery URL fields.

Still outstanding:

- Clicking an image currently focuses its URL field for editing; true crop/focal-point editing still happens in the Product Media Workflow, not directly inside the thumbnail card.
- Removing a card clears it from the Product Editor URL fields; permanent product-image row deletion still requires saving through the Product Media Workflow when using row metadata.
- The Product Editor and Product Media Workflow both manage image data, so future work should add a clearer one-click sync/save-order path to reduce operator confusion.

# Build 156 gaps and risks update

Closed or reduced in Build 156:

- Payment links now require a stricter admin share gate before external sharing: quote line items, customer email, positive amount, reviewed payment draft, converted real order, and accepted/quoted request status are checked.
- Approved payment pages can prepare Stripe/PayPal/Square/manual checkout records instead of stopping at a manual readiness note.
- Converted custom-request orders now have private customer order-status pages.
- Marketplace copy packs now have CSV downloads for Etsy, Facebook Marketplace, Pinterest, and manual listings.
- Post-fulfillment review/photo/consent prompts now have a public private-token response page.
- Product detail pages now show related proof-matched products when metadata exists.
- Candle and soap custom-work entry pages now exist and feed the Custom Request intake.

Still open:

1. Stripe/PayPal/Square checkout preparation must still be verified against live provider credentials before relying on redirects for real payments.
2. Payment/order/consent links need admin void/resend/expiry management.
3. Marketplace CSV rows still need channel-specific category, shipping, variation, and fee settings before direct upload.
4. Product proof matching depends on clean product metadata; older products may need material/process/locality cleanup.
5. Consent responses are saved, but admin review must still decide whether anything becomes public/social.
6. Candle/soap pages need product photos, batch examples, ingredient/scent notes, and safety/allergen language before heavy promotion.

# Build 154 gaps and risks update

Closed or reduced in Build 154:

- Accepted quote previews now create review-needed payment-request and order-draft records.
- Quote drafts now support editable line items and calculated material/labour/pickup-shipping/tax/total estimates.
- Quote revision history now records important quote changes and customer decisions.
- Customer reference uploads now create media consent records as requested/internal-only.
- Accounting close can now download a ZIP bundle containing close-summary CSV, evidence-index CSV, and manifest JSON.
- Approved SEO overrides now have a static JSON fallback and a deploy-time bake script.
- The gallery now has proof filters for material, process, locality, and product type.

Still open:

1. Payment-request drafts are not real payment links yet; they require admin review before sending.
2. Order drafts are not real orders yet; conversion into `orders` and order line items is still needed.
3. Quote revisions are tracked, but customer-facing revised quote resend/version links are not finished.
4. The accountant ZIP includes generated text/CSV evidence indexes, but not binary receipt attachments yet.
5. Static SEO baking depends on populating `data/site/seo-page-overrides.json` before deploy.
6. Gallery filters depend on available metadata; older JSON/catalog rows may need material/process/locality cleanup.
7. Media consent records are created for reference uploads, but admin must still review/approve public/social use manually.

Deployment watch items:

- Apply Build 154 schema changes before relying on quote line items, revisions, payment-request drafts, or order drafts.
- Test custom quote acceptance with a private token and confirm Operations shows the payment/order drafts.
- Test one reference image upload and confirm Media Consent Records shows it as requested/internal-only.
- Run `python scripts/bake_approved_seo_overrides.py` only after reviewing static SEO override JSON.
- Confirm `/gallery/` filters still work when live D1 falls back to JSON.

# Build 153 known gaps and risks update

Moved forward in Build 153:

- Private quote preview links are now generated from Custom Requests.
- Customers can accept or decline a quote preview without being charged automatically.
- Quote responses are tracked in D1 and recorded in conversion history.
- Public custom requests can now upload reference images after the written request is saved.
- Reference-image uploads use a request-bound token, image-only validation, an 8 MB per-file limit, and a 5-file cap.
- If R2 upload is not configured, the written request still succeeds and the customer receives a clear fallback message.

Still outstanding:

1. Accepted quote previews do not yet create real payment links, invoices, or order records.
2. Quote drafts do not yet have editable line items, taxes, pickup/shipping, material cost, labour time, or revision history.
3. Uploaded custom-request reference images are still stored as private-review references; they do not yet create full media-consent review records.
4. Deposit/invoice candidates still need a reviewed bridge into the real payment/order system.
5. Accountant export packaging is still CSV/manifest-focused; ZIP bundle packaging is still outstanding.
6. Approved SEO overrides still need to be baked into static HTML during deployment.
7. Public proof/gallery filtering by material, process, locality, and product type is still outstanding.
8. Marketplace-ready export copy/checklists are still outstanding.
9. HST/GST reminders are queued, but final reminder review/dispatch controls should be strengthened.
10. Live production testing still needs to confirm R2 public base URL and bucket bindings for custom-request uploads.

Risk notes:

- Keep quote preview links private and manual-share only. They are token-protected and noindexed, but anyone with the link can view the quote.
- Do not treat customer acceptance as paid work. Build 153 records intent only; a reviewed payment request or invoice should still happen separately.
- Reference images may contain private people, gifts, names, or memorial content. They must stay private-review-only until media consent/public-use review is complete.

# Build 152 known gaps and risks update

Resolved or reduced in Build 152:

- Custom request quote drafts can now generate manual customer reply templates.
- Custom request quote drafts can now generate deposit and invoice candidates.
- HST/GST reminder dates can now queue a reminder into `notification_outbox`.
- The Operations UI now exposes reply template and payment-candidate follow-up instead of leaving draft records hidden.

Still outstanding:

1. Reply templates are not auto-sent and are intentionally manual/copy-only. A future safe dispatch workflow should require review/approval.
2. Deposit and invoice candidates are not real invoices or payment requests yet. They need a bridge into the order/payment system before customers can pay.
3. Custom request attachments still rely on pasted public URLs; R2 reference-image upload is still needed.
4. Quote acceptance/decline tracking is not complete.
5. Accountant export packaging is still CSV/manifest focused and not a full ZIP bundle with evidence index.
6. Approved SEO overrides still need static HTML baking during deploy for the strongest crawler signal.
7. Public proof filters by material/process/locality/product type are not finished.
8. Marketplace readiness export is not finished.
9. HST/GST reminders queue to notification outbox, but live dispatch still depends on the notification dispatch setup.
10. Continue checking CSS drift and one-H1 compliance every pass.

# Build 151 gaps and risks update

## Closed or reduced in Build 151

- Custom Requests are now mounted in Operations and can be converted into quote draft, job draft, or product draft plan records.
- Custom request conversion history is tracked in D1 through `custom_request_conversion_events`.
- UTM campaign attribution now flows into public custom request submissions and visitor/page-view analytics.
- Social Posting Queue UTM rollups now show traffic and conversion signals when analytics tables are present.
- HST/GST review now stores remittance evidence URL and reminder date fields.
- Accounting Close Workflow can now download a close-summary CSV for accountant handoff.

## Still open

- Quote/job/product draft records are planning records; they are not yet full quote, job, invoice, or catalog product modules.
- Approved SEO overrides still need a deploy/build-time static HTML baking step for the strongest crawler signal.
- Custom request attachments still accept pasted URLs only; R2 upload for request references is still outstanding.
- Accountant export packaging now has CSV summary support, but not a bundled ZIP package with all supporting files.
- HST/GST reminders are recorded but are not yet pushed into the notification outbox automatically.
- UTM conversion joins depend on production analytics tables existing and receiving traffic after deployment.

## Deployment watch items

- Apply or record the Build 151 schema changes before relying on Custom Request conversion tables.
- Open `/admin/operations/` after deploy and confirm Custom Requests appears between Media Consent Records and Testimonials / Trust Blocks.
- Submit a test custom request with a UTM-tagged URL and confirm the Operations panel shows it.
- Run Social Posting Queue after a few tracked visits to confirm campaign traffic/conversion counts appear without breaking when analytics tables are empty.

# Build 150 gaps and risks update

## Closed or reduced in Build 150

- Approved testimonial/local trust blocks now have a D1-backed admin workflow and public API fallback.
- Search Console reviewed actions now have an “Apply” path into `seo_page_overrides`.
- Public pages now load a safe SEO override fallback script that can update title/meta and insert a reviewed internal-link note when approved D1 data exists.
- Payment application, HST/GST review, month-end close checklist/readiness, and accountant export manifest packaging now exist in Accounting.
- Release Sanity and Public API Health now cover the new trust, SEO override, and accounting close workflow surfaces.

## Still open

- Custom requests are still not converted directly into quotes, jobs, or product drafts.
- Client-side SEO override fallback is helpful, but approved title/meta changes should still be baked into static HTML for the strongest crawler signal.
- Social UTM rollups still need live visitor/session/order/request conversion joins.
- Accountant export manifests do not yet generate a downloadable ZIP/CSV package.
- HST/GST review does not yet attach remittance evidence or send due-date reminders.
- Public proof filtering by material/process/locality is not yet finished.

## Deployment watch items

- Apply or record the Build 150 schema changes before relying on the new panels.
- Existing `seo_opportunity_actions` tables may need the self-healed `applied_override_id` and `applied_at` columns; the Search Console endpoint attempts this safely.
- If trust blocks are empty, public pages should still fall back to featured product reviews or show nothing without breaking layout.

# Build 149 gaps and risks update

## Closed or reduced in Build 149

- Simple photo editing is now available during Product Media Workflow uploads through crop/resize presets.
- Product readiness and review actions now flag/fail missing image roles, missing hero/front role, and blocked/consent-needed public-use statuses.
- Product Story Notes approval/publishing is now blocked unless the story privacy status is safe/private-detail-removed and product media consent is clear.
- Media consent status now appears in Product Story Notes product summaries and rows.
- Public product detail galleries now return role-aware image groups and hide explicitly blocked/consent-needed images.
- Custom request intake is now public and has an Operations admin review queue.
- Social caption templates are now admin-editable.
- Social UTM campaign rollups now exist in the Social Posting Queue admin panel.

## Still open

- Approved testimonial/local trust block workflow is still not complete.
- Custom requests are captured and reviewable, but they do not yet convert directly into quotes, jobs, or product drafts.
- Search Console reviewed title/meta/internal-link actions still remain manual/review-first and do not auto-apply to public pages.
- Social UTM rollups currently summarize queued/posted social records; they do not yet join live visitor/session conversion analytics.
- Payment application, HST/GST review, month-end close controls, and accountant export packaging remain the most important unfinished accounting workflows.

## Watch after deployment

- Confirm old products with no image-role annotations still show usable public images, while blocked/consent-needed images are hidden.
- Confirm Product Story Notes cannot be approved while media consent blockers are present.
- Confirm upload crop/resize output still passes the first-image 1200×1200 gate for square crops.
- Confirm `/custom-request/` submits JSON successfully and Operations > Custom Requests can update statuses.

# Known Gaps and Risks — Devil n Dove

## Build 140 update — social scheduling and dry-run risks

- Dry run previews do not guarantee that a platform will accept the final API request; they are a safety preview before live publishing.
- Future-scheduled posts are blocked from API publishing early, but the queue is not yet a background scheduler. Someone still needs to run/trigger publishing after the scheduled time.
- Duplicate/repost warnings are based on a practical signature of caption, images, platforms, and link. Review before clearing because similar posts may still be intentional.
- Media warnings are URL-level checks only. Full platform media validation for aspect ratio, duration, file size, and rights still needs deeper platform-specific work.
- TikTok and YouTube remain manual/review-first until app approvals, OAuth upload handling, and media rules are fully configured.


## Build 139 update — social API publishing risks

- Social posting is now review-first plus API-capable, but credentials must be stored only in Cloudflare environment variables.
- Facebook, Instagram, X, and Pinterest can attempt publishing only when their required credentials are present.
- TikTok and YouTube remain manual/copy-ready in this pass because they require more involved upload flows and platform approval.
- The first live social tests should be done one platform at a time with harmless test captions and images.
- API failures are expected during setup and should be reviewed in Social Posting Queue attempts and Runtime Incidents instead of treated as storefront failures.

# Known Gaps and Risks

## Build 137 known gaps and risk updates

- Search Console SEO actions are recommendations only. Do not apply generated titles, meta descriptions, H1 wording, or internal links without checking the actual page intent.
- Batch delete/revert removes staged Search Console rows for that import batch. It does not change public pages, product records, or sitemap rows.
- Large Search Console imports can still grow D1 quickly. Test with a small CSV and use filters before importing a full export.
- The SEO action list now needs an export/share workflow and a current-title/current-meta comparison before it becomes a full SEO production queue.
- Product/media/accounting gaps remain: product SEO bulk tooling, media library attach/detach, Amazon bulk approval safeguards, payment application, HST review, period close/lock, and accountant export packaging.

## Build 135 known gaps and risk updates

- Product uploads now have a public URL fallback and diagnostics, but the best long-term setup is still to configure `PRODUCT_MEDIA_PUBLIC_BASE_URL=https://assets.devilndove.com` in Cloudflare so the setting is explicit.
- The Product editor checklist is a guidance layer; it does not replace final admin review before publishing.
- The reusable image picker uses existing `media_assets` rows. Older images pasted directly into product URL fields may not appear in the picker until they are imported into `media_assets`.
- Product Image Health samples the first missing-image and weak-alt rows, so large catalogs should still be repaired in batches.
- Edit-mode uploads now attach to the loaded product, but unassigned uploads from earlier tests may still need manual linking or cleanup.


Current sync: 2026-05-18 — Build 137 Search Console filtering, safe batch revert, and private SEO opportunity action queue.


## Build 134 product editor risk update

- The Product editor now supports true draft creation with only product name and product type required.
- SEO title, SEO description, price, category, featured image, and external listing URL are publish-readiness fields, not draft blockers.
- `/api/admin/create-product` now returns JSON on server failure and records `admin_products/create_product_failed` runtime incidents instead of allowing an HTML 500 page to produce `Unexpected token '<'` in the browser.
- The inline image uploader depends on the R2 media bucket binding and public media base URL. If those bindings are missing, the form still supports pasted image URLs and the API will return a readable JSON error.
- Remaining risk: existing-product edit mode still needs the same inline uploader workflow; use the Product Images panel or pasted URLs until that is added.

## Highest-priority gaps still open
1. The accounting backend is stronger, but it is still not a finished tax-filing system.
2. `database_upgrade_current_pass.sql` still needs to be applied in Cloudflare D1 after deployment and recorded in the migration ledger.
3. Amazon purchase review exists, but only obvious/safe rows should be approved first until more real-world review confidence is built.
4. Amazon CSV loading still needs a proper admin import screen; current staging assumes rows are already loaded into `amazon_purchase_import_staging`.
5. Cost history now exists, but inventory valuation reports still need beginning balance, additions, usage, write-offs, and ending balance logic.
6. Reconciliation exceptions now have queue statuses, but need export, attachment links, and stronger accountant review reporting.
7. Payment application screens still need to connect orders, deposits, payouts, refunds, fees, gift cards, and journals.
8. Journal validation/posting exists for monthly balance checks, but full auto-generation and close controls remain open.
9. HST/sales-tax review screens still need final worksheet/export behaviour before accountant handoff.
10. Accountant export still needs one packaged export with ledgers, statements, taxes, attachments, and unresolved notes.
11. Some catalog/product areas still use JSON as a bridge while D1 becomes the long-term source of truth.
12. Product variants/options are not complete enough for a full ecommerce app.
13. Media management still needs retire/replace/broken-link lifecycle controls.
14. Local SEO pages have been added, but they need real photos, product links, internal links from relevant pages, and performance monitoring.
15. Fuzzy Amazon matching can still be wrong when product titles are generic.

## Current guardrails
- Keep one H1 per exposed HTML page.
- Update Markdown and schema files on every code pass.
- Prefer D1 for authoritative operational data.
- Keep JSON only as fallback, seed, export, or static catalog bridge until migrated.
- Store money in cents in D1, but display dollars in admin forms.
- Treat current owned tools/supplies as at least 1 stock unit unless manually retired.
- Use package math for consumables: for example, 1 package can equal 100 sheets.
- Keep Amazon order details, costs, and review spreadsheets private; do not deploy raw order reports under public `/data/` paths.
- Review Amazon matches before applying costs; do not mass-approve weak or generic title matches.
- Run Release Sanity and D1 count checks after every deployment.

## Recently reduced risks
- Added `/api/admin/amazon-purchase-review` so private Amazon purchase staging rows can be reviewed from the admin instead of spreadsheets only.
- Added the Amazon purchase review queue UI to `/admin/catalog/` with search, status filters, approve/apply, hold, and reject controls.
- Added approved Amazon purchase application that updates linked inventory unit cost, supplier name, ASIN/supplier SKU, Amazon URL, and notes.
- Added `site_item_inventory_cost_history` so Amazon-approved costs and manual cost changes create history rows instead of silently overwriting the latest cost.
- Added inventory cost-history recording during Tools/Supplies catalog sync when a synced unit cost changes.
- Added cost-history recording for manual site-item inventory create/update and bulk cost update workflows.
- Improved the Tools/Supplies inventory sync result panel so inserted, updated, failed, Amazon URL, unit-cost, stock-default, match-status, and cost-history counts are visible after sync.
- Hardened Amazon purchase review schema creation with runtime-safe staging-table migrations for applied inventory, applied cost-history, review user, and applied timestamp fields.
- Hardened Amazon purchase review inventory access with runtime-safe inventory column backfills for older D1 tables.
- Added audit entries for Amazon purchase review decisions so approve/hold/reject actions are traceable.
- Expanded reconciliation exceptions with assign-to-user, accountant review flag, resolve, reopen, and richer status handling.
- Added reconciliation exception queue controls in the Accounting import UI for assign, manual review, accountant review, resolve, reopen, ignore, and notes.
- Added journal-period validation that checks monthly debit/credit balance before posting.
- Added journal posting metadata and posting guardrails so unbalanced monthly journals are blocked before being marked posted.
- Added Accounting report buttons for validating and posting the selected month’s journal entries.
- Added six local-intent SEO landing pages for handmade jewelry, polymer clay earrings, custom gifts, laser engraving projects, vintage finds, and workshop-made gifts in Ontario/Southern Ontario.
- Added `sitemap.xml` so the new public local-intent pages and existing public pages have a clean crawl map.
- Added shared-footer local search links so the new local-intent pages are internally linked from public pages.
- Added CSS for local-intent cards, related-page links, and mobile-friendly local page calls to action.
- Updated active schema files and Markdown files, then ran syntax/H1/meta/link sanity checks for the new build.

## Build 126 runtime warning follow-up

- The Release Sanity warning for recent runtime errors is now actionable from `/admin/operations/` through the new Security / Runtime Incidents panel.
- The warning should not be treated as a deploy blocker by itself; it means unresolved `error` or `critical` incidents were logged in the last 7 days.
- Main risk: if the same scope/code/endpoint group repeats, the underlying API or schema drift still needs a code or D1 fix.
- Resolved or ignored rows are excluded from the warning, so do not mark rows closed until the recurring cause has been reviewed.


## Build 127 runtime incident follow-up

- The `/api/products` runtime incident group was caused by schema drift assumptions in the public products endpoint.
- A key example is `COALESCE(tc.rate_percent, tc.tax_rate, 0)`: D1/SQLite still fails when `tc.rate_percent` does not exist, even if `tc.tax_rate` does.
- Build 127 reduces this risk by inspecting table columns before building SQL and by using a schema-adaptive product-only fallback.
- Remaining risk: if the live `products` table itself is missing or unreadable, `/api/products` will still return a safe empty result and log an incident.
- After deployment, old `/api/products` incident rows should be marked resolved only after fresh requests stop creating new rows.

## Build 128 products API follow-up

- Build 127 still allowed `p.merchandise_origin` to leak into a live `/api/products` query on the deployed D1 schema.
- Build 128 treats `PRAGMA table_info` as helpful but not authoritative; optional columns are now verified with a direct `SELECT column FROM table LIMIT 0` test before being referenced.
- The public product list fallback now avoids all newer optional storefront fields and supplies safe defaults instead.
- `/api/product-detail` was also hardened because product detail used several of the same newer product, tax, and SEO columns.
- Remaining risk: if the live `products` table lacks required basics like `slug`, `product_id`, or `name`, public product results may still be empty or product detail may return a schema-unavailable response.
- Long-term fix: apply/verify the full product schema migration so merchandise origin, sale channel, external listing fields, condition/era/sourcing notes, and current tax fields exist in D1.


## Build 129 reduced risks

- Added a visible D1 Schema Drift Report so missing live D1 columns can be found before public APIs fail.
- Added Public API Health checks for shop/product/catalog endpoints after deployment.
- Release Sanity now includes a product schema drift snapshot and `/api/products` health check.
- Runtime incidents can now be cleaned up only after they are resolved/ignored and old enough to be safe to remove.
- Amazon CSV rows can now be imported into private D1 staging from admin rather than placing private import files in public static folders.
- Amazon review rows now explain match confidence using status, score, ASIN presence, inventory link, and available unit cost.

## Build 129 remaining risks

- The Amazon CSV import is intentionally simple and review-first; it still needs duplicate detection before large imports.
- Amazon staging import does not automatically match new rows to inventory yet unless the CSV already includes inventory keys.
- Public API Health depends on the deployed host being reachable from the Worker runtime; if fetch self is blocked/noisy, use direct browser checks too.
- Schema Drift Report lists missing columns but does not run migrations automatically.
- Runtime incident cleanup permanently deletes old resolved/ignored records, so export important history first if needed.

## Build 130 products API risk update

- The `/api/products` incident count increased again after the prior compatibility patch, which proved the endpoint still had a path that could reference optional product columns or log incidents before a successful lower-tier fallback.
- Build 130 removes candidate optional columns from the verified SQL column set and adds a final `SELECT *` fallback that filters in JavaScript. This is intentionally less fancy but much harder for schema drift to break.
- The only time `/api/products` should now log a new error incident is when every product query tier fails, including `SELECT * FROM products`.
- If the endpoint returns `summary.authority: "d1_select_star_fallback"`, the storefront is protected, but D1 schema cleanup is still recommended.
- Old `/api/products` incidents should remain open until a fresh deploy is verified, then they can be marked resolved.

## Build 131 known gaps and risk updates

- Storefront Schema Repair can add safe missing columns, but it does not replace the need for a reviewed full D1 migration history. Use it as a compatibility repair, then record/confirm the migration ledger.
- `/api/products` should no longer be allowed to sit at `authority: "error"`. If the endpoint falls back to `d1_select_star_fallback`, the public storefront is protected but schema cleanup is still recommended.
- Product rows may still need value backfills after columns are added: `merchandise_origin`, `sale_channel`, `currency`, `requires_shipping`, `status`, and image fields should be reviewed before relying on filters.
- The new local predeploy sanity script catches obvious public data leaks, but private Amazon order/cost files still must not be placed under `/data/` or other public static folders.
- Public API Health now checks more endpoints, but it cannot validate real buyer checkout success; payment/provider tests remain a separate workflow.
- Next risk to reduce: product schema value backfill and product structured-data checks so richer shop filters and SEO can move from fallback-safe to fully intentional.

## Build 132 known gaps and risk updates

- The mobile main menu is now grouped and expandable, but it still needs a real-phone pass after deployment because mobile browser address bars and font scaling can affect drawer height.
- If an old cached `/js/main.js` or `/css/styles.css` remains in the browser, the menu may still look like the older long list. Hard refresh or clear site cache before judging the deployed result.
- The mobile drawer is a code/CSS fix only. No D1 schema change is required, but the Build 132 marker should still be recorded so the release ledger remains complete.
- Admin department shortcut buttons now scroll horizontally on small screens; future work should add a dedicated admin mobile command palette if the admin page count keeps growing.
- The next major risk is still D1/product schema drift and accounting workflow completeness, not the menu itself.

## Build 133 known gaps and risk updates

- Structured Data Health is a diagnostic layer, not a guarantee that Google will show rich results. It helps catch missing/invalid JSON-LD and Product-readiness fields before pages are submitted or crawled.
- Live Sitemap Preview does not overwrite the static `sitemap.xml` yet. It gives a live D1 product URL preview so the next pass can decide whether to regenerate static XML or move to a dynamic sitemap route.
- Storefront Value Backfill is intentionally conservative. It fills blank defaults and creates missing `product_seo` placeholder rows, but it does not invent product descriptions, prices, or images.
- Search Console tables are staging-only. The actual CSV import screen and charts are still pending.
- The mobile menu should remain compact from Build 132, but deployed phones should still be checked after cache clears.

## Build 136 known gaps and risk updates

- Search Console CSV import is manual and staging-only. It does not connect to Google Search Console directly and should be tested with a small export first.
- Imported Search Console rows can accumulate quickly. A delete/revert batch action and date filters should be added before large recurring imports.
- SEO opportunity rows are hints, not automatic edits. Review the actual page intent before changing titles, meta descriptions, H1 wording, or internal links.
- The Search Console staging tables are private D1 tables. Do not place Search Console CSV exports under public `/data/` folders.
- The next highest SEO value is turning imported opportunities into a simple page-level action list with suggested title/meta/internal-link improvements.


## Build 138 update — social posting queue risk posture

- Social posting is now review-first and manual/copy-ready, not blind auto-posting.
- Direct API posting remains a known future gap because Facebook/Instagram/TikTok/X require platform apps, OAuth tokens, scopes, and in some cases app review or paid API access.
- Platform secrets must stay in Cloudflare environment variables, not D1, Markdown, JSON, or public site files.
- Next risk-reduction step: add per-platform connection diagnostics before any live API publish action is enabled.


## Build 141 update — social queue gaps moved forward

Completed: the social queue now has reusable caption templates, a compact content calendar summary, content pillars, calls to action, and UTM-tagged links for review-first crafting/process posts.

Remaining gaps:
- Social caption templates are seeded by code and not yet fully editable from an admin template editor.
- TikTok and YouTube remain manual/review-first until their upload flows, permissions, media rules, and app approvals are configured.
- Social API credentials must stay in Cloudflare environment variables only; do not store tokens in D1, Markdown, JSON, or public files.
- UTM links are generated, but analytics rollups from those UTM campaigns still need a reporting panel.
- Customer/job-media privacy controls still need a dedicated “do not post” guard before job/customer images can be selected for social posts.


## Build 142 update — Competitive roadmap completed and tracked

- Completed `COMPETITIVE.md` as the active competitive strategy for Devil n Dove, covering positioning, homepage/product-page improvements, mobile UX, local SEO, social workflow, marketplace readiness, product media, trust, and accounting/margin direction.
- Added Operations > Competitive Roadmap so the highest-value items from the document can be seeded into D1, assigned a status, and reviewed during Release Sanity.
- Added `competitive_opportunities` and `competitive_opportunity_events` schema support.
- Added `/data/site/competitive-opportunities.json` as a public-safe roadmap seed file; it contains strategy/action metadata only and no private costs, orders, or customer data.
- Next direction: connect competitive opportunities to product readiness, SEO action completion, social analytics, testimonials, custom requests, and marketplace export checks.


## Build 142 competitive roadmap risks

- `COMPETITIVE.md` is now more complete, but it is still a strategy document. Public page copy, product rendering, media requirements, and admin workflows need to be implemented step by step.
- Operations > Competitive Roadmap seeds strategy items into D1, but marking an item `done` should only happen after the related public/admin behavior is verified.
- The public-safe `data/site/competitive-opportunities.json` must remain strategy-only. Do not place competitor scraping exports, private costs, Amazon order rows, customer names, or platform credentials in public data folders.
- Social platform directions remain review-first. Direct posting still depends on platform credentials, scopes, app review, and platform-specific media rules.
- X API cost/rate-limit changes can make API publishing less practical than manual/copy mode; keep manual posting as a fallback.
- Competitive tracking should not distract from accounting completeness: payment application, HST review, close controls, and accountant export remain important business-risk items.


## Build 143 update — social privacy guard risks reduced

- Reduced risk of accidental public posting of customer details, private workshop background information, visible bystanders, or overly personal captions.
- Social API publishing now blocks unless the queue item is privacy-approved or marked as product-only/no-private-media.
- Default privacy rules are seeded in D1 and visible in Operations > Social Media Privacy Guard.
- Remaining risk: this is an admin review workflow, not image-recognition. Someone still needs to inspect the media before approving it.
- Next risk reduction: add customer/job consent records and connect media assets to a “safe for social” flag.

## Build 144 known gaps and risk updates

- Public product pages now show a story section, but most products will initially use fallback text until approved `product_story_public_notes` rows are created.
- The local trust block is public-safe and reusable, but it should be reviewed on real phones to ensure it does not crowd product purchase actions.
- **Post this product** only queues a social draft. It does not bypass caption review, privacy review, scheduling, duplicate warnings, or missing platform credentials.
- Product-to-social posts depend on product list data. If a product has no slug or featured image, the queued post may need manual link/media cleanup before posting.
- The story-note table is schema-ready, but an admin story editor is still needed so we do not rely on SQL/manual inserts.
- Local trust wording should remain natural. Do not repeat Southern Ontario/Tillsonburg/Oxford/Norfolk excessively on every page.
- The next business-risk items remain accounting-heavy: payment application, HST review, month-end close controls, and accountant export packaging.

## Build 146 gaps and risks update

### Reduced risk

- Mobile product capture should no longer fail with `normalizeColorNames is not defined` because the endpoint now includes the missing normalizer.
- Desktop Product editor draft capture is still light enough for unfinished products and can preserve work with autosave.
- Product story copy now has an admin workflow instead of requiring raw SQL edits.

### Remaining risk

- Story notes still need human review. The system cannot guarantee that private/customer/workshop-sensitive details are safe without us checking.
- Product story snippets are not yet shown on shop cards/search result cards.
- Drag/drop image ordering and duplicate-image warnings are still outstanding.
- Social API posting must remain review-first until platform credentials, privacy review, and media rules are tested one platform at a time.
- Accounting is still not year-end complete until payment application, HST review, close controls, reconciliation packaging, and accountant exports are finished.

### Watch after deployment

- `/api/admin/mobile-create-product` should return JSON and should not log `mobile_create_product_failed` for normal draft saves.
- `/api/admin/product-story-notes` should load in the Product editor for admin users.
- Product drafts should not require SEO title, SEO description, external links, or images.
- Product story notes should stay draft/review until privacy status is safe.



## Build 147 gaps and risks update

### Reduced risk

- Approved product stories can now appear earlier in the customer journey on shop cards.
- Product image duplication is easier to catch before publishing.
- Finished-product photo coverage is easier to review because the Product editor now shows a seven-role image checklist.
- Product-to-social posting is easier from the editor, while still remaining review-first.
- Media consent now has a private D1 registry instead of being a loose note outside the system.

### Remaining risk

- The image role checklist is advisory only. Role labels are not yet stored per image.
- Image ordering is still field-order based; drag/drop ordering is not finished.
- Consent records are not yet automatically linked to specific Social Posting Queue rows or Product Story Notes.
- Story snippets only show if a product has an approved/privacy-safe note; most existing products may still rely on fallback copy.
- Social API publishing must stay blocked/review-first until credentials, privacy status, media consent, and platform rules are verified.
- Accounting remains incomplete until payment application, HST review, close controls, reconciliation packaging, and accountant exports are finished.

### Watch after deployment

- `/api/products` should return story fields without failing if `product_story_public_notes` is empty or absent.
- `/admin/products/` should show the image role checklist and social shortcut panel.
- `/admin/operations/` should show Media Consent Records.
- The public shop cards should remain mobile-friendly after story snippets appear.


## Build 148 Known Gaps Update

Closed or improved:

- Product image ordering is now easier through drag/drop plus up/down fallback buttons.
- Image roles are now stored per image through the Product Media Workflow.
- Public-use status and consent record references can now be stored per product image.
- Social Privacy Guard now checks Media Consent Records before approving customer/private social media.
- Internal site search can use approved product story snippets.

Still open:

- Product publish readiness does not yet automatically fail a product for missing image roles.
- Product Story Notes approval does not yet automatically require a linked media consent check.
- Media consent records are not yet surfaced directly inside each Product Story row.
- The public storefront does not yet expose role-aware galleries, such as “detail,” “scale,” or “process” tabs.
- Accounting workflows are still the largest unfinished business area: payment application, HST/GST review, close controls, and accountant exports.

## Build 155 gap closure and remaining risks

Closed or reduced:

- Reviewed payment-request drafts can now become private approved payment review links.
- Reviewed order drafts can now become real `orders`/`order_items` records.
- Quote revisions can now create versioned replacement links and supersede older active links.
- Marketplace copy no longer has to be drafted manually from scratch.
- Proof filtering is available in the shop/product API layer, not only gallery JavaScript.
- Post-fulfillment review/photo/consent prompts are now tracked as internal draft records.

Still intentionally guarded:

- Payment links are manual review links only; no card charge happens inside the new page.
- Converted custom request orders remain draft/pending until the final payment and fulfillment workflow is approved.
- Marketplace exports are copy/card packs, not direct marketplace API publishing.
- Consent prompts are draft/copy-only until a proper consent acceptance page is built.

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
