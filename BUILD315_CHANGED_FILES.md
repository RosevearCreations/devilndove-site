# Build 315 Changed Files — Orders Operations Runtime Coverage

Baseline:

```text
c29aca8c789ac53e9418f6074e8408b56391d7e5
Build 314 set completed runtime handoff context
```

Build 315 is a loader/runtime-coverage build only.

## Exact changed-file boundary

```text
AI_CONTEXT.md
BUILD315_CHANGED_FILES.md
BUILD315_VALIDATION.md
admin/customer-documents/index.html
admin/operations/index.html
admin/orders/index.html
docs/architecture/BUILD315_ORDERS_OPERATIONS_RUNTIME.md
public/js/admin.js
public/js/core/dd-application-module-groups.mjs
public/js/modules/commerce-operations/runtime.mjs
scripts/build315_orders_operations_runtime_test.py
```

Exactly 11 files.

## Explicit exclusions

Build 315 does not modify:

- `public/js/admin-orders.js`;
- `public/js/admin-order-detail.js`;
- `public/js/admin-gift-card-order-redemption.js`;
- `public/js/admin-accounting-backend.js`;
- `functions/api/admin/orders.js`;
- `functions/api/admin/update-order-status.js`;
- `functions/api/admin/record-payment.js`;
- `functions/api/admin/payment-actions.js`;
- `functions/api/admin/order-payments.js`;
- Customer Documents business JavaScript/APIs;
- Catalog, Inventory or Accounting contract implementations;
- Inventory post/reverse authorities or Creative consumers;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production;
- schema/data parity work.

The only Orders-page behavior change is adding the shared Build 315 Admin/runtime loader before the existing Orders business scripts.
