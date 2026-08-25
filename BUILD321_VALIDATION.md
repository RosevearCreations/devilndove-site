# Build 321 Validation — Accounting Overhead Product Allocations Read Extraction

## Status — VALIDATED

Baseline: `5e16845202a2f2b870f02420703f7bf0c3089a5b`.

Validation captured on 2026-08-24:

- legacy `/api/admin/accounting-overhead-product-allocations` GET returned 200;
- dedicated `/api/admin/contracts/accounting-overhead-product-allocations-read` returned 200;
- both identified Build 321 / owner `accounting`;
- both reported `request_time_schema_mutation=false`;
- optional `products` join reported enabled in Development;
- legacy POST upsert/delete behavior was not invoked during proof;
- Core runtime remained 305 and Commerce runtime remained 315;
- local regression passed without contacting Cloudflare.

Local proof:

```text
BUILD 321 ACCOUNTING OVERHEAD PRODUCT ALLOCATIONS READ EXTRACTION: PASS
No Cloudflare resource was contacted.
```

Browser proof was consolidated with Builds 320 and 322 from `/admin/orders/`.

Note: the captured transcript did not include the requested `git status --short` line. Runtime and regression gates passed; source-control cleanliness remains a housekeeping check rather than a functional failure.
