# Devil n Dove AI Context — Build 305 Inventory Umbrella Runtime

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader functional roadmap.

Current modular architecture authority:

- `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`
- `docs/architecture/BUILD302_CORE_THREE_MODULE_NORMALIZATION.md`
- `docs/architecture/BUILD303_COMMERCE_OPERATIONS_UMBRELLA_BRIDGE.md`
- `docs/architecture/BUILD304_COMMERCE_OPERATIONS_CATALOG_RUNTIME.md`
- `docs/architecture/BUILD305_COMMERCE_OPERATIONS_INVENTORY_RUNTIME.md`
- `BUILD304_VALIDATION.md`
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

There is one shared Core + exactly three top-level application modules.

Internal domain ownership remains explicit:

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

Core owns shared infrastructure only. It must not absorb domain business rules.

## Build 301 Packaging baseline — COMPLETE IN DEVELOPMENT

Completed handoff:

```text
a81f8d6af0004d847174fa27043c11e159ca3d10
```

Packaging remains the trusted active domain runtime beneath Creative & Production. Proven state includes native read/write 200, verified Save Project, fitted Preview, zero failed verification, and write authority `packaging-domain-service`.

Build 299 remains NOT COMPLETE and rolled back.

## Build 302 — COMPLETE IN DEVELOPMENT

Completed architecture handoff:

```text
000b9617bc5141ba876ec667d4fbc653ea9ee556
```

Architecture build remains `302`.

## Build 303 — COMPLETE IN DEVELOPMENT

Completed handoff:

```text
6cbcc4353327eea093ef4701497fa5321b680096
```

Build 303 made Core umbrella-aware and added retained verified-auth reconciliation.

## Build 304 — COMPLETE IN DEVELOPMENT

Completed Build 304 handoff historically pinned by Build 305:

```text
b142b3a6267df57ac43b8189982bd6abe82605ac
Build 304 set completed Catalog-runtime handoff
```

Core/Commerce runtime implementation head:

```text
395eb722a9b060d904b28b1a917f66dc7120f64c
```

Validated Build 304 deployment source:

```text
af0993ef9b4da807d9d1f32c63988dc28b07f1f8
```

Build 304 proved the first real top-level application runtime:

```text
Catalog
  domain                             catalog
  domain mode                        shadow
  application module                 commerce-operations
  application module mode            active
  active application runtime         commerce-operations
  application runtime domain         catalog
  catalog boundary active            true
```

Packaging remained active through Build 301 with native read 200.

### Build 304 deployment lesson

The first Build 304 browser proof exposed a stale Development Pages artifact even though the deployment list showed the expected source. The clean local tree was directly uploaded to **Development project `devilndove-site-dev` only**, after which both the alias and exact deployment served the current Build 304 HTML and shared loader.

Future modular runtime validation must verify served assets before browser signoff. Do not infer served bytes from the deployment list alone.

## Build 305 — STAGED / VALIDATION REQUIRED

Build 305 is the second bounded domain migration into the existing Commerce & Operations runtime.

It adds **Inventory only**. Operations and Public remain bridge-only.

### Build 305 runtime identity

```text
DDModuleRuntime.build                         305
DDModuleRuntime.applicationArchitectureBuild 302
DDModuleRuntime.applicationRuntimeCatalogBuild 304
DDModuleRuntime.applicationRuntimeInventoryBuild 305
```

Application runtime metadata:

```text
RUNTIME_CATALOG_BUILD = 304
RUNTIME_INVENTORY_BUILD = 305
commerce-operations.entry = ../modules/commerce-operations/runtime.mjs?v=305
commerce-operations.runtimeDomains = [catalog, inventory]
```

### Inventory route ownership

The real Inventory workspace is:

```text
/admin/inventory-operations/
```

Build 305 explicitly adds that route prefix to the Inventory domain. Before this build it was not matched by the existing `/admin/inventory` prefix under the registry's path rules.

### Commerce & Operations service boundary

Build 305 runtime supports exactly:

```text
catalog   -> catalog-read
inventory -> inventory-read
```

The runtime explicitly records:

```text
createsNetworkTransport = false
ownsInventoryMutations  = false
```

Inventory write/mutation authority is **not** moved in Build 305. Existing stock movement, reserve/release, lot, kit, correction and reversal implementations remain where they are.

No `inventory-post` or `inventory-reverse` runtime call is introduced.

### Inventory target state

On `/admin/inventory-operations/` after verified startup:

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
active_required_services           inventory-read
facade_build                       305
facade_inventory_boundary_active   true
facade_catalog_boundary_active     false
owns_inventory_mutations           false
```

### Catalog preservation target

Catalog remains under the same Commerce runtime:

```text
domain                             catalog
application_module                 commerce-operations
application_module_mode            active
active_application_runtime         commerce-operations
application_runtime_domain         catalog
active_required_services           catalog-read
facade_catalog_boundary_active     true
```

Build 305 does not change Catalog APIs or Product/Catalog page business logic.

### Packaging preservation target

Packaging remains:

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

Build 305 changes no Packaging implementation file. Packaging Studio receives only a shared-loader query pin to `admin.js?v=305` for regression validation.

### Shared-loader pins

Build 305 changes:

```text
/admin/inventory-operations/  /public/js/admin.js?v=245 -> ?v=305
/admin/packaging-studio/      /public/js/admin.js?v=304 -> ?v=305
```

The regression requires each of these page diffs to contain only that one-line query change.

### Completed Build 304 historical pin

`scripts/build304_commerce_operations_catalog_runtime_test.py` is now a historical regression pinned to:

```text
b142b3a6267df57ac43b8189982bd6abe82605ac
```

It preserves the completed Build 304 local, served-asset, direct-upload and browser evidence.

### Build 305 safety boundary

Build 305 does not change:

- `dd-module-registry.mjs`;
- module contract declarations;
- default service adapters;
- `/api/admin/contracts/catalog-read`;
- `/api/admin/contracts/inventory-read`;
- Inventory API/business implementations;
- Inventory mutation paths;
- Catalog APIs/business behavior;
- Packaging transport/read/write/save/preview implementation;
- Operations or Public runtime extraction;
- SQL/schema;
- Cloudflare bindings/config;
- R2 bindings/data;
- real Production.

Expected Build 305 boundary from completed Build 304 is exactly 13 files:

```text
AI_CONTEXT.md
BUILD305_CHANGED_FILES.md
BUILD305_VALIDATION.md
admin/inventory-operations/index.html
admin/packaging-studio/index.html
docs/architecture/BUILD305_COMMERCE_OPERATIONS_INVENTORY_RUNTIME.md
public/js/admin.js
public/js/core/dd-admin-module-runtime.mjs
public/js/core/dd-application-module-groups.mjs
public/js/core/dd-module-definitions.mjs
public/js/modules/commerce-operations/runtime.mjs
scripts/build304_commerce_operations_catalog_runtime_test.py
scripts/build305_commerce_operations_inventory_runtime_test.py
```

Run:

```text
python scripts/build304_commerce_operations_catalog_runtime_test.py
python scripts/build305_commerce_operations_inventory_runtime_test.py
```

Then verify served Development assets and run the three browser proofs documented in `BUILD305_VALIDATION.md`.

Do not mark Build 305 complete until Inventory, Catalog, and Packaging are all green.

## Direction after Build 305

Do **not** automatically migrate Operations next.

After Build 305, assess Inventory write-side service boundaries. If explicit `inventory-post`, `inventory-reverse`, cost/movement and compensating-reversal contracts are not mature enough, strengthen those boundaries before adding more domains to Commerce & Operations.

## Separate schema/data parity track — DO NOT MIX WITH MODULE EXTRACTION

There is a separate database parity problem: missing Production business data in Development and incomplete fresh-install schema. Priority remains schema parity first, then business-data migration. Do not combine that work with module-runtime extraction.
