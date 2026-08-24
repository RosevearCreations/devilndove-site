# Build 310 — Creative Inventory Post Consumer Cutover

## Status — COMPLETE IN DEVELOPMENT

Baseline:

```text
ab8089b76d881617bc3ca4768abdb4674afcf3a0
Build 309 set completed post-authority handoff
```

Proven runtime/source head:

```text
c55f72b73941e0a568591c6a1125bc360a86a8f9
Build 310 update modular posting-consumer handoff
```

Real Devil n Dove Production remains frozen at Build 280.

## Purpose

Build 310 migrates Creative reviewed-material posting consumption to the Inventory-owned Build 309 `inventory-post` authority while preserving existing Creative UI/API behavior.

Final authority paths:

```text
Creative reviewed-material posting -> inventory-post
Creative reversal                  -> inventory-reverse
```

Both mutation authorities are owned by Inventory. The Commerce & Operations umbrella exposes readiness only and performs no Inventory mutation itself.

## Compatibility routing

The previous Creative implementation is preserved as:

```text
functions/api/admin/creative-process-compat.js
```

The live route is a narrow Build 310 wrapper:

```text
functions/api/admin/creative-process.js
```

It intercepts all three current posting workflows before legacy compatibility logic:

```text
post_material_inventory
record_inventory_use
correct_inventory_use
```

All unrelated Creative actions continue through the preserved compatibility implementation.

## Consumer adapter

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

The adapter owns no Inventory SQL. It delegates to the frozen Build 309 `inventoryPostService.js` and preserves the result shape used by existing Creative callers.

## Posting and reversal state

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

Correction remains:

```text
reverse original posting
-> void superseded event
-> create corrected event + approved review
-> post corrected usage through inventory-post
```

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

Commerce still reports `ownsInventoryMutations=false`. `consumerMutationReady=true` means approved consumer paths exist, not that the browser/runtime umbrella mutates stock.

## Proven Development validation

Both validation gates passed:

- local Build 310 regression: PASS;
- Development browser proof: PASS.

The browser test used an intentionally invalid `post_material_inventory` request with no required IDs/quantity. It returned the expected controlled 400 with Build 310 metadata, proving the live interceptor was active before any Inventory write.

## Exclusions

Build 310 did not modify:

- Build 309 Inventory post authority implementation;
- Build 307 Inventory reversal authority implementation;
- Build 308 Creative reversal consumer adapter;
- legacy broad Inventory mutation endpoint;
- Operations implementation;
- `inventory-cost` implementation;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production;
- schema/data parity work.

## Next direction

Before Operations joins the Commerce & Operations umbrella runtime, perform a bounded review of:

1. whether `creative-process-compat.js` can be retired without losing unrelated Creative behavior;
2. whether `inventory-cost` should become the next explicit Inventory-owned read contract.

Do not combine that review with Operations migration or schema/data parity work.