# Build 313 Changed Files — Operations Read-Only Runtime

Baseline:

```text
3b5709c842ed7bce8335ddd57fe11420ae207367
Build 312 complete handoff and set Operations activation next
```

Expected Build 313 changed-file boundary:

```text
AI_CONTEXT.md
BUILD313_CHANGED_FILES.md
BUILD313_VALIDATION.md
admin/operations/index.html
docs/architecture/BUILD313_OPERATIONS_READ_ONLY_RUNTIME.md
public/js/admin.js
public/js/core/dd-application-module-groups.mjs
public/js/modules/commerce-operations/runtime.mjs
scripts/build313_operations_read_only_runtime_test.py
```

Exactly 9 distinct files.

Build 313 intentionally excludes:

- `admin/orders/index.html`;
- other Operations route-family pages;
- Accounting contract/helper changes;
- Catalog/Inventory contract changes;
- Inventory mutation authorities;
- Creative Inventory consumers;
- SQL/schema;
- Cloudflare config/bindings;
- R2;
- real Production.
