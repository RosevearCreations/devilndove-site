# Builds 359–361 Validation — CAIP Runtime

## Status — BROWSER PROVEN / LOCAL REGRESSION REQUIRED

```text
Build 359  CAIP intelligence + media-intake GET-only contracts
Build 360  Creative & Production runtime expands to CAIP
Build 361  /admin/creative-assets/ top-level activation
```

CAIP mutation ownership remains unchanged.

## Firefox activation proof — PASSED 2026-08-24

Development browser proof on `/admin/creative-assets/` returned the expected owned-read and top-level runtime state:

```text
caip_contract_status                     200
caip_contract_build                      359
caip_contract_legacy_build               Build 201 + Build 202 + Build 279
caip_contract_owner                      caip
caip_contract_id                         caip-read
caip_contract_schema_mutation            false
caip_contract_mutation_ownership_moved   false
caip_contract_verification_only          true
caip_contract_r2_mutation                false

intake_contract_status                   200
intake_contract_build                    359
intake_contract_legacy_build             Build 279
intake_contract_owner                    caip
intake_contract_id                       caip-media-intake-read
intake_contract_schema_mutation          false
intake_contract_mutation_ownership_moved false
intake_contract_verification_only        true
intake_contract_r2_mutation              false
intake_contract_binary_mutation          false

caip_read_service_registered             true
caip_read_service_build                  359
caip_intake_service_registered           true
caip_intake_service_build                359
application_module                       creative-production
application_mode                         active
active_application_module                creative-production
caip_domain                              caip
runtime_definition                       creative-production
runtime_entry                            ../modules/creative-production/runtime.mjs?v=360
runtime_build                            360
activation_build                         361
runtime_state                            active
current_domain                           caip
last_pathname                            /admin/creative-assets/
services_ready                           true
required_service_count                   2
required_services                        ["caip-read","caip-media-intake-read"]
caip_page_proven                         true
caip_read_contract_build                 359
caip_intake_contract_build               359
creates_network_transport                false
caip_mutation_ownership                  false
contracts_ok                             true
services_ok                              true
```

This proves both Build 359 read contracts are non-mutating and verification-only in the deployed Development environment, both passive browser services are registered, and Build 361 activates only the CAIP page under the Creative & Production umbrella. No upload, governance, probe, derivative, secure-review, duplicate-cleanup, public-promotion, project/evidence/story mutation, R2 write, or binary mutation was invoked for this proof.

## Local regression — STILL REQUIRED

```bash
git -c gc.auto=0 pull --ff-only origin dev
python scripts/build352_354_creative_process_runtime_test.py
python scripts/build355_357_content_studio_runtime_test.py
python scripts/build358_creative_dependency_gate_fix_test.py
python scripts/build359_361_caip_runtime_test.py
git status --short
```

Expected:

```text
BUILDS 352-354 CREATIVE PROCESS RUNTIME: PASS
No Cloudflare resource was contacted.
BUILDS 355-357 CONTENT STUDIO RUNTIME: PASS
No Cloudflare resource was contacted.
BUILD 358 CREATIVE DEPENDENCY GATE FIX: PASS
No Cloudflare resource was contacted.
BUILDS 359-361 CAIP RUNTIME: PASS
No Cloudflare resource was contacted.
```

Do not mark Builds 359–361 fully validated until the local regression is supplied. No further CAIP browser mutation proof is required for this loader/read-boundary checkpoint.
