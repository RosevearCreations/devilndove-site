# Devil n Dove AI Context — Build 313 Operations Read-Only Runtime

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
- `docs/architecture/BUILD312_ACCOUNTING_READ_CONTRACT.md`
- `docs/architecture/BUILD313_OPERATIONS_READ_ONLY_RUNTIME.md`
- `BUILD312_VALIDATION.md`
- `BUILD313_VALIDATION.md`

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
Build 311 Inventory cost read contract   COMPLETE IN DEVELOPMENT
Build 312 Accounting read contract       COMPLETE IN DEVELOPMENT
```

Build 306 remains historically browser-proven with standalone local signoff not captured in the conversation. Do not silently relabel it.

Build 308 remains browser-proven; its standalone local regression output was not captured before later work began. Do not silently relabel it complete.

## Build 312 — COMPLETE IN DEVELOPMENT

Proven source/runtime head:

```text
6d99d05e40999776ab38f91fbaa182e9232db547
Build 312 update Accounting read handoff context
```

Completed handoff head:

```text
3b5709c842ed7bce8335ddd57fe11420ae207367
Build 312 complete handoff and set Operations activation next
```

Accounting read authority:

```text
GET /api/admin/contracts/accounting-read
owner            accounting
build            312
authority table  accounting_order_records
schema ready     true
schema mutation  false
```

Operations read prerequisites are now all implemented:

```text
catalog-read
inventory-read
accounting-read
```

## Build 313 — STAGED / VALIDATION REQUIRED

Baseline:

```text
3b5709c842ed7bce8335ddd57fe11420ae207367
Build 312 complete handoff and set Operations activation next
```

Build 313 activates the first real `operations` runtime page beneath Commerce & Operations in read-only mode.

### Commerce runtime

```text
build              313
supported domains  catalog, inventory, operations
operations reads   catalog-read, inventory-read, accounting-read
```

The runtime remains non-mutating:

```text
createsNetworkTransport false
ownsInventoryMutations  false
ownsOperationsMutations false
```

### Explicitly migrated page

Build 313 pins:

```text
/admin/operations/
/public/js/admin.js?v=313
```

The shared Admin loader imports the Build 313 runtime graph.

### Coverage limitation

Do not claim the whole Operations route family is migrated in Build 313.

`/admin/orders/` is unchanged and currently has no shared `admin.js` runtime loader. `/admin/customer-documents/` retains a historical loader pin but is not re-pinned or validated in Build 313.

Build 313 proven runtime-page scope is intentionally only:

```text
/admin/operations/
```

### Runtime identity

```text
Architecture build              302
Core runtime implementation     305
Catalog runtime                 304
Inventory runtime               305
Inventory write boundary        310
Inventory cost contract         311
Accounting read contract        312
Operations runtime              313
Commerce runtime                313
```

### Build 313 exclusions

Build 313 does not modify:

- Accounting contract/helper behavior;
- Catalog/Inventory read contracts;
- Inventory post/reverse authorities;
- Creative Inventory consumers;
- order/payment/customer/gift-card/membership mutation handlers;
- `/admin/orders/`;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production;
- schema/data parity work.

## Next direction after Build 313

After Build 313 is proven, expand Operations runtime loader coverage one bounded route group at a time. Prefer read-heavy pages before any mutation-authority extraction.

## Validation interaction preference

Keep validation concise: default to **one GIT BASH block and one reusable BROWSER DEVTOOLS CONSOLE block** unless a failure requires deeper isolation.

## Separate schema/data parity track — DO NOT MIX

Fresh-install schema parity remains a separate priority before any Production business-data copy. Do not combine schema/data parity with module extraction.
