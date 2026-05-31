# Build 159 note

Catalog Product Editor image UX was repaired: existing saved images now appear as draggable thumbnail cards in Product pictures, the first card syncs to the featured image, gallery URL slots are de-duplicated from the featured image, and advanced media metadata remains in Product Media Workflow. No schema migration required for this front-end pass.

# Build 156 inventory/proof note

No Amazon matching logic was changed in Build 156. Continue keeping Amazon/order-cost data private in D1/admin tools only. The new custom candle/soap direction may require future supply matching for wax, fragrance oils, wicks, soap base, colourants, molds, packaging, safety labels, and batch/ingredient notes.

# Build 154 note

No Amazon matching logic was changed in this pass. The new quote line item workflow can later use matched tool/supply cost records to prefill material and consumable estimates for custom requests.

# Build 153 note

No Amazon matching schema was changed in Build 153. Custom-request quote previews and reference uploads are separate from Amazon purchase matching. Continue keeping Amazon order/import data private and out of public `/data` files.

# Build 152 Amazon/import privacy note

Build 152 does not change Amazon matching logic. The same rule still applies: Amazon order/cost data stays private in D1 staging/admin workflows and must not be placed in public JSON, public Markdown, marketplace exports, or storefront files. Custom request reply templates, deposit candidates, and invoice candidates should use reviewed product/work pricing only, not raw private Amazon order records.

# Build 151 note

No Amazon matching logic changed in this pass. The accounting/custom-request work still preserves the rule that private purchase/order data remains in D1/admin workflows and is not copied into public `/data/` files. Future quote/job/product draft costing should link to reviewed tool/supply costs only after private review.

# Build 150 Amazon/private-data note

No Amazon matching rules changed in Build 150. The new trust block, Search Console override, and accounting close workflows keep private source data in D1/admin routes. Amazon order/import data should still not be exposed in public trust blocks, public SEO notes, or social captions unless the wording is non-private product context.

# Amazon Matching Notes — Devil n Dove

## Build 139 note

No Amazon matching rules changed in this pass. The focus was social publishing from crafting/job process photos. Amazon purchase/import data should remain private and should not be reused in social captions unless it is useful public product context and does not expose order or cost details.

# Amazon Matching Notes

## Build 137 note

This pass did not change Amazon matching logic. Amazon review/import data remains private. The next Amazon-related priorities are duplicate detection, high-confidence bulk approval with rollback notes, and clearer inventory relinking tools.

## Build 135 inventory/media note

This pass did not change Amazon matching logic. It improves product media and editor readiness so reviewed Amazon-linked supplies/tools can support clearer product listings with better images and draft workflow.


Current sync: 2026-05-18 — Build 137 Search Console filtering, safe batch revert, and private SEO opportunity action queue.

## Current status
Amazon CSV title matching has supplied Amazon URLs and cost candidates for Tools/Supplies. `catalog_items` is the catalog snapshot and `site_item_inventory` is the working inventory table used by admin product-resource screens.

## Data rules
- Keep raw Amazon order CSVs and review spreadsheets private.
- Do not deploy private Amazon purchase reports under public `/data/` paths.
- Store cost as integer cents in D1.
- Display cost as dollars in admin screens.
- Treat current owned Tools/Supplies as at least 1 stock unit unless manually retired.
- Use package math for consumables.

## Example package rule
```text
100 DTF sheets = 1 package on hand
stock_unit_label = package
usage_unit_label = sheet
usage_units_per_stock_unit = 100
```

## Current sync flow
1. Run `/api/admin/catalog-sync` for tools and supplies.
2. Run `/api/admin/site-item-inventory` with `action: sync_catalog`.
3. Use the D1 sanity queries in `SANITY_HEALTH_CHECK.md`.
4. Review cost/unit outliers before using them in product costing.

## Next Amazon-specific steps
- Build admin review screens for `amazon_purchase_import_staging`.
- Add approve/hold/reject decisions.
- Add approved-import cost history rows.
- Add duplicate detection by order ID + ASIN + net total.
- Add accounting posting rules for approved business purchases.

## Build 125 note

Build 125 keeps Amazon order/cost data private, adds admin review/apply controls for Amazon staging rows, records inventory cost history, expands reconciliation and journal guardrails, and adds local-intent SEO pages plus `sitemap.xml`. Keep schema files and active Markdown updated on every pass.

## Build 126 note

No Amazon matching rules changed in this hotfix. Runtime incident review was added so admin/API errors from Amazon review, catalog sync, or inventory apply workflows can be grouped and resolved from Operations if they recur.

## Build 128 note

No Amazon matching logic changed in Build 128. This was a public product API compatibility hotfix. Amazon/private cost data should continue to stay in D1 staging/review tables, not public static JSON paths.

## Build 129 update

Amazon rows can now be pasted into `/admin/catalog/` through the private Amazon CSV staging import panel. Imported rows remain `pending` until reviewed. The review queue now shows a confidence explanation based on match status, match score, ASIN presence, inventory link, and available unit cost.

Guardrail: do not place raw Amazon order exports, cost reports, or review spreadsheets in public `/data/` folders. Use D1 staging and review/apply workflow instead.

## Build 130 inventory/catalog note

No Amazon matching rules changed in Build 130. The key fix is public product API resilience so inventory/accounting improvements do not cause storefront product reads to fail while schema migrations are still catching up.

## Build 131 Amazon workflow note

Amazon order/cost data should continue through private staging and review. Build 131 does not make Amazon reports public; it strengthens predeploy privacy scanning so Amazon order IDs/cost import files are not accidentally shipped under public `/data/`.

## Build 132 note

Build 132 did not change Amazon matching rules or staged purchase approval logic. It keeps the prior Amazon review-first workflow and only updates mobile navigation, mobile layout polish, sanity checks, and documentation.

## Build 133 note

Build 133 does not change Amazon matching rules, but the next pass should add duplicate detection and manual relinking before any bulk approval workflow.


## Build 134 note

This pass fixes the Product editor draft workflow: drafts require only name/type, image upload is available from the editor when R2 media storage is configured, create-product failures return JSON instead of HTML 500 pages, and the create endpoint adapts to live D1 product/media/SEO columns.
## Build 138 note

No Amazon matching logic changed in Build 138. The new Social Posting Queue can use approved product/job image URLs after inventory and product-media records are reviewed. Amazon private cost/order data should still remain private and must not be copied into public captions unless intentionally summarized for customers.


## Build 142 update — Competitive roadmap completed and tracked

- Completed `COMPETITIVE.md` as the active competitive strategy for Devil n Dove, covering positioning, homepage/product-page improvements, mobile UX, local SEO, social workflow, marketplace readiness, product media, trust, and accounting/margin direction.
- Added Operations > Competitive Roadmap so the highest-value items from the document can be seeded into D1, assigned a status, and reviewed during Release Sanity.
- Added `competitive_opportunities` and `competitive_opportunity_events` schema support.
- Added `/data/site/competitive-opportunities.json` as a public-safe roadmap seed file; it contains strategy/action metadata only and no private costs, orders, or customer data.
- Next direction: connect competitive opportunities to product readiness, SEO action completion, social analytics, testimonials, custom requests, and marketplace export checks.

## Build 155 maintenance note

- Updated alongside the latest custom request payment/order/marketplace/proof-filter pass.
- Schema, roadmap, gaps, SEO, and sanity notes now reflect the new Build 155 workflow direction.

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

## Build 158 documentation review

Reviewed during the catalog/media repair pass. No accounting-template or Amazon matching schema change was required for this pass, but the new `IMAGES.md` product-media checklist should be used before marketplace/image-heavy product exports.

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

