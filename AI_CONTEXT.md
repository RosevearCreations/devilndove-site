# Devil n Dove AI Context — Build 303 Commerce & Operations Umbrella Bridge

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader functional roadmap.

Current modular architecture authority:

- `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`
- `docs/architecture/BUILD302_CORE_THREE_MODULE_NORMALIZATION.md`
- `BUILD302_VALIDATION.md`
- `docs/architecture/BUILD303_COMMERCE_OPERATIONS_UMBRELLA_BRIDGE.md`
- `BUILD303_VALIDATION.md`

Completed Packaging baseline authority:

- `BUILD300_VALIDATION.md`
- `BUILD301_VALIDATION.md`
- `docs/architecture/BUILD300_PACKAGING_STABILIZATION.md`
- `docs/architecture/BUILD301_PACKAGING_COMPATIBILITY_CHECKPOINT.md`

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

The twelve historical domain IDs remain internal ownership/service boundaries during migration. They are not twelve separate final applications.

## Domain-to-module map

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

## Core responsibilities

Core may own only shared cross-application infrastructure:

- authentication/session awareness;
- current-user and authorization context;
- module registry and lifecycle;
- route-to-module resolution;
- shared API request helpers;
- error handling and notifications;
- environment/runtime state;
- shared service registration;
- module/feature availability.

Core must not absorb business-domain rules.

Core primitives:

```text
public/js/core/dd-module-registry.mjs
public/js/core/dd-module-definitions.mjs
public/js/core/dd-module-contracts.mjs
public/js/core/dd-module-service-adapters.mjs
public/js/core/dd-admin-module-runtime.mjs
public/js/core/dd-admin-module-shadow.mjs
public/js/core/dd-application-module-groups.mjs
```

## Build 301 Packaging baseline — COMPLETE IN DEVELOPMENT

Build 301 remains the one current Packaging compatibility baseline/conversation.

Runtime activation:

```text
e2be2209ed96b7a67e975feead37a768f0043cb5
```

Completed Build 301 handoff head:

```text
a81f8d6af0004d847174fa27043c11e159ca3d10
```

Live proof established:

```text
compatibility_build          301
compatibility_state          active
native_read_status           200
native_write_status          200
verified_save_count          1
failed_verification_count    0
preview_mode                 fit
forced_preview_refresh_count 0
compatibility_delayed        0
compatibility_replayed       0
compatibility_blocked        0
gateway_build                292
write_service_build          291
write_authority              packaging-domain-service
```

Implementation provenance beneath Build 301:

```text
startupGateBuild              297
clientTransportBuild          297
nativeClientBuild             298
stabilizationBuild            300
editorImplementationBuild     298
nativeReadGatewayBuild        293
nativeReadImplementationBuild 286
nativeWriteGatewayBuild       292
nativeWriteServiceBuild       291
```

Build 299 remains NOT COMPLETE and its print-source controller remains rolled back.

## Build 302 — COMPLETE IN DEVELOPMENT

Proven Build 302 runtime/architecture baseline:

```text
cb68b71440f344c258809e79efe23bea65d0167f
```

Completed Build 302 documentation/handoff head pinned by Build 303:

```text
000b9617bc5141ba876ec667d4fbc653ea9ee556
```

Build 302 normalized the authoritative architecture to Core + exactly three application modules and added the passive machine-readable grouping catalog.

Build 302 local proof passed:

```text
BUILD 301 PACKAGING COMPATIBILITY HISTORICAL REGRESSION: PASS (a81f8d6a)
BUILD 302 CORE + THREE MODULE ARCHITECTURE NORMALIZATION: PASS
```

The working tree was clean after validation. Build 302 changed no active Build 301 Packaging runtime file.

## Build 303 — STAGED / VALIDATION REQUIRED

Build 303 is the first runtime bridge from the old domain-only classification to the three umbrella application modules.

It does not move business logic yet.

### Runtime identity

`public/js/core/dd-admin-module-runtime.mjs` now reports:

```text
DDModuleRuntime.build = 303
DDModuleRuntime.applicationArchitectureBuild = 302
```

Core continues to resolve and activate the existing domain definition, while also reporting its umbrella parent.

Examples:

```text
catalog     -> commerce-operations
inventory   -> commerce-operations
operations  -> commerce-operations
packaging   -> creative-production
accounting  -> business-administration
```

The runtime exposes:

```text
getCurrentApplicationModule()
applicationModuleForDomain()
getApplicationModule()
```

and annotates the document/links with umbrella metadata.

New diagnostic event:

```text
dd:application-module-resolved
```

### Build 303 safety rule

Build 303 does not change:

- `dd-module-definitions.mjs` domain IDs/routes;
- `dd-module-contracts.mjs` ownership;
- `dd-module-service-adapters.mjs` service implementations;
- Catalog/Inventory/Operations APIs;
- Packaging runtime entry;
- Build 301 Packaging compatibility facade;
- Build 300 Save/Preview stabilizer;
- Packaging server authorities;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production.

Packaging must continue to activate as domain `packaging` while Core reports parent `creative-production`.

Catalog/Inventory/Operations remain shadow domains in Build 303 while Core reports parent `commerce-operations`.

### Build 303 validation

Run:

```text
python scripts/build302_core_three_module_architecture_test.py
python scripts/build303_commerce_operations_umbrella_bridge_test.py
```

Then validate Development browser state on `/admin/products/` and `/admin/packaging-studio/` exactly as documented in `BUILD303_VALIDATION.md`.

Do not mark Build 303 complete until both local and browser gates are green.

## Planned extraction sequence after Build 303

1. give Commerce & Operations its first real umbrella runtime entry and migrate one internal domain at a time;
2. establish Creative & Production around the proven Packaging domain and bring Creative/CAIP/Content under it;
3. establish Business & Administration;
4. only after all three umbrella runtimes are proven, retire redundant shadow/domain loaders and older compatibility layers.

Do not spend upcoming passes only deleting Packaging compatibility code.

## Separate schema/data parity track — DO NOT MIX WITH MODULE EXTRACTION

There is a separate database parity problem:

1. missing Production business data in Development;
2. incomplete fresh-install schema, with Development missing Production tables current runtime code may still use.

Examples already identified include `accounting_order_records`, `gift_cards`, several Command Center tables, and `notification_dispatch_log` fresh-install inconsistency.

Priority remains:

```text
schema parity first
then business-data copy/migration
```

Do not combine that work with module-runtime extraction.
