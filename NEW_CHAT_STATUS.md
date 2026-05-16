# New Chat Status — Devil n Dove Build 129

Date: 2026-05-15
Source build: `devilndove-site-main-127-products-api-hotfix.zip`
Current output build: Build 129 public products/product-detail schema verification hotfix.

## Why Build 129 was needed

After Build 127, the live `/api/products` response still returned a safe empty result with this D1 error:

```text
D1_ERROR: no such column: p.merchandise_origin
```

That means the endpoint still trusted a column list that did not match what the live query engine could actually select.

## What changed in Build 129

- `/api/products` now verifies columns with direct `SELECT column FROM table LIMIT 0` checks before building SQL.
- The verified column list is cached briefly so warm requests are not repeatedly expensive.
- The product-only fallback no longer references newer optional fields such as merchandise origin, sale channel, external listing fields, condition summary, era, or sourcing notes.
- Missing optional fields are returned as safe defaults so public pages can still render.
- `/api/product-detail` received the same schema-drift hardening.
- Fixed the malformed dynamic `color_names_json` select logic in `/api/product-detail`.
- Updated active Markdown and current-pass schema ledger notes.

## Deploy order

1. Deploy Build 129.
2. Apply or record `database_upgrade_current_pass.sql`. Build 129 is code-only, but the ledger marker helps us track the hotfix.
3. Open `/api/products` directly and confirm it returns `ok: true` without `authority: "error"`.
4. Open one product page/detail API and confirm `/api/product-detail?slug=...` works.
5. Open `/admin/operations/`, refresh Runtime Incidents, and confirm `/api/products` does not create fresh incidents.
6. Mark old Build 127 `/api/products` incidents resolved only after fresh requests stop creating them.

## Useful D1 check

```sql
SELECT
  severity,
  incident_scope,
  incident_code,
  endpoint_path,
  COUNT(*) AS total,
  MAX(created_at) AS last_seen
FROM runtime_incidents
WHERE endpoint_path IN ('/api/products','/api/product-detail')
GROUP BY severity, incident_scope, incident_code, endpoint_path
ORDER BY datetime(last_seen) DESC;
```

## Current caution

This hotfix keeps public pages alive on an older D1 schema. The better long-term fix is still to apply/verify the full product schema migration so the newer fields actually exist in D1.


## Build 129 handoff — 2026-05-15

Latest build package: `devilndove-site-main-129-schema-drift-api-health-amazon-import.zip`.

What changed:
- Operations now has D1 Schema Drift Report, Public API Health, Runtime Incidents cleanup, Migration Ledger, and Release Sanity panels.
- Catalog now has Amazon CSV staging import before the Amazon purchase review/apply queue.
- Release Sanity now checks product schema drift and `/api/products` health in addition to H1/title/meta, inventory, accounting, runtime incidents, and migration status.
- Amazon import rows remain private in D1 staging; do not publish raw Amazon order CSV/report files under `/data/`.

Deploy order:
1. Deploy the Build 129 ZIP.
2. Apply/record `database_upgrade_current_pass.sql` in Cloudflare D1.
3. Open `/admin/operations/`, run D1 Schema Drift Report, Public API Health, Runtime Incidents, and Release Sanity.
4. Open `/admin/catalog/`, test Amazon CSV import with a tiny sample first, then refresh the Amazon review queue.
5. Only approve obvious safe Amazon matches until duplicate detection/manual relinking are added.
