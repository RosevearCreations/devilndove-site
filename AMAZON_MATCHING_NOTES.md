# Amazon Matching Notes — Tools and Supplies

Current sync: 2026-05-14 — Build 125.

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
