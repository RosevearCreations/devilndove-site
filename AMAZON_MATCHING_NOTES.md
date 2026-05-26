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
