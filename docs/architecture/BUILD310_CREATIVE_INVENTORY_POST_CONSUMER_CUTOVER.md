# Build 310 — Creative Inventory Post Consumer Cutover

## Status — STAGED / VALIDATION REQUIRED

Baseline:

```text
ab8089b76d881617bc3ca4768abdb4674afcf3a0
Build 309 set completed post-authority handoff
```

Build 309 is COMPLETE IN DEVELOPMENT. Real Devil n Dove Production remains frozen at Build 280.

## Purpose

Build 310 migrates only Creative reviewed-material posting consumption to the Inventory-owned Build 309 `inventory-post` authority.

After this build:

```text
Creative reviewed-material posting -> inventory-post
Creative reversal                  -> inventory-reverse
```

Both mutation authorities remain owned by Inventory. The Commerce & Operations umbrella reports readiness but performs no mutation itself.

## Compatibility routing

The former Build 308 Creative endpoint implementation is preserved unchanged as:

```text
functions/api/admin/creative-process-compat.js
```

The live route becomes a narrow Build 310 wrapper:

```text
functions/api/admin/creative-process.js
```

The wrapper intercepts exactly the three current Creative workflows that can create a reviewed Inventory posting:

```text
post_material_inventory
record_inventory_use
correct_inventory_use
```

Those actions cannot reach the old direct posting helper. All unrelated Creative Process actions are delegated to the preserved compatibility implementation.

## Creative consumer adapter

New adapter:

```text
functions/api/_lib/creativeInventoryPostConsumer.js
```

It performs no stock/movement SQL. It delegates to:

```text
functions/api/_lib/inventoryPostService.js
Build 309
```

and preserves the result shape expected by existing Creative UI/API callers:

```text
item
trackingMode
perStock
stockQuantity
previous
next
allocatedCostCents
```

It also exposes:

```text
consumerBuild = 310
authority = inventory
contract = inventory-post
postId
originalMovementId
```

## Posting behavior preserved

The existing Creative workflows continue to provide the same user-visible behavior:

- explicit approved material posting;
- direct actual-usage shortcut, which creates its timeline event and approved material review first;
- correction flow, which reverses the original posting, voids the superseded event, creates the corrected event/review, then posts the corrected usage.

Only the Inventory mutation authority changes.

## Build 309 authority remains frozen

Build 310 does not modify:

```text
functions/api/_lib/inventoryPostService.js
functions/api/admin/contracts/inventory-post.js
```

The Build 309 guarded D1 batch, stock snapshot check, review claim, UNIQUE idempotency, movement linkage, and fractional usage provenance remain authoritative.

## Reversal authority remains intact

Build 310 also does not modify:

```text
functions/api/_lib/inventoryReversalService.js
functions/api/admin/contracts/inventory-reverse.js
functions/api/_lib/creativeInventoryReversalConsumer.js
```

The correction flow continues to reverse through the Build 307/308 Inventory-owned reversal path before posting corrected usage through Build 309/310.

## Cross-module contract state

Build 310 records both mutation contracts as:

```text
implementation state   implemented-creative-consumer-enabled
consumer writes ready  true
```

The Inventory write boundary reports:

```text
post consumer ready        true
reverse consumer ready     true
consumer mutation ready    true
mutatesInventory           false
```

`consumer mutation ready` means the approved consumer paths are available. It does not mean the browser/runtime umbrella performs mutations.

## Runtime identity

```text
Core architecture             302
Catalog runtime               304
Inventory runtime             305
Inventory write boundary      310
Commerce runtime              310
Core runtime implementation   305
Creative post consumer        310
Creative reversal consumer    308
Inventory post authority      309
Inventory reversal authority  307
```

## Safe Development validation

No live stock change is required to prove the cutover.

The browser validation uses:

1. authenticated GET `/api/admin/creative-process` to confirm Build 310 posting-consumer metadata;
2. authenticated GET `/api/admin/contracts/inventory-post` to confirm Build 309 authority/schema readiness;
3. an intentionally invalid `post_material_inventory` POST with no project/event/item IDs.

The invalid POST must return a controlled validation error carrying Build 310 consumer metadata. Because required IDs are absent, no Inventory write can occur.

## Exclusions

Build 310 does not migrate:

- Operations;
- `inventory-cost`;
- Catalog business rules;
- Packaging;
- Content/CAIP business rules;
- legacy broad Inventory mutation endpoint;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production;
- schema/data parity work.

## Next direction

After Build 310 is proven, do not immediately fold Operations into the umbrella. First review whether the legacy Creative compatibility copy can be retired safely and whether `inventory-cost` should become the next explicit Inventory contract boundary.
