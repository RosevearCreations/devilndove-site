# Build 358 Validation — Creative Process Activation Dependency Gate

## Status — BROWSER PASSED / LOCAL REGRESSION REQUIRED

Build 358 fixes a real browser activation defect discovered while validating Builds 352–354.

## Defect

The top-level Creative & Production runtime incorrectly required four Creative services:

```text
creative-process-read
inventory-read
inventory-post
inventory-reverse
```

Only the first two are Core browser services. `inventory-post` and `inventory-reverse` are Inventory-owned mutation authorities used by the retained Creative Process POST flow; they are not default passive browser services.

The browser therefore initially failed activation with:

```text
Creative & Production creative boundary is missing required services: inventory-post, inventory-reverse
```

## Correction

Build 358 separates activation services from retained mutation authorities.

Activation services:

```text
creative-process-read
inventory-read
```

Retained Inventory-owned mutation authorities:

```text
inventory-post
inventory-reverse
```

The top-level runtime does not register or call those mutation authorities and still reports:

```text
createsNetworkTransport = false
creativeMutationOwnership = false
ownsCreativeMutations = false
mutationAuthoritiesRequiredAsActivationServices = false
```

Coverage remains unchanged:

```text
packaging -> /admin/packaging-studio/
creative  -> /admin/creative-process/
content   -> /admin/content-studio/
caip      -> not activated
```

## Browser proof — PASSED 2026-08-24

User-run Development browser evidence on `/admin/creative-process/`:

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

This is the exact expected structural proof. The page activates successfully, mutation authorities remain separate from passive activation services, and no mutation ownership moved.

## Remaining local regression

```bash
git -c gc.auto=0 pull --ff-only origin dev
python scripts/build352_354_creative_process_runtime_test.py
python scripts/build355_357_content_studio_runtime_test.py
python scripts/build358_creative_dependency_gate_fix_test.py
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
```

No POST or Inventory mutation is required for validation.
