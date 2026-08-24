# Build 316 Validation — Accounting Expenses Read Correction

## Status — STAGED / VALIDATION REQUIRED

Baseline:

```text
2edcc42865fe818baa5091f6db55c94dcb6c5363
Build 315 set completed modular handoff context
```

Build 315 is COMPLETE IN DEVELOPMENT.

Build 316 fixes the legacy Accounting expenses GET 500 and extracts a read-only Accounting-owned contract without moving expense POST/write authority.

## One GIT BASH block

```bash
git pull --ff-only origin dev
python scripts/build316_accounting_expenses_read_correction_test.py
git status --short
```

Expected ending:

```text
BUILD 316 ACCOUNTING EXPENSES READ CORRECTION: PASS
No Cloudflare resource was contacted.
```

`git status --short` should be empty.

## One BROWSER DEVTOOLS CONSOLE block

Open and hard-refresh:

```text
https://devilndove-site-dev.pages.dev/admin/orders/
```

Then run the Build 316 console proof.

The proof must confirm:

- legacy `/api/admin/accounting-expenses` returns HTTP 200;
- dedicated `/api/admin/contracts/accounting-expenses-read` returns HTTP 200;
- both identify Build 316 / `accounting-expenses-read` / owner `accounting`;
- both report `request_time_schema_mutation=false`;
- Development reports `schema_ready=true` or explicitly reports missing schema without mutating it;
- direct Build 316 contract catalog and adapter imports report build 316;
- the passive `accounting-expenses-read` adapter is owner `accounting`, mode `read-only-http`;
- adapter read succeeds;
- Core runtime implementation remains 305;
- Commerce/Operations runtime remains 315;
- Operations mutation ownership remains false;
- contracts/services on the existing runtime remain green.

Expected healthy Development values:

```text
pathname                         /admin/orders/
legacy_status                    200
legacy_ok                        true
legacy_build                     316
legacy_contract                  accounting-expenses-read
legacy_owner                     accounting
legacy_schema_ready              true
legacy_schema_mutation           false
contract_status                  200
contract_ok                      true
contract_build                   316
contract_name                    accounting-expenses-read
contract_owner                   accounting
contract_schema_ready            true
contract_schema_mutation         false
contract_catalog_build           316
service_adapter_build            316
expense_service_owner            accounting
expense_service_mode             read-only-http
service_build                    316
service_schema_ready              true
service_schema_mutation           false
core_runtime_build               305
commerce_runtime_build           315
owns_operations_mutations        false
contracts_ok                     true
services_ok                      true
```

Expense row counts may be zero or greater.

If `schema_ready=false`, do not add DDL back to the GET path. Capture `missing_tables` / `missing_columns` and route that issue to the separate fresh-install schema-parity track.

## No mutation validation

Do not create an expense, change an order, record a payment, issue a gift card, or perform any other mutation for Build 316 validation.

## Completion decision

Do not mark Build 316 complete until:

1. local regression passes;
2. working tree is clean;
3. legacy Accounting expenses GET no longer returns the observed 500;
4. dedicated contract GET succeeds;
5. read paths report no request-time schema mutation;
6. contract/adapter identities are Build 316 and Accounting-owned;
7. Core runtime implementation remains 305;
8. Commerce runtime remains 315;
9. Operations mutation ownership remains false;
10. no SQL/schema/config/R2/Git-branch deletion/real Production change occurs.
