# Devil n Dove AI Context — Build 305 Inventory Umbrella Runtime

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader functional roadmap.

Current modular architecture authority:

- `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`
- `docs/architecture/BUILD302_CORE_THREE_MODULE_NORMALIZATION.md`
- `docs/architecture/BUILD303_COMMERCE_OPERATIONS_UMBRELLA_BRIDGE.md`
- `docs/architecture/BUILD304_COMMERCE_OPERATIONS_CATALOG_RUNTIME.md`
- `docs/architecture/BUILD305_COMMERCE_OPERATIONS_INVENTORY_RUNTIME.md`
- `BUILD305_VALIDATION.md`

**Real Devil n Dove Production is frozen at Build 280 unless deliberately promoted through the separate Production workflow. Development has intentionally diverged.**

## Authoritative application structure

```text
                     DEVIL N DOVE APPLICATION CORE
                               |
              +----------------+----------------+
              |                |                |
              v                v                v
       COMMERCE &         CREATIVE &       BUSINESS &
       OPERATIONS          PRODUCTION      ADMINISTRATION
```

Internal domains remain explicit ownership/service boundaries:

```text
Commerce & Operations
  public
  catalog
  inventory
  operations

Creative & Production
  creative
  caip
  packaging
  content

Business & Administration
  marketing
  accounting
  platform
  admin
```

Core owns shared infrastructure only and must not absorb domain business rules.

## Completed modular baselines

### Build 301 — Packaging baseline COMPLETE IN DEVELOPMENT

Completed handoff:

```text
a81f8d6af0004d847174fa27043c11e159ca3d10
```

Packaging remains the trusted active domain runtime beneath Creative & Production. Proven state includes native read/write 200, verified Save Project, fitted Preview, zero failed verification, and write authority `packaging-domain-service`.

Build 299 remains NOT COMPLETE and rolled back.

### Build 302 — Core + exactly three modules COMPLETE IN DEVELOPMENT

Completed handoff:

```text
000b9617bc5141ba876ec667d4fbc653ea9ee556
```

Architecture build remains `302`.

### Build 303 — Umbrella classification bridge COMPLETE IN DEVELOPMENT

Completed handoff:

```text
6cbcc4353327eea093ef4701497fa5321b680096
```

Build 303 made Core umbrella-aware and retained verified-auth reconciliation.

### Build 304 — Catalog runtime COMPLETE IN DEVELOPMENT

Completed handoff:

```text
b142b3a6267df57ac43b8189982bd6abe82605ac
Build 304 set completed Catalog-runtime handoff
```

Build 304 proved the first real top-level runtime:

```text
Catalog
  domain                     catalog
  application module         commerce-operations
  application module mode    active
  active application runtime commerce-operations
  runtime domain             catalog
  service boundary           catalog-read
```

Build 304 also proved that Development validation must check served assets directly; a deployment-list row alone does not prove which bytes the Pages alias serves.

## Build 305 — COMPLETE IN DEVELOPMENT

Proven Build 305 runtime/correction head:

```text
f999a5fd61a233254e062540b80aff4fa57956d7
Build 305 restore Inventory page final newline
```

Build 305 is the second bounded domain migration into the existing Commerce & Operations runtime.

Runtime identity:

```text
DDModuleRuntime.build                          305
DDModuleRuntime.applicationArchitectureBuild  302
DDModuleRuntime.applicationRuntimeCatalogBuild 304
DDModuleRuntime.applicationRuntimeInventoryBuild 305
```

Runtime support:

```text
catalog   -> catalog-read
inventory -> inventory-read
```

The real Inventory workspace is explicitly mapped to the Inventory domain:

```text
/admin/inventory-operations/
```

### Proven Inventory state

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

This proves Inventory is now genuinely inside the active Commerce & Operations runtime while retaining its internal-domain identity and read authority.

### Catalog preservation

Catalog remained green under the same runtime:

```text
domain                      catalog
application_module          commerce-operations
application_module_mode     active
runtime_domain              catalog
required_services           catalog-read
facade_build                305
catalog_boundary            true
inventory_boundary          false
owns_inventory_mutations    false
```

### Packaging preservation

Packaging remained green beneath Creative & Production:

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

### Inventory mutation boundary

Build 305 explicitly does **not** move Inventory write/mutation authority into the umbrella runtime:

```text
createsNetworkTransport = false
ownsInventoryMutations  = false
```

No `inventory-post` or `inventory-reverse` runtime call was added. Existing stock movement, reserve/release, lot, kit, correction, reversal and cost-write implementations remain where they are.

### Validation lesson

The first strict Build 305 regression failure was only a missing final newline in `admin/inventory-operations/index.html`. The intended loader edit was correct. Commit `f999a5fd...` restored the newline and the exact-boundary regression then passed.

Keep strict diff regressions strict; fix accidental formatting drift instead of broadening the allowed boundary.

### Build 305 safety boundary

Build 305 changed no:

- SQL/schema;
- Cloudflare binding/config;
- R2 data/bindings;
- Catalog API/business behavior;
- Inventory read API;
- Inventory mutation implementation;
- Packaging transport/read/write/save/preview implementation;
- real Production.

## Next direction

Do **not** migrate Operations next yet.

First assess and strengthen Inventory write-side service boundaries:

```text
inventory-post
inventory-reverse
inventory-cost / movement authority
compensating reversal with reason + authorization
```

Only after those contracts are explicit and proven should we decide whether Operations is ready to join Commerce & Operations.

## Validation interaction preference

Keep validation concise: default to **one Git Bash block and one reusable browser-console script** rather than separate scripts for each page unless a failure requires deeper isolation.

## Separate schema/data parity track — DO NOT MIX WITH MODULE EXTRACTION

There is a separate database parity problem: missing Production business data in Development and incomplete fresh-install schema. Priority remains schema parity first, then business-data migration. Do not combine that work with module-runtime extraction.
