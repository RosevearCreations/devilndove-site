# Devil n Dove AI Context — Build 310 Complete / Build 311 Review Next

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
- `BUILD310_VALIDATION.md`

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

## Build 309 — completed authority

Proven runtime/service head:

```text
f23a914c9ea4848c6f91d715ce0c983a06f716b3
Build 309 update modular post-authority handoff
```

Completed handoff head:

```text
ab8089b76d881617bc3ca4768abdb4674afcf3a0
Build 309 set completed post-authority handoff
```

Inventory owns reviewed Creative material posting through:

```text
GET  /api/admin/contracts/inventory-post
POST /api/admin/contracts/inventory-post
functions/api/_lib/inventoryPostService.js
```

The service uses one guarded D1 batch, the existing UNIQUE material-review posting constraint for idempotency, a current-stock snapshot check, physical movement provenance, and fractional usage linkage.

## Build 310 — COMPLETE IN DEVELOPMENT

Proven runtime/source head:

```text
c55f72b73941e0a568591c6a1125bc360a86a8f9
Build 310 update modular posting-consumer handoff
```

Build 310 migrates all three current Creative posting workflows to the Inventory-owned Build 309 service:

```text
post_material_inventory
record_inventory_use
correct_inventory_use
```

The live Creative route is a narrow wrapper. Unrelated Creative behavior remains in the preserved compatibility implementation:

```text
functions/api/admin/creative-process-compat.js
```

Creative Inventory authority state is now:

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

Runtime identity:

```text
Architecture build              302
Catalog runtime                 304
Inventory runtime               305
Inventory write boundary        310
Commerce runtime                310
Core runtime implementation     305
Creative post consumer          310
Creative reversal consumer      308
Inventory post authority        309
Inventory reversal authority    307
```

Commerce still reports `ownsInventoryMutations=false`.

### Validation proof

Build 310 local regression passed. Development browser validation also passed:

```text
creative_ok                     true
creative_engine_build           274
post_consumer_build             310
post_authority                  inventory-post
reversal_consumer_build         308
reversal_authority              inventory-reverse
inventory_post_build            309
inventory_post_schema_ready     true
invalid_post_ok                 false
invalid_post_consumer_build     310
invalid_post_authority          inventory-post
```

The invalid POST intentionally omitted IDs/quantity and returned the expected controlled 400 before any Inventory mutation.

## Build 310 safety boundary

Build 310 did not modify:

- Build 309 Inventory post service/route;
- Build 307 Inventory reversal service/route;
- Build 308 reversal consumer adapter;
- legacy broad Inventory mutation endpoint;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- Operations implementation;
- real Production;
- schema/data parity work.

## Next direction — Build 311 review before Operations

Do **not** activate Operations yet.

First review:

1. whether `functions/api/admin/creative-process-compat.js` can be retired safely without losing unrelated Creative behavior;
2. whether `inventory-cost` should become the next explicit Inventory-owned read contract.

Prefer a bounded, non-mutating Build 311 that records those decisions and implements only a safe read boundary if warranted.

## Separate schema/data parity track — DO NOT MIX

Fresh-install schema parity remains a separate priority before any Production business-data copy. Do not combine schema/data parity with module extraction.