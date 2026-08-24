# Build 311 Validation — Inventory Cost Read Contract

## Status — STAGED / VALIDATION REQUIRED

Baseline:

```text
c88bcd63d7478cdb24e2b7070fa739f35789ac88
Build 310 set completed modular handoff
```

Build 310 is COMPLETE IN DEVELOPMENT.

Build 311 does two bounded things only:

1. records that the preserved Creative compatibility implementation cannot yet be retired safely;
2. implements `inventory-cost` as a passive Inventory-owned read contract for Catalog and Accounting consumers.

Operations remains bridge-only and is not activated.

## One Git Bash block

```bash
git pull --ff-only origin dev
python scripts/build311_inventory_cost_read_contract_test.py
git status --short
```

Expected ending:

```text
BUILD 311 INVENTORY COST READ CONTRACT: PASS
No Cloudflare resource was contacted.
```

`git status --short` should be empty.

## One browser block

Open and hard-refresh:

```text
https://devilndove-site-dev.pages.dev/admin/inventory-operations/
```

The browser proof should:

- confirm the Build 311 runtime graph is loaded;
- confirm `inventory-cost` is registered as a passive read service;
- make one authenticated read through that service;
- confirm Catalog now requires `catalog-read,inventory-cost`;
- confirm Operations still has no active application runtime.

Expected state:

```text
pathname                         /admin/inventory-operations/
admin_script                     .../public/js/admin.js?v=311
core_runtime_build               305
commerce_runtime_build           311
domain                           inventory
application_module               commerce-operations
application_module_mode          active
active_required_services         inventory-read
catalog_required_services        catalog-read,inventory-cost
inventory_cost_service_owner     inventory
inventory_cost_service_mode      read-only-http
inventory_cost_contract          inventory-cost
inventory_cost_build             311
inventory_cost_authority_field   site_item_inventory.unit_cost_cents
operations_application_module    commerce-operations
operations_runtime               <none>
contracts_ok                     true
services_ok                      true
```

The returned cost-row count may be zero or greater depending on Development data. Build 311 validates authority and transport, not business-data parity.

No POST, stock mutation, SQL migration, or Operations workflow test is required.

## Completion decision

Do not mark Build 311 complete until:

1. local regression passes;
2. working tree is clean;
3. Development serves `admin.js?v=311`;
4. the passive `inventory-cost` service is registered;
5. authenticated cost GET succeeds at Build 311;
6. Catalog's required service list includes `inventory-cost`;
7. Operations still has no umbrella runtime activation;
8. Build 310 write consumers remain unchanged;
9. no SQL/schema/config/R2/real Production change occurs.
