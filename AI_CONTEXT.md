# Devil n Dove AI Context — Build 308 Creative Reversal Consumer Cutover

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader roadmap.

Architecture authority:

- `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`
- `docs/architecture/BUILD302_CORE_THREE_MODULE_NORMALIZATION.md`
- `docs/architecture/BUILD303_COMMERCE_OPERATIONS_UMBRELLA_BRIDGE.md`
- `docs/architecture/BUILD304_COMMERCE_OPERATIONS_CATALOG_RUNTIME.md`
- `docs/architecture/BUILD305_COMMERCE_OPERATIONS_INVENTORY_RUNTIME.md`
- `docs/architecture/BUILD306_INVENTORY_WRITE_CONTRACTS.md`
- `docs/architecture/BUILD307_INVENTORY_COMPENSATING_REVERSAL_SERVICE.md`
- `docs/architecture/BUILD308_CREATIVE_REVERSAL_CONSUMER_CUTOVER.md`
- `BUILD307_VALIDATION.md`
- `BUILD308_VALIDATION.md`

**Real Devil n Dove Production is frozen at Build 280 unless deliberately promoted through the separate Production workflow.**

## Authoritative structure

```text
                     DEVIL N DOVE APPLICATION CORE
                               |
              +----------------+----------------+
              |                |                |
       COMMERCE &         CREATIVE &       BUSINESS &
       OPERATIONS          PRODUCTION      ADMINISTRATION
```

Domains remain explicit ownership/service boundaries beneath those exactly three top-level modules.

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

Proven Build 307 runtime/service head:

```text
f1cc11000b0c90944c4224b6c0002ddab7063876
```

Build 307 provides the Inventory-owned reversal authority:

```text
GET/POST /api/admin/contracts/inventory-reverse
```

It requires the original physical movement, Creative posting, typed confirmation, compensating-only reversal, UNIQUE ledger idempotency and stale-stock protection. Build 307 added no SQL/schema.

Development proof showed the required reversal schema present and no missing tables. Local regression passed and the working tree was clean.

## Build 306 historical note

Build 306 write-contract readiness was browser-proven, but its standalone local regression output was not separately supplied before Build 307 superseded the reversal-service staging work. Do not retroactively label Build 306 COMPLETE without an explicit policy decision or historical proof.

## Build 308 — STAGED / VALIDATION REQUIRED

Build 308 migrates only **Creative reversal consumption** to the proven Inventory-owned Build 307 authority.

### New Creative consumer adapter

```text
functions/api/_lib/creativeInventoryReversalConsumer.js
```

The adapter performs no reversal mutation SQL. It:

1. loads the Creative inventory posting;
2. preserves idempotent already-reversed behavior;
3. resolves exactly one matching original `consume` movement;
4. fails closed when the movement is missing or ambiguous;
5. delegates to `reverseCreativeInventoryPost()` in the frozen Build 307 Inventory service;
6. adapts the result back to the existing Creative helper shape.

### Creative Process cutover

`functions/api/admin/creative-process.js` keeps the historical Creative engine identity:

```text
build = 274
```

but now exposes:

```text
inventory_reversal_consumer_build = 308
inventory_reversal_authority = inventory-reverse
```

Its `reverseInventoryPost()` helper now delegates to the consumer adapter. Existing callers remain:

```text
void_event
correct_inventory_use
reverse_material_inventory
```

The retired Creative direct reversal SQL is removed.

### Original movement resolution

Because older Creative posts do not persist the physical movement ID directly, the Build 308 adapter matches the original movement using all available provenance:

- same Inventory item;
- `consume` movement type;
- negative posted stock delta;
- same previous/new on-hand values;
- same Creative project/event in the movement note;
- same actor when available.

```text
0 matches  -> block
1 match    -> delegate to Inventory
>1 matches -> block for review
```

Creative never guesses an original movement.

### Contract state

`inventory-reverse` now records:

```text
implementation state  implemented-creative-consumer-enabled
consumer writes ready true
```

Guardrails remain:

```text
requires original movement id  true
requires Creative posting id   true
compensating movement only      true
direct stock add-back allowed  false
confirmation                    REVERSE INVENTORY
```

`inventory-post` remains unchanged:

```text
implementation state  existing-authority-not-yet-contract-route
consumer writes ready false
```

### Frozen Build 307 authority

Build 308 deliberately does not change:

```text
functions/api/_lib/inventoryReversalService.js
functions/api/admin/contracts/inventory-reverse.js
```

Therefore the safe Build 307 readiness GET may still identify its own implementation state as `implemented-not-consumer-enabled`. Build 308 consumer activation is represented by the Creative API identity and Build 308 contract catalog; the proven mutation service itself remains frozen.

### Build 308 safety boundary

Expected changed files are exactly those in `BUILD308_CHANGED_FILES.md`.

No changes to:

- Inventory-owned Build 307 reversal mutation logic;
- legacy `site-item-inventory` mutation endpoint;
- Creative inventory-post implementation;
- Core lifecycle;
- Catalog;
- Packaging;
- Operations extraction;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production.

## Next direction after Build 308

After Build 308 is proven, extract **inventory-post** as its own Inventory-owned contract/service pass. Do not combine posting extraction with Operations migration.

## Validation interaction preference

Keep validation concise: default to **one GIT BASH block and one reusable BROWSER DEVTOOLS CONSOLE IIFE** unless a failure requires deeper isolation.

## Separate schema/data parity track — DO NOT MIX

Fresh-install schema parity remains a separate priority before any Production business-data copy. Do not combine schema/data parity with module extraction.
