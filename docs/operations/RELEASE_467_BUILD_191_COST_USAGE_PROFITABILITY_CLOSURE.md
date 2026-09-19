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


## Implemented evidence model

Build 191 extends the Build 185 Product-resource linkage authority rather than adding another costing or accounting authority.

- The operator explicitly loads or rechecks one selected Product.
- The selected Product price is read as one exact Product row.
- Saved Product-resource links continue to use the grouped/ranked Inventory/catalog projection and one batched base-balance read.
- Each link reports `cost_evidence_state` as `known`, `unknown_missing_cost`, `unknown_inventory_match` or `not_applicable`.
- Reusable/log-only Tools and story-only links are `not_applicable`; they are never treated as zero-cost consumables.
- A cost-required link with no Inventory cost remains explicitly unknown. Build 191 never substitutes zero.
- The Product resource-cost total is `null` whenever any cost-required link is unknown.
- Resource margin is derived only when Product price evidence and every cost-required linked-resource cost are known.
- Link evidence exposes quantity used, usage unit, stock unit, units-per-stock-unit, consumption mode, Inventory identity and lot state.
- End-of-lot and lot-reconciliation review remains inherited from Build 185.
- The margin snapshot is deliberately scoped to linked resources only and excludes labour, overhead, marketplace/payment fees, shipping, tax and accounting adjustments.
- Publication readiness remains owned separately by Product buyer-readiness evidence.

## Development D1 budget

The exact Development Build 191 proof is provider-metered and capped at **15,000 rows read**. It measures Product-resource/Inventory identity, usage, lot and cost evidence with grouped CTEs and performs **zero D1 mutation**.

## Production path

Build 191 is code-only and requires **no canonical migration**. Production promotion therefore uses the **zero-D1 code-only path** with Production business data remaining Production-owned.
