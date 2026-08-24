# Build 311 Changed Files — Inventory Cost Read Contract

Baseline:

```text
c88bcd63d7478cdb24e2b7070fa739f35789ac88
Build 310 set completed modular handoff
```

Build 311 is limited to exactly these files:

1. `AI_CONTEXT.md`
2. `BUILD311_CHANGED_FILES.md`
3. `BUILD311_VALIDATION.md`
4. `admin/inventory-operations/index.html`
5. `docs/architecture/BUILD311_INVENTORY_COST_READ_CONTRACT.md`
6. `functions/api/admin/contracts/inventory-cost.js`
7. `public/js/admin.js`
8. `public/js/core/dd-application-module-groups.mjs`
9. `public/js/core/dd-module-contracts.mjs`
10. `public/js/core/dd-module-service-adapters.mjs`
11. `public/js/modules/commerce-operations/runtime.mjs`
12. `scripts/build311_inventory_cost_read_contract_test.py`

Build 311 intentionally does **not** modify:

- `functions/api/admin/creative-process-compat.js`;
- Build 309 Inventory post authority;
- Build 307 Inventory reversal authority;
- Build 310/308 Creative Inventory consumers;
- legacy broad Inventory mutation code;
- Operations implementation;
- Accounting implementation;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production;
- schema/data parity work.
