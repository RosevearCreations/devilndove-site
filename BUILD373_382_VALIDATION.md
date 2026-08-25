# Builds 373–382 Validation — Custom Requests Read Surface

## Status — BROWSER PROVEN / LOCAL REGRESSION REQUIRED

```text
373  non-mutating marketplace CSV export
374  marketplace export readiness read
375  dedicated-page owned-read diagnostics bootstrap
376  safe marketplace export toolbar
377  legacy marketplace CSV-link rewrite
378  startup schema visibility
379  export schema visibility
380  dedicated-page legacy-export guard
381  regression harness
382  rolling next-20 roadmap / 10-build cadence
```

No Custom Requests mutation authority moves in this batch.

## Firefox proof — PASS 2026-08-25

User-run Development proof returned:

```text
startup_status                    200
startup_contract_build            370
startup_schema_ready              true
startup_missing_tables            []
startup_checked_table_count       23
export_readiness_status           200
export_readiness_build            374
export_schema_ready               true
export_missing_tables             []
export_optional_schema_ready      true
export_optional_missing_tables    []
export_pack_count                 0
marketplace_preset_count          0
export_seeds_presets              false
safe_export_status                200
safe_export_contract              operations-custom-requests-marketplace-export
safe_export_build                 373
safe_export_schema_ready          true
safe_export_schema_mutation       false
safe_export_mutation_moved        false
csv_header_ok                     true
safe_export_toolbar_link_count    5
unsafe_legacy_export_link_count   0
page_tools_build                  380
page_owned_read_ready             true
page_export_ready                 true
legacy_links_rewritten            0
application_mode                  active
active_application_module         commerce-operations
runtime_build                     371
activation_build                  372
runtime_state                     active
current_domain                    operations
last_pathname                     /admin/custom-request/
services_ready                    true
required_services                 ["operations-custom-requests-read"]
custom_requests_page_proven       true
creates_network_transport         false
custom_requests_mutation_ownership false
contracts_ok                      true
services_ok                       true
```

`legacy_links_rewritten=0` is correct for this proof because no unsafe legacy export link was present to rewrite. The stronger invariant is `unsafe_legacy_export_link_count=0` with five safe export links present.

The browser side is closed.

## Remaining local regression

```bash
git -c gc.auto=0 pull --ff-only origin dev

python scripts/build362_364_operations_membership_runtime_test.py
python scripts/build365_membership_read_resilience_test.py
python scripts/build366_368_today_tasks_runtime_test.py
python scripts/build369_today_tasks_schema_alignment_test.py
python scripts/build370_372_custom_requests_runtime_test.py
python scripts/build373_382_custom_requests_read_surface_test.py

git status --short
```

Expected six PASS results and a clean tree. Do not mark Builds 373–382 fully validated until the local regression is supplied.
