# Build 310 Changed Files — Creative Inventory Post Consumer Cutover

Baseline:

```text
ab8089b76d881617bc3ca4768abdb4674afcf3a0
Build 309 set completed post-authority handoff
```

Build 310 boundary:

1. `AI_CONTEXT.md`
2. `BUILD310_CHANGED_FILES.md`
3. `BUILD310_VALIDATION.md`
4. `admin/inventory-operations/index.html`
5. `docs/architecture/BUILD310_CREATIVE_INVENTORY_POST_CONSUMER_CUTOVER.md`
6. `functions/api/_lib/creativeInventoryPostConsumer.js`
7. `functions/api/admin/creative-process-compat.js`
8. `functions/api/admin/creative-process.js`
9. `public/js/admin.js`
10. `public/js/core/dd-application-module-groups.mjs`
11. `public/js/core/dd-module-contracts.mjs`
12. `public/js/modules/commerce-operations/inventory-write-boundary.mjs`
13. `public/js/modules/commerce-operations/runtime.mjs`
14. `scripts/build310_creative_inventory_post_consumer_cutover_test.py`

No SQL/schema, Cloudflare binding/config, R2, Operations implementation, legacy broad Inventory mutation endpoint, Build 309 Inventory post service, Build 307 reversal service, or real Production change belongs in this build.
