# Release 457 — Financials Reconciliation, Commerce Cost & Reporting Depth

**Environment:** Development (`dev` → `devilndove-site-dev`)  
**Durable D1 change:** none  
**Last independently verified D1 schema:** Release 453  
**Release 453 mutation / verifier:** `33258377328` / `33258415391`  
**Release 456 exact-head Source / System proof:** `33263530207` / `33263530221`  
**Separate live Production and provider execution/publication:** closed

## Purpose

Release 457 deepens the existing **Financials** module without inventing a second accounting ledger, reconciliation authority, statement authority, costing authority, or close authority.

The Accounting workspace now gets a read-only **Financial Operations queue** that composes existing authenticated Accounting reads and routes each exception back to the section that already owns the underlying write.

## Existing authorities retained

- `accounting_reconciliation_reviews` remains the durable reconciliation-review authority.
- `accounting_reconciliation_exceptions` remains the durable exception authority.
- Statement imports remain owned by the existing Accounting statement-import workflow.
- Profit/loss and item costing remain Accounting-owned read services.
- General Ledger, expenses, write-offs, product costs, GIFI review, period locks and close workflows retain their existing write routes.
- Release 457 creates **no D1 table and no migration**.

## Financial Operations projection

The new `/admin/accounting/` operational layer shows, by selected month:

1. open reconciliation exceptions;
2. sales-tax reconciliation variance and evidence gaps;
3. processor-fee reconciliation variance and statement-evidence gaps;
4. shipping reconciliation variance and statement-evidence gaps;
5. imported provider fee totals;
6. uncosted products and missing product-cost links;
7. negative-margin review signals;
8. unmapped GIFI reporting lines;
9. month-close checklist blockers;
10. recognized revenue, non-COGS operating costs, recognized full COGS and a rough operating result.

The rough result subtracts recognized **full COGS** once; because full COGS already includes allocated overhead, overhead is not subtracted a second time.

## Failure behavior

The Financial Operations runtime uses authenticated `window.DDAuth.apiFetch` reads and `Promise.allSettled`. A single unavailable source produces a partial-data warning instead of blanking the entire Financials workspace.

The projection performs no `POST`, `PUT`, `PATCH` or `DELETE` request.

## UI / accessibility / responsive behavior

- one source H1 remains on the private Accounting page;
- Financials module ownership remains explicit;
- shared Admin workspace state semantics remain present;
- month control and refresh control preserve 44px minimum touch height;
- summary and queue layouts collapse cleanly at 900px and 640px;
- all queue items link directly to existing owner sections.

## Release boundary

Release 457 is source-only. `devilndove-dev` remains schema-current through independently verified Release 453. A new chat is not a migration event. Historical migrations must not be replayed.

Promotion to the separate live Production application remains closed.
