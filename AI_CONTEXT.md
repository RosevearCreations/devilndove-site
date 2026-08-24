# Devil n Dove AI Context — Build 311 Inventory Cost Read Contract

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader roadmap.

Current modular architecture authority includes:

- `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`
- `docs/architecture/BUILD302_CORE_THREE_MODULE_NORMALIZATION.md`
- `docs/architecture/BUILD303_COMMERCE_OPERATIONS_UMBRELLA_BRIDGE.md`
- `docs/architecture/BUILD304_COMMERCE_OPERATIONS_CATALOG_RUNTIME.md`
- `docs/architecture/BUILD305_COMMERCE_OPERATIONS_INVENTORY_RUNTIME.md`
- `docs/architecture/BUILD306_INVENTORY_WRITE_CONTRACTS.md`
- `docs/architecture/BUILD307_INVENTORY_COMPENSATING_REVERSAL_SERVICE.md`
- `docs/architecture/BUILD308_CREATIVE_REVERSAL_CONSUMER_CUTOVER.md`
- `docs/architecture/BUILD309_INVENTORY_POST_AUTHORITY.md`
- `docs/architecture/BUILD310_CREATIVE_INVENTORY_POST_CONSUMER_CUTOVER.md`
- `docs/architecture/BUILD311_INVENTORY_COST_READ_CONTRACT.md`
- `BUILD310_VALIDATION.md`
- `BUILD311_VALIDATION.md`

**Real Devil n Dove Production remains frozen at Build 280 unless deliberately promoted through the separate Production workflow.**

## Authoritative application structure

```text
                     DEVIL N DOVE APPLICATION CORE
                               |
              +----------------+----------------+
              |                |                |
       COMMERCE &         CREATIVE &       BUSINESS &
       OPERATIONS          PRODUCTION      ADMINISTRATION
```

Domains remain internal ownership/service boundaries beneath exactly three top-level modules.

## Completed modular baselines

```text
Build 301 Packaging compatibility        COMPLETE IN DEVELOPMENT
Build 302 Core + exactly 3 modules       COMPLETE IN DEVELOPMENT
Build 303 umbrella classification        COMPLETE IN DEVELOPMENT
Build 304 Catalog runtime                COMPLETE IN DEVELOPMENT
Build 305 Inventory runtime              COMPLETE IN DEVELOPMENT
Build 307 Inventory reversal service     COMPLETE IN DEVELOPMENT
Build 309 Inventory post authority       COMPLETE IN DEVELOPMENT
Build 310 Creative post consumer cutover COMPLETE IN DEVELOPMENT
```

Build 306 remains historically browser-proven with standalone local signoff not captured in the conversation. Do not silently relabel it.

Build 308 remains browser-proven; its standalone local regression output was not captured before later work began. Do not silently relabel it complete.

## Build 310 — COMPLETE IN DEVELOPMENT

Proven runtime/source head:

```text
c55f72b73941e0a568591c6a1125bc360a86a8f9
Build 310 update modular posting-consumer handoff
```

Completed handoff head:

```text
c88bcd63d7478cdb24e2b7070fa739f35789ac88
Build 310 set completed modular handoff
```

Creative Inventory authority state:

```text
inventory-post
  authority build       309
  consumer build        310
  consumer writes ready true

inventory-reverse
  authority build       307
  consumer build        308
  consumer writes ready true
```

Commerce remains non-mutating: `ownsInventoryMutations=false`.

## Build 311 — STAGED / VALIDATION REQUIRED

Build 311 resolves the two review questions left by Build 310 before Operations activation.

### Compatibility retirement decision

`functions/api/admin/creative-process-compat.js` cannot be retired safely yet.

It still owns the unrelated Creative actions intentionally excluded from the narrow Inventory post/reverse cutovers. Build 311 therefore freezes it byte-for-byte from the completed Build 310 baseline.

### Inventory cost decision

`inventory-cost` is now implemented as a read-only Inventory-owned contract:

```text
GET /api/admin/contracts/inventory-cost
```

Authority:

```text
site_item_inventory.unit_cost_cents
```

Optional supporting history:

```text
site_item_inventory_cost_history
```

The route performs no mutation and no request-time DDL.

It returns current cost facts including:

```text
unit_cost_cents
usage_units_per_stock_unit
cost_per_usage_unit_cents
on_hand_quantity
inventory_value_cents
```

### Passive browser service

`public/js/core/dd-module-service-adapters.mjs` registers:

```text
inventory-cost
owner inventory
mode  read-only-http
```

Registration performs no request until `.list()` is called.

### Catalog runtime dependency

Build 311 makes Catalog's existing declared dependency real:

```text
catalog required services:
  catalog-read
  inventory-cost
```

Inventory remains:

```text
inventory required services:
  inventory-read
```

### Operations remains inactive

Do not activate Operations in Build 311.

```text
runtimeDomains = ['catalog', 'inventory']
operationsRuntimeDomainActive = false
```

No orders, memberships, fulfillment, gift-card, customer-workflow, Accounting, or payment implementation moves.

### Runtime identity

```text
Architecture build              302
Catalog runtime                 304
Inventory runtime               305
Inventory write boundary        310
Inventory cost contract         311
Commerce runtime                311
Core runtime implementation     305
Operations runtime active       false
```

### Build 311 exclusions

Build 311 does not modify:

- Creative compatibility implementation;
- Build 309 Inventory post authority;
- Build 307 Inventory reversal authority;
- Build 310/308 Creative Inventory consumers;
- legacy broad Inventory mutation endpoint;
- Operations implementation;
- Accounting implementation;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production;
- schema/data parity work.

## Next direction after Build 311

Only after Build 311 is proven should Operations activation be reconsidered. Before activation, Operations' declared `accounting-read` dependency should become a real bounded read contract or be explicitly deferred with a documented service plan.

## Validation interaction preference

Keep validation concise: default to **one Git Bash block and one reusable browser-console script** unless a failure requires deeper isolation.

## Separate schema/data parity track — DO NOT MIX

Fresh-install schema parity remains a separate priority before any Production business-data copy. Do not combine schema/data parity with module extraction.