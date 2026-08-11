# Build 250 Validation

Build 250 repairs Product Edit image recovery and Product Resource per-use/batch persistence.

## Verified

- Build 250 regression: **14/14 passed**.
- Build 249 kit/component regression: **25/25 passed**.
- Build 248 source-material/Packaging Studio regression: **85/85 passed**.
- Build 244 fractional inventory regression: **PASS**.
- Build 246 product/project/production regression: **PASS**.
- Build 239 public visual/asset/H1 regression: **PASS** (18 routes, 7 item fallbacks).
- `database_full_schema.sql`: executes from a clean SQLite database with **0 foreign-key violations**.
- Build 250 migration is idempotent and `database_upgrade_current_pass.sql` is byte-identical to the standalone migration.
- Changed Product Edit, Product Resources and API JavaScript pass `node --check`.

## Primary fixes

1. Product Edit no longer clears a valid featured/gallery image after resolving it.
2. Stored featured image remains first authority; recoverable gallery image remains fallback.
3. New product-resource links default to **1** use/batch even when inventory defines one stock item as 100+ uses.
4. Save synchronizes the actual visible per-use/batch field immediately before POST.
5. Server reloads saved D1 links after POST and returns persisted values for verification.
6. Historical null/non-positive `quantity_used` values normalize to 1; valid fractional values remain unchanged.
7. Admin script URLs were bumped to v250 to avoid stale-cache behavior after deployment.

## Deployment

Back up D1. Apply `database_build250_product_media_resource_usage_reliability.sql` **or** the byte-identical `database_upgrade_current_pass.sql`, not both. Deploy the complete Build 250 package and hard-refresh Product Edit before testing.
