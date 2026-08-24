# Devil n Dove AI Context — Build 304 Completed Catalog Umbrella Runtime

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader functional roadmap.

Current modular architecture authority:

- `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`
- `docs/architecture/BUILD302_CORE_THREE_MODULE_NORMALIZATION.md`
- `docs/architecture/BUILD303_COMMERCE_OPERATIONS_UMBRELLA_BRIDGE.md`
- `docs/architecture/BUILD304_COMMERCE_OPERATIONS_CATALOG_RUNTIME.md`
- `BUILD304_VALIDATION.md`

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

Completed handoff:

```text
a81f8d6af0004d847174fa27043c11e159ca3d10
```

Proven Packaging state includes native read/write 200, verified Save Project, fitted Preview, zero failed verification, zero compatibility replay/block traffic, and write authority `packaging-domain-service`.

Build 299 remains NOT COMPLETE and rolled back.

## Build 302 — COMPLETE IN DEVELOPMENT

Completed architecture handoff:

```text
000b9617bc5141ba876ec667d4fbc653ea9ee556
```

Build 302 normalized the application to Core + exactly three top-level modules and added the passive grouping catalog. Architecture build remains `302`.

## Build 303 — COMPLETE IN DEVELOPMENT

Completed handoff:

```text
6cbcc4353327eea093ef4701497fa5321b680096
```

Proven runtime head:

```text
4fa2124cb89edff89c873c0dbdc1feee35a4e92b
```

Build 303 made Core umbrella-aware while preserving domain activation and fixed the verified-auth event race through retained `DDAuthUiState` reconciliation.

## Build 304 — COMPLETE IN DEVELOPMENT

Build 304 is the first proven real top-level application-module runtime extraction.

Core/Commerce runtime implementation head:

```text
395eb722a9b060d904b28b1a917f66dc7120f64c
```

Validated Build 304 handoff/deployment source:

```text
af0993ef9b4da807d9d1f32c63988dc28b07f1f8
```

Runtime identity:

```text
DDModuleRuntime.build                         304
DDModuleRuntime.applicationArchitectureBuild 302
DDModuleRuntime.applicationRuntimeCatalogBuild 304
```

The Build 302 grouping catalog remains the architecture authority but carries Build 304 runtime metadata:

```text
RUNTIME_CATALOG_BUILD = 304
commerce-operations.entry = ../modules/commerce-operations/runtime.mjs?v=304
commerce-operations.runtimeDomains = [catalog]
```

### Catalog is now behind a real top-level runtime

Final `/admin/products/` browser proof:

```text
admin_script_src                     https://devilndove-site-dev.pages.dev/public/js/admin.js?v=304
runtime_build                        304
architecture_build                   302
runtime_catalog_build                304
auth_phase                           verified
auth_verified                        true
domain                               catalog
domain_mode                          shadow
application_module                   commerce-operations
application_module_mode              active
api_current_application_module       commerce-operations
active_domain_runtime                null
active_application_runtime           commerce-operations
application_runtime_state            active
application_runtime_domain           catalog
application_runtime_services_ready   true
facade_build                         304
facade_state                         active
facade_catalog_boundary_active       true
contracts_ok                         true
services_ok                          true
```

Catalog remains an explicit internal domain, but `commerce-operations` is now the active top-level lifecycle owner.

The Commerce & Operations runtime currently:

- supports only `catalog`;
- requires only existing `catalog-read`;
- creates no network transport;
- exposes `window.DDCommerceOperations` diagnostics;
- does not rewrite Catalog API/business logic.

Inventory, Operations and Public remain grouped under Commerce & Operations but are not yet opted into its runtime.

### Packaging preservation

Final `/admin/packaging-studio/` browser proof:

```text
admin_script_src                 https://devilndove-site-dev.pages.dev/public/js/admin.js?v=304
runtime_build                    304
architecture_build               302
runtime_catalog_build            304
domain                           packaging
domain_mode                      active
application_module               creative-production
application_module_mode         domain-bridge
api_current_application_module   creative-production
active_domain_runtime            packaging
active_application_runtime       null
packaging_compatibility_build    301
packaging_compatibility_state    active
native_read_count                2
native_read_status               200
failed_verification_count        0
preview_mode                     fit
```

Build 304 changes no Packaging transport/read/write/save/preview authority.

### Build 304 historical-test correction

The first validation found a whitespace-sensitive Build 303 historical assertion. The assertion was corrected while keeping completed Build 303 pinned to `6cbcc435...`.

Final Build 303 historical regression and Build 304 regression both PASS with no Cloudflare resource contacted by the tests.

### Shared-loader delivery incident and recovery

The first browser proof remained on Core 303 because Products and Packaging Studio still referenced historical `admin.js` query versions. Build 304 pins both validation pages to:

```text
/public/js/admin.js?v=304
```

The regression verifies each page change is exactly that one-line version pin.

A later served-asset audit showed the Development Pages alias still served older HTML and older `/public/js/admin.js` despite the deployment list showing source `af0993e` as active.

The clean local `af0993ef...` tree was therefore directly uploaded to **Development project `devilndove-site-dev` only** with Wrangler.

Validated deployment:

```text
Id      6effd1eb-9a1f-4538-b7d3-3cdc18b54328
Branch  dev
Source  af0993e
Status  Active
```

After recovery, both the Development alias and exact deployment served:

```text
Products HTML       admin.js?v=304
Packaging HTML      admin.js?v=304
Shared admin.js      Core ?v=304 import present
Build 304 marker     present
HTTP                 200
```

No real Production resource was touched.

### Build 304 safety boundary

Build 304 does not change:

- domain registry or domain definitions;
- domain contract ownership/default service adapters;
- Catalog APIs;
- Inventory/Operations/Public runtime extraction;
- Packaging transport/native client/read/write/save/preview implementation;
- SQL/schema;
- Cloudflare bindings/config;
- R2 bindings/data;
- real Production.

Final Build 304 boundary from completed Build 303 is exactly 12 files, including two exact one-line validation-page loader pins.

## Current separation state

```text
Core
  established
  umbrella-aware
  generic top-level application-runtime lifecycle proven

Commerce & Operations
  real top-level runtime exists
  Catalog is active beneath it
  Inventory not yet migrated
  Operations not yet migrated
  Public not yet migrated

Creative & Production
  Packaging domain remains proven/active beneath it
  top-level Creative & Production runtime not yet established
  Creative/CAIP/Content remain legacy/shadow

Business & Administration
  umbrella identity mapped
  no top-level runtime yet
```

## Next bounded direction — Inventory only

The next pass should historically pin completed Build 304 and add **Inventory** to the already-proven Commerce & Operations runtime.

Inventory must remain an explicit domain/service authority. Use the existing `inventory-read` service contract for passive read ownership and do not collapse Catalog and Inventory business rules together.

Do not migrate Operations or Public in the same pass.

Also add a Core release/version-integrity gate so active Admin validation pages cannot silently reference an older shared `admin.js` loader when Core changes.

## Separate schema/data parity track — DO NOT MIX WITH MODULE EXTRACTION

There is a separate database parity problem: missing Production business data in Development and incomplete fresh-install schema. Priority remains schema parity first, then business-data migration. Do not combine that work with module-runtime extraction.
