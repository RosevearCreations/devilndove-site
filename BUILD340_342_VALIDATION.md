# Builds 340–342 Validation — Reconciliation / Platform Sanity / Close Workflow Read Batch

## Status — BROWSER PROVEN / LOCAL REGRESSION REQUIRED

```text
Build 340  Accounting reconciliation GET read extraction
Build 341  Platform DB sanity read ownership extraction
Build 342  Accounting close-workflow GET schema-mutation retirement + read extraction
```

Business & Administration remains `domain-bridge` / inactive. No Accounting mutation ownership moves. Build 341 is intentionally Platform-owned because DB sanity spans the complete application schema.

## Development browser proof — PASSED 2026-08-24

```text
reconciliation_legacy_status                         200
reconciliation_legacy_build                          340
reconciliation_legacy_owner                          accounting
reconciliation_legacy_schema_ready                   true
reconciliation_legacy_schema_mutation                false
reconciliation_contract_status                       200
reconciliation_contract_build                        340
reconciliation_contract_owner                        accounting
reconciliation_contract_schema_ready                 true
reconciliation_contract_schema_mutation              false

db_sanity_legacy_status                              200
db_sanity_legacy_build                               341
db_sanity_legacy_owner                               platform
db_sanity_legacy_schema_ready                        false
db_sanity_legacy_schema_mutation                     false
db_sanity_legacy_missing_tables                      []
db_sanity_legacy_missing_columns                     ["user_profiles.profile_id","access_tiers.tier_id","payment_disputes.payment_dispute_id"]
db_sanity_contract_status                            200
db_sanity_contract_build                             341
db_sanity_contract_owner                             platform
db_sanity_contract_schema_ready                      false
db_sanity_contract_schema_mutation                   false
db_sanity_contract_missing_tables                    []
db_sanity_contract_missing_columns                   ["user_profiles.profile_id","access_tiers.tier_id","payment_disputes.payment_dispute_id"]

close_workflow_legacy_status                         200
close_workflow_legacy_build                          342
close_workflow_legacy_owner                          accounting
close_workflow_legacy_schema_ready                   true
close_workflow_legacy_schema_mutation                false
close_workflow_contract_status                       200
close_workflow_contract_build                        342
close_workflow_contract_owner                        accounting
close_workflow_contract_schema_ready                 true
close_workflow_contract_schema_mutation              false

accounting-reconciliation-read_service_build         340
accounting-reconciliation-read_service_schema_ready  true
accounting-reconciliation-read_service_schema_mutation false
platform-db-sanity-read_service_build                341
platform-db-sanity-read_service_schema_ready         false
platform-db-sanity-read_service_schema_mutation      false
accounting-close-workflow-read_service_build         342
accounting-close-workflow-read_service_schema_ready  true
accounting-close-workflow-read_service_schema_mutation false

application_module                                   business-administration
application_mode                                     domain-bridge
active_application_module                            null
contracts_ok                                         true
services_ok                                          true
```

The modular/read boundary passes. Build 341 exposed separate schema-parity evidence:

```text
user_profiles.profile_id
access_tiers.tier_id
payment_disputes.payment_dispute_id
```

Do not repair these in `db-sanity` GET. Fresh-install schema/readiness tooling owns repair.

## Local regression still required

```bash
git pull --ff-only origin dev
python scripts/build340_342_accounting_read_batch_test.py
git status --short
```

Expected:

```text
BUILDS 340-342 ACCOUNTING/PLATFORM READ BATCH: PASS
No Cloudflare resource was contacted.
```

A clean local result plus this browser proof fully validates Builds 340–342.
