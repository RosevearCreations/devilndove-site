# Builds 352–354 Validation — Creative Process Runtime

## Status — LOCAL REGRESSION PASSED / INITIAL BROWSER ACTIVATION FAILED / BUILD 358 FIX STAGED

```text
Build 352  Creative Process GET-only owned read contract
Build 353  Creative & Production runtime expands to Creative Process
Build 354  /admin/creative-process/ top-level activation
Build 358  corrects the top-level Creative dependency gate
```

Creative Process mutation ownership remains unchanged. Inventory posting/reversal remain Inventory-owned.

## Local regression — PASSED 2026-08-24

User-run Development checkpoint:

```text
BUILDS 352-354 CREATIVE PROCESS RUNTIME: PASS
No Cloudflare resource was contacted.
```

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

Top-level activation failed with:

```text
Creative & Production creative boundary is missing required services: inventory-post, inventory-reverse
```

Observed runtime state:

```text
application_module                    creative-production
application_mode                      activation-failed
active_application_module             null
creative_domain                       creative
runtime_build                         356
activation_build                      357
runtime_state                         registered
services_ready                        false
page_proven                           false
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

## Required revalidation

After pulling/deploying Build 358, rerun the corrected local regression and Build 358 regression, then repeat the Firefox GET/runtime proof. Expected top-level result:

```text
application_module                    creative-production
application_mode                      active
active_application_module             creative-production
creative_domain                       creative
runtime_entry                         ../modules/creative-production/runtime.mjs?v=358
runtime_build                         358
activation_build                      357
dependency_gate_fix_build             358
runtime_state                         active
services_ready                        true
required_service_count                2
page_proven                           true
creative_contract_build               352
creates_network_transport             false
creative_mutation_ownership           false
mutation_authorities_activation_gate  false
contracts_ok                          true
services_ok                           true
```

Do not create/edit projects or trigger POST/inventory actions during this proof.
