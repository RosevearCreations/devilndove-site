# Build 303 — Commerce & Operations Umbrella Runtime Bridge

## Purpose

Build 303 is the first runtime step after Build 302 normalized Devil n Dove to one shared Core plus exactly three top-level application modules.

Build 303 does **not** yet move Catalog, Inventory or Operations business logic into a new bundle. Instead it makes the existing Core runtime aware of each domain's umbrella application-module parent while preserving current domain activation.

This is the safest bridge between architecture and implementation.

## Completed Build 302 baseline

Completed Build 302 handoff head:

```text
000b9617bc5141ba876ec667d4fbc653ea9ee556
```

Build 302 remains the architecture authority for:

```text
Core
+ Commerce & Operations
+ Creative & Production
+ Business & Administration
```

Build 303 historically pins Build 302 to this completed head.

## Runtime behavior added

`public/js/core/dd-admin-module-runtime.mjs` now imports the passive Build 302 grouping catalog and reports both:

```text
current domain
current top-level application module
```

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
DDModuleRuntime.build = 303
DDModuleRuntime.applicationArchitectureBuild = 302
DDModuleRuntime.getCurrentApplicationModule()
DDModuleRuntime.applicationModuleForDomain()
DDModuleRuntime.getApplicationModule()
```

The document root is annotated with:

```text
data-dd-module
data-dd-application-module
```

and Admin links gain:

```text
data-dd-module-target
data-dd-application-module-target
```

A new passive diagnostic event is emitted alongside the existing domain event:

```text
dd:application-module-resolved
```

## Verified-auth reconciliation

The first Development browser proof showed the Commerce & Operations classification working correctly on `/admin/products/`, but Packaging remained at:

```text
domain_mode                     activation-pending
active_domain_runtime           null
packaging_compatibility_state   waiting-for-proven-packaging-stack
native_read_status              0
```

The cause is an event-order race introduced by the slightly longer async Core import chain. `site-auth-ui.js` stores verified auth in `window.DDAuthUiState` and emits `dd:admin-ready` when `/api/auth/me` completes. On a sufficiently fast page, the verified event can occur before `dd-admin-module-runtime.mjs` has finished importing and attached its listener.

Build 303 now makes verified auth level-triggered as well as event-triggered:

- `verifiedResolutionPromise` prevents duplicate concurrent activation;
- `requestVerifiedAdminResolution()` centralizes verified activation;
- `reconcileVerifiedAuthState()` reads retained `DDAuthUiState`;
- `bootstrap()` queues a verified-state reconciliation after normal route classification;
- `dd:admin-ready` remains the normal event path;
- `dd:auth-verified` also triggers reconciliation.

This adds no network request and changes no Packaging business/runtime authority. It only ensures Core cannot miss an already-completed verified login because of module-import timing.

## What does not change

The existing domain registry remains authoritative for actual activation.

Build 303 does not change:

- `DD_MODULE_DEFINITIONS` domain IDs or route prefixes;
- service contract ownership;
- Catalog/Inventory/Operations API routes;
- the `catalog-read`, `inventory-read` or `content-media` adapters;
- Packaging runtime entry;
- Packaging Build 301 compatibility behavior;
- Build 300 Save/Preview stabilization;
- domain activation rules;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production.

Packaging still activates as domain:

```text
packaging
```

while Core additionally reports its umbrella parent:

```text
creative-production
```

Catalog and Inventory remain shadow domains in this build, but Core now reports them under:

```text
commerce-operations
```

## Why Commerce & Operations comes first

Commerce & Operations owns the shared operational authorities most other modules consume:

- Catalog identity/presentation facts;
- Inventory identity/source facts;
- future Inventory cost/post/reverse services;
- customer/order/fulfillment operations.

Establishing its umbrella identity before physically moving those domains reduces the risk of cross-module imports later.

## Cache/versioning rule

`public/js/admin.js` now imports the Core runtime with:

```text
/public/js/core/dd-admin-module-runtime.mjs?v=303
```

A hard refresh is required during Development validation so the shared loader itself is fresh. Build 303 does not mass-edit every Admin HTML page merely to bump the `admin.js` query string; live proof determines whether any further cache-bust work is necessary.

## Completion gate

Build 303 is complete only when:

1. completed Build 302 historical regression passes;
2. Build 303 local regression passes;
3. Development deployment includes the Build 303 runtime commits;
4. a Commerce & Operations route such as `/admin/products/` reports domain `catalog` and umbrella `commerce-operations`;
5. the Catalog route remains shadow/inactive as before;
6. Packaging reports domain `packaging` and umbrella `creative-production`;
7. Packaging domain mode reaches `active` after verified-auth reconciliation;
8. Packaging Build 301 compatibility remains active and native read status returns 200;
9. no existing domain service/route authority changes;
10. no SQL/config/R2/Production change occurs.

## Next step after Build 303

After this bridge is proven, a later build can give Commerce & Operations its first real umbrella runtime entry and begin migrating one internal domain at a time behind that boundary.

Do not convert all four Commerce & Operations domains at once.
