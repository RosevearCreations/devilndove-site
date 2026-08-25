# Build 321 — Accounting Overhead Product Allocations Read Extraction

## Status — STAGED / VALIDATION REQUIRED

Baseline: `5e16845202a2f2b870f02420703f7bf0c3089a5b`.

## Purpose

Move overhead-to-product allocation GET reads behind an Accounting-owned, schema-aware, non-mutating service while preserving all historical write behavior.

## New authority

```text
functions/api/_lib/accountingOverheadProductAllocationsReadService.js
build            321
contract         accounting-overhead-product-allocations-read
owner            accounting
authority table  accounting_overhead_product_allocations
optional join    products
```

Dedicated contract:

```text
GET /api/admin/contracts/accounting-overhead-product-allocations-read
```

Legacy compatibility GET delegates to the service and preserves `allocations` plus summary totals. The `products` table is presentation enrichment only; if unavailable, the service still reads the Accounting authority and reports join availability instead of mutating schema.

Legacy POST remains unchanged in responsibility: product validation, upsert/delete, audit logging, and write-side schema/index ensure behavior.

Contract catalog and passive adapters advance to Build 321; Core runtime remains 305 and Commerce runtime remains 315.
