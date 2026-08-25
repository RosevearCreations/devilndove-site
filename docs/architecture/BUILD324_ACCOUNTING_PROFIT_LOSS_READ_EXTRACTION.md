# Build 324 — Accounting Profit/Loss Read Extraction

## Purpose

Build 323 showed that `/admin/accounting/` cannot yet be activated as the first read-only `business-administration` runtime page because several automatic reads still use legacy endpoints and `accounting-journal` GET still performs request-time DDL.

Build 324 removes the first automatic blocker: the Accounting overview's monthly profit/loss read.

## Boundary

The current UI continues to call:

```text
GET /api/admin/accounting-profit-loss?month=YYYY-MM
```

That legacy route now delegates to:

```text
functions/api/_lib/accountingProfitLossReadService.js
```

The same owner service is exposed independently through:

```text
GET /api/admin/contracts/accounting-profit-loss-read?month=YYYY-MM
```

Contract identity:

```text
build       324
contract    accounting-profit-loss-read
owner       accounting
mode        read-only-accounting-profit-loss
mutation    false
```

## Data read

The service reads, when available:

```text
orders
accounting_expenses
accounting_writeoffs
accounting_overhead_allocations
general_ledger_accounts
```

It preserves the existing Accounting overview payload:

- monthly order/revenue totals;
- operating expense totals and groups;
- write-off totals;
- overhead totals and groups;
- rough net before/after overhead;
- General Ledger presentation fields.

It also reports:

```text
schema_ready
missing_tables
missing_columns
authority_tables
request_time_schema_mutation=false
```

Missing schema is reported, not repaired.

## No write ownership change

Build 324 does not change expense, write-off, overhead, product-cost, journal, reconciliation, import, close, or other Accounting mutation behavior.

`business-administration` remains:

```text
entry          null
runtimeDomains []
```

## Next blocker sequence

After Build 324 validates:

```text
Build 325  accounting-item-costing read extraction
Build 326  accounting-journal GET schema-mutation retirement + read extraction
then       remaining automatic Accounting-page read blockers only
finally    first read-only business-administration runtime activation
```

The separate fresh-install schema/data parity track remains independent.
