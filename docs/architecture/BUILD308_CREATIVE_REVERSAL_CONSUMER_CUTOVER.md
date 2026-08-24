# Build 308 — Creative Reversal Consumer Cutover

## Status — STAGED / VALIDATION REQUIRED

Baseline:

```text
075b905c5fa7960fb7abde410571d840f1983c91
Build 307 set completed reversal-service handoff
```

Build 307 proved the Inventory-owned compensating reversal authority. Build 308 changes only the Creative consumer so that Creative no longer owns reversal mutation SQL.

## Before Build 308

`functions/api/admin/creative-process.js` contained a local `reverseInventoryPost()` implementation that directly:

- updated `site_item_inventory`;
- inserted a physical reversal movement;
- inserted `creative_project_inventory_reversals`;
- marked the Creative posting reversed;
- cleared `inventory_consumed`;
- inserted the usage reversal.

Three Creative workflows used that helper:

```text
void_event
correct_inventory_use
reverse_material_inventory
```

## Build 308 consumer boundary

New adapter:

```text
functions/api/_lib/creativeInventoryReversalConsumer.js
```

It owns no reversal mutation SQL.

It performs only consumer-side work:

1. load the Creative inventory posting;
2. preserve idempotent already-reversed behavior;
3. resolve exactly one original `consume` Inventory movement;
4. fail closed if the movement is missing or ambiguous;
5. call the proven Inventory-owned `reverseCreativeInventoryPost()` service;
6. adapt the result to the existing Creative helper result shape.

The existing Creative helper becomes:

```js
async function reverseInventoryPost(db,{projectId,postId,reason,userId}){
  return reverseCreativeInventoryThroughContract(db,{projectId,postId,reason,userId});
}
```

The three Creative workflows therefore keep their existing UI/action behavior while the mutation authority moves to Inventory.

## Original movement resolution

Legacy Creative posting did not persist the physical movement ID directly on the Creative post. Build 308 therefore resolves the original movement by requiring all available posting provenance to match:

- same Inventory item;
- `consume` movement type;
- stock delta equals the negative posted stock quantity;
- same previous on-hand quantity;
- same new on-hand quantity;
- movement note identifies the same Creative project and event;
- same actor when the posting actor is available.

Resolution is deliberately strict:

```text
0 matches  -> blocked
1 match    -> delegate to Inventory authority
>1 matches -> blocked for review
```

Build 308 never guesses which movement to reverse.

## Inventory authority remains frozen

Build 308 does not modify:

```text
functions/api/_lib/inventoryReversalService.js
functions/api/admin/contracts/inventory-reverse.js
```

The proven Build 307 service remains the mutation authority, including:

- original-movement validation;
- typed confirmation;
- compensating-delta behavior;
- UNIQUE reversal ledger idempotency;
- request-correlated D1 batch transaction;
- stale-stock protection.

## Contract state

`inventory-reverse` now records:

```text
implementation state  implemented-creative-consumer-enabled
consumer writes ready true
```

Its safety requirements remain:

```text
requires original movement id  true
requires Creative posting id   true
compensating movement only      true
direct stock add-back allowed  false
confirmation                    REVERSE INVENTORY
```

`inventory-post` remains:

```text
implementation state  existing-authority-not-yet-contract-route
consumer writes ready false
```

Build 308 does not extract posting authority.

## Creative API identity

The historical Creative Process engine remains Build 274, while its reversal-consumer identity is exposed separately:

```text
build                              274
inventory_reversal_consumer_build  308
inventory_reversal_authority       inventory-reverse
```

This avoids falsely relabeling the whole Creative Process engine as Build 308.

## Safety boundary

Build 308 does not change:

- Inventory-owned Build 307 reversal mutation logic;
- legacy Inventory posting/consume implementation;
- Creative material-posting behavior;
- Operations extraction;
- Core lifecycle;
- Catalog;
- Packaging;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production.

## Validation rule

Do not run a live reversal merely to validate Build 308. The source regression proves the consumer delegation and the Development browser uses safe authenticated GET calls to prove the deployed Creative consumer identity and the still-healthy Build 307 Inventory authority.

After Build 308 is proven, the next Inventory extraction should be `inventory-post` as its own bounded build. Do not combine posting extraction with Operations migration.
