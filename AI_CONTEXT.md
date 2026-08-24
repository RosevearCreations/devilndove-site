# Devil n Dove AI Context — Development Build 302 Core + Three Modules Normalization

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader functional roadmap.

For current modular architecture read:

- `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`
- `docs/architecture/BUILD302_CORE_THREE_MODULE_NORMALIZATION.md`
- `BUILD302_VALIDATION.md`

For the completed Packaging baseline read:

- `BUILD300_VALIDATION.md`
- `BUILD301_VALIDATION.md`
- `docs/architecture/BUILD300_PACKAGING_STABILIZATION.md`
- `docs/architecture/BUILD301_PACKAGING_COMPATIBILITY_CHECKPOINT.md`

**Production is frozen at Build 280 unless deliberately promoted through the separate Production workflow. Development has intentionally diverged.**

## Current application architecture rule

The authoritative Devil n Dove target is:

```text
                     DEVIL N DOVE APPLICATION CORE
                               |
              +----------------+----------------+
              |                |                |
              v                v                v
       COMMERCE &         CREATIVE &       BUSINESS &
       OPERATIONS          PRODUCTION      ADMINISTRATION
```

There is **one shared Core + exactly three top-level application modules**.

The existing domain names remain internal ownership/service boundaries during migration. They are not intended to remain twelve separate top-level independently loaded applications.

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

Core must not absorb Catalog, Inventory, Creative, CAIP, Packaging, Content, Marketing or Accounting business rules.

Existing Core primitives include:

```text
public/js/core/dd-module-registry.mjs
public/js/core/dd-module-definitions.mjs
public/js/core/dd-module-contracts.mjs
public/js/core/dd-module-service-adapters.mjs
public/js/core/dd-admin-module-runtime.mjs
public/js/core/dd-admin-module-shadow.mjs
```

Build 302 adds the passive target grouping catalog:

```text
public/js/core/dd-application-module-groups.mjs
```

This Build 302 catalog is intentionally not loaded by the current live runtime yet.

## Module 1 — Commerce & Operations

Internal domains:

```text
public
catalog
inventory
operations
```

Owns storefront/customer-facing commerce, Catalog/Products, Inventory/Materials, Orders, customer operations, memberships, gift cards, fulfillment and related operational workflows.

Inventory remains a foundational authority even though it is grouped inside Commerce & Operations. Other modules consume Inventory through explicit service contracts.

Current extraction state:

```text
umbrella module runtime: not yet extracted
public: shadow/legacy
catalog: shadow/legacy
inventory: shadow/contract provider
operations: shadow/legacy
```

## Module 2 — Creative & Production

Internal domains:

```text
creative
caip
packaging
content
```

Owns Creative Projects, CAIP, Packaging & Labeling, Media/Content Studio and reviewed production workflows.

Current extraction state:

```text
umbrella module runtime: partially established through Packaging proof
creative: shadow/legacy
caip: shadow/legacy
packaging: substantially extracted; Build 301 baseline
content: shadow/contract provider
```

Packaging Build 301 is the first proven extracted domain inside Creative & Production.

## Module 3 — Business & Administration

Internal domains:

```text
marketing
accounting
platform
admin
```

Owns Marketing/Publishing/SEO, Accounting/Finance, analytics, platform/runtime health, users/roles/settings, Command Center, release/readiness and system administration.

Current extraction state:

```text
umbrella module runtime: not yet extracted
marketing: shadow/legacy
accounting: shadow/legacy
platform: shadow/platform
admin: shadow/platform-admin
```

## Why twelve current domain definitions still exist

`public/js/core/dd-module-definitions.mjs` currently defines these twelve domain IDs:

```text
public
catalog
inventory
operations
creative
caip
packaging
content
marketing
accounting
platform
admin
```

Those definitions currently support route classification, capability ownership and service contracts.

Only Packaging has a non-null runtime entry. The rest remain `entry: null` and therefore shadow/legacy classifications.

Do not mistake the twelve domain definitions for the final top-level application structure.

Build 302 maps them to the three umbrella modules without changing live route resolution yet.

## Build 301 Packaging baseline — COMPLETE IN DEVELOPMENT

**Build 301 is the one current Packaging compatibility baseline/conversation.**

Do not describe Builds 297, 298 or 300 as separate current Packaging passes. They are implementation provenance beneath Build 301.

Build 301 runtime activation commit:

```text
e2be2209ed96b7a67e975feead37a768f0043cb5
Build 301 activate Packaging compatibility checkpoint
```

Completed Build 301 handoff head:

```text
a81f8d6af0004d847174fa27043c11e159ca3d10
Build 301 set completed compatibility baseline handoff
```

Build 302 pins the completed Build 301 regression to this historical head.

Development Pages project:

```text
devilndove-site-dev
```

The Cloudflare `Environment = Production` label for this project means the primary environment of the Development project. It is not real Devil n Dove Production.

### Build 301 live proof

Initial load passed:

```text
build301_script_in_page       true
build301_global_exists        true
compatibility_build           301
compatibility_state           active
compatibility_checkpoint      true
single_conversation_build     301
startup_gate_ready            true
client_transport_ready        true
native_client_ready           true
save_verification_active      true
preview_stabilization_active  true
native_read_status            200
failed_verification_count     0
preview_mode                  fit
forced_preview_refresh_count  0
```

One Development-only Save Project also passed:

```text
native_write_status           200
verified_save_count           1
failed_verification_count     0
compatibility_delayed         0
compatibility_replayed        0
compatibility_blocked         0
gateway_build                 292
write_service_build           291
write_authority               packaging-domain-service
```

### Build 301 implementation provenance

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

These are provenance only beneath the one Build 301 Packaging compatibility identity.

## Build 300 historical stabilization baseline

Completed Build 300 head:

```text
21b01cc34ef734f581da22a7f0d3c43ec10607c0
```

Build 300 proved:

```text
verified Save Project through fresh D1 read-back
claims/core fields persisted correctly
fitted full-ribbon Preview
DOM -> rendered SVG claim parity
verified saved state -> DOM parity
forced preview refreshes = 0
idle preview audit delta = 0
```

The mature soap renderer does print `Front tagline`.

## Build 299 status

Build 299 is **NOT COMPLETE**.

Its draft-versus-saved-version browser print controller was rolled back after live regressions. Do not reactivate it without a deliberate redesign and new proof.

## Build 302 — CURRENT ARCHITECTURE NORMALIZATION

Build 302 corrects the architectural drift between the broad Build 281 domain inventory and the owner's intended final structure of Core + three application modules.

Build 302 changes architecture/documentation only plus one passive module-group catalog and historical regression pinning.

It does **not** change:

- Packaging page script order;
- Build 301 compatibility facade;
- Build 300 Save/Preview stabilizer;
- Build 298 native client/editor;
- Build 297 startup/compatibility implementation;
- current `dd-module-definitions.mjs` route/domain behavior;
- current `dd-admin-module-runtime.mjs` behavior;
- Packaging server read/write authorities;
- SQL/schema;
- Cloudflare binding/config;
- R2;
- real Production.

### Build 302 machine-readable target

`public/js/core/dd-application-module-groups.mjs` defines:

```text
core
commerce-operations
creative-production
business-administration
```

Domain map:

```text
public      -> commerce-operations
catalog     -> commerce-operations
inventory   -> commerce-operations
operations  -> commerce-operations

creative    -> creative-production
caip        -> creative-production
packaging   -> creative-production
content     -> creative-production

marketing   -> business-administration
accounting  -> business-administration
platform    -> business-administration
admin       -> business-administration
```

The catalog is passive: no fetch, timers, D1/R2 work or route interception.

### Build 302 local gates

Run:

```text
python scripts/build301_packaging_compatibility_checkpoint_test.py
python scripts/build302_core_three_module_architecture_test.py
```

Required endings:

```text
BUILD 301 PACKAGING COMPATIBILITY HISTORICAL REGRESSION: PASS (a81f8d6a)
No Cloudflare resource was contacted.
```

and:

```text
BUILD 302 CORE + THREE MODULE ARCHITECTURE NORMALIZATION: PASS
No Cloudflare resource was contacted.
```

Build 302 needs no repeated Packaging browser Save/Preview proof because it changes no proven Build 301 runtime file.

## Next runtime direction after Build 302

Do not spend the next passes only deleting Packaging compatibility code.

The next runtime objective is to migrate from twelve top-level domain classifications toward the three umbrella application modules incrementally.

Recommended direction:

1. establish the Commerce & Operations umbrella/runtime boundary and formalize Catalog/Inventory/Operations service ownership;
2. establish Creative & Production around the already-proven Packaging domain and bring Creative/CAIP/Content under it;
3. establish Business & Administration;
4. after all three top-level runtimes are proven, retire redundant shadow/domain loaders and old compatibility layers.

A future Packaging compatibility-retirement pass must still respect the Build 298 readiness dependency on Build 297 until an equivalent umbrella/Core readiness contract replaces it.

## Separate schema/data parity track — DO NOT MIX WITH MODULE EXTRACTION

There is a separate Devil n Dove database parity problem:

1. missing Production business data in Development;
2. incomplete fresh-install schema, with Development missing Production tables that current runtime code may still use.

Examples previously identified include `accounting_order_records`, `gift_cards`, several Command Center tables, and the `notification_dispatch_log` fresh-install inconsistency.

Priority remains:

```text
schema parity first
then business-data copy/migration
```

Do not combine that work with Build 302 architecture normalization or future module-runtime extraction.
