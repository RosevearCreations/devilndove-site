# Build 325 — Accounting Item-Costing Read Extraction

## Purpose

Extract the automatic monthly item-costing read used by `/admin/accounting/` into Accounting ownership without request-time schema mutation.

## Boundary

Legacy-compatible UI route:

```text
GET /api/admin/accounting-item-costing?month=YYYY-MM
```

Dedicated contract:

```text
GET /api/admin/contracts/accounting-item-costing-read?month=YYYY-MM
```

Owner service:

```text
functions/api/_lib/accountingItemCostingReadService.js
```

Identity:

```text
build       325
contract    accounting-item-costing-read
owner       accounting
mutation    false
```

The service validates the required `products` table/columns, reports optional source-table availability, and delegates the existing costing calculation only when the required product shape is ready. Missing schema is reported rather than repaired.

No write authority moves.
