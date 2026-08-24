# Devil n Dove AI Context — Build 310 Creative Inventory Post Consumer Cutover

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader roadmap.

Current modular architecture authority:

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
- `BUILD309_VALIDATION.md`
- `BUILD310_VALIDATION.md`

**Real Devil n Dove Production is frozen at Build 280 unless deliberately promoted through the separate Production workflow.**

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
Build 301 Packaging compatibility      COMPLETE IN DEVELOPMENT
Build 302 Core + exactly 3 modules     COMPLETE IN DEVELOPMENT
Build 303 umbrella classification      COMPLETE IN DEVELOPMENT
Build 304 Catalog runtime              COMPLETE IN DEVELOPMENT
Build 305 Inventory runtime            COMPLETE IN DEVELOPMENT
Build 307 Inventory reversal service   COMPLETE IN DEVELOPMENT
Build 309 Inventory post authority     COMPLETE IN DEVELOPMENT
```

Build 306 remains historically browser-proven with standalone local signoff not captured in the conversation. Do not silently relabel it.

Build 308 remains browser-proven; its standalone local regression output was not captured before later work began. Do not silently relabel it complete.

## Build 309 — COMPLETE IN DEVELOPMENT

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

Build 309 owns reviewed Creative material posting through:

```text
GET  /api/admin/contracts/inventory-post
POST /api/admin/contracts/inventory-post
functions/api/_lib/inventoryPostService.js
```

The service uses one guarded D1 batch, the existing UNIQUE material-review posting constraint for idempotency, a current-stock snapshot check, physical movement provenance, and fractional usage linkage.

Build 309 local regression and Development browser readiness both passed. No live POST was required.

## Build 310 — STAGED / VALIDATION REQUIRED

Baseline:

```text
ab8089b76d881617bc3ca4768abdb4674afcf3a0
Build 309 set completed post-authority handoff
```

Build 310 migrates only Creative reviewed-material posting consumption to the Inventory-owned Build 309 service.

### Creative posting consumer adapter

```text
functions/api/_lib/creativeInventoryPostConsumer.js
```

Identity:

```text
build      310
consumer   creative
authority  inventory
contract   inventory-post
```

The adapter performs no Inventory mutation SQL. It delegates to `postCreativeInventoryUsage()` and preserves the result shape expected by existing Creative workflows.

### Compatibility routing

The former Build 308 endpoint implementation is preserved unchanged as:

```text
functions/api/admin/creative-process-compat.js
```

The live `functions/api/admin/creative-process.js` is now a narrow Build 310 wrapper.

It intercepts all three current posting workflows:

```text
post_material_inventory
record_inventory_use
correct_inventory_use
```

Those actions cannot reach the old direct posting helper. All unrelated Creative actions are delegated to the preserved compatibility implementation.

### Corrected usage flow

The correction workflow remains:

```text
reverse original posting through inventory-reverse
void superseded event
create corrected event + approved material review
post corrected usage through inventory-post
```

Reversal authority remains Build 307 with Creative consumer Build 308. Posting authority remains Build 309 with Creative consumer Build 310.

### Contract/runtime state

Both Inventory mutation contracts are now represented as:

```text
implementation state   implemented-creative-consumer-enabled
consumer writes ready  true
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

The Commerce runtime still reports:

```text
ownsInventoryMutations false
```

`consumerMutationReady=true` means the approved Creative consumer paths are available; the browser/runtime umbrella itself remains non-mutating.

### Build 310 safety boundary

Build 310 does not modify:

- Build 309 Inventory post service;
- Build 309 Inventory post contract route;
- Build 307 Inventory reversal service;
- Build 307 Inventory reversal route;
- Build 308 Creative reversal adapter;
- legacy broad Inventory mutation endpoint;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- Operations implementation;
- real Production;
- schema/data parity work.

## Build 310 validation

Keep validation concise: one Git Bash block and one browser-console script.

The browser proof must be non-mutating:

1. GET Creative Process metadata;
2. GET Inventory post readiness;
3. send one intentionally invalid `post_material_inventory` request with no IDs/quantity.

That invalid POST must fail before any Inventory write while returning Build 310 consumer metadata, proving the live interceptor is active.

## Next direction after Build 310

After Build 310 is proven, first review retirement of the preserved Creative compatibility copy and the `inventory-cost` contract boundary before migrating Operations.

## Separate schema/data parity track — DO NOT MIX

Fresh-install schema parity remains a separate priority before any Production business-data copy. Do not combine schema/data parity with module extraction.
