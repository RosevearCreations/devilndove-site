# Build 302 — Core + Three Application Modules Normalization

## Status — COMPLETE IN DEVELOPMENT

Build 302 corrects architectural drift before more Devil n Dove domains are extracted.

Build 281 intentionally began with a broad domain catalog so ownership could be identified without a large-bang rewrite. By Build 301, Packaging had become the first substantially extracted domain, but the repository still described twelve domain IDs as if each might become a separate top-level application module.

The owner direction is simpler and authoritative:

```text
one shared Application Core
+ three top-level application modules
```

Build 302 normalizes the architecture to that target without changing the completed Build 301 Packaging runtime.

Completed Build 302 baseline:

```text
cb68b71440f344c258809e79efe23bea65d0167f
Build 302 harden Build 301 historical syntax pin
```

Local Build 301 historical and Build 302 architecture regressions both passed, and `git status --short` was clean after validation.

## Completed Build 301 baseline

Completed Build 301 head:

```text
a81f8d6af0004d847174fa27043c11e159ca3d10
Build 301 set completed compatibility baseline handoff
```

Build 301 remains the trusted Packaging compatibility baseline.

Build 302 changes `scripts/build301_packaging_compatibility_checkpoint_test.py` so Build 301 is tested historically against that completed head rather than future `HEAD`.

## Target application structure

```text
                     DEVIL N DOVE APPLICATION CORE
                               |
              +----------------+----------------+
              |                |                |
              v                v                v
       COMMERCE &         CREATIVE &       BUSINESS &
       OPERATIONS          PRODUCTION      ADMINISTRATION
```

### Core

Shared infrastructure only:

- authentication/session awareness;
- current user and authorization context;
- module registry/lifecycle;
- route-to-module resolution;
- shared API request helpers;
- error handling/notifications;
- environment/runtime state;
- shared service registration;
- module availability.

Core does not own business-domain rules.

### Commerce & Operations

Internal domains:

```text
public
catalog
inventory
operations
```

Responsibilities include storefront, products/catalog, stock/material authority, orders, customers, memberships, gift cards, fulfillment and operational workflows.

### Creative & Production

Internal domains:

```text
creative
caip
packaging
content
```

Responsibilities include Creative Projects, CAIP evidence/intelligence, Packaging & Labeling, Media/Content Studio and reviewed production workflows.

Packaging Build 301 is the first proven extracted domain inside this module.

### Business & Administration

Internal domains:

```text
marketing
accounting
platform
admin
```

Responsibilities include Marketing/Publishing/SEO, Accounting/Finance, analytics, platform/runtime health, users/roles/settings, Command Center and release/readiness administration.

## Why the twelve current domain IDs remain

The current `public/js/core/dd-module-definitions.mjs` domain catalog remains useful for:

- route ownership;
- capability ownership;
- service-contract validation;
- migration sequencing;
- identifying which legacy/shadow runtime still owns a route.

Build 302 does **not** rename those domain IDs to three new IDs in the active runtime yet.

Doing so immediately would change route resolution underneath the completed Build 301 Packaging runtime and would create unnecessary regression risk.

Instead Build 302 adds a passive machine-readable grouping catalog:

```text
public/js/core/dd-application-module-groups.mjs
```

It maps the twelve current domains into exactly three top-level application modules.

## Passive catalog rules

The Build 302 catalog:

- has `BUILD = 302`;
- defines one Core descriptor;
- defines exactly three application modules;
- assigns every current domain exactly once;
- identifies Packaging as part of `creative-production`;
- records Build 301 as the preserved Packaging baseline;
- performs no fetch;
- creates no timer;
- performs no D1/R2 operation;
- installs no route interception;
- is not imported by the active Build 301 runtime yet.

This gives future extraction builds one authoritative grouping without changing live behavior merely to update architecture language.

## Current extraction state

### Core foundation — established

Existing Core primitives include:

```text
public/js/core/dd-module-registry.mjs
public/js/core/dd-module-definitions.mjs
public/js/core/dd-module-contracts.mjs
public/js/core/dd-module-service-adapters.mjs
public/js/core/dd-admin-module-runtime.mjs
public/js/core/dd-admin-module-shadow.mjs
```

The registry already supports gated loading, activation/deactivation, route resolution and service lookup.

### Commerce & Operations — not yet umbrella-extracted

Its domains are still primarily shadow/legacy. Inventory already provides services consumed by Packaging, which is useful groundwork for the eventual umbrella boundary.

### Creative & Production — partially extracted

Packaging is substantially extracted and stabilized through Build 301.

Creative Projects, CAIP and Content remain shadow/legacy at the top-level runtime boundary and must be brought under the same umbrella incrementally.

### Business & Administration — not yet umbrella-extracted

Marketing, Accounting, Platform and Admin remain shadow/legacy top-level domain classifications.

## Build 302 safety boundary — PASS

Build 302 did not modify:

- Packaging page script order;
- Build 301 compatibility facade;
- Build 300 stabilizer;
- Build 298 native client/editor;
- Build 297 compatibility/startup implementation;
- Packaging server read/write authorities;
- current `dd-module-definitions.mjs` runtime route catalog;
- current `dd-admin-module-runtime.mjs` loader behavior;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production.

## Separate schema/data parity track

Fresh-install schema parity and Production business-data migration remain separate from application-module extraction.

Do not mix schema repair/data copy into module extraction builds.

## Build 302 completion proof

Build 302 is complete because:

1. completed Build 301 historical regression passed;
2. the Build 302 catalog has exactly three application modules;
3. all twelve current domain IDs are assigned exactly once;
4. the authoritative architecture document describes Core + three modules;
5. Packaging is mapped to Creative & Production and Build 301 is preserved;
6. current runtime route/module implementation is unchanged;
7. no SQL/config/R2/Production change occurred;
8. the working tree was clean after local validation.

Because Build 302 is architecture normalization only, no Packaging browser behavior change or Development-only D1 write was required.

## Next extraction direction

Future builds should migrate runtime grouping incrementally rather than continuing Packaging-only cleanup indefinitely.

Recommended order:

1. establish the Commerce & Operations umbrella/runtime boundary while preserving current domain services;
2. establish Creative & Production around the already-proven Packaging domain, then bring Creative/CAIP/Content under it;
3. establish Business & Administration;
4. only after the three umbrella runtimes are proven, retire redundant shadow/domain loaders and old compatibility layers.
