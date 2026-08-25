# Build 321 Validation — Accounting Overhead Product Allocations Read Extraction

## Status — STAGED / VALIDATION REQUIRED

Baseline: `5e16845202a2f2b870f02420703f7bf0c3089a5b`.

Build 321 must prove:

- legacy `/api/admin/accounting-overhead-product-allocations` GET returns 200;
- dedicated `/api/admin/contracts/accounting-overhead-product-allocations-read` returns 200;
- both identify Build 321 / owner `accounting`;
- both report `request_time_schema_mutation=false`;
- optional `products` join status is reported without schema mutation;
- legacy POST upsert/delete behavior is preserved and not invoked for validation;
- Core runtime remains 305 and Commerce runtime remains 315.

Local regression:

```bash
git pull --ff-only origin dev
python scripts/build321_accounting_overhead_product_allocations_read_extraction_test.py
```

Expected:

```text
BUILD 321 ACCOUNTING OVERHEAD PRODUCT ALLOCATIONS READ EXTRACTION: PASS
No Cloudflare resource was contacted.
```
