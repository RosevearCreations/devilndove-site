# Builds 337–339 Validation — Accounting Automatic Read Batch

## Status — BROWSER PROVEN / LOCAL REGRESSION REQUIRED

```text
Build 337  Sales-tax filing read extraction
Build 338  Fixed-assets GET schema-mutation retirement + read extraction
Build 339  Evidence-check read ownership/schema-readiness extraction
```

Business & Administration remains `domain-bridge` / inactive. No Accounting mutation ownership moves.

## Development browser proof — PASSED 2026-08-24

Observed on `/admin/accounting/`:

```text
sales_tax_legacy_status                                  200
sales_tax_legacy_build                                   337
sales_tax_legacy_owner                                   accounting
sales_tax_legacy_schema_ready                            true
sales_tax_legacy_schema_mutation                         false
sales_tax_contract_status                                200
sales_tax_contract_build                                 337
sales_tax_contract_owner                                 accounting
sales_tax_contract_schema_ready                          true
sales_tax_contract_schema_mutation                       false
accounting-sales-tax-filing-read_service_build           337
accounting-sales-tax-filing-read_service_schema_ready    true
accounting-sales-tax-filing-read_service_schema_mutation false

fixed_assets_legacy_status                               200
fixed_assets_legacy_build                                338
fixed_assets_legacy_owner                                accounting
fixed_assets_legacy_schema_ready                         false
fixed_assets_legacy_schema_mutation                      false
fixed_assets_legacy_missing_tables                       []
fixed_assets_legacy_missing_columns                      ["accounting_fixed_assets.location_note"]
fixed_assets_contract_status                             200
fixed_assets_contract_build                              338
fixed_assets_contract_owner                              accounting
fixed_assets_contract_schema_ready                       false
fixed_assets_contract_schema_mutation                    false
fixed_assets_contract_missing_tables                     []
fixed_assets_contract_missing_columns                    ["accounting_fixed_assets.location_note"]
accounting-fixed-assets-read_service_build               338
accounting-fixed-assets-read_service_schema_ready        false
accounting-fixed-assets-read_service_schema_mutation     false

evidence_legacy_status                                   200
evidence_legacy_build                                    339
evidence_legacy_owner                                    accounting
evidence_legacy_schema_ready                             false
evidence_legacy_schema_mutation                          false
evidence_legacy_missing_tables                           ["hst_gst_review_records","accountant_export_manifests"]
evidence_legacy_missing_columns                          []
evidence_contract_status                                 200
evidence_contract_build                                  339
evidence_contract_owner                                  accounting
evidence_contract_schema_ready                           false
evidence_contract_schema_mutation                        false
evidence_contract_missing_tables                         ["hst_gst_review_records","accountant_export_manifests"]
evidence_contract_missing_columns                        []
accounting-evidence-check-read_service_build             339
accounting-evidence-check-read_service_schema_ready      false
accounting-evidence-check-read_service_schema_mutation   false

application_module                                       business-administration
application_mode                                         domain-bridge
active_application_module                                null
contracts_ok                                             true
services_ok                                              true
```

The architecture gate passes. `schema_ready=false` for Builds 338 and 339 is separate fresh-install/schema-parity evidence and must not be repaired inside GET handlers.

## Schema-parity findings captured

```text
accounting_fixed_assets.location_note    missing column
hst_gst_review_records                   missing table
accountant_export_manifests              missing table
```

These join the existing Build 324 parity finding `orders.total_amount|total`. Schema migrations/readiness tooling owns repair.

## Local regression still required

```bash
git pull --ff-only origin dev
python scripts/build337_339_accounting_read_batch_test.py
git status --short
```

Expected:

```text
BUILDS 337-339 ACCOUNTING READ BATCH: PASS
No Cloudflare resource was contacted.
```

A clean `git status --short` plus this browser proof fully validates Builds 337–339.
