# Build 309 Changed Files — Inventory Post Authority

Baseline:

```text
6d9a236ae688fe3d4b8e6975b866c637efe51c9b
Build 308 update modular reversal-consumer handoff
```

Build 308 is browser-proven but local regression signoff is still pending.

Build 309 changes exactly these 13 files:

1. `AI_CONTEXT.md`
2. `BUILD309_CHANGED_FILES.md`
3. `BUILD309_VALIDATION.md`
4. `admin/inventory-operations/index.html`
5. `docs/architecture/BUILD309_INVENTORY_POST_AUTHORITY.md`
6. `functions/api/_lib/inventoryPostService.js`
7. `functions/api/admin/contracts/inventory-post.js`
8. `public/js/admin.js`
9. `public/js/core/dd-application-module-groups.mjs`
10. `public/js/core/dd-module-contracts.mjs`
11. `public/js/modules/commerce-operations/inventory-write-boundary.mjs`
12. `public/js/modules/commerce-operations/runtime.mjs`
13. `scripts/build309_inventory_post_authority_test.py`

Explicitly unchanged:

- `functions/api/admin/creative-process.js`
- `functions/api/_lib/creativeInventoryReversalConsumer.js`
- `functions/api/_lib/inventoryReversalService.js`
- `functions/api/admin/contracts/inventory-reverse.js`
- `functions/api/admin/site-item-inventory.js`
- SQL/schema files
- Cloudflare bindings/config
- R2
- real Production

Build 309 implements the Inventory-owned post authority but does **not** migrate Creative posting consumers yet.
