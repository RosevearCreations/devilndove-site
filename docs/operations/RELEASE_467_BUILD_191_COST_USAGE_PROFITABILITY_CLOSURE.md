# Release 467 — Build 191 Cost, Usage & Profitability Evidence Closure

## Goal

Build 191 closes Product-resource cost and usage evidence gaps exposed by Build 185 and turns those links into an explainable Product-level profitability-readiness view.

The build does not post accounting entries and does not invent missing cost. It distinguishes known cost evidence, incomplete cost evidence and operator-review requirements.

## Scope

Build 191 should:

- recheck Product-to-Tool/Supply links for missing Inventory matches;
- surface missing cost evidence without defaulting it to zero;
- show quantity-per-use or quantity-per-batch evidence and its unit;
- distinguish reusable tools from consumed supplies;
- preserve end-of-lot and lot-reconciliation semantics where already modeled;
- derive an explainable Product resource-cost snapshot only from evidenced inputs;
- show margin-readiness separately from sale/publication readiness;
- route correction to the existing Inventory/Product-resource authorities.

## Acceptance

Build 191 is GREEN only when:

1. Missing cost remains explicitly unknown rather than zero.
2. Derived totals expose their source links and units.
3. No N+1 unbounded base-balance pattern is reintroduced.
4. Live D1 proof has an explicit provider-metered rows-read ceiling.
5. Inventory quantity, historical cost and accounting ledgers are not automatically mutated.
6. Exact-SHA Development gates and protected-main Production promotion are GREEN.

## Safety boundary

No schema migration, request-time DDL, automatic cost write, automatic Inventory quantity change, accounting posting, supplier purchasing, payment/refund action, R2 mutation or wholesale Production data replacement.

## Successor

Build 192 — Release Regression & Runtime Budget Convergence.
