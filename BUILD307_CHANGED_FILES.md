# Build 307 Changed Files — Inventory Compensating Reversal Service

Base:

```text
c8ea00e57cb906cc671fc15727ed2c8cd8b63dab
Build 306 harden Build 305 historical proof markers
```

Build 307 is bounded to exactly these files:

```text
AI_CONTEXT.md
BUILD307_CHANGED_FILES.md
BUILD307_VALIDATION.md
admin/inventory-operations/index.html
docs/architecture/BUILD307_INVENTORY_COMPENSATING_REVERSAL_SERVICE.md
functions/api/_lib/inventoryReversalService.js
functions/api/admin/contracts/inventory-reverse.js
public/js/admin.js
public/js/core/dd-application-module-groups.mjs
public/js/core/dd-module-contracts.mjs
public/js/modules/commerce-operations/inventory-write-boundary.mjs
public/js/modules/commerce-operations/runtime.mjs
scripts/build307_inventory_compensating_reversal_service_test.py
```

Explicitly outside Build 307:

- Creative Process consumer migration;
- legacy `/api/admin/site-item-inventory` mutation behavior;
- `inventory-post` contract-route extraction;
- Core lifecycle implementation;
- Catalog or Packaging implementation;
- SQL/schema or aggregate-schema changes;
- Cloudflare bindings/config;
- R2;
- real Production.

Build 307 reuses the existing `creative_project_inventory_reversals` UNIQUE ledger for the current `creative` consumer. It does not create a second reversal table.
