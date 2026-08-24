# Build 305 — Commerce & Operations Inventory Umbrella Runtime

## Status — STAGED / VALIDATION REQUIRED

Build 305 is the second bounded domain migration into the proven `commerce-operations` top-level runtime.

Completed Build 304 handoff pinned by this build:

```text
b142b3a6267df57ac43b8189982bd6abe82605ac
Build 304 set completed Catalog-runtime handoff
```

Real Devil n Dove Production remains frozen at Build 280.

## Purpose

Build 304 proved:

```text
Catalog -> commerce-operations runtime
```

Build 305 adds:

```text
Inventory -> commerce-operations runtime
```

while keeping Inventory as an explicit internal domain/service authority.

The top-level structure remains:

```text
                     DEVIL N DOVE APPLICATION CORE
                               |
              +----------------+----------------+
              |                |                |
              v                v                v
       COMMERCE &         CREATIVE &       BUSINESS &
       OPERATIONS          PRODUCTION      ADMINISTRATION
```

## Inventory route ownership correction

The actual Inventory workspace is:

```text
/admin/inventory-operations/
```

Before Build 305, the Inventory domain route catalog listed `/admin/site-item-inventory` and `/admin/inventory` but did not explicitly match `/admin/inventory-operations/` under the registry's path-prefix rules.

Build 305 therefore adds:

```text
/admin/inventory-operations
```

to the Inventory domain route prefixes.

This is a route-ownership correction, not an Inventory feature rewrite.

## Runtime catalog

Architecture build remains:

```text
302
```

Build 304 Catalog runtime identity remains historically recorded as:

```text
RUNTIME_CATALOG_BUILD = 304
```

Build 305 adds:

```text
RUNTIME_INVENTORY_BUILD = 305
```

and updates the Commerce & Operations runtime metadata to:

```text
entry: ../modules/commerce-operations/runtime.mjs?v=305
runtimeDomains: [catalog, inventory]
```

Operations and Public remain bridge-only in Build 305.

Creative & Production and Business & Administration remain unchanged at the top-level runtime layer.

## Commerce & Operations runtime

`public/js/modules/commerce-operations/runtime.mjs` becomes Build 305 and supports exactly:

```text
catalog
inventory
```

Service requirements remain domain-specific:

```text
catalog   -> catalog-read
inventory -> inventory-read
```

The runtime explicitly records:

```text
createsNetworkTransport: false
ownsInventoryMutations: false
```

It does not call `inventory-post`, `inventory-reverse`, or any Inventory mutation API.

Inventory writes, stock movements, lots, kits, reserve/release, corrections and reversal rules remain with their existing implementations until separately extracted behind explicit service contracts.

## Core runtime

Build 305 Core identity:

```text
DDModuleRuntime.build                         305
DDModuleRuntime.applicationArchitectureBuild 302
DDModuleRuntime.applicationRuntimeCatalogBuild 304
DDModuleRuntime.applicationRuntimeInventoryBuild 305
```

The generic application-module lifecycle proven in Build 304 is reused unchanged conceptually.

Expected Inventory steady state:

```text
domain                             inventory
domain_mode                        shadow
application_module                 commerce-operations
application_module_mode            active
active_domain_runtime              null
active_application_runtime         commerce-operations
application_runtime_state          active
application_runtime_domain         inventory
application_runtime_services_ready true
```

Expected Commerce facade state:

```text
facade_build                       305
facade_state                       active
facade_inventory_boundary_active   true
facade_catalog_boundary_active     false
active_required_services           inventory-read
owns_inventory_mutations           false
```

## Catalog preservation

Catalog remains on the same Commerce & Operations runtime and must still produce:

```text
domain                             catalog
application_module                 commerce-operations
application_module_mode            active
active_application_runtime         commerce-operations
application_runtime_domain         catalog
facade_catalog_boundary_active     true
```

Build 305 does not modify Catalog page/API business logic.

## Packaging preservation

Packaging remains beneath Creative & Production through the proven Build 301 domain runtime.

Expected Packaging steady state:

```text
runtime_build                    305
domain                           packaging
domain_mode                      active
application_module               creative-production
application_module_mode          domain-bridge
active_domain_runtime            packaging
active_application_runtime       null
packaging_compatibility_build    301
packaging_compatibility_state    active
native_read_status               200
failed_verification_count        0
preview_mode                     fit
```

The Packaging page receives only a Build 305 shared-loader query pin. Packaging implementation files are not changed.

## Shared-loader validation pins

Build 305 explicitly pins:

```text
/admin/inventory-operations/  -> /public/js/admin.js?v=305
/admin/packaging-studio/      -> /public/js/admin.js?v=305
```

The Inventory page is the new runtime target and Packaging is the cross-module regression surface.

Build 305 does not mass-edit unrelated Admin pages solely for loader query consistency.

## Historical Build 304 pin

`scripts/build304_commerce_operations_catalog_runtime_test.py` is converted to a historical regression pinned to:

```text
b142b3a6267df57ac43b8189982bd6abe82605ac
```

It preserves:

- Build 304 syntax proof;
- Catalog-only runtime catalog;
- generic Core lifecycle;
- Catalog browser proof;
- Packaging browser proof;
- direct-upload Development recovery evidence;
- exact completed Build 304 changed-file boundary.

## Safety boundary

Build 305 does not change:

- `dd-module-registry.mjs`;
- domain contract declarations;
- default module service adapters;
- `/api/admin/contracts/catalog-read`;
- `/api/admin/contracts/inventory-read`;
- Inventory API/business implementations;
- Inventory mutation authorities;
- Catalog APIs/business logic;
- Packaging transport/native client/read/write/save/preview authorities;
- Operations runtime extraction;
- Public runtime extraction;
- SQL/schema;
- Cloudflare bindings/config;
- R2 bindings/data;
- real Production.

## Completion gate

Build 305 is complete only when:

1. completed Build 304 historical regression passes;
2. Build 305 local regression passes;
3. working tree is clean after pull;
4. Development serves the Build 305 shared loader/Core runtime;
5. `/admin/inventory-operations/` resolves domain `inventory`;
6. Inventory activates `commerce-operations` with `inventory-read` ready;
7. Inventory facade reports `ownsInventoryMutations = false`;
8. Catalog remains active under the same Commerce runtime;
9. Packaging remains active through Build 301 with native read 200;
10. Operations/Public remain bridge-only;
11. no SQL/config/R2/real Production change occurs.

## Next bounded migration

Do not automatically move Operations next merely because Catalog and Inventory are now grouped.

After Build 305, first assess whether Inventory needs explicit write-side contracts (`inventory-post`, `inventory-reverse`, cost/movement services) before further umbrella extraction. If those authorities are not yet contractized enough, the next pass should strengthen those service boundaries rather than collapsing Operations into the module prematurely.
