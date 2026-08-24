# Build 309 — Inventory-Owned Post Authority

## Status — COMPLETE IN DEVELOPMENT

Proven runtime/service head:

```text
f23a914c9ea4848c6f91d715ce0c983a06f716b3
Build 309 update modular post-authority handoff
```

Real Devil n Dove Production remains frozen at Build 280.

## Purpose

Build 309 creates the dedicated Inventory-owned authority for reviewed Creative material usage:

```text
GET  /api/admin/contracts/inventory-post
POST /api/admin/contracts/inventory-post
```

Service:

```text
functions/api/_lib/inventoryPostService.js
```

Contract state proven in Development:

```text
owner                  inventory
consumer               creative
implementation state   implemented-not-consumer-enabled
consumer writes ready  false
```

Creative posting behavior is deliberately unchanged in Build 309.

## Posting requirements

The service requires:

```text
creative_work_project_id
creative_work_event_id
site_item_inventory_id
usage_quantity_consumed > 0
a matching approved material review
authenticated administrator identity
```

## Tracking-mode preservation

```text
exact / estimated: stock quantity consumed = usage quantity / usage units per stock unit
log_only / reusable: physical stock quantity consumed = 0
```

Usage provenance is still recorded for every mode.

## Atomic reviewed-material posting

The Inventory service performs one guarded D1 batch:

```text
1. claim approved review through UNIQUE creative_project_material_review_id posting row
2. apply stock delta
3. insert physical consume movement
4. insert Creative usage-detail provenance
5. insert fractional usage movement linked to the physical movement id
6. mark material review inventory_consumed=1
```

The existing UNIQUE constraint on `creative_project_inventory_posts.creative_project_material_review_id` provides database-level idempotency without new schema.

The claim is conditioned on the approved review, active Inventory item, current stock snapshot, and absence of an existing posting. Stale stock returns:

```text
409 inventory_post_stale_stock
```

A pre-existing posting is returned as an idempotent replay.

## Movement provenance

The physical movement remains compatible with the Build 308 reversal resolver:

```text
movement_type = consume
note prefix   = Creative Project <project>, event <event>.
```

The fractional usage movement stores the generated `site_inventory_movement_id`.

## Runtime identity

```text
Core architecture             302
Catalog runtime               304
Inventory runtime             305
Inventory write boundary      309
Commerce runtime              309
Core runtime implementation   305
```

The Commerce umbrella runtime still performs no mutation itself:

```text
ownsInventoryMutations false
consumerMutationReady  false
```

The dedicated Inventory contract route owns the mutation authority.

## Reversal state preserved

```text
inventory-reverse
implementation state   implemented-creative-consumer-enabled
consumer writes ready  true
```

Build 309 does not modify the Build 307 reversal service or Build 308 Creative reversal adapter.

## Completed proof

Local regression:

```text
BUILD 309 INVENTORY POST AUTHORITY: PASS
No Cloudflare resource was contacted.
```

Development browser proof confirmed:

```text
admin.js?v=309
Commerce runtime 309
write boundary 309
inventory-post implemented-not-consumer-enabled
post consumer ready false
atomic review posting true
inventory-reverse implemented-creative-consumer-enabled
reverse consumer ready true
schema ready true
missing tables none
contracts/services true / true
```

## Compatibility boundary

Build 309 intentionally does not modify:

- Creative posting consumption;
- Build 308 reversal consumer;
- Build 307 reversal authority;
- legacy broad Inventory mutation endpoint;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production.

## Next bounded pass

Build 310 should migrate only Creative reviewed-material posting consumption to the Inventory-owned `inventory-post` service with equivalence/idempotency validation.

Do not combine that cutover with Operations migration or schema/data-parity work.
