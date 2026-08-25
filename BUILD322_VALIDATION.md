# Build 322 Validation — Product Costs Read Extraction / Builds 320–322 Consolidated Proof

## Status — STAGED / VALIDATION REQUIRED

Build 322 baseline: `612ff1b875d00d9a0aefd1b954c91c92d4c46d9d`.

Builds 320–322 may be proven together because they are consecutive Accounting read-only extractions and their write paths remain independent.

## Local regressions

```bash
git pull --ff-only origin dev
python scripts/build320_accounting_overhead_allocations_read_extraction_test.py
python scripts/build321_accounting_overhead_product_allocations_read_extraction_test.py
python scripts/build322_accounting_product_costs_read_extraction_test.py
git status --short
```

Expected:

```text
BUILD 320 ACCOUNTING OVERHEAD ALLOCATIONS READ EXTRACTION: PASS
No Cloudflare resource was contacted.
BUILD 321 ACCOUNTING OVERHEAD PRODUCT ALLOCATIONS READ EXTRACTION: PASS
No Cloudflare resource was contacted.
BUILD 322 ACCOUNTING PRODUCT COSTS READ EXTRACTION: PASS
No Cloudflare resource was contacted.
```

`git status --short` should be empty.

## Development browser proof

Use `/admin/orders/` because the existing Accounting backend is already loaded there.

Prove all three legacy GETs and all three dedicated contracts return 200 and report non-mutating Accounting-owned reads:

```text
/api/admin/accounting-overhead-allocations
/api/admin/contracts/accounting-overhead-allocations-read
/api/admin/accounting-overhead-product-allocations
/api/admin/contracts/accounting-overhead-product-allocations-read
/api/admin/product-costs
/api/admin/contracts/accounting-product-costs-read
```

Also prove:

```text
contract catalog build       322
service adapter build        322
Core runtime                 305
Commerce runtime             315
Operations mutation owner    false
contracts_ok                 true
services_ok                  true
```

Zero rows are valid. If any read reports `schema_ready=false`, capture missing tables/columns and route them to the separate schema-parity track; do not restore request-time DDL.

## No mutation validation

Do not create/update/delete overhead allocations, overhead-product allocations, product costs, orders, payments, or other business records during this proof.

Builds 320–322 are not COMPLETE until the consolidated local and browser gates pass.
