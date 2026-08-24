# Build 307 — Inventory-Owned Compensating Reversal Service

## Status — COMPLETE IN DEVELOPMENT

Proven Build 307 runtime/service head:

```text
f1cc11000b0c90944c4224b6c0002ddab7063876
Build 307 update modular reversal-service handoff
```

Build 307 implements the first dedicated `inventory-reverse` contract route while deliberately leaving Creative Process on its existing compatibility reversal path.

Baseline:

```text
c8ea00e57cb906cc671fc15727ed2c8cd8b63dab
Build 306 harden Build 305 historical proof markers
```

Build 306 remains browser-proven with its own local completion signoff pending; Build 307 completion does not retroactively relabel Build 306.

Real Devil n Dove Production remains frozen at Build 280.

## Purpose

Build 306 defined the required safety contract:

```text
inventory-reverse
  requires original movement id
  compensating movement only
  direct stock add-back forbidden
  consumer writes disabled
```

Build 307 supplies the missing Inventory-owned service:

```text
POST /api/admin/contracts/inventory-reverse
GET  /api/admin/contracts/inventory-reverse
```

The service is implemented but not yet enabled for Creative consumers:

```text
implementation_state = implemented-not-consumer-enabled
consumer_writes_ready = false
```

This separates authority implementation from consumer migration.

## Existing authority reused

Build 307 adds no schema.

The current only `inventory-reverse` consumer is `creative`. The existing table:

```text
creative_project_inventory_reversals
```

already contains:

```text
creative_project_inventory_post_id INTEGER NOT NULL UNIQUE
```

so the database already guarantees no more than one reversal ledger row per Creative inventory posting.

Build 307 reuses that proven ledger rather than creating another reversal table.

## Required request provenance

A reversal request must supply:

```text
creative_work_project_id
creative_project_inventory_post_id
original_site_inventory_movement_id
reason                         >= 8 characters
confirmation                   REVERSE INVENTORY
```

The authenticated administrator becomes the authorizing user; the caller cannot choose another `authorized_by` identity.

## Original-movement validation

The Inventory-owned service loads both the Creative posting and the supplied physical Inventory movement.

The movement is accepted only when it matches the post on all relevant facts:

- same `site_item_inventory_id`;
- movement type is `consume`;
- movement quantity delta equals the negative posted stock consumption;
- previous stock equals the Creative posting previous stock;
- new stock equals the Creative posting new stock;
- movement note identifies the same Creative project and event;
- posting actor and movement actor match when both are available.

This prevents a caller from supplying an unrelated movement ID merely because it belongs to the same inventory item.

## Compensating-delta rule

Build 307 never restores an old absolute stock count.

Instead:

```text
current on-hand + original posted stock consumption
```

is the compensating correction.

That preserves valid Inventory activity that may have happened after the original Creative posting.

For `log_only` or `reusable` usage, stock restoration can legitimately be zero while the usage quantity is still reversed.

## Request-correlated transaction

The existing Creative reversal ledger has no request-token column. Build 307 therefore generates a unique request marker and writes it into:

- the reversal ledger reason;
- the compensating physical movement note;
- the compensating usage movement note.

Every downstream statement in the batch requires the exact ledger row for that request marker.

The transaction is ordered:

```text
1. claim UNIQUE reversal ledger row, conditioned on the current stock snapshot
2. add the compensating stock delta
3. insert correction movement
4. insert positive usage movement linked to that correction movement
5. mark Creative inventory post reversed
6. clear material-review inventory_consumed
```

If concurrent work already created a reversal, the unique constraint causes the transaction to fail and the service returns the existing reversal as an idempotent replay.

If current Inventory changes before the transaction acquires its claim, the ledger insert changes zero rows and the service returns:

```text
409 inventory_reversal_stale_stock
```

The caller must refresh and retry rather than apply a stale correction.

## D1 transaction boundary

The six statements use D1 `batch()` as one transaction. A failed statement rolls the batch back; Build 307 also verifies that the first ledger claim changed exactly one row before treating the reversal as successful.

## Audit boundary

Successful first reversals and idempotent replay attempts are recorded through `admin_action_audit`.

Unexpected server failures are sent through the existing runtime-incident mechanism.

## Safe GET readiness

`GET /api/admin/contracts/inventory-reverse` does not mutate Inventory.

It reports:

```text
build                         307
contract                      inventory-reverse
owner                         inventory
implementation_state          implemented-not-consumer-enabled
consumer_writes_ready         false
requires_original_movement_id true
requires_creative_posting_id  true
compensating_movement_only    true
direct_stock_add_back_allowed false
confirmation_required         REVERSE INVENTORY
schema_ready                  true/false
missing_tables                [...]
```

The completed Development browser proof used this GET route only.

Observed:

```text
api_ok             true
api_build          307
api_state          implemented-not-consumer-enabled
api_consumer_ready false
api_schema_ready   true
api_missing_tables <empty>
```

No live reversal POST was required for Build 307 because no consumer is migrated yet.

## Runtime metadata

Architecture build remains:

```text
302
```

Historical runtime identities remain:

```text
Catalog runtime   304
Inventory runtime 305
```

Write-contract/service identity is:

```text
INVENTORY_WRITE_CONTRACT_BUILD = 307
Commerce runtime build          = 307
```

The Inventory route remains:

```text
domain                    inventory
application module        commerce-operations
required runtime service  inventory-read
```

The umbrella runtime still records:

```text
ownsInventoryMutations         false
inventoryConsumerMutationReady false
```

The Inventory-owned endpoint performs mutation authority; the umbrella runtime itself does not.

## Completed proof

Local regression ended:

```text
BUILD 307 INVENTORY COMPENSATING REVERSAL SERVICE: PASS
No Cloudflare resource was contacted.
```

The working tree was clean.

Development browser proof matched every Build 307 target, including `admin.js?v=307`, active Inventory under Commerce & Operations, implemented reversal readiness, schema readiness, and fail-closed consumer migration.

## Compatibility boundary

Build 307 did not modify:

- `functions/api/admin/creative-process.js`;
- `functions/api/admin/site-item-inventory.js`;
- Build 217/244 Inventory schema;
- `database_full_schema.sql`;
- Core lifecycle implementation;
- Catalog behavior;
- Packaging behavior;
- Cloudflare bindings/config;
- R2;
- real Production.

The existing Creative reversal helper remains the compatibility fallback until a later build switches the consumer to the new contract.

## Next bounded pass

Migrate **only Creative reversal consumption** to the Inventory-owned route/service, with equivalence and idempotency tests. Do not combine that consumer cutover with `inventory-post` extraction or Operations migration.
