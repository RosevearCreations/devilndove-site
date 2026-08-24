# Devil n Dove AI Context — Build 312 Complete / Operations Runtime Next

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
- `docs/architecture/BUILD312_ACCOUNTING_READ_CONTRACT.md`
- `BUILD311_VALIDATION.md`
- `BUILD312_VALIDATION.md`

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
Build 312 Accounting read contract       COMPLETE IN DEVELOPMENT
```

Build 306 remains historically browser-proven with standalone local signoff not captured in the conversation. Do not silently relabel it.

Build 308 remains browser-proven; its standalone local regression output was not captured before later work began. Do not silently relabel it complete.

## Build 311 — completed cost boundary

Proven source/regression head:

```text
92aaef7b0076dbbf5db0e4a87109067b7af563ff
Build 311 make historical pins line-ending safe
```

Completed handoff head:

```text
78546a6b9304ce38d0a42b130445a7504a15823f
Build 311 set completed inventory-cost handoff
```

Inventory cost authority:

```text
GET /api/admin/contracts/inventory-cost
owner     inventory
build     311
authority site_item_inventory.unit_cost_cents
```

## Build 312 — COMPLETE IN DEVELOPMENT

Proven source/runtime head:

```text
6d99d05e40999776ab38f91fbaa182e9232db547
Build 312 update Accounting read handoff context
```

Build 312 implements:

```text
GET /api/admin/contracts/accounting-read
owner            accounting
build            312
mode             read-only-order-financial-state
authority table  accounting_order_records
```

The contract exposes only bounded order-linked financial/payment state and excludes customer identity, journals, bank imports, close controls and Accounting mutations.

The route does not call `ensureAccountingSchema` or `syncAccountingForOrder` and performs no request-time DDL or writes.

Development proof:

```text
operations_required_services  catalog-read,inventory-read,accounting-read
accounting_service_owner      accounting
accounting_service_mode       read-only-http
accounting_contract           accounting-read
accounting_build              312
accounting_authority_table    accounting_order_records
accounting_schema_ready       true
accounting_missing_tables     <empty>
accounting_missing_columns    <empty>
accounting_schema_mutation    false
accounting_rows               0
operations_runtime            <none>
contracts_ok                  true
services_ok                   true
```

Local regression:

```text
BUILD 312 ACCOUNTING READ CONTRACT: PASS
No Cloudflare resource was contacted.
```

`accounting_rows=0` is valid Development business-data state.

## Current runtime identity

```text
Architecture build              302
Core runtime implementation     305
Catalog runtime                 304
Inventory runtime               305
Inventory write boundary        310
Inventory cost contract         311
Accounting read contract        312
Commerce runtime                312
Operations runtime active       false
```

## Next direction — Build 313 Operations runtime activation

The required read services now exist:

```text
catalog-read
inventory-read
accounting-read
```

Build 313 may activate the `operations` domain beneath Commerce & Operations, but the first activation must remain read-only.

Requirements for Build 313:

- add `operations` to the Commerce runtime domain set only after confirming shared-loader coverage;
- require `catalog-read,inventory-read,accounting-read` for Operations activation;
- do not migrate or intercept order/payment/customer/gift-card/membership mutations;
- do not change Accounting or Inventory authorities;
- do not add SQL/schema/config/R2/Production changes;
- prove one real Operations page classifies and activates as `operations` under `commerce-operations`;
- keep legacy page behavior available underneath the runtime shell;
- document any Operations route families that still lack the shared loader rather than claiming unproven coverage.

## Validation interaction preference

Keep validation concise: default to **one GIT BASH block and one reusable BROWSER DEVTOOLS CONSOLE block** unless a failure requires deeper isolation.

## Separate schema/data parity track — DO NOT MIX

Fresh-install schema parity remains a separate priority before any Production business-data copy. Do not combine schema/data parity with module extraction.
