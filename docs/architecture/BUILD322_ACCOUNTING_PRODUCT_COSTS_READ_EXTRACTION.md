# Build 322 — Accounting Product Costs Read Extraction

## Status — STAGED / VALIDATION REQUIRED

Baseline: `612ff1b875d00d9a0aefd1b954c91c92d4c46d9d`.

## Purpose

Move historical product-cost GET reads behind an Accounting-owned, schema-aware, non-mutating service while preserving the existing product-cost write path.

## New authority

```text
functions/api/_lib/accountingProductCostsReadService.js
build            322
contract         accounting-product-costs-read
owner            accounting
authority table  product_costs
```

Dedicated contract:

```text
GET /api/admin/contracts/accounting-product-costs-read
```

Legacy compatibility GET delegates to the service. The historical legacy GET remains unbounded so existing UI behavior is preserved; the dedicated contract may accept an explicit bounded limit.

Legacy POST remains unchanged in responsibility: period-open validation, dynamic write-column compatibility, product-cost insert, audit logging, and write-side schema ensure behavior.

## Three-step Accounting progress

Builds 320–322 remove request-time schema mutation from:

```text
/api/admin/accounting-overhead-allocations
/api/admin/accounting-overhead-product-allocations
/api/admin/product-costs
```

Contract catalog and passive service adapters advance to Build 322. Core runtime remains 305 and Commerce/Operations runtime remains 315.

No SQL/schema migration, Cloudflare config, R2, Production, Orders/payment, Inventory authority, Creative consumer, or Operations-loader change occurs.

## Next direction

After proof, audit the actual Accounting admin page and its loader/dependencies for the first bounded read-only `business-administration` runtime activation. Keep mutation-authority extraction and fresh-install schema parity as separate tracks.
