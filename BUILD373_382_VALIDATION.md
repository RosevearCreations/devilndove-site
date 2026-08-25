# Builds 373–382 Validation — Custom Requests Read Surface

## Status — STAGED / LOCAL + BROWSER VALIDATION REQUIRED

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

## Local regression

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

Expected six PASS results and a clean tree.

## Firefox gate

After Development deploys, open:

```text
/admin/custom-request/
```

Do not create/update any request workflow records, export packs, presets, quotes, payments, orders, or consent/public-proof records during proof.

The Build 373 CSV endpoint is safe to read because it only exports already-prepared packs and performs no mutation.

Expected read/export state:

```text
startup_contract_build             370
startup_schema_ready               true
startup_missing_tables             []
export_readiness_build             374
export_schema_ready                true
export_missing_tables              []
export_optional_schema_ready       true
safe_export_status                 200
safe_export_build                  373
safe_export_schema_ready_header    true
safe_export_schema_mutation        false
page_tools_build                   380
safe_export_link_count             5
unsafe_legacy_export_link_count    0
runtime_build                      371
activation_build                   372
custom_requests_page_proven        true
custom_requests_mutation_ownership false
```

If the optional marketplace preset table is absent, `export_optional_schema_ready=false` is acceptable because Build 373 exports already-prepared pack JSON and does not need to seed presets at download time. Missing required export-pack schema is not acceptable for a successful download and should be reported as readiness/parity evidence rather than repaired during GET.

## Browser proof block

Use the Firefox-safe block supplied with the handoff. It reads:

- Build 370 startup contract;
- Build 374 export-readiness contract;
- Build 373 safe CSV response/headers;
- page-tools dataset/link rewrite state;
- unchanged Commerce 371/372 runtime state.

The mature legacy `?format=marketplace_csv` branch is not called during validation.
