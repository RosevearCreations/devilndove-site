# Build 244 Validation

Local/static/synthetic validation for D1 tool/supply authority and fractional inventory use. This does not claim a production D1 migration, live Cloudflare load test or live browser/device test.

## Automated results

- Build 243 resilience regression: **PASS** — request dedupe/backoff/form recovery/HTML boundary/no critical request-time DDL retained.
- Build 244 inventory authority/fractional usage regression: **PASS**.
- Legacy masters represented: **897 rows** — 399 tools + 498 supplies.
- Clean-schema Build 244 migration: **897 D1 catalog rows + 897 operational inventory rows**.
- Legacy usage defaults: **399 reusable tools + 498 log-only supplies** in the synthetic clean-schema test.
- Migration repeat application: **PASS** — no duplicate catalog/inventory rows; one ledger entry.
- Inactive operational identity rerun safety: **PASS** — migration does not silently recreate/reactivate an intentionally inactive inventory identity.
- Reviewed reclassification + migration rerun provenance guard: **PASS** — old pre-review classification is not recreated.
- TEMP/DROP operations in Build 244 migration: **0**.
- Numbered/current-pass migration byte identity: **PASS**.
- Build 244 database case audit: **PASS** — database object identifiers lower-case; display/external identifiers intentionally case-preserving.
- Build 244 public SEO/static audit: **36/36 passed**, 0 warnings, 0 failures.
- Local `/assets/...` audit: **120 references, 0 missing**.
- Predeploy sanity: **109 pages, 0 issues**.
- JavaScript syntax checks for every modified runtime/client file: **PASS**.

## Fractional-use behavior validated by code/contract

- Product-resource quantities are not forced to `1` on desktop/mobile/preflight paths.
- Site Inventory allows fractional on-hand/reserved/incoming/reorder values and fractional `usage_units_per_stock_unit`.
- `consume_usage` interprets entered quantity in the configured usage unit.
- `exact` / `estimated` tracking reduces stock by `usage / usage_units_per_stock_unit`.
- `log_only` / `reusable` records usage evidence while stock change is zero.
- Creative Project material posting records actual usage and stock-unit consumption separately; reversal restores the stock quantity actually posted.

## Classification behavior

- Inventory table and full editor can change tool↔supply.
- Catalog and product-resource classification follows a reviewed correction.
- If the corrected target identity already exists, the target remains canonical and the mistaken source row is retained inactive rather than deleted.
- Duplicate legacy stock counters use a conservative MAX merge, not blind summation of historical default-one rows.

## Required deployment evidence

1. Back up production D1.
2. Confirm Build 243 normalization was applied.
3. Apply **only** `database_build244_inventory_authority_fractional_usage.sql` (or the identical current-pass file, not both).
4. Confirm ledger key `build244_inventory_authority_fractional_usage` and the three Build 244 app settings.
5. Record before/after counts for catalog, inventory and usage profiles.
6. Deploy Build 244 code and hard-refresh to shell v21.
7. Test tool/supply search, classification correction, an exact fractional material, a log-only material, Product Resource fractional use and Creative Project fractional use.
8. Review Cloudflare observability for any remaining Worker/D1 5xx; Build 244 reduces broad sync/search pressure but does not claim external platform limits can never occur.

## Release-readiness checks

- Deployment preflight static check: **READY — 0 blockers, 0 warnings**.
- Final deployment blocker check: **PASS**.
- Dark-theme regression: **PASS**.
- Retained Build 240 Operational Continuity regression: **PASS**.
- Retained Build 241 CAIP private-media regression: **PASS**.
- Retained Build 242 inventory-create regression: **PASS**.
