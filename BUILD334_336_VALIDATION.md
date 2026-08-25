# Builds 334–336 Validation — Accounting Statement/Reconciliation Support Read Batch

## Status — BROWSER PROVEN / LOCAL REGRESSION REQUIRED

```text
Build 334  Statement imports GET schema/seeding retirement + read extraction
Build 335  Reconciliation exceptions GET schema-mutation retirement + read extraction
Build 336  Vendor statements GET attachment-helper mutation retirement + read extraction
```

Business & Administration remains `domain-bridge` / inactive. No Accounting mutation ownership moves.

## Development browser proof — PASSED 2026-08-24

Observed on `/admin/accounting/`:

```text
imports_legacy_status                                  200
imports_legacy_build                                   334
imports_legacy_owner                                   accounting
imports_legacy_schema_ready                            true
imports_legacy_schema_mutation                         false
imports_contract_status                                200
imports_contract_build                                 334
imports_contract_owner                                 accounting
imports_contract_schema_ready                          true
imports_contract_schema_mutation                       false
accounting-statement-imports-read_service_build        334
accounting-statement-imports-read_service_schema_ready true
accounting-statement-imports-read_service_schema_mutation false

exceptions_legacy_status                               200
exceptions_legacy_build                                335
exceptions_legacy_owner                                accounting
exceptions_legacy_schema_ready                         true
exceptions_legacy_schema_mutation                      false
exceptions_contract_status                             200
exceptions_contract_build                              335
exceptions_contract_owner                              accounting
exceptions_contract_schema_ready                       true
exceptions_contract_schema_mutation                    false
accounting-reconciliation-exceptions-read_service_build 335
accounting-reconciliation-exceptions-read_service_schema_ready true
accounting-reconciliation-exceptions-read_service_schema_mutation false

vendor_statements_legacy_status                        200
vendor_statements_legacy_build                         336
vendor_statements_legacy_owner                         accounting
vendor_statements_legacy_schema_ready                   true
vendor_statements_legacy_schema_mutation                false
vendor_statements_contract_status                      200
vendor_statements_contract_build                       336
vendor_statements_contract_owner                       accounting
vendor_statements_contract_schema_ready                true
vendor_statements_contract_schema_mutation             false
accounting-vendor-statements-read_service_build        336
accounting-vendor-statements-read_service_schema_ready true
accounting-vendor-statements-read_service_schema_mutation false

application_module                                     business-administration
application_mode                                       domain-bridge
active_application_module                              null
contracts_ok                                           true
services_ok                                            true
```

All three browser boundaries passed with no Development schema deficit. Business & Administration remains inactive and no mutation ownership moved.

## Combined local checkpoint still required

```bash
git pull --ff-only origin dev
python scripts/build331_333_accounting_read_batch_test.py
python scripts/build334_336_accounting_read_batch_test.py
git status --short
```

Expected:

```text
BUILDS 331-333 ACCOUNTING READ BATCH: PASS
No Cloudflare resource was contacted.
BUILDS 334-336 ACCOUNTING READ BATCH: PASS
No Cloudflare resource was contacted.
```

`git status --short` should print nothing. Once the local output is captured, Builds 334–336 become fully VALIDATED. Browser proof used reads only; no CSV import, reconciliation-exception update, or attachment write was performed.
