# Builds 352–354 Validation — Creative Process Runtime

## Status — BROWSER REVALIDATION PASSED AFTER BUILD 358 / CORRECTED LOCAL REGRESSION REQUIRED

```text
Build 352  Creative Process GET-only owned read contract
Build 353  Creative & Production runtime expands to Creative Process
Build 354  /admin/creative-process/ top-level activation
Build 358  corrects the top-level Creative dependency gate
```

Creative Process mutation ownership remains unchanged. Inventory posting/reversal remain Inventory-owned.

## Original local regression — PASSED 2026-08-24

User-run Development checkpoint before the Build 358 harness correction:

```text
BUILDS 352-354 CREATIVE PROCESS RUNTIME: PASS
No Cloudflare resource was contacted.
```

The historical regression was subsequently corrected so it no longer treats Inventory mutation authorities as passive top-level activation services. That corrected script must be rerun before final closure.

## Initial Firefox activation proof — FAILED FOR A REAL DEPENDENCY-GATE DEFECT

The Build 352 read contract itself passed:

```text
contract_status                       200
contract_build                        352
contract_legacy_build                 274
contract_owner                        creative
contract_id                           creative-process-read
contract_schema_mutation              false
contract_mutation_ownership_moved     false
inventory_post_authority              inventory-post
inventory_reverse_authority           inventory-reverse
contracts_ok                          true
services_ok                           true
```

Top-level activation initially failed with:

```text
Creative & Production creative boundary is missing required services: inventory-post, inventory-reverse
```

Root cause: `inventory-post` and `inventory-reverse` are real Inventory-owned HTTP mutation contracts used by the retained Creative Process POST path, but they are not registered Core browser services. Build 353 incorrectly treated them as top-level runtime activation prerequisites.

## Build 358 correction

Build 358 changes the Creative top-level activation service gate to:

```text
creative-process-read
inventory-read
```

and separately declares retained mutation authorities:

```text
inventory-post
inventory-reverse
```

The runtime explicitly reports:

```text
mutationAuthoritiesRequiredAsActivationServices = false
creativeMutationOwnership = false
createsNetworkTransport = false
```

No Inventory write service is invented or registered. No Creative Process POST implementation changes. Build 310 Inventory authority ownership remains intact.

## Firefox revalidation — PASSED 2026-08-24

User browser proof after Build 358 deployment:

```text
application_module                     creative-production
application_mode                       active
active_application_module              creative-production
creative_domain                        creative
runtime_entry                          ../modules/creative-production/runtime.mjs?v=358
runtime_build                          358
activation_build                       357
dependency_gate_fix_build              358
runtime_state                          active
services_ready                         true
required_service_count                 2
required_services                      ["creative-process-read","inventory-read"]
mutation_authority_count               2
mutation_authorities                   ["inventory-post","inventory-reverse"]
mutation_authorities_activation_gate   false
page_proven                            true
creates_network_transport              false
creative_mutation_ownership            false
contracts_ok                           true
services_ok                            true
```

This proves the Creative Process page now activates under `creative-production` with only its actual passive/read activation dependencies, while the two retained Inventory mutation authorities remain separate and do not gate page activation.

## Remaining gate

Rerun the corrected source-only regressions:

```bash
python scripts/build352_354_creative_process_runtime_test.py
python scripts/build355_357_content_studio_runtime_test.py
python scripts/build358_creative_dependency_gate_fix_test.py
```

Do not create/edit projects or trigger POST/inventory actions for browser validation.
