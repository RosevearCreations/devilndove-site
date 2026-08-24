# Devil n Dove AI Context — Build 304 Catalog Umbrella Runtime

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader functional roadmap.

Current modular architecture authority:

- `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`
- `docs/architecture/BUILD302_CORE_THREE_MODULE_NORMALIZATION.md`
- `docs/architecture/BUILD303_COMMERCE_OPERATIONS_UMBRELLA_BRIDGE.md`
- `docs/architecture/BUILD304_COMMERCE_OPERATIONS_CATALOG_RUNTIME.md`
- `BUILD304_VALIDATION.md`

**Production is frozen at Build 280 unless deliberately promoted through the separate Production workflow. Development has intentionally diverged.**

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

Core owns shared infrastructure only and must not absorb business-domain rules.

## Build 301 Packaging baseline — COMPLETE IN DEVELOPMENT

Build 301 remains the trusted Packaging compatibility baseline.

Runtime activation:

```text
e2be2209ed96b7a67e975feead37a768f0043cb5
```

Completed Build 301 handoff:

```text
a81f8d6af0004d847174fa27043c11e159ca3d10
```

Live proof established native read/write 200, verified Save Project, fitted Preview, zero failed verification, zero compatibility replay/block traffic, and write authority `packaging-domain-service`.

Build 299 remains NOT COMPLETE and rolled back.

## Build 302 — COMPLETE IN DEVELOPMENT

Completed architecture handoff:

```text
000b9617bc5141ba876ec667d4fbc653ea9ee556
```

Build 302 normalized the application to Core + exactly three top-level modules and added the passive grouping catalog.

Architecture build remains:

```text
302
```

## Build 303 — COMPLETE IN DEVELOPMENT

Completed Build 303 handoff:

```text
6cbcc4353327eea093ef4701497fa5321b680096
Build 303 set completed umbrella-runtime handoff
```

Proven runtime head:

```text
4fa2124cb89edff89c873c0dbdc1feee35a4e92b
```

Build 303 made Core umbrella-aware while preserving domain activation and fixed the verified-auth event race through retained `DDAuthUiState` reconciliation.

Completed browser proof:

```text
Catalog
  domain                     catalog
  application module         commerce-operations
  domain mode                shadow
  application module mode    domain-bridge

Packaging
  domain                     packaging
  application module         creative-production
  domain mode                active
  Build 301 compatibility    active
  native read status         200
```

Build 304 historically pins Build 303 to `6cbcc435...`.

## Build 304 — STAGED / VALIDATION REQUIRED

Build 304 is the first true top-level application-module runtime extraction.

It adds:

```text
public/js/modules/commerce-operations/runtime.mjs
```

and opts **Catalog only** into the Commerce & Operations runtime.

### Runtime identities

```text
DDModuleRuntime.build                        304
DDModuleRuntime.applicationArchitectureBuild 302
DDModuleRuntime.applicationRuntimeCatalogBuild 304
```

The Build 302 grouping catalog remains the architecture authority but now carries passive Build 304 runtime metadata:

```text
RUNTIME_CATALOG_BUILD = 304
commerce-operations.entry = ../modules/commerce-operations/runtime.mjs?v=304
commerce-operations.runtimeDomains = [catalog]
```

Inventory, Operations and Public remain bridge-only. Creative & Production and Business & Administration still have no top-level runtime entry.

### Catalog target state

On `/admin/products/` after verified Admin startup:

```text
domain                            catalog
domain_mode                       shadow
application_module                commerce-operations
application_module_mode           active
active_domain_runtime             null
active_application_runtime        commerce-operations
application_runtime_state         active
application_runtime_domain        catalog
application_runtime_services_ready true
```

The new Commerce & Operations runtime:

- supports only `catalog`;
- requires only the existing `catalog-read` service;
- creates no network transport;
- exposes `window.DDCommerceOperations` diagnostics;
- does not rewrite Catalog page/API business logic.

### Packaging preservation target

On `/admin/packaging-studio/`:

```text
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

Build 304 changes no Packaging implementation file.

### Build 304 safety boundary

Build 304 must not change:

- domain registry or domain definitions;
- domain contract ownership/service adapters;
- Catalog page or API implementations;
- Inventory/Operations/Public extraction;
- Packaging page/client/runtime/read/write/save/preview authorities;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production.

Run:

```text
python scripts/build303_commerce_operations_umbrella_bridge_test.py
python scripts/build304_commerce_operations_catalog_runtime_test.py
```

Then perform the two browser proofs in `BUILD304_VALIDATION.md`.

Do not mark Build 304 complete until both local and browser gates are green.

## Next bounded direction after Build 304

If Build 304 is green, the next Commerce & Operations extraction should add **Inventory** to the same top-level runtime in a separate build while preserving Inventory as an explicit authority/service boundary.

Do not migrate Inventory and Operations together.

## Separate schema/data parity track — DO NOT MIX WITH MODULE EXTRACTION

There is a separate database parity problem: missing Production business data in Development and incomplete fresh-install schema. Priority remains schema parity first, then business-data migration. Do not combine that work with module-runtime extraction.
