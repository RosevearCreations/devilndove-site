# Release 467 Build 72 — Inventory / Reorder Economics

Build 72 starts from the exact fully-green Build 71 Production/Development checkpoint:

- Source SHA: `fb6d2b952003b5516f2caba1e297e82763603697`
- Source tree: `eb129e4ee7b9e70869361834b528c5ad5ebd371c`
- Canonical D1 migrations: `0001`–`0004`
- Build 71 Development System Gate: GREEN
- Build 71 Production Pages Deploy: GREEN
- Build 71 Production Live Resource Integrity Proof: GREEN

## Purpose

Turn replenishment from a simple threshold/list view into a **recommendation-only economics workspace** that helps the owner decide what to reorder, roughly how much, what the observed landed-cost history says, how long current stock may last, and which linked Products are constrained by that Inventory item.

Build 72 does **not** buy anything. It does not create or submit purchase orders, contact suppliers, change Inventory quantities, create incoming stock, post accounting, delete R2 objects or call payment/social providers.

## Build 72 contract

1. **One pure economics engine owns advisory reorder math.** `inventoryReorderEconomics.js` calculates coverage, target stock, recommended quantity, supplier-cost comparison and per-resource buildability without D1/network/provider behavior.
2. **Build 71 lifecycle remains mutation authority.** Build 72 reads lifecycle facts; it does not create a second Inventory mutation path.
3. **Build 70 remains package/base conversion authority.** Linked Product buildability converts required base usage into purchase/package quantities through the shared conversion helpers.
4. **Recommendations use available stock, not gross on-hand.** Available stock is `on_hand - reserved`; confirmed incoming is added only to the projected balance.
5. **30-day and 90-day use history informs coverage.** Recent package depletion from canonical `site_inventory_movements` is aggregated into 30/90-day consumption windows.
6. **The forecast is conservative but explainable.** Daily use is the larger of the observed 30-day and 90-day average rates so a recent increase in demand is not hidden by the longer window.
7. **Default target coverage is 30 days.** The engine targets at least the greater of demand coverage and the existing reorder policy target.
8. **Existing preferred reorder quantity is respected.** When a reorder signal exists, configured `preferred_reorder_quantity` is treated as the minimum suggested order quantity.
9. **Reorder-list intent remains visible.** An explicit reorder-list flag is a recommendation signal even when historical consumption is absent.
10. **`do_not_reorder` remains fail-closed.** A blocked item gets no recommended purchase quantity even when coverage/threshold signals say stock is low.
11. **No recommendation silently becomes incoming stock.** Build 71’s corrected boundary remains intact: incoming quantity changes only through actual purchasing/receiving authority.
12. **Stock coverage is explicit.** Current/projected days of coverage are returned with `critical`, `low`, `watch`, `healthy` or `unknown` bands.
13. **Landed cost uses received-lot evidence.** Historical landed unit cost is computed from received lot unit cost plus recorded lot shipping and tax, weighted by quantity received.
14. **Preferred supplier history is the first cost basis.** If the current preferred supplier has received-lot history, its observed landed cost is used for the advisory estimate.
15. **Alternative suppliers are comparison-only.** If other observed suppliers have lower historical landed cost, they are surfaced for review but are never automatically selected or ordered from.
16. **Fallback cost is explicit.** If preferred supplier history is unavailable, the engine may use the lowest observed historical landed cost; if no observed lot cost exists, it may fall back to the current Inventory unit cost and labels the basis accordingly.
17. **Supplier comparison is historical, not a live quote.** Build 72 does not scrape supplier sites, call Amazon/provider pricing, promise availability or claim a historical price is still current.
18. **Estimated reorder landed cost is advisory.** It is recommended quantity × the selected historical/fallback cost basis; it is not AP, a purchase commitment, a journal or a bank transaction.
19. **Linked-Product economics are resource-scoped.** For each linked Product, Build 72 shows how many units this specific resource could support now and after the advisory reorder.
20. **Resource buildability is not a finished-Product promise.** Another linked material may still constrain the Product; the UI explicitly labels this as per-resource buildability.
21. **Reusable/log-only Tools do not constrain buildability.** Their usage remains non-depleting under Build 70/71 rules.
22. **`story_only` links do not create stock demand.** Story/evidence links remain excluded from depletion economics.
23. **`end_of_lot` links retain their lot-size amortization.** Required base quantity per Product is divided by configured lot size before package conversion.
24. **The existing replenishment workspace is upgraded rather than duplicated.** `/admin/inventory-replenishment/` continues to be the operator surface, now showing economics alongside the established readiness queues.
25. **The endpoint stays GET/read-only.** `/api/admin/inventory-replenishment` still exposes no mutation method in Build 72.
26. **Every added read is bounded.** Inventory is capped at 500 rows, purchase orders at 120, recent receipts at 40, usage aggregates at 500 items, supplier landed-cost groups at 300 and Product-resource links at 800.
27. **The D1 read-budget authority documents the expanded operator projection.** Build 72 remains an explicitly opened admin workspace, not unrelated startup work.
28. **No new D1 migration is required.** Existing Inventory movement, lot, purchase-order, Product-resource and usage-profile authorities are sufficient; canonical migrations remain `0001`–`0004`.
29. **No Production business-data rewrite or R2 deletion is introduced.** Build 72 is source/read-projection work only.
30. **Production promotion remains exact-green only.** System Gate, Current Application Quality Proof, I.T. Admin Runtime Proof and Repository Branch Hygiene must all pass on the exact Development SHA before `main` may fast-forward.

## Recommendation model

For each active Inventory item:

- `available = max(0, on_hand - reserved)`
- `projected = available + confirmed incoming`
- `daily30 = consumed_30d / 30`
- `daily90 = consumed_90d / 90`
- `forecast_daily_usage = max(daily30, daily90)`
- `demand_target = forecast_daily_usage × 30 days`
- `policy_target = reorder_level + preferred_reorder_quantity` when a preferred quantity exists; otherwise `reorder_level × 2`
- `target_stock = max(reorder_level, demand_target, policy_target)`

A recommendation signal exists when any of these are true:

- projected stock is at/below the existing reorder level;
- projected stock coverage is below 30 days; or
- the owner has explicitly left the item on the reorder list.

When a signal exists, the suggested quantity is the greater of the target-stock gap and the configured preferred reorder quantity. `do_not_reorder` always forces the advisory quantity to zero.

## Landed-cost model

For each Inventory item/supplier with received lot history:

`observed landed unit cost = (unit cost × received quantity + lot shipping + lot tax) / received quantity`

Multiple lots are weighted by received quantity. This deliberately uses actual recorded receipts instead of guessing current marketplace pricing.

## Buildable-unit model

For a depleting Product resource link:

- `required base quantity per Product = quantity_used` for normal per-unit links;
- `required base quantity per Product = quantity_used / lot_size_units` for end-of-lot links;
- that base quantity is converted to purchase/package quantity by Build 70 conversion authority;
- current resource-limited buildable units use available unreserved stock;
- projected resource-limited buildable units use available + incoming + advisory reorder quantity.

Reusable/log-only Tools and story-only links remain non-depleting and therefore do not constrain Product buildability.

## Operator experience

The upgraded replenishment workspace now surfaces:

- advisory reorder count and estimated landed total;
- low stock-coverage count;
- 30/90-day consumption and projected days of coverage;
- target stock and recommended quantity;
- preferred/fallback historical landed-cost basis;
- historical supplier comparison;
- linked-Product resource buildability before/after the advisory reorder;
- existing purchase-order readiness, supplier context and recent audited receiving evidence.

Every relevant panel repeats that recommendations are advisory and that purchase-order creation/submission remains an explicit owner action in Inventory Operations.

## D1 / R2 boundary

Build 72 adds no table, column, index, trigger or migration. It does not mutate D1 business data, create false incoming inventory, replace Production data, delete R2 objects or call any payment/social/supplier provider. The new economics engine is pure calculation.

## Acceptance

The Build 72 gate and pure Node runtime acceptance prove:

- coverage-driven reorder recommendations;
- preferred reorder quantity minimum behavior;
- do-not-reorder blocking;
- 30/90-day demand math;
- preferred supplier landed-cost basis;
- comparison-only lower historical supplier visibility;
- fallback cost-basis labeling;
- package/base Product-resource conversion;
- current/projected resource buildability;
- reusable Tool non-depletion;
- end-of-lot amortization;
- bounded read caps;
- no D1 mutation, runtime DDL, provider call, R2 action or automatic purchase.

## Next build

After Build 72 is exact-green, continue with **Release 467 Build 73 — Product Media / Photo Studio Convergence**.
