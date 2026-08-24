# Build 308 Changed Files

Baseline:

```text
075b905c5fa7960fb7abde410571d840f1983c91
Build 307 set completed reversal-service handoff
```

Build 308 is limited to the Creative reversal-consumer cutover.

Expected boundary:

```text
AI_CONTEXT.md
BUILD308_CHANGED_FILES.md
BUILD308_VALIDATION.md
docs/architecture/BUILD308_CREATIVE_REVERSAL_CONSUMER_CUTOVER.md
functions/api/_lib/creativeInventoryReversalConsumer.js
functions/api/admin/creative-process.js
public/js/core/dd-module-contracts.mjs
scripts/build308_creative_reversal_consumer_cutover_test.py
```

Explicitly unchanged:

- `functions/api/_lib/inventoryReversalService.js` — proven Build 307 Inventory authority;
- `functions/api/admin/site-item-inventory.js` — legacy Inventory mutation authority;
- Inventory posting implementation (`postInventoryUsage`) except for surrounding unchanged Creative file context;
- Core lifecycle/runtime;
- Catalog;
- Packaging;
- Operations extraction;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production.
