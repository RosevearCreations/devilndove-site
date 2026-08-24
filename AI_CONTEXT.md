# Devil n Dove AI Context — Build 309 Inventory Post Authority

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
- `BUILD307_VALIDATION.md`
- `BUILD308_VALIDATION.md`
- `BUILD309_VALIDATION.md`

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
```

Completed Build 307 handoff:

```text
075b905c5fa7960fb7abde410571d840f1983c91
Build 307 set completed reversal-service handoff
```

Build 306 remains historically browser-proven with standalone local signoff not captured in the conversation. Do not silently relabel it.

## Build 308 — BROWSER PROVEN / LOCAL SIGNOFF PENDING

Build 308 staged handoff:

```text
6d9a236ae688fe3d4b8e6975b866c637efe51c9b
Build 308 update modular reversal-consumer handoff
```

Development browser proof passed:

```text
pathname                          /admin/creative-process/
creative_ok                       true
creative_engine_build             274
reversal_consumer_build           308
reversal_authority                inventory-reverse
inventory_authority_ok            true
inventory_authority_build         307
inventory_authority_state         implemented-not-consumer-enabled
inventory_authority_schema_ready  true
inventory_authority_missing       <empty>
```

Build 308 changes only Creative reversal consumption:

- `creativeInventoryReversalConsumer.js` resolves exactly one matching original Creative `consume` movement;
- Creative's former direct reversal SQL delegates to the Inventory-owned Build 307 service;
- timeline void, usage correction, and explicit reversal callers keep their existing Creative API/UI behavior;
- `inventory-reverse` contract is marked `implemented-creative-consumer-enabled` / `consumerWritesReady=true` in cross-module metadata;
- `inventory-post` remained untouched in Build 308.

Do not mark Build 308 complete until its local regression output is supplied or a deliberate documented signoff policy supersedes that requirement.

## Build 309 — STAGED / VALIDATION REQUIRED

Build 309 implements the Inventory-owned reviewed-material posting authority without migrating Creative posting consumption.

Baseline:

```text
6d9a236ae688fe3d4b8e6975b866c637efe51c9b
Build 308 update modular reversal-consumer handoff
```

### New post authority

```text
GET  /api/admin/contracts/inventory-post
POST /api/admin/contracts/inventory-post
```

Service:

```text
functions/api/_lib/inventoryPostService.js
```

Contract state:

```text
owner                  inventory
consumer               creative
implementation state   implemented-not-consumer-enabled
consumer writes ready  false
```

### Posting requirements

The service requires:

```text
creative_work_project_id
creative_work_event_id
site_item_inventory_id
usage_quantity_consumed > 0
a matching approved material review
authenticated administrator identity
```

Creative consumer migration is deliberately disabled in Build 309.

### Atomic posting transaction

The Inventory service performs one guarded D1 batch:

```text
1. claim approved review through UNIQUE creative_project_material_review_id posting row
2. apply stock delta
3. insert physical consume movement
4. insert Creative usage detail
5. insert fractional usage movement linked to the physical movement id
6. mark material review inventory_consumed=1
```

The existing schema already provides:

```text
UNIQUE(creative_project_material_review_id)
```

so no new schema is added.

The claim is also conditioned on the current stock snapshot. If stock changes first, the service returns:

```text
409 inventory_post_stale_stock
```

A pre-existing posting is returned as an idempotent replay.

### Usage semantics preserved

```text
exact / estimated: stock quantity = usage quantity / usage units per stock unit
log_only / reusable: physical stock delta = 0
```

All modes still write usage provenance.

Physical movement provenance remains compatible with Build 308 reversal resolution:

```text
movement_type = consume
note prefix   = Creative Project <project>, event <event>.
```

### Runtime metadata

```text
Architecture build              302
Catalog runtime                 304
Inventory runtime               305
Inventory write boundary        309
Commerce runtime                309
Core runtime implementation     305
```

Commerce still reports:

```text
ownsInventoryMutations false
consumerMutationReady  false
```

The dedicated Inventory contract route owns mutation authority, not the umbrella runtime.

### Reversal remains enabled

```text
inventory-reverse
implementation state   implemented-creative-consumer-enabled
consumer writes ready  true
```

Build 309 does not alter the Build 307 reversal service or Build 308 Creative reversal adapter.

### Build 309 safety boundary

Build 309 does not modify:

- `functions/api/admin/creative-process.js`;
- `functions/api/_lib/creativeInventoryReversalConsumer.js`;
- `functions/api/_lib/inventoryReversalService.js`;
- `functions/api/admin/contracts/inventory-reverse.js`;
- `functions/api/admin/site-item-inventory.js`;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production.

## Next direction after Build 309

After Build 309 is proven, migrate **only Creative reviewed-material posting consumption** to `inventory-post` with equivalence/idempotency validation.

Do not combine that cutover with Operations migration.

## Validation interaction preference

Keep validation concise: default to **one Git Bash block and one reusable browser-console script** unless a failure requires deeper isolation.

## Separate schema/data parity track — DO NOT MIX

Fresh-install schema parity remains a separate priority before any Production business-data copy. Do not combine schema/data parity with module extraction.
