# Devil n Dove AI Context — Build 307 Inventory Compensating Reversal Service

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader roadmap.

Current modular architecture authority:

- `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`
- `docs/architecture/BUILD302_CORE_THREE_MODULE_NORMALIZATION.md`
- `docs/architecture/BUILD303_COMMERCE_OPERATIONS_UMBRELLA_BRIDGE.md`
- `docs/architecture/BUILD304_COMMERCE_OPERATIONS_CATALOG_RUNTIME.md`
- `docs/architecture/BUILD305_COMMERCE_OPERATIONS_INVENTORY_RUNTIME.md`
- `docs/architecture/BUILD306_INVENTORY_WRITE_CONTRACTS.md`
- `docs/architecture/BUILD307_INVENTORY_COMPENSATING_REVERSAL_SERVICE.md`
- `BUILD306_VALIDATION.md`
- `BUILD307_VALIDATION.md`

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

Internal domains remain explicit ownership/service boundaries.

## Completed modular baselines

```text
Build 301 Packaging compatibility      COMPLETE IN DEVELOPMENT
Build 302 Core + exactly 3 modules     COMPLETE IN DEVELOPMENT
Build 303 umbrella classification      COMPLETE IN DEVELOPMENT
Build 304 Catalog runtime              COMPLETE IN DEVELOPMENT
Build 305 Inventory runtime            COMPLETE IN DEVELOPMENT
Build 307 Inventory reversal service   COMPLETE IN DEVELOPMENT
```

Completed Build 305 handoff:

```text
eba6d248a6c3a8725076c3f31b1edbfb0fa5f74e
Build 305 set completed Inventory-runtime handoff
```

Completed Build 307 proven runtime/service head:

```text
f1cc11000b0c90944c4224b6c0002ddab7063876
Build 307 update modular reversal-service handoff
```

Build 305 proved:

```text
catalog   -> commerce-operations -> catalog-read
inventory -> commerce-operations -> inventory-read
```

Packaging remains green beneath Creative & Production through Build 301.

## Build 306 — BROWSER PROVEN / LOCAL SIGNOFF PENDING

Build 306 baseline:

```text
c8ea00e57cb906cc671fc15727ed2c8cd8b63dab
Build 306 harden Build 305 historical proof markers
```

The Development browser proof passed:

```text
admin_script                   ...admin.js?v=306
Core runtime                   305
Commerce runtime               306
write contract build           306
domain                         inventory
application module             commerce-operations
required service               inventory-read
owns inventory mutations       false
consumer mutation ready        false
inventory-post                 existing-authority-not-yet-contract-route
inventory-reverse              blocked-pending-compensating-movement-service
requires original movement     true
direct stock add-back          false
contracts/services             true / true
```

The user has not supplied the standalone Build 306 local-regression output. Do not relabel Build 306 as COMPLETE unless that historical proof is later supplied or deliberately superseded by a documented policy decision.

## Build 307 — COMPLETE IN DEVELOPMENT

Build 307 implements and proves the Inventory-owned compensating reversal service without migrating Creative Process to it yet.

### New contract route

```text
GET  /api/admin/contracts/inventory-reverse
POST /api/admin/contracts/inventory-reverse
```

Contract state:

```text
owner                         inventory
consumer                      creative
status                        implemented
implementation state          implemented-not-consumer-enabled
requires original movement    true
requires Creative posting     true
confirmation                  REVERSE INVENTORY
compensating movement only    true
direct stock add-back         false
consumer writes ready         false
```

### Inventory-owned service

```text
functions/api/_lib/inventoryReversalService.js
```

The service requires:

```text
creative_work_project_id
creative_project_inventory_post_id
original_site_inventory_movement_id
reason >= 8 characters
confirmation = REVERSE INVENTORY
```

Authenticated administrator identity supplies authorization; callers cannot choose another authorizer.

### Original movement provenance

The supplied `site_inventory_movement_id` must match the Creative posting on:

- inventory item;
- `consume` movement type;
- negative stock delta;
- previous/new stock values;
- Creative project/event provenance in movement note;
- posting/movement actor when both exist.

Unrelated movement IDs are rejected with a 409 mismatch.

### Compensating reversal rule

Never restore an old absolute stock value.

Build 307 applies:

```text
current on-hand + original posted stock consumption
```

so later legitimate stock activity is preserved.

For reusable/log-only usage, physical stock restoration may be zero while usage quantity is still reversed.

### Idempotency and race protection

Build 307 reuses the existing database-unique ledger:

```text
creative_project_inventory_reversals.creative_project_inventory_post_id UNIQUE
```

No new reversal table was introduced.

A unique request marker is embedded in the ledger reason and compensating movement notes. Every mutation statement is gated by the exact marker for this request.

The D1 batch order is:

```text
1. claim unique reversal ledger row conditioned on current stock snapshot
2. add compensating stock delta
3. insert correction movement
4. insert positive usage movement linked to correction movement
5. mark Creative post reversed
6. clear material-review inventory_consumed
```

If Inventory changes before the claim, the service returns:

```text
409 inventory_reversal_stale_stock
```

If another request already completed the reversal, the UNIQUE ledger makes the call idempotent and the existing reversal is returned.

### Completed safe readiness proof

Development validation used GET only. No live reversal POST was run.

Observed:

```text
admin_script                   ...admin.js?v=307
Core runtime                   305
Commerce runtime               307
write contract build           307
domain                         inventory
application module             commerce-operations
application module mode        active
required service               inventory-read
owns inventory mutations       false
consumer mutation ready        false
reverse state                  implemented-not-consumer-enabled
reverse route                  /api/admin/contracts/inventory-reverse
requires original movement     true
requires Creative posting      true
direct stock add-back          false
api ok                         true
api build                      307
api state                      implemented-not-consumer-enabled
api consumer ready             false
api schema ready               true
api missing tables             <empty>
contracts/services             true / true
```

### Completed local regression proof

User-supplied output ended:

```text
BUILD 307 INVENTORY COMPENSATING REVERSAL SERVICE: PASS
No Cloudflare resource was contacted.
```

The working tree was clean.

### Runtime identity

Architecture build remains 302.

```text
Catalog runtime                   304
Inventory runtime                 305
Inventory write contract/service  307
Commerce runtime                  307
Core runtime source               305
```

Inventory remains active under Commerce & Operations through `inventory-read`.

The umbrella runtime still reports:

```text
ownsInventoryMutations         false
inventoryConsumerMutationReady false
```

The Inventory-owned endpoint performs mutation authority; the umbrella runtime itself does not.

### Build 307 frozen safety boundary

Build 307 did not modify:

- `functions/api/admin/creative-process.js`;
- `functions/api/admin/site-item-inventory.js`;
- Core lifecycle implementation;
- Build 217/244 schema;
- `database_full_schema.sql`;
- Catalog implementation;
- Packaging implementation;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production.

The existing Creative reversal helper remains the compatibility path until a later consumer-cutover build.

## Next direction after Build 307

Migrate **only Creative reversal consumption** to the new Inventory-owned contract with equivalence/idempotency tests.

Do not combine that cutover with `inventory-post` extraction or Operations migration.

## Validation interaction preference

Keep validation concise: default to **one Git Bash block and one reusable browser-console script** unless a failure requires deeper isolation.

## Separate schema/data parity track — DO NOT MIX

Fresh-install schema parity remains a separate priority before any Production business-data copy. Do not combine schema/data parity with module extraction.
