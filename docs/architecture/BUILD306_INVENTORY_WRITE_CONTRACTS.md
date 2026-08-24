# Build 306 — Inventory Write-Side Contract Hardening

## Status

STAGED / VALIDATION REQUIRED

Completed Build 305 handoff:

```text
eba6d248a6c3a8725076c3f31b1edbfb0fa5f74e
Build 305 set completed Inventory-runtime handoff
```

Real Devil n Dove Production remains frozen at Build 280.

## Purpose

Build 305 proved Inventory under the active `commerce-operations` top-level runtime using `inventory-read` only.

Build 306 does **not** move Inventory mutations into the umbrella runtime. It formalizes what must be true before cross-module Inventory writes are allowed.

## Existing mutation authority

Current Inventory UI and server code already use:

```text
POST /api/admin/site-item-inventory
action = consume_usage
```

The existing server records Inventory movements and usage movement linkage. Build 306 preserves that implementation unchanged.

## inventory-post

Build 306 records:

```text
contract                 inventory-post
owner                    inventory
consumer                 creative
existing authority       /api/admin/site-item-inventory
authority action         consume_usage
consumer contract ready  false
```

This means the existing Inventory UI/server can continue to perform its proven work, but other modules must not yet treat that generic endpoint as a stable cross-module mutation contract.

A later build can introduce a dedicated contract route/service after request shape, authorization, idempotency, movement identity, error semantics and audit requirements are frozen.

## inventory-reverse

Build 306 explicitly refuses to model reversal as a stock increment.

The contract requires:

```text
original movement id required   true
compensating movement only      true
direct stock add-back allowed   false
consumer contract ready         false
```

No `inventory-reverse` contract route is implemented in Build 306.

A true reversal must preserve the original movement and create a compensating movement with reason/authorization and traceable linkage.

## Inventory write boundary facade

New passive file:

```text
public/js/modules/commerce-operations/inventory-write-boundary.mjs
```

It exposes:

```text
window.DDInventoryWriteBoundary
```

and reports Build 306 contract readiness. It performs no fetch and no mutation.

## Commerce runtime

`commerce-operations/runtime.mjs` advances to Build 306 only to expose write-boundary diagnostics.

Catalog and Inventory runtime ownership remains unchanged:

```text
catalog   -> catalog-read
inventory -> inventory-read
```

The runtime still reports:

```text
ownsInventoryMutations = false
```

and now also reports:

```text
inventoryWriteBoundaryBuild                 306
inventoryConsumerMutationReady              false
inventoryReverseRequiresOriginalMovementId  true
inventoryDirectStockAddBackAllowed          false
```

## Core lifecycle

Build 306 deliberately does not rewrite `dd-admin-module-runtime.mjs`.

The proven Core 305 lifecycle is reused. `admin.js?v=306` reloads it so it sees the Build 306 application catalog and Commerce runtime entry.

This keeps lifecycle risk out of a contract-only pass.

## Safety boundary

Build 306 does not change:

- Core lifecycle implementation;
- existing Inventory mutation server implementation;
- Inventory UI mutation implementation;
- Inventory read contract route;
- Catalog behavior;
- Packaging behavior;
- Operations/Public extraction;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production.

## Completion gate

Build 306 is complete only when:

1. completed Build 305 historical regression passes;
2. Build 306 regression passes;
3. Inventory page serves `admin.js?v=306`;
4. Inventory remains active beneath `commerce-operations`;
5. Commerce facade reports Build 306 write-boundary diagnostics;
6. `inventory-post` remains consumer-not-ready;
7. `inventory-reverse` requires original movement identity and compensation-only behavior;
8. direct stock add-back remains prohibited;
9. existing Inventory mutation implementation remains unchanged;
10. no SQL/config/R2/real Production change occurs.

## Next direction

After Build 306, the next write-side pass should implement a dedicated Inventory posting service/route with stable request and audit semantics. A reversal route should not be introduced until it can create a compensating movement tied to the original movement ID.
