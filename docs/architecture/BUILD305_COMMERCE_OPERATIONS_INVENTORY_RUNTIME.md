# Build 305 — Commerce & Operations Inventory Umbrella Runtime

## Status — COMPLETE IN DEVELOPMENT

Completed Build 304 handoff:

```text
b142b3a6267df57ac43b8189982bd6abe82605ac
Build 304 set completed Catalog-runtime handoff
```

Proven Build 305 runtime/correction head:

```text
f999a5fd61a233254e062540b80aff4fa57956d7
Build 305 restore Inventory page final newline
```

Real Devil n Dove Production remains frozen at Build 280.

## Purpose

Build 305 is the second bounded domain migration into the real `commerce-operations` top-level runtime.

```text
Commerce & Operations
  Catalog   -> catalog-read
  Inventory -> inventory-read
```

Inventory remains an explicit internal domain and does not lose its authority boundary.

## Route ownership

The real Inventory workspace is:

```text
/admin/inventory-operations/
```

Build 305 explicitly maps that route to the Inventory domain. This is a route-ownership correction, not an Inventory feature rewrite.

## Runtime identity

Architecture build remains:

```text
302
```

Runtime identities are:

```text
RUNTIME_CATALOG_BUILD   = 304
RUNTIME_INVENTORY_BUILD = 305
```

Commerce runtime metadata:

```text
entry: ../modules/commerce-operations/runtime.mjs?v=305
runtimeDomains: [catalog, inventory]
```

Operations and Public remain bridge-only.

## Commerce & Operations service boundary

The Build 305 Commerce runtime supports exactly:

```text
catalog   -> catalog-read
inventory -> inventory-read
```

It explicitly records:

```text
createsNetworkTransport: false
ownsInventoryMutations: false
```

The runtime does not invoke `inventory-post`, `inventory-reverse`, or Inventory mutation APIs.

Stock movement, reserve/release, lot, kit, correction, reversal and cost-write behavior remain with their existing implementations until separately extracted behind explicit contracts.

## Proven Inventory steady state

Development browser proof established:

```text
pathname                    /admin/inventory-operations/
admin_script                .../public/js/admin.js?v=305
runtime_build               305
domain                      inventory
domain_mode                 shadow
application_module          commerce-operations
application_module_mode     active
active_application_runtime  commerce-operations
runtime_state               active
runtime_domain              inventory
required_services           inventory-read
facade_build                305
inventory_boundary          true
catalog_boundary            false
owns_inventory_mutations    false
contracts_ok                true
services_ok                 true
```

This proves Inventory is inside the active top-level module while retaining its own internal domain identity and read contract.

## Catalog preservation

Catalog remained green under the same runtime:

```text
domain                      catalog
application_module          commerce-operations
application_module_mode     active
active_application_runtime  commerce-operations
runtime_domain              catalog
required_services           catalog-read
facade_build                305
catalog_boundary            true
inventory_boundary          false
owns_inventory_mutations    false
```

Build 305 does not change Catalog API/business logic.

## Packaging preservation

Packaging remained beneath Creative & Production through the proven Build 301 domain runtime:

```text
runtime_build                   305
domain                          packaging
domain_mode                     active
application_module              creative-production
application_module_mode         domain-bridge
active_domain_runtime           packaging
active_application_runtime      null
packaging_compatibility_build   301
packaging_compatibility_state   active
native_read_status              200
failed_verification_count       0
preview_mode                    fit
```

No Packaging transport/read/write/save/preview authority changed.

## Validation lesson

Build 305's first strict regression failed only because the Inventory HTML edit removed the file's final newline. The intended loader change was correct. Commit `f999a5fd...` restored the newline and the exact-boundary regression then passed.

This reinforces the rule that strict historical/page-diff regressions should remain strict; correct accidental formatting drift rather than broadening the allowed boundary.

## Safety boundary

Build 305 does not change:

- module registry lifecycle;
- contract declarations;
- default service adapters;
- Catalog read API;
- Inventory read API;
- Inventory mutation implementations;
- Catalog business logic;
- Packaging implementation;
- Operations/Public extraction;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production.

## Completion decision

**Build 305 is COMPLETE IN DEVELOPMENT.**

Catalog and Inventory now share the real Commerce & Operations umbrella runtime, while Inventory mutation authority remains explicitly outside that runtime.

## Next bounded migration

Do not move Operations next merely because Inventory is now grouped.

First strengthen and prove Inventory write-side boundaries:

```text
inventory-post
inventory-reverse
inventory-cost / movement authority
compensating reversal with reason + authorization
```

Only after those contracts are explicit should we decide whether Operations is ready to join Commerce & Operations.
