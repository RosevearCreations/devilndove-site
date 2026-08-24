# Devil n Dove AI Context — Build 311 Complete / Accounting Read Next

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader roadmap.

Current modular architecture authority includes:

- `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`
- `docs/architecture/BUILD302_CORE_THREE_MODULE_NORMALIZATION.md`
- `docs/architecture/BUILD303_COMMERCE_OPERATIONS_UMBRELLA_BRIDGE.md`
- `docs/architecture/BUILD304_COMMERCE_OPERATIONS_CATALOG_RUNTIME.md`
- `docs/architecture/BUILD305_COMMERCE_OPERATIONS_INVENTORY_RUNTIME.md`
- `docs/architecture/BUILD306_INVENTORY_WRITE_CONTRACTS.md`
- `docs/architecture/BUILD307_INVENTORY_COMPENSATING_REVERSAL_SERVICE.md`
- `docs/architecture/BUILD308_CREATIVE_REVERSAL_CONSUMER_CUTOVER.md`
- `docs/architecture/BUILD309_INVENTORY_POST_AUTHORITY.md`
- `docs/architecture/BUILD310_CREATIVE_INVENTORY_POST_CONSUMER_CUTOVER.md`
- `docs/architecture/BUILD311_INVENTORY_COST_READ_CONTRACT.md`
- `BUILD310_VALIDATION.md`
- `BUILD311_VALIDATION.md`

**Real Devil n Dove Production remains frozen at Build 280 unless deliberately promoted through the separate Production workflow.**

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
Build 301 Packaging compatibility        COMPLETE IN DEVELOPMENT
Build 302 Core + exactly 3 modules       COMPLETE IN DEVELOPMENT
Build 303 umbrella classification        COMPLETE IN DEVELOPMENT
Build 304 Catalog runtime                COMPLETE IN DEVELOPMENT
Build 305 Inventory runtime              COMPLETE IN DEVELOPMENT
Build 307 Inventory reversal service     COMPLETE IN DEVELOPMENT
Build 309 Inventory post authority       COMPLETE IN DEVELOPMENT
Build 310 Creative post consumer cutover COMPLETE IN DEVELOPMENT
Build 311 Inventory cost read contract   COMPLETE IN DEVELOPMENT
```

Build 306 remains historically browser-proven with standalone local signoff not captured in the conversation. Do not silently relabel it.

Build 308 remains browser-proven; its standalone local regression output was not captured before later work began. Do not silently relabel it complete.

## Build 310 — completed consumer cutover

Proven runtime/source head:

```text
c55f72b73941e0a568591c6a1125bc360a86a8f9
Build 310 update modular posting-consumer handoff
```

Completed handoff head:

```text
c88bcd63d7478cdb24e2b7070fa739f35789ac88
Build 310 set completed modular handoff
```

Creative Inventory authority state:

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

Commerce remains non-mutating: `ownsInventoryMutations=false`.

## Build 311 — COMPLETE IN DEVELOPMENT

Proven source/regression head:

```text
92aaef7b0076dbbf5db0e4a87109067b7af563ff
Build 311 make historical pins line-ending safe
```

Build 311 resolved the two review gates left by Build 310.

### Creative compatibility decision

`functions/api/admin/creative-process-compat.js` cannot yet be retired. It still owns unrelated Creative Process actions outside the Inventory post/reverse cutovers.

### Inventory cost authority

Implemented read-only contract:

```text
GET /api/admin/contracts/inventory-cost
owner     inventory
build     311
authority site_item_inventory.unit_cost_cents
```

Optional supporting history:

```text
site_item_inventory_cost_history
```

The route performs no mutation and no request-time DDL.

### Runtime composition

```text
catalog required services:
  catalog-read
  inventory-cost

inventory required services:
  inventory-read
```

Operations remains inactive:

```text
runtimeDomains = ['catalog', 'inventory']
operationsRuntimeDomainActive = false
```

Runtime identity:

```text
Architecture build              302
Catalog runtime                 304
Inventory runtime               305
Inventory write boundary        310
Inventory cost contract         311
Commerce runtime                311
Core runtime implementation     305
Operations runtime active       false
```

### Validation proof

Final local regression:

```text
BUILD 311 INVENTORY COST READ CONTRACT: PASS
No Cloudflare resource was contacted.
```

Development browser proof:

```text
inventory_cost_service_owner   inventory
inventory_cost_service_mode    read-only-http
inventory_cost_contract        inventory-cost
inventory_cost_build           311
inventory_cost_authority_field site_item_inventory.unit_cost_cents
inventory_cost_rows            5
catalog_required_services      catalog-read,inventory-cost
operations_runtime             <none>
contracts_ok                   true
services_ok                    true
```

The Windows CRLF/LF false-negative in the first regression run was corrected in `92aaef7b` by switching protected-file historical pins to Git-native comparison. The Build 311 file boundary did not expand.

## Build 311 safety boundary

Build 311 did not move or change:

- Creative compatibility behavior;
- Inventory post/reverse authorities;
- Creative post/reverse consumers;
- legacy broad Inventory mutation endpoint;
- Operations implementation;
- Accounting implementation;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production;
- schema/data parity work.

## Next direction — Accounting read before Operations

Do not activate Operations yet.

Operations declares:

```text
catalog-read
inventory-read
accounting-read
```

`catalog-read` and `inventory-read` are implemented. The remaining prerequisite is a bounded, read-only Accounting-owned `accounting-read` contract. Prove that contract first; only then reconsider adding `operations` to the Commerce & Operations runtime domains.

## Validation interaction preference

Keep validation concise: default to **one GIT BASH block and one reusable BROWSER DEVTOOLS CONSOLE block** unless a failure requires deeper isolation.

## Separate schema/data parity track — DO NOT MIX

Fresh-install schema parity remains a separate priority before any Production business-data copy. Do not combine schema/data parity with module extraction.
