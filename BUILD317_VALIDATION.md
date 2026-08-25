# Build 317 Validation — Accounting Write-Offs Read Extraction

## Status — STAGED / VALIDATION REQUIRED

Baseline: `343a67de711234f193614f38e83a46122e205197`.

Validate together with Builds 318–319 in the consolidated pass if those builds are staged on top of this one.

Build 317 must prove:

- legacy `/api/admin/accounting-writeoffs` GET returns 200;
- dedicated `/api/admin/contracts/accounting-writeoffs-read` returns 200;
- both identify Build 317 / owner `accounting` / contract `accounting-writeoffs-read`;
- both report `request_time_schema_mutation=false`;
- schema is ready or missing schema is reported without repair;
- passive adapter is owner `accounting`, mode `read-only-http`;
- write-off POST remains compatibility behavior and is not invoked for validation;
- Core runtime remains 305 and Commerce runtime remains 315.

Local regression:

```bash
git pull --ff-only origin dev
python scripts/build317_accounting_writeoffs_read_extraction_test.py
```

Expected:

```text
BUILD 317 ACCOUNTING WRITEOFFS READ EXTRACTION: PASS
No Cloudflare resource was contacted.
```
