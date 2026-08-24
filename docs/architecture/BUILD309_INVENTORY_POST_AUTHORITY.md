# Build 309 — Inventory-Owned Post Authority

## Status — STAGED / VALIDATION REQUIRED

Build 309 implements a dedicated Inventory-owned `inventory-post` contract route for reviewed Creative material usage while deliberately leaving Creative Process on its current posting path until a separate consumer-cutover build.

Baseline:

```text
6d9a236ae688fe3d4b8e6975b866c637efe51c9b
Build 308 update modular reversal-consumer handoff
```

Build 308 is browser-proven; its local regression signoff remains pending.

Real Devil n Dove Production remains frozen at Build 280.

## Purpose

Before Build 309, `inventory-post` was only described as an existing authority through the broad legacy Inventory endpoint. Creative Process also retained its own direct reviewed-material posting implementation.

Build 309 creates a dedicated Inventory-owned authority:

```text
GET  /api/admin/contracts/inventory-post
POST /api/admin/contracts/inventory-post
```

Contract state:

```text
owner                  inventory
consumer               creative
implementation state   implemented-not-consumer-enabled
consumer writes ready  false
```

Creative posting behavior does not change in this build.

## Inventory-owned posting service

New service:

```text
functions/api/_lib/inventoryPostService.js
```

Required input:

```text
creative_work_project_id
creative_work_event_id
site_item_inventory_id
usage_quantity_consumed > 0
notes optional
authorized_by supplied by authenticated admin route
```

The service requires the matching Creative material review to exist and be approved.

## Tracking-mode preservation

The service preserves the established Inventory usage modes:

```text
exact
estimated
log_only
reusable
```

For exact/estimated usage:

```text
stock quantity consumed = usage quantity / usage units per stock unit
```

For log-only/reusable usage:

```text
stock quantity consumed = 0
```

Usage is still recorded even when physical stock is unchanged.

## Atomic reviewed-material posting

Build 309 improves the old multi-step Creative posting pattern by performing the authoritative mutation as one guarded D1 batch.

Transaction order:

```text
1. claim the approved Creative material review by inserting its UNIQUE inventory-post row
2. reduce physical on-hand stock by the calculated delta
3. insert the physical `consume` movement
4. insert Creative usage-detail provenance
5. insert fractional usage movement linked to the physical movement id
6. mark the material review inventory_consumed=1
```

The first posting row is conditioned on:

- the review still being approved;
- `inventory_consumed=0`;
- the Inventory item still being active;
- current stock still matching the pre-read snapshot;
- no existing posting for the material review.

The existing schema provides:

```text
UNIQUE(creative_project_material_review_id)
```

on `creative_project_inventory_posts`, giving the posting claim database-level idempotency without adding schema.

## Race and retry behavior

If another request already posted the same review, the service returns the existing posting as an idempotent replay.

If stock changed before the guarded claim, the service returns:

```text
409 inventory_post_stale_stock
```

The caller must refresh instead of applying a stale stock calculation.

## Movement provenance

The physical movement uses:

```text
movement_type = consume
note prefix   = Creative Project <project>, event <event>.
```

This preserves the provenance format used by the Build 308 reversal consumer to resolve the original movement later.

The fractional usage movement stores the generated `site_inventory_movement_id`, improving linkage compared with the older Creative posting path.

## Safe readiness GET

The GET route is authenticated and non-mutating. It reports:

```text
build                         309
contract                      inventory-post
owner                         inventory
implementation_state          implemented-not-consumer-enabled
consumer_writes_ready         false
requires_approved_material_review true
requires_positive_usage_quantity  true
supports_fractional_usage     true
supports_log_only             true
supports_reusable             true
atomic_review_posting         true
schema_ready                  true/false
missing_tables                [...]
```

## Runtime metadata

Architecture remains:

```text
Core architecture             302
Catalog runtime               304
Inventory runtime             305
Inventory write boundary      309
Commerce runtime              309
Core runtime implementation   305
```

The Commerce umbrella runtime still performs no stock mutation itself:

```text
ownsInventoryMutations   false
consumerMutationReady    false
```

The dedicated Inventory contract route owns the mutation.

## Reversal state remains intact

Build 308 reversal consumption remains:

```text
inventory-reverse
implementation state   implemented-creative-consumer-enabled
consumer writes ready  true
```

Build 309 does not modify the Build 307 reversal service or the Build 308 Creative reversal consumer adapter.

## Compatibility boundary

Build 309 intentionally does not modify:

- `functions/api/admin/creative-process.js`;
- `functions/api/_lib/creativeInventoryReversalConsumer.js`;
- `functions/api/_lib/inventoryReversalService.js`;
- `functions/api/admin/contracts/inventory-reverse.js`;
- `functions/api/admin/site-item-inventory.js`;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production.

## Next bounded pass

After Build 309 is proven, migrate only Creative's reviewed-material posting consumer to the Inventory-owned `inventory-post` service with equivalence/idempotency tests.

Do not combine that consumer cutover with Operations migration or schema/data-parity work.
