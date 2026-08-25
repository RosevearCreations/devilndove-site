# Build 319 Validation — Accounting Summary Read Extraction / Builds 317–319 Consolidated Proof

## Status — STAGED / VALIDATION REQUIRED

Build 319 baseline: `246bee5c9069c15e17b21ac13c3490f0e80fee08`.

This validation pass may prove Builds 317, 318 and 319 together because they are consecutive Accounting read-only extractions and their write paths remain independent.

## Local regressions

Run:

```bash
git pull --ff-only origin dev
python scripts/build317_accounting_writeoffs_read_extraction_test.py
python scripts/build318_general_ledger_read_extraction_test.py
python scripts/build319_accounting_summary_read_extraction_test.py
git status --short
```

Expected:

```text
BUILD 317 ACCOUNTING WRITEOFFS READ EXTRACTION: PASS
No Cloudflare resource was contacted.
BUILD 318 GENERAL LEDGER READ EXTRACTION: PASS
No Cloudflare resource was contacted.
BUILD 319 ACCOUNTING SUMMARY READ EXTRACTION: PASS
No Cloudflare resource was contacted.
```

`git status --short` should be empty.

## Development browser proof

Use `/admin/orders/` because the existing Accounting backend is already loaded there.

Prove all three legacy GETs and all three dedicated contracts return 200 and report non-mutating schema-aware reads:

```text
/accounting-writeoffs                 build 317
/contracts/accounting-writeoffs-read  build 317
/general-ledger-accounts              build 318
/contracts/accounting-general-ledger-read build 318
/accounting-summary                   build 319
/contracts/accounting-summary-read    build 319
```

Also prove:

```text
contract catalog build       319
service adapter build        319
Core runtime                 305
Commerce runtime             315
Operations mutation owner    false
contracts_ok                 true
services_ok                  true
```

Zero rows are valid. If any read reports `schema_ready=false`, capture missing tables/columns and route them to the separate schema-parity track; do not restore request-time DDL.

## No mutation validation

Do not create write-offs, change General Ledger accounts, apply GIFI mappings, create expenses, change orders, record payments, or perform any other write during this validation pass.

## Completion

Builds 317–319 are not COMPLETE until the consolidated local and browser gates pass.
