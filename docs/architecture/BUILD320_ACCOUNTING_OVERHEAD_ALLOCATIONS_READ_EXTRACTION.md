# Build 320 — Accounting Overhead Allocations Read Extraction

## Status — STAGED / VALIDATION REQUIRED

Baseline: `c5ad0709e0789d8562973e2adeeb569a177ec8b9`.

## Purpose

Move monthly overhead-allocation GET reads behind an Accounting-owned, schema-aware, non-mutating service while preserving the existing write path.

## New authority

```text
functions/api/_lib/accountingOverheadAllocationsReadService.js
build            320
contract         accounting-overhead-allocations-read
owner            accounting
authority table  accounting_overhead_allocations
```

Dedicated contract:

```text
GET /api/admin/contracts/accounting-overhead-allocations-read
```

Legacy compatibility:

```text
GET /api/admin/accounting-overhead-allocations
  -> delegates to Accounting read service

POST /api/admin/accounting-overhead-allocations
  -> unchanged compatibility write authority
```

GET no longer calls `ensureTable()`. POST still retains period-open validation, upsert, audit logging, and write-side schema ensure behavior.

Contract catalog and passive adapters advance to Build 320; Core runtime remains 305 and Commerce runtime remains 315.

No SQL migration, Cloudflare config, R2, Production, Orders/payment, Inventory, Creative, or Operations-loader change occurs.
