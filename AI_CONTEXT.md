# Devil n Dove AI Context — Build 306 Inventory Write Contracts

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader roadmap.

Current modular architecture authority:

- `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`
- `docs/architecture/BUILD302_CORE_THREE_MODULE_NORMALIZATION.md`
- `docs/architecture/BUILD303_COMMERCE_OPERATIONS_UMBRELLA_BRIDGE.md`
- `docs/architecture/BUILD304_COMMERCE_OPERATIONS_CATALOG_RUNTIME.md`
- `docs/architecture/BUILD305_COMMERCE_OPERATIONS_INVENTORY_RUNTIME.md`
- `docs/architecture/BUILD306_INVENTORY_WRITE_CONTRACTS.md`
- `BUILD306_VALIDATION.md`

**Real Devil n Dove Production is frozen at Build 280 unless deliberately promoted through the separate Production workflow.**

## Authoritative structure

```text
                     DEVIL N DOVE APPLICATION CORE
                               |
              +----------------+----------------+
              |                |                |
       COMMERCE &         CREATIVE &       BUSINESS &
       OPERATIONS          PRODUCTION      ADMINISTRATION
```

Internal domains remain explicit ownership/service boundaries.

## Completed baselines

```text
Build 301 Packaging compatibility      COMPLETE IN DEVELOPMENT
Build 302 Core + exactly 3 modules     COMPLETE IN DEVELOPMENT
Build 303 umbrella classification      COMPLETE IN DEVELOPMENT
Build 304 Catalog runtime              COMPLETE IN DEVELOPMENT
Build 305 Inventory runtime            COMPLETE IN DEVELOPMENT
```

Completed Build 305 handoff:

```text
eba6d248a6c3a8725076c3f31b1edbfb0fa5f74e
Build 305 set completed Inventory-runtime handoff
```

Build 305 proved:

```text
catalog   -> commerce-operations -> catalog-read
inventory -> commerce-operations -> inventory-read
```

Inventory live proof showed `domain=inventory`, active application runtime `commerce-operations`, `required_services=inventory-read`, and `owns_inventory_mutations=false`.

Packaging remained green beneath Creative & Production through Build 301.

## Build 306 — STAGED / VALIDATION REQUIRED

Build 306 hardens Inventory write-side contracts **without moving or rewriting mutation authority**.

### Existing Inventory authority

Current Inventory code already performs movement-backed usage through:

```text
POST /api/admin/site-item-inventory
action = consume_usage
```

Build 306 preserves that server/UI implementation unchanged.

### inventory-post

Build 306 records:

```text
owner                    inventory
consumer                 creative
existing authority       /api/admin/site-item-inventory
authority action         consume_usage
implementation state     existing-authority-not-yet-contract-route
consumer writes ready    false
```

The generic Inventory endpoint is existing authority, not yet a stable cross-module mutation contract.

### inventory-reverse

Build 306 explicitly blocks fake reversal by stock increment:

```text
implementation state              blocked-pending-compensating-movement-service
requires original movement id     true
compensating movement only        true
direct stock add-back allowed     false
consumer writes ready             false
```

No dedicated reversal route is added.

A future reversal must preserve the original movement and create a compensating movement with traceable linkage, reason and authorization.

### Passive write-boundary facade

New file:

```text
public/js/modules/commerce-operations/inventory-write-boundary.mjs
```

It exposes `window.DDInventoryWriteBoundary` and creates no fetch or mutation.

### Commerce runtime

Commerce runtime advances to Build 306 for diagnostics only.

Catalog/Inventory ownership remains unchanged. It still requires only:

```text
catalog   -> catalog-read
inventory -> inventory-read
```

and still reports:

```text
ownsInventoryMutations = false
inventoryConsumerMutationReady = false
inventoryWriteBoundaryBuild = 306
```

### Core lifecycle

Build 306 deliberately does **not** change `public/js/core/dd-admin-module-runtime.mjs`.

The proven Core Build 305 lifecycle is reused. `admin.js?v=306` cache-busts it so the browser reloads the Build 306 application catalog and Commerce runtime metadata.

Expected Build 306 browser identity therefore includes:

```text
Core runtime build             305
Commerce runtime build         306
Inventory write contract build 306
```

### Safety boundary

Build 306 changes no:

- Core lifecycle implementation;
- Inventory mutation implementation;
- Inventory read API;
- Catalog business behavior;
- Packaging implementation;
- Operations/Public extraction;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production.

## Next direction after Build 306

After Build 306 is proven, implement a dedicated `inventory-post` service/route with stable request, authorization, idempotency, movement identity, audit and error semantics.

Do not implement `inventory-reverse` until it can create a compensating movement tied to the original movement ID.

Do not migrate Operations yet.

## Validation interaction preference

Keep validation concise: default to **one Git Bash block and one reusable browser-console script** unless a failure requires deeper isolation.

## Separate schema/data parity track — DO NOT MIX

Fresh-install schema parity remains a separate priority before any Production business-data copy. Do not combine schema/data parity with module extraction.
