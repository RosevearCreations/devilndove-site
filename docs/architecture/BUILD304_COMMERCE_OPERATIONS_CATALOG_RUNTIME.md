# Build 304 — Commerce & Operations Catalog Umbrella Runtime

## Purpose

Build 304 is the first build in which one of the three top-level application modules has a real runtime lifecycle.

The authoritative application structure remains:

```text
                     DEVIL N DOVE APPLICATION CORE
                               |
              +----------------+----------------+
              |                |                |
              v                v                v
       COMMERCE &         CREATIVE &       BUSINESS &
       OPERATIONS          PRODUCTION      ADMINISTRATION
```

Build 304 activates `commerce-operations` for the internal `catalog` domain only.

## What “Catalog is behind the umbrella runtime” means

On a verified Admin Catalog route, Core now maintains two separate runtime concepts:

```text
domain classification         catalog
active domain runtime         none
application module            commerce-operations
active application runtime    commerce-operations
```

Catalog remains a valid internal domain and continues to identify route/capability ownership. The top-level application runtime now wraps that domain and becomes the active module-level lifecycle boundary.

This does **not** mean the Catalog page or APIs have been rewritten in Build 304.

Existing Catalog HTML, JavaScript and `/api/admin/contracts/catalog-read` remain authoritative and unchanged.

## Why Catalog is first

Catalog already has a stable cross-module read contract:

```text
catalog-read
```

Packaging and other consumers can depend on that contract without importing Catalog implementation details. This makes Catalog the safest first domain for proving a top-level Commerce & Operations runtime.

## Runtime catalog

`public/js/core/dd-application-module-groups.mjs` retains:

```text
BUILD = 302
```

because Build 302 remains the architecture-definition build.

Build 304 adds:

```text
RUNTIME_CATALOG_BUILD = 304
```

and marks only Commerce & Operations as having a top-level runtime entry:

```text
entry: ../modules/commerce-operations/runtime.mjs?v=304
runtimeDomains: [catalog]
```

Inventory, Operations and Public remain grouped under Commerce & Operations but are not activated through the umbrella runtime yet.

Creative & Production and Business & Administration remain bridge-only at the top-level runtime layer.

Packaging continues to use its proven domain runtime beneath Creative & Production.

## Commerce & Operations runtime

New file:

```text
public/js/modules/commerce-operations/runtime.mjs
```

Build 304 responsibilities are intentionally narrow:

- identify itself as `commerce-operations`;
- support only the `catalog` internal domain;
- require the already-registered `catalog-read` service;
- expose lifecycle status through `window.DDCommerceOperations`;
- emit load/active/inactive diagnostics;
- perform no network request;
- own no Inventory or Operations behavior yet.

The runtime fails closed if Core attempts to activate it for any domain other than Catalog.

## Core lifecycle

`public/js/core/dd-admin-module-runtime.mjs` now has a separate top-level application-module lifecycle in addition to the existing domain registry.

Core can report independently:

```text
active domain runtime
active application-module runtime
```

For `/admin/products/` the Build 304 target is:

```text
domain                           catalog
domain_mode                      shadow
application_module               commerce-operations
application_module_mode          active
active_domain_runtime            null
active_application_module_runtime commerce-operations
```

The existing domain registry remains untouched.

## Packaging preservation

For `/admin/packaging-studio/` Build 304 should still report:

```text
domain                           packaging
domain_mode                      active
application_module               creative-production
application_module_mode          domain-bridge
active_domain_runtime            packaging
active_application_module_runtime null
packaging_compatibility_build    301
packaging_compatibility_state    active
native_read_status               200
```

Build 304 does not modify any Packaging implementation file.

## Verified-auth reconciliation

Build 303's retained verified-auth reconciliation remains mandatory. Build 304 reuses that behavior so both domain and top-level application runtime activation can recover if `/api/auth/me` finishes before the async Core runtime import.

## Safety boundary

Build 304 does not change:

- `dd-module-registry.mjs`;
- `dd-module-definitions.mjs`;
- domain contract declarations;
- default contract service adapters;
- Catalog page or API implementation;
- Inventory or Operations extraction state;
- Packaging page/runtime/native client/stabilizer/server services;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production.

## Completion gate

Build 304 is complete only when:

1. completed Build 303 historical regression passes;
2. Build 304 local regression passes;
3. Development deployment points at the Build 304 head;
4. `/admin/products/` shows `commerce-operations` as the active application runtime while Catalog remains the internal shadow domain;
5. the Commerce & Operations facade reports `state = active`, `currentDomain = catalog`, and `servicesReady = true`;
6. Inventory/Operations/Public do not receive an application runtime entry;
7. Packaging remains fully active through Build 301 with native read status 200;
8. no SQL/config/R2/Production change occurs.

## Next bounded migration

After Build 304 is proven, the next Commerce & Operations extraction should add **Inventory** to the same umbrella runtime in a separate build. Inventory authority and stock mutation rules must remain explicit service contracts; Catalog and Inventory should not be collapsed into one undifferentiated implementation.
