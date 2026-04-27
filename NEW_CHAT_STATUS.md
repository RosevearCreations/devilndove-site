# Current pass status — 2026-04-25

This repo now includes:
- accounting vendor directory support
- recurring expense rule support
- monthly reconciliation review storage for sales tax, processor fees, and shipping
- a year-end close bundle endpoint/UI foundation
- richer expense linkage fields (`vendor_id`, `recurring_expense_rule_id`, `source_mode`, `reference_number`)
- stronger GIFI review tracking (`gifi_reviewed_by_user_id`, `gifi_reviewed_at`)

Safest next pass from here:
1. finish reviewed GIFI mapping coverage for every active account
2. add receipt/bill/statement attachment handling
3. deepen reconciliation logic and filing support
4. expand the year-end close bundle into a more accountant-handoff-ready package

# Current pass update — 2026-04-24

- Added live DB sanity checking at `/api/admin/db-sanity`.
- Added year-level GIFI staging at `/api/admin/accounting-gifi-summary` and surfaced it on the accounting admin page.
- General ledger rows now support grouping, normal balance, sort order, GIFI code/label/section, and deductibility percent.
- Schema files were aligned with the runtime accounting journal table shape.

# New Chat Status


## Current pass update — 2026-04-24
- Added a real phone-first basic draft wizard to `/admin/mobile-product/` so quick entries can be saved with just name, short description, price, quantity, and 1 to 5 pictures.
- Added a same-day draft review table on the phone capture screen so today’s entries can be reopened individually or updated in bulk before the desktop cleanup pass.
- Added mobile-capture metadata on `products` (`capture_entry_mode`, capture actor ids, start/save timestamps) so today filtering and phone workflow history are less dependent on loose `updated_at` guesses.
- Kept SEO/local-search hygiene in the pass by preserving one clear public H1 per page, keeping prominent title/main-heading wording aligned, and tightening docs/schema sync around the new phone/accounting workflow.


## Current pass update

- Repaired the phone product-capture save route so it resolves the shared D1 binding through `DB` or `DD_DB` instead of assuming one binding name.
- The mobile save endpoint now returns structured JSON failures and records a runtime incident when the save path breaks unexpectedly.
- The phone product-capture page now parses failed responses safely, so HTML 500 pages no longer surface as `Unexpected token '<'` in the admin UI.
- Rechecked outward-facing HTML pages and the one-H1 rule remains intact across the current public page set.

## Current handoff summary

This handoff is updated for the latest repo pass. The build focus remained admin resilience, mobile follow-up visibility, schema/doc sync, and reducing duplicate truth risks where the repo could safely move forward in one pass.

## Most important current truths
- `data/movies/movie_catalog_enriched.v2.json` remains the active movie base truth.
- `functions/api/admin/catalog-sync.js` now points movie sync work at the v2 JSON source instead of the older enriched file.
- `movie_catalog` in D1 is still a manual/admin overlay layer, not the primary movie truth.
- The public movie tab and admin movie list/editor must continue to load from the JSON-first movie source, then merge any D1 overlay rows on top.
- The admin movie editor must continue to show fuller JSON-backed details, not just image and UPC.
- `database_schema.sql`, `database_store_schema.sql`, and `database_upgrade_current_pass.sql` were brought forward so the schema references better match the current code paths.
- Public exposed pages were checked again and still keep the one-H1-per-page rule intact.

## What just happened
- Earlier movie admin saves could fail on older databases with: `D1_ERROR: table movie_catalog has no column named imdb_id`.
- This pass reduced that drift by aligning the repo schema references and upgrade SQL with the richer movie fields the admin editor expects.
- Catalog-sync movie imports were moved to the same v2 JSON source already preferred by the public/admin movie flows.
- The movies page received another small SEO wording pass around DVD/Blu-ray collection terms.

## Current requested direction
1. Keep movies JSON-first using `movie_catalog_enriched.v2.json`.
2. Keep admin movie editing stable and visually complete.
3. Keep D1 movie writes backward-compatible with older table shapes.
4. Continue moving Known Gaps forward only where it is honest and safe to do so.
5. Keep all Markdown and schema-reference files in sync each pass.

## Movie fields the user expects to see/edit
At minimum, the admin movie workflow should expose and allow edits for:
- UPC
- title
- original title
- summary
- release year
- media format
- genre
- director names
- actor names
- studio name
- runtime minutes
- trailer URL
- front image URL
- back image URL
- status
- featured rank
- IMDb id
- alternate identifier
- metadata source
- metadata status
- estimated value low/high cents
- estimated value currency
- rarity notes
- collection notes
- value search URL

## Product intake expectations
- Mobile product entry must support partial drafts before later mandatory fields are enforced.
- The repo should include and maintain a detailed finished-products CSV import template for bulk additions.

## Known honest remaining gaps
- Trusted movie enrichment still depends on the external/local enrichment pipeline and cannot be truthfully marked fully complete inside the site repo alone.
- Broader permission granularity and deeper security segmentation remain future security-pass work, not something already solved.
- Some legacy admin/read paths may still need more API-first authority cleanup.

## Recommended next actions in a new chat
- Verify `functions/api/admin/movies.js` in a live environment against an older D1 database and confirm the auto-add column path covers every missing movie field.
- Continue the Known Gaps list from the remaining repo-safe items.
- Keep docs aligned with the JSON-first movie truth and overlay-only D1 strategy.
- Continue reducing duplicate truth paths between JSON, D1, and admin screens where the repo can do so honestly.


## Current pass addendum
- Marked the previous admin preview, products fallback, movie save, and accordion issues as completed/fixed in the documentation.
- Departmentalized Admin into standalone interfaces: Members, Catalog, Orders, Accounting, Analytics, Operations, and Movies, reducing the size and risk of the main dashboard file.
- Added real starter routes/UI for tier policy, general ledger accounts, expenses, write-offs, product unit costs, and monthly accounting CSV export.
- Added accounting templates (CSV + XLSX) so GL and month-end bookkeeping can be seeded faster.
- Continued mobile direction by making the lighter departmental pages easier to use on smaller screens than the former all-in-one Admin page.
- Continued JSON-to-DB convergence by moving tier policy and accounting records into D1-backed tables instead of temporary page-only assumptions.


## Current pass addendum
- Fixed the Members department so Access Tiers render as a visible standalone interface instead of only a hidden modal dependency.
- Rewired Tier Policy admin/member JSON contracts so the admin editor and member account views use the same DB-backed field names.
- Strengthened the Accounting department with visible starter forms plus month-end, quarter-end, and year-end CSV export presets.
- Added a new phone-first Admin Dashboard at `/admin/mobile/` with Today, Quick Add, receiving, and export-oriented shortcuts.
- Continued moving the admin shell toward dashboard-style department buttons instead of long scroll-heavy interfaces.


## Current pass status
- Departmental admin pages remain the active direction and the lighter launcher dashboard is still the preferred shell over a single long admin page.
- Accounting now has clearer quick-action launch points and export preset entry points, especially for phone use.
- Mobile-first work should continue by moving more common daily actions onto the phone dashboard before broader stress testing.


## Current pass addendum
- Replaced the long phone Admin link list with a grouped tree-style mobile menu so the phone workflow uses collapsible sections instead of one uninterrupted list.
- Continued mobile-first workflow tuning by surfacing Today, quick expense, quick write-off, product cost, and export actions closer to the top of the phone dashboard.
- Continued docs/current-build synchronization for the present mobile-navigation and admin-usability pass.


## Current pass addendum
- Customer-facing home/shop flow was made friendlier and clearer on phone and desktop with stronger exploration sections and clearer action cards.
- Accounting moved forward with monthly overhead allocations and a rough net-after-overhead view in the accounting report so operating costs can start flowing toward fuller P&L reporting.
- Mobile admin moved forward again with a direct overhead-allocation shortcut from the phone dashboard.
- Schema and template files were updated for the new overhead allocation layer.


## Current pass update
- Fixed the missing phone-draft continuation gap by adding a draft picker to the mobile product capture screen and update-in-place draft saves.
- Added an estimated item-costing accounting view so rough full unit cost can include direct costs, linked resources, and allocated overhead.
- Mobile admin quick links now expose item-costing review directly from the phone dashboard.

## Current pass update
- Fixed a real accounting-schema mismatch in the reporting layer: the rough P&L now reads the live `amount` / `tax_amount` accounting columns instead of non-existent cents columns.
- Fixed the estimated item-costing layer so it now joins product costs by `product_number` and uses real-dollar `cost_per_unit`, then blends that with linked-resource cost and allocated overhead.
- Mobile draft continuation is better because saved SEO rows reload with the draft and updated drafts stay open in-place after save.
- The phone dashboard now has a live month snapshot for rough revenue, overhead, costing warnings, and visible draft-product status.
- Public SEO copy was tuned again around Southern Ontario / Canada language and About/Contact now carry a stronger LocalBusiness-style structured-data graph.

## Honest remaining open items
- overhead allocation is still rough revenue-share logic, not true final per-item absorption accounting
- deeper accounting / P&L / double-entry still remains future work
- remaining mixed JSON/D1 cleanup and broader real-device stress testing still remain open

## 2026-04-10 deploy hotfix

- Fixed a Cloudflare Pages build blocker in the accounting CSV export helpers by replacing the regex-based CSV quoting check with a simpler string-contains check.
- This hotfix does not change the database shape. Schema files remain current for this pass because no SQL migration was required.

## Latest pass update
- Public gallery/creations pages now rely on `/api/creations` instead of keeping another direct JSON-read fallback in the page code.
- The public tools page now uses `/api/tools` as its page authority rather than reading `/data/toolshed/toolshed_items_master.json` directly.
- `/admin/mobile/` now shows open accounting-record count plus paid, outstanding, and tax-liability snapshot values for quicker phone-side review.
- `functions/api/admin/accounting-summary.js` now shares the same accounting schema helper as the rest of the accounting layer, which reduces future drift.
- Schema/upgrade SQL now includes extra `catalog_items` indexes to support centralized public catalog reads.

## Still open after this pass
- movies remain intentionally JSON-first with D1 overlay logic rather than full D1 authority
- social feed content still reads from JSON
- real phone/desktop stress testing is still needed
- deeper accounting remains rough and is not yet final double-entry

## Latest pass update
- `/api/social-feed` now fronts the public social hub so that page no longer reads `data/site/social-feed.json` directly in the browser.
- Shop, movies, socials, and the phone dashboard now keep last-good snapshot fallback data in the browser for safer public/admin continuity.
- `/api/admin/runtime-incidents` now exposes recent fallback/error records for admin review.
- `dashboard-summary` now tracks recent runtime-incident counts for quicker phone/admin health checks.

## Latest handoff note

This pass focused on admin order resiliency rather than new storefront features. The strongest shipped changes are: partial-fallback order APIs, cached admin order snapshots in the browser, and expanded phone dashboard health counts for order/payment incidents. The next strongest step is write-path hardening for refunds/disputes/payment-entry flows plus real device testing.


## Latest pass addendum
- Saved local fallback actions now exist for failed admin order writes in the browser, so operators can retry order-status, manual-payment, and refund/dispute actions without retyping.
- Server-side runtime incidents now cover these write paths more explicitly, and the mobile dashboard shows those warnings plus the local pending-action count.
- Composite payment/refund/dispute indexes were added to keep the new follow-up health queries responsive.

## Latest handoff note

This pass focused on moving failed admin write actions beyond one browser. A new `admin_pending_actions` table plus `/api/admin/pending-actions` endpoints now back a shared replay queue for order-status updates, manual payment entries, and refund/dispute actions. The order-detail screen now prefers the shared queue and only keeps browser-local fallback when the shared queue cannot be reached. The phone dashboard also shows shared queue health counts.

## Current pass handoff update
- Fixed the social hub YouTube thumbnail problem by deriving thumbnail fallbacks in `/api/social-feed` and rendering thumbnail cards in `public/js/social-hub.js`.
- Moved shared replay coverage beyond order detail by queueing failed product review actions from `public/js/admin-products.js` into `admin_pending_actions`, with retry/dismiss controls in the products screen.
- Switched `/api/admin/accounting-item-costing` over to the shared `_costing.js` engine, which now exposes basis-aware overhead pools plus rough recognized COGS metrics to the accounting UI.
- Added `idx_admin_pending_actions_scope_status` to all main schema files and the current-pass upgrade SQL.

## Current pass completion update
- Added `accounting_overhead_product_allocations` so monthly overhead can now be assigned directly to specific products by ledger code instead of relying only on pool-wide share logic.
- Added a rough journal foundation with `accounting_journal_entries` and `accounting_journal_lines`, plus `/api/admin/accounting-journal` to sync and review month-level double-entry style bookkeeping.
- Expanded shared replay coverage from order/payment and product review into product edit/update failures through the same `admin_pending_actions` queue, with browser-local storage kept only as the last safety net.
- Strengthened the public movies API merge logic so D1 overlay rows can match JSON rows by UPC, slug, or title/year instead of only one identifier path.
- Updated the phone dashboard and accounting overview to show journal health, explicit overhead overrides, and queued product-edit actions more honestly.

## Current pass note
- Catalog migration sync now accepts both `collections` and legacy `item_kinds` payloads for maintenance/reseed use after the completed full migration.
- Tool, supply, and featured creation syncs continue to upsert into `catalog_items`.
- Movie sync now upserts into `movie_catalog` so hybrid JSON + D1 movie authority can move forward without crashing `catalog_items`.
- The admin catalog sync tooling now remains maintenance-only. The main Catalog department page no longer shows the migration panel after the successful full sync run, but the backend route is still available for maintenance or reseed recovery.

## Current Pass Note — 2026-04-12

- Movie catalog sync was changed from one-row-at-a-time D1 writes to chunked `db.batch(...)` upserts so large movie imports stay under the Worker invocation API-request ceiling.
- `/api/admin/products` was hardened to detect optional table availability and fall back to a simpler products query instead of failing the full admin page with a 500 during staged migration.
- `_headers` now explicitly allows `https://static.cloudflareinsights.com` in `script-src` so the Cloudflare Insights beacon is no longer blocked by the current CSP.
- The initial catalog migration has now been run successfully for Tools, Supplies, Movies, and Featured Creations. The everyday admin catalog sync panel was retired from the main Catalog page, while `/api/admin/catalog-sync` remains available for maintenance or reseed work. Movies still remain hybrid on the public read path while D1 overlay parity continues.


- Current pass: the main Catalog admin page no longer shows the day-to-day migration panel after the full D1 catalog sync completed successfully. The sync route remains available only for maintenance or reseed recovery, and the docs now treat catalog migration as completed rather than an active daily admin step.

## Current pass handoff — 2026-04-12

- Fixed the admin mobile-product numbering bug: the DD sequence now starts at `DD1000` and increments by `1` from the current highest product number.
- Shared the numbering rule across `/api/admin/product-mobile-bootstrap`, `/api/admin/mobile-create-product`, and `/api/admin/create-product`.
- Seeded `site.catalog.product_number_start` in the schema files so the baseline is documented as data, while runtime still falls back safely to `1000` on older databases.
- Added a more graceful mobile bootstrap fallback and tightened the offline fallback page head tags.
- Next sensible check: verify imports/backfills cannot still create low manual product numbers that break the DD sequence.


## Latest handoff note
- Mobile/DD numbering remains on the DD1000 baseline introduced in the prior pass.
- The products admin now also has broader price-control coverage: one item through the normal edit form, or multi-item/category/all-catalog changes through the bulk tools.
- Bulk pricing now has preview-before-save support and no longer forces shipping/tax flag changes when those fields are left alone.
- Public exposed pages were checked again and still keep the one-H1 rule.
- No new required schema tables were introduced in this pass; this was a code, workflow, and documentation sync pass.

## Recommended next actions in a new chat
- Add bulk raw-material / packaging cost adjustments to `site_item_inventory` using the same scope model as the new catalog pricing controls.
- Continue the Known Gaps list from the remaining cost, inventory-authority, and analytics items that are still honest and repo-safe.

## 2026-04-13 pass update
- Repaired the phone capture next-number display so the admin UI now shows `DD1000`-style labels instead of a bare numeric value when the next product number is loaded.
- Restored stronger public social discovery by adding the Socials route back into the shared navigation/footer and hydrating the footer profile list from `/api/social-feed` instead of keeping another hard-coded duplicate set of links.
- Added a catalog-side **Brand, Socials & Creations** helper so reusable brand images can be uploaded as standalone brand assets and the current public social links can be verified from admin.
- Confirmed that public gallery and creations are still fed through the finished-product plus catalog-sync flow; a fully separate creations-only editor remains a next-step item rather than a completed interface.

## Current pass handoff update
- Bulk unit-cost updates were added for site inventory through a new admin API route: `/api/admin/bulk-update-site-inventory`.
- The admin catalog inventory section now includes a preview/apply bulk cost tool with scope by ids, category, source type, or all inventory.
- Quick inventory updates now also allow one-off unit-cost correction from the table prompt.
- Public H1 audit still came back clean for exposed HTML pages.
- No schema expansion was required in this pass; the work reused `site_item_inventory` and `site_inventory_movements`.

## Pass 20 note — mobile capture compatibility repair
- Repaired the phone capture save path so it no longer hard-fails when the live `products` table is missing newer mobile-capture columns such as `capture_reference`.
- The mobile save endpoint now checks the live table columns first and only writes optional mobile fields that actually exist in the current database.
- The mobile drafts endpoint now also tolerates missing optional product columns so older partially-migrated databases can still load saved drafts instead of failing on select/search.
- Follow-up priority: run the current schema upgrade on production so mobile capture can use the full metadata set, but the app now degrades safely until that migration is finished.

## Current Pass Note — 2026-04-14
- Added approval-required field guidance to the mobile product capture flow, with green outlined required fields for approval readiness.
- Approval-required checks now update live for name, category, price, first photo, short description, SEO title, and SEO meta description.
- Product approval is now blocked until storefront readiness passes, and the admin products table disables Approve/Publish until required fields are complete.


## Current Pass Note — 2026-04-15
- Added an admin dropdown manager for product categories, colours, shipping codes, and tax codes so these lists can now be maintained without code edits.
- Phone product bootstrap now reads dropdown option sets from `app_settings`, while tax classes continue to come from the `tax_classes` table.
- Product resource search now includes inventory-only tools and supplies, so materials like wax can appear even before a matching `catalog_items` row exists.
- Product resource links now support `per_unit`, `end_of_lot`, and `story_only` inventory-use modes.
- `end_of_lot` is intended for materials such as wax, resin, clay, or similar lot/container supplies where one inventory lot can cover many finished products.
- Cost rollups, product stock math, and resource shortage checks now account for end-of-lot usage, while automatic reserve/release skips those links so inventory is not consumed one finished product at a time.
- Follow-up priority: surface the same dropdown-managed values in every desktop create/edit product form once the full desktop editor is consolidated into one stable screen.


## Current pass note — 2026-04-16
- Wired the admin dropdown manager so categories, colours, shipping codes, and tax codes are now accessible from the Products and Catalog admin pages after admin auth resolves.
- Added inventory usage-unit support for backend costing: each stock item can now define a usage unit label such as cup, wick, gram, or spool, plus how many usage units exist in one stock unit.
- Product resource links now save inventory mode details consistently across desktop resource linking and phone capture drafts: per product, end of lot, and story only.
- End-of-lot and cost/buildable calculations now use usage-unit math so supplies such as wax, wicks, resin, clay, and PLA can contribute to pricing and planning without forcing per-item depletion when the lot should be consumed manually.
- Remaining next-step focus: surface these same usage-unit fields in every remaining desktop product edit path and keep tightening margin warnings / repricing suggestions from the new cost model.

---

## Current Pass Update — 2026-04-17

This pass added and/or stabilized:
- a modern mobile navigation drawer for phone layouts, replacing the plain stacked menu list with a toggle + panel pattern
- an admin customer engagement dashboard for wishlist demand, back-in-stock requests, checkout recovery leads, gift cards, and reviews/testimonials
- public/member review and testimonial collection flows, plus approved product review display on product pages
- checkout recovery lead capture, gift-card validation during checkout, and notification outbox support for checkout recovery, gift card issue, and review request emails
- recommended-price suggestion actions that can now load pricing into the product editor and apply pricing live

Public-page verification completed this pass:
- public `index.html` routes were rechecked and continue to return one H1 per exposed page

Roadmap emphasis after this pass:
- finish the admin side for processing engagement queues at larger scale
- add storefront wishlist / favorites UI surfacing beyond the member area
- expand testimonial display onto Home, Gallery, and About
- continue pricing write-back and margin-warning refinement inside the main product edit workflow
- keep schema compatibility hardening in place for older live D1 tables before assuming newer columns

## Current pass update: customer engagement workflow depth, gift-card recipient support, and storefront testimonial placement
- Customer engagement admin now supports larger queue handling for back-in-stock requests, abandoned checkout recovery leads, review/testimonial moderation, and recent order review-request email queuing.
- Gift cards now support purchaser and recipient as separate people in the data model and admin issuance flow.
- The main product editor now accepts live price-suggestion write-back with clearer landed-cost and target-margin warnings before save.
- Featured testimonials are now designed to surface beyond product detail pages so storefront trust signals can appear on broader public pages.
- Current schema intent for this pass includes gift-card purchaser/recipient fields and no change to the one-H1 rule on public pages.

## Pass 29 - footer socials, engagement depth, and editor price write-back
- Restored footer social visibility with static links plus live social-feed hydration and local JSON fallback.
- Deepened the admin customer engagement board with filters, bulk gift card actions, and notification retry controls.
- Added direct price-preset write-back buttons inside the main product editor pricing insight card.
- Gift cards continue to support purchaser and recipient as separate people, with stronger admin resend/activate/deactivate workflow.
- Next recommended direction after this pass: storefront gift-card purchase flow, richer testimonial placement, and engagement queue automation polish.


## Current pass note (Pass 30)
- Added storefront gift-card purchase UX from the shop into checkout with purchaser and recipient fields.
- Storefront gift-card purchases now create `pending_activation` gift cards tied to the order so purchaser and recipient can be different people without auto-issuing unpaid cards.
- Expanded featured testimonial placement onto more public templates.
- Added automated engagement processing from the admin board for back-in-stock, recovery, review requests, and notification dispatch.
- Added stronger publish-readiness and photo-completeness scoring before publish, including photo-count warnings and image scoring in admin.


## Current pass update (Pass 31)
- Added webhook-side gift card activation when Stripe or PayPal marks an order paid.
- Tightened publish gating so low publish/image scores now need an explicit override publish path.
- Added deeper customer engagement automation controls with cooldown rules, exclusions, and run logs.
- Added upload-side listing image validation and stronger photo workflow warnings.
- Extended featured testimonial output and synced schema/docs for this pass.

## Pass 32 update - support, quality gate, and engagement depth (2026-04-20)

This pass moved the store further into provider-confirmed fulfillment, listing-quality control, and customer engagement operations.

What changed in code this pass:
- Gift cards now continue through provider-confirmed fulfillment more cleanly, including purchaser and recipient notification timing and admin resend/history visibility.
- Listing-quality control is stricter with stronger publish gating, explicit override notes, image-dimension history support, and stronger media completeness scoring.
- Customer engagement automation now supports cooldown rules, exclusions, suppression, run logging, retry/cancel controls, and richer queue visibility.
- Pricing decision support now goes further into receiving-cost pressure, packaging/shipping pressure, markup targets, and planned increase guidance.
- Footer/social support paths now include the live Buy Me a Coffee link: https://buymeacoffee.com/devilndovel

Recommended next direction after this pass:
- tighten provider-confirmed gift-card delivery and resend auditing further
- deepen listing photo validation and first-image scoring
- expand testimonial placement and merchandised trust blocks
- continue pricing decision support into receiving, shipping, and margin planning

## Pass 33 update
- Deepened gift card delivery history and resend controls with recipient/purchaser audit support.
- Strengthened listing-photo readiness with crop history, first-image scoring, and richer media-quality checks.
- Expanded public trust/testimonial placement and support CTA coverage.
- Pushed pricing toward a fuller operating console with receiving/packaging/shipping assumptions and save-time warnings.

---

## Current Pass Update — Gift Card History, Upload Validation, Trust Blocks, and Save-Time Pricing

This pass moved four areas forward together:

- Gift card delivery audit now reaches clearer order-history views for members and storefront confirmation paths.
- First-image validation is stronger at upload/save time, not just later during review.
- Featured testimonials/trust messaging were expanded into more merchandised public browsing flows.
- Save-time pricing guidance was tightened in the main product editor so receiving-cost pressure, planned increases, and below-target pricing are more visible before save.

Key implementation notes:
- Member order history now surfaces gift-card counts and delivery timing summary where available.
- Member order detail now includes purchased gift cards and delivery audit history for buyer/recipient communication.
- Order confirmation now shows gift-card delivery details when present.
- Product media save now blocks weak first-listing images when orientation, dimensions, alt text, or first-image score are too weak.
- Pricing console assumptions persist locally in-browser and the save path now warns more clearly when current price is below target or under landed cost.
- Public trust/support blocks were broadened so testimonials and support cues are visible in more browsing flows.


## Latest handoff note — 2026-04-22
Completed this pass:
- strengthened image scoring into a merchandising score with lead-image/gallery weighting
- persisted upload-time metrics into `media_assets` and `product_image_annotations`
- improved upload and asset-selection guidance before save/publish
- fixed the media-upload metric-persistence bug that previously dropped width/height/orientation-derived values
- re-synced markdown and schema reference files for the current image-scoring direction

Best next continuation point:
- test old products with older uploads and decide whether to bulk backfill missing merchandising fields or only refresh them as images are touched
- then continue the pricing-history/admin-note tightening and broader storefront trust/SEO passes


## Pass 99 handoff

Implemented now:
- accountant/GIFI review notes and Schedule 141 note capture
- accounting month lock + reopen controls
- locked-period enforcement on core accounting write routes
- stronger storefront trust/policy placement on shop, product, and cart
- contextual-shot visibility in admin product merchandising status
- schema files synced to runtime for `accounting_journal_lines` and new accounting review/lock tables

Carry forward next:
- reviewed GIFI mapping for every active ledger account
- recurring expenses, vendors, sales tax reconciliation, processor fee reconciliation
- shipping-cost reconciliation versus orders
- attachments for bills/statements
- fuller public process-video management and more trust blocks on collection/about pages


### Legacy schema drift still noted
A broader repo-level sanity sweep also found older bootstrap/runtime tables that still appear in legacy setup code but are not yet fully represented in the core schema reference set, including legacy/member/content tables such as `members`, `member_sessions`, `newsletter_subscribers`, `blog_posts`, `blog_comments`, `creations`, `project_updates`, `comments`, `inventory_items`, `inventory_usage`, `store_products`, and several customer-engagement tables. These were noted for a slower follow-up normalization pass rather than being forced into the accounting-focused schema update in this pass.

## Pass note — 2026-04-25 accounting handoff step
- Extended the slow T2/GIFI path with stronger GL review completion support, including reviewed/finalized starter mappings and bulk review/finalize actions for mapped active accounts.
- Added accounting attachments for bills, receipts, statements, and workpapers so files can be tied to vendors, expenses, reconciliation periods, and year-end handoff bundles.
- Deepened reconciliation storage with statement references, difference reasons, detail JSON, and attachment counts for sales tax, processor fees, and shipping reviews.
- Expanded the year-end close bundle so the accountant handoff now includes GL review summary, attachment coverage, reconciliation coverage, and missing-item prompts.

## Current pass: accounting handoff depth
- moved GL review closer to final GIFI state with starter mapping helpers, final-review blockers, and safer reviewed-to-finalized bulk actions
- expanded accounting attachments with status, document date, and reconciliation scope metadata so bills, receipts, statements, and workpapers are easier to tie into month-end and year-end review
- deepened reconciliation storage for statement/book amounts, tolerances, expected versus observed rates, and unresolved item counts
- expanded the year-end close bundle so accountant handoff now summarizes GL blockers, reconciliation coverage, attachment coverage by kind/month, and missing support items

