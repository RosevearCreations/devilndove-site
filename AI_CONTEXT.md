# Devil n Dove AI Context — Build 302 Completed Core + Three-Module Baseline

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader functional roadmap.

Current modular architecture authority:

- `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`
- `docs/architecture/BUILD302_CORE_THREE_MODULE_NORMALIZATION.md`
- `BUILD302_VALIDATION.md`

Completed Packaging baseline authority:

- `BUILD300_VALIDATION.md`
- `BUILD301_VALIDATION.md`
- `docs/architecture/BUILD300_PACKAGING_STABILIZATION.md`
- `docs/architecture/BUILD301_PACKAGING_COMPATIBILITY_CHECKPOINT.md`

**Production is frozen at Build 280 unless deliberately promoted through the separate Production workflow. Development has intentionally diverged.**

## Current application architecture — AUTHORITATIVE

Devil n Dove is one application platform with:

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

The twelve historical domain IDs remain internal ownership/service boundaries during migration. They are not intended to remain twelve separate top-level applications.

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

Existing Core primitives:

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

It is intentionally not loaded by the active runtime yet.

## Module 1 — Commerce & Operations

Internal domains:

```text
public
catalog
inventory
operations
```

Owns storefront/customer-facing commerce, Catalog/Products, Inventory/Materials, Orders, customer operations, memberships, gift cards, fulfillment and related operational workflows.

Inventory remains a foundational authority. Other modules must consume Inventory through explicit service contracts.

Current state:

```text
umbrella runtime: not yet extracted
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

Current state:

```text
umbrella runtime: partially established through Packaging proof
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

Current state:

```text
umbrella runtime: not yet extracted
marketing: shadow/legacy
accounting: shadow/legacy
platform: shadow/platform
admin: shadow/platform-admin
```

## Why twelve current domain definitions still exist

`public/js/core/dd-module-definitions.mjs` currently defines:

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

These definitions currently support route classification, capability ownership, service contracts and migration sequencing.

Only Packaging has a non-null runtime entry. The rest remain shadow/legacy classifications.

Do not mistake the twelve domain definitions for the final top-level application structure.

## Build 301 Packaging baseline — COMPLETE IN DEVELOPMENT

Build 301 is the one current Packaging compatibility baseline/conversation.

Runtime activation:

```text
e2be2209ed96b7a67e975feead37a768f0043cb5
Build 301 activate Packaging compatibility checkpoint
```

Completed Build 301 handoff head:

```text
a81f8d6af0004d847174fa27043c11e159ca3d10
Build 301 set completed compatibility baseline handoff
```

Build 302 historically pins Build 301 to this completed head.

Live Build 301 proof established:

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

Implementation provenance beneath Build 301 remains:

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

These are provenance only, not separate current Packaging conversations.

Build 299 remains **NOT COMPLETE** and its print-source browser controller remains rolled back.

## Build 302 — COMPLETE IN DEVELOPMENT

Completed Build 302 baseline:

```text
cb68b71440f344c258809e79efe23bea65d0167f
Build 302 harden Build 301 historical syntax pin
```

Build 302 corrected the architectural drift between the broad Build 281 domain inventory and the intended final structure of Core + three application modules.

Build 302 machine-readable target:

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

### Build 302 completed local proof

Build 301 historical regression passed:

```text
BUILD 301 PACKAGING COMPATIBILITY HISTORICAL REGRESSION: PASS (a81f8d6a)
No Cloudflare resource was contacted.
```

Build 302 architecture regression passed:

```text
PASS: Build 302 architecture catalog JavaScript syntax
PASS: Build 302 catalog is passive and defines Core + three application modules
PASS: all current domains are assigned exactly once across the three application modules
PASS: authoritative architecture is normalized to Core + three modules
PASS: Build 302 documents the migration state without claiming runtime conversion is complete
PASS: completed Build 301 compatibility proof is historically pinned
PASS: Build 301 Packaging and current Core/domain runtime behavior are unchanged
PASS: exact Build 302 architecture-normalization changed-file boundary
PASS: no SQL/schema, Cloudflare binding/config, R2, or Production change
BUILD 302 CORE + THREE MODULE ARCHITECTURE NORMALIZATION: PASS
No Cloudflare resource was contacted.
```

`git status --short` was clean after validation.

Build 302 changes architecture/documentation, one passive grouping catalog and historical regression pinning only. It does **not** change the proven Build 301 Packaging runtime.

## Next runtime direction

The next runtime objective is to move from twelve domain classifications toward the three umbrella modules incrementally.

Recommended order:

1. establish the **Commerce & Operations** umbrella/runtime boundary and formalize Catalog/Inventory/Operations service ownership;
2. establish **Creative & Production** around the already-proven Packaging domain and bring Creative/CAIP/Content under it;
3. establish **Business & Administration**;
4. only after all three top-level runtimes are proven, retire redundant shadow/domain loaders and old compatibility layers.

Do not spend upcoming passes only deleting Packaging compatibility code. Build 301 is stable and should remain preserved while the broader module boundaries are established.

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
