# Amazon Inventory Matching Notes

Generated from `orders_from_20220601_to_20260416_20260416_0932(2).csv` against the current Toolshed and Supplies inventory JSON files.

## Results

- Inventory rows checked: 897
- Safe matches patched into JSON: 572
- Needs human review: 198
- Weak candidates: 127
- Toolshed safe / review / weak: 205 / 108 / 86
- Supplies safe / review / weak: 367 / 90 / 41

## Files generated outside the public build

The full match report CSV, purchase import candidate CSV, and JSON match report were generated for review, but they are not included under the public `/data/` tree in this deployable package. The deployable package keeps only the admin-side match helper module under `functions/api/admin/_amazonInventoryMatches.js`.

## Matching approach

The search was rerun by cleaned title matching, not exact filenames. It compares inventory names, brand guesses, image-title stems, strict/loose group keys, and category terms against Amazon order title, brand, manufacturer, and ASIN. It uses character n-gram matching, token matching, weighted keyword overlap, and title containment checks. Only conservative `safe_match` rows were written into the live JSON fields (`amazon_url`, `amazon_asin`, `purchase_date`, `purchase_price`, and notes where available). Review and weak candidates are included in the reports but not patched into the JSON.


## Public-safe deployment note

The public-safe deployment package keeps only non-sensitive Amazon lookup fields in Tools/Supplies JSON, such as `amazon_url` and `amazon_asin`. Purchase prices, purchase dates, order IDs, tax/shipping totals, seller details, and full import reports must stay outside the public `/data/` tree and should be loaded only into private D1 staging/accounting tables after review.


## Admin-side sync update — 2026-05-14

The deployable build now keeps the full Amazon match/cost data in `functions/api/admin/_amazonInventoryMatches.js`, which is imported only by admin API functions. This avoids placing the full Amazon reports inside public `/data/` while still allowing admin sync to populate D1 inventory.

New behavior:
- `/api/admin/catalog-sync` enriches `catalog_items.source_record_json` with the best Amazon candidate details.
- `/api/admin/site-item-inventory` now supports `{ "action": "sync_catalog", "source_types": ["tool", "supply"] }`.
- Inventory sync fills `site_item_inventory` with Amazon URL, ASIN, supplier/seller, unit cost, stock unit label, usage unit label, usage-units-per-stock, and review notes.
- `needs_review` and `weak_candidate` matches are still flagged in notes/status so they can be reviewed before relying on their costing.
