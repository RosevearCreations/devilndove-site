# Amazon Inventory Matching Notes

Generated from `orders_from_20220601_to_20260416_20260416_0932(2).csv` against the current Toolshed and Supplies inventory JSON files.

## Results

- Inventory rows checked: 897
- Safe matches patched into JSON: 572
- Needs human review: 198
- Weak candidates: 127
- Toolshed safe / review / weak: 205 / 108 / 86
- Supplies safe / review / weak: 367 / 90 / 41

## Files added

- `data/imports/amazon_inventory_match_report.csv` — full match report with top candidate plus 2 alternatives.
- `data/imports/amazon_purchase_import_candidates.csv` — narrower DB-import candidate table.
- `data/imports/amazon_inventory_match_report.json` — JSON copy of the report.

## Matching approach

The search was rerun by cleaned title matching, not exact filenames. It compares inventory names, brand guesses, image-title stems, strict/loose group keys, and category terms against Amazon order title, brand, manufacturer, and ASIN. It uses character n-gram matching, token matching, weighted keyword overlap, and title containment checks. Only conservative `safe_match` rows were written into the live JSON fields (`amazon_url`, `amazon_asin`, `purchase_date`, `purchase_price`, and notes where available). Review and weak candidates are included in the reports but not patched into the JSON.


## Public-safe deployment note

The public-safe deployment package keeps only non-sensitive Amazon lookup fields in Tools/Supplies JSON, such as `amazon_url` and `amazon_asin`. Purchase prices, purchase dates, order IDs, tax/shipping totals, seller details, and full import reports must stay outside the public `/data/` tree and should be loaded only into private D1 staging/accounting tables after review.
