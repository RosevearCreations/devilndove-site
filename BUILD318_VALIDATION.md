# Build 318 Validation — General Ledger Read Extraction

## Status — STAGED / VALIDATION REQUIRED

Baseline: `7ffceabb8a11d7e3f4e4b3dfc4ea923811e28a96`.

Build 318 must prove:

- legacy `/api/admin/general-ledger-accounts` GET returns 200;
- dedicated `/api/admin/contracts/accounting-general-ledger-read` returns 200;
- both identify Accounting-owned read state with no request-time schema mutation;
- account and GIFI summary payloads remain available;
- legacy `starter_mapping_count` remains available;
- General Ledger POST is not invoked for validation and retains its compatibility write path;
- Core runtime remains 305 and Commerce runtime remains 315.

Local regression:

```bash
git pull --ff-only origin dev
python scripts/build318_general_ledger_read_extraction_test.py
```

Expected:

```text
BUILD 318 GENERAL LEDGER READ EXTRACTION: PASS
No Cloudflare resource was contacted.
```
