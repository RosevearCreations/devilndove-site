# Builds 359–361 Validation — CAIP Runtime

## Status — STAGED / LOCAL + BROWSER VALIDATION REQUIRED

```text
Build 359  CAIP intelligence + media-intake GET-only contracts
Build 360  Creative & Production runtime expands to CAIP
Build 361  /admin/creative-assets/ top-level activation
```

CAIP mutation ownership remains unchanged.

## Local regression

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

## Firefox activation proof

Open `/admin/creative-assets/` after Development deploy and allow both CAIP panels to finish their normal startup reads. Use GET/read checks only.

Expected structural state:

```text
caip_contract_status                    200
caip_contract_build                     359
caip_contract_owner                     caip
caip_contract_schema_mutation           false
caip_contract_mutation_ownership_moved  false
caip_contract_verification_only         true

intake_contract_status                  200
intake_contract_build                   359
intake_contract_owner                   caip
intake_contract_schema_mutation         false
intake_contract_mutation_ownership_moved false
intake_contract_verification_only       true

application_module                      creative-production
application_mode                        active
active_application_module               creative-production
caip_domain                             caip
runtime_entry                           ../modules/creative-production/runtime.mjs?v=360
runtime_build                           360
activation_build                        361
runtime_state                           active
services_ready                          true
required_service_count                  2
caip_read_service_registered            true
caip_intake_service_registered          true
caip_page_proven                        true
caip_read_contract_build                359
caip_intake_contract_build              359
creates_network_transport               false
caip_mutation_ownership                 false
contracts_ok                            true
services_ok                             true
```

Do not upload media, alter governance, run probes, create/approve derivative plans, issue/revoke secure-review links, sync/edit CAIP projects, or request public promotion during validation.
