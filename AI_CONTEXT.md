# Devil n Dove AI Context — Build 309 Inventory Post Authority COMPLETE

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
Build 309 Inventory post authority     COMPLETE IN DEVELOPMENT
```

Build 306 remains historically browser-proven with standalone local signoff not captured in the conversation. Do not silently relabel it.

Build 308 remains browser-proven; its local regression signoff was not captured before Build 309 work began. Do not silently relabel it complete.

## Build 307 — completed reversal authority

Completed handoff:

```text
075b905c5fa7960fb7abde410571d840f1983c91
Build 307 set completed reversal-service handoff
```

`inventory-reverse` is Inventory-owned, compensating-only, tied to the original movement, and database-idempotent through the existing Creative reversal ledger.

## Build 308 — Creative reversal consumer cutover

Staged/browser-proven handoff:

```text
6d9a236ae688fe3d4b8e6975b866c637efe51c9b
Build 308 update modular reversal-consumer handoff
```

Development browser proof confirmed Creative reports:

```text
reversal_consumer_build 308
reversal_authority      inventory-reverse
```

Creative no longer owns direct reversal SQL; its reversal workflows delegate to Inventory authority. Local Build 308 regression signoff was not supplied in the conversation.

## Build 309 — COMPLETE IN DEVELOPMENT

Proven runtime/service head:

```text
f23a914c9ea4848c6f91d715ce0c983a06f716b3
Build 309 update modular post-authority handoff
```

Build 309 implements the Inventory-owned reviewed-material posting authority without yet migrating Creative posting consumption.

### Post authority

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

### Posting requirements

```text
creative_work_project_id
creative_work_event_id
site_item_inventory_id
usage_quantity_consumed > 0
matching approved material review
authenticated administrator identity
```

### Atomic Inventory-owned posting

One guarded D1 batch:

```text
1. claim approved review via UNIQUE creative_project_material_review_id posting row
2. apply stock delta
3. insert physical consume movement
4. insert Creative usage-detail provenance
5. insert usage movement linked to the physical movement id
6. mark material review inventory_consumed=1
```

The existing UNIQUE constraint on `creative_project_inventory_posts.creative_project_material_review_id` provides database-level idempotency without new schema.

If stock changes before the claim:

```text
409 inventory_post_stale_stock
```

A pre-existing posting is returned as an idempotent replay.

### Usage semantics

```text
exact / estimated: stock quantity = usage quantity / usage units per stock unit
log_only / reusable: physical stock delta = 0
```

All modes still record usage provenance.

Physical movement provenance remains compatible with Build 308 reversal resolution:

```text
movement_type = consume
note prefix   = Creative Project <project>, event <event>.
```

### Runtime identity

```text
Architecture build              302
Catalog runtime                 304
Inventory runtime               305
Inventory write boundary        309
Commerce runtime                309
Core runtime implementation     305
```

Commerce continues to report:

```text
ownsInventoryMutations false
consumerMutationReady  false
```

The dedicated Inventory contract route owns the mutation authority.

### Reversal remains enabled

```text
inventory-reverse
implementation state   implemented-creative-consumer-enabled
consumer writes ready  true
```

### Completed Build 309 proof

Local regression supplied by the user:

```text
BUILD 309 INVENTORY POST AUTHORITY: PASS
No Cloudflare resource was contacted.
```

Working tree was clean.

Development browser proof observed:

```text
admin_script              ...admin.js?v=309
commerce_runtime_build    309
write_contract_build      309
domain                    inventory
application_module        commerce-operations
post_state                implemented-not-consumer-enabled
post_route                /api/admin/contracts/inventory-post
post_consumer_ready       false
post_atomic_review        true
reverse_state             implemented-creative-consumer-enabled
reverse_consumer_ready    true
api_ok                    true
api_build                 309
api_schema_ready          true
api_missing_tables        <empty>
contracts_ok              true
services_ok               true
```

No live POST was required in Build 309.

### Build 309 safety boundary

Build 309 did not modify:

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

Build 310: migrate **only Creative reviewed-material posting consumption** to the Inventory-owned `inventory-post` service with equivalence/idempotency validation.

Do not combine that cutover with Operations migration.

## Validation interaction preference

Keep validation concise: default to **one Git Bash block and one reusable browser-console script** unless a failure requires deeper isolation.

## Separate schema/data parity track — DO NOT MIX

Fresh-install schema parity remains a separate priority before any Production business-data copy. Do not combine schema/data parity with module extraction.
