# Build 320 Validation — Accounting Overhead Allocations Read Extraction

## Status — STAGED / VALIDATION REQUIRED

Baseline: `c5ad0709e0789d8562973e2adeeb569a177ec8b9`.

Build 320 must prove:

- legacy `/api/admin/accounting-overhead-allocations` GET returns 200;
- dedicated `/api/admin/contracts/accounting-overhead-allocations-read` returns 200;
- both identify Build 320 / owner `accounting`;
- both report `request_time_schema_mutation=false`;
- Development reports `schema_ready=true` or explicit missing schema without repair;
- legacy POST remains compatibility write behavior and is not invoked for validation;
- Core runtime remains 305 and Commerce runtime remains 315.

Local regression:

```bash
git pull --ff-only origin dev
python scripts/build320_accounting_overhead_allocations_read_extraction_test.py
```

Expected:

```text
BUILD 320 ACCOUNTING OVERHEAD ALLOCATIONS READ EXTRACTION: PASS
No Cloudflare resource was contacted.
```
