# New Chat Status — Devil n Dove Build 127

Date: 2026-05-15
Source build: `devilndove-site-main-126-runtime-incidents-hotfix.zip`
Current output build: Build 127 public products API adaptive schema hotfix.

## What changed in Build 127
- Fixed the repeated `/api/products` runtime incident group: `products_primary_query_failed` followed by `products_fallback_query_failed`.
- Rebuilt `functions/api/products.js` so public products queries inspect D1 table columns first and only reference columns that actually exist.
- Removed unsafe assumptions such as `tc.rate_percent` existing when the live D1 table only has `tax_rate`. In D1/SQLite, referencing a missing column inside `COALESCE()` still fails, so the query must be built conditionally.
- Made the public products fallback product-only and schema-adaptive so older D1 databases can still return products instead of empty results.
- Fixed optional price filter parsing so missing `min_price_cents` / `max_price_cents` are not treated as zero filters.
- Kept safe empty-result handling if the `products` table itself is unavailable.
- Updated active Markdown and current-pass schema ledger notes.

## Deploy order
1. Deploy the Build 127 zip.
2. Apply `database_upgrade_current_pass.sql` or at least record the Build 127 ledger marker if the previous Build 126 SQL is already applied. Build 127 does not require a destructive schema change.
3. Open `/api/products` directly and confirm it returns `ok: true` with `authority: "d1_adaptive_query"` or the product-only fallback, not `authority: "error"`.
4. Open public Gallery/Shop/Creations pages that use `/api/products`.
5. Open `/admin/operations/`, refresh Security / Runtime Incidents, and mark the old repeated `/api/products` incidents resolved after confirming new requests no longer create them.
6. Re-run Release Sanity.

## Important D1 incident query
```sql
SELECT
  severity,
  incident_scope,
  incident_code,
  endpoint_path,
  COUNT(*) AS total,
  MAX(created_at) AS last_seen
FROM runtime_incidents
WHERE endpoint_path = '/api/products'
GROUP BY severity, incident_scope, incident_code, endpoint_path
ORDER BY datetime(last_seen) DESC;
```

## Current caution
If `/api/products` still logs a fresh error after Build 127, copy the new incident `details_json`; it should now contain a narrower adaptive-query error instead of a generic primary/fallback pair.
