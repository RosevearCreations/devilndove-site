# Build 311 — Inventory Cost Read Contract

## Status — STAGED / VALIDATION REQUIRED

Baseline:

```text
c88bcd63d7478cdb24e2b7070fa739f35789ac88
Build 310 set completed modular handoff
```

Real Devil n Dove Production remains frozen at Build 280.

## Review decision before Operations

Build 310 required two questions to be answered before Operations could join the Commerce & Operations runtime.

### 1. Can the preserved Creative compatibility copy be retired now?

No. The compatibility copy cannot be retired safely in Build 311.

`functions/api/admin/creative-process-compat.js` still contains the large set of unrelated Creative Process actions that were intentionally left outside the narrow Inventory post/reverse cutovers. Deleting or rewriting it now would turn a bounded Inventory authority extraction into a broad Creative engine rewrite.

Therefore Build 311 freezes that file byte-for-byte from the completed Build 310 baseline.

### 2. Is `inventory-cost` ready to become an explicit Inventory contract?

Yes, as a read-only boundary.

The existing Inventory authority already has stable current-cost facts in:

```text
site_item_inventory.unit_cost_cents
```

with unit conversion facts in:

```text
stock_unit_label
usage_unit_label
usage_units_per_stock_unit
```

and optional historical evidence in:

```text
site_item_inventory_cost_history
```

No new schema is required.

## New Inventory-owned route

```text
GET /api/admin/contracts/inventory-cost
```

Implementation:

```text
functions/api/admin/contracts/inventory-cost.js
```

Identity:

```text
build                 311
contract              inventory-cost
owner                 inventory
mode                  read-only-current-cost
authority field       site_item_inventory.unit_cost_cents
```

The route is authenticated and GET-only.

## Cost facts returned

For each active Inventory item the contract can return:

```text
site_item_inventory_id
source_type
external_key
item_name
category
unit_cost_cents
currency
stock_unit_label
usage_unit_label
usage_units_per_stock_unit
cost_per_usage_unit_cents
on_hand_quantity
inventory_value_cents
supplier_name
supplier_sku
updated_at
```

`cost_per_usage_unit_cents` is derived from current Inventory cost divided by `usage_units_per_stock_unit`.

`inventory_value_cents` is a current operational valuation of on-hand quantity using the current unit cost. It is not a posted accounting journal value.

## Optional history evidence

`include_history=1` reads existing rows from `site_item_inventory_cost_history` when that table exists.

History is supporting evidence only. It does not override current cost authority.

The contract never calls schema-creation helpers and never performs request-time DDL.

## Browser service adapter

Build 311 adds `inventory-cost` to the passive read service registry:

```text
public/js/core/dd-module-service-adapters.mjs
```

Registration performs no network request. A request occurs only when a consumer explicitly calls:

```text
window.DDModuleRuntime.service('inventory-cost').list(...)
```

## Catalog boundary

Catalog already declares `inventory-cost` as a consumed capability. Build 311 makes that dependency real in the Commerce & Operations runtime:

```text
catalog required services:
  catalog-read
  inventory-cost

inventory required services:
  inventory-read
```

This is still read-only runtime composition.

## Operations remains inactive

Build 311 does not add `operations` to `runtimeDomains`.

```text
runtimeDomains = ['catalog', 'inventory']
operationsRuntimeDomainActive = false
```

Operations remains classified beneath Commerce & Operations but bridge-only.

No orders, memberships, fulfillment, gift-card, customer-workflow, payment, or accounting business behavior moves in this build.

## Existing Inventory write authorities stay frozen

Build 311 does not modify:

```text
Inventory post authority      Build 309
Creative post consumer        Build 310
Inventory reversal authority  Build 307
Creative reversal consumer    Build 308
```

The Commerce umbrella remains non-mutating:

```text
ownsInventoryMutations = false
```

## Runtime identity

```text
Core architecture               302
Catalog runtime                 304
Inventory runtime               305
Inventory write boundary        310
Inventory cost contract         311
Commerce runtime                311
Core runtime implementation     305
Operations runtime active       false
```

## Safety boundary

Build 311 intentionally does not modify:

- `creative-process-compat.js`;
- Inventory post/reverse services;
- Creative post/reverse consumers;
- legacy broad Inventory mutation endpoint;
- Operations implementation;
- Accounting implementation;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production;
- schema/data parity work.

## Next direction

Only after Build 311 is proven should Operations activation be reconsidered. Before activation, Operations' declared `accounting-read` dependency must either become a real bounded read contract or be explicitly deferred with a documented runtime service plan.
