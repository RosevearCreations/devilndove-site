# Release 467 Build 19 — Inventory Replenishment & Procurement Readiness Command Center

## Purpose

Build 19 creates one read-only operating view for replenishment and procurement readiness. It projects facts already owned by Inventory Operations, supplier purchase orders and the audited Receiving workflow; it does not create a parallel stock, purchasing or receiving ledger.

Exact source base is green **Release 467 Build 18 — Order Fulfillment & Customer Care Command Center**:

- merged `dev`: `ce01014e201df9a8a8496945bd71212bd688c6f6`
- tree: `131948dc58cc455ab4e7a6f5e883edf47adfb00f`
- System Gate `33669162936` — SUCCESS
- Build 18 Proof `33669163159` — SUCCESS

## Operator view

`/admin/inventory-replenishment/` reads `/api/admin/inventory-replenishment` and surfaces:

1. inventory at/below its existing reorder threshold;
2. reorder-list items and do-not-reorder conflicts;
3. missing supplier facts when replenishment is due;
4. open purchase-order draft, ordered and partial-receipt context;
5. stale purchase-order record review without inventing a supplier due date;
6. missing purchase-order line-cost review;
7. stale physical-count review for inventory already in replenishment attention;
8. recent audited receiving claims; and
9. supplier-level inventory, incoming quantity, open purchase-order quantity and estimated-cost context.

Attention lanes are `replenishment`, `supplier`, `procurement`, `receiving`, and `inventory_accuracy`.

## Write ownership

Build 19 is intentionally **read-only**.

- `site_item_inventory` remains the stock/reorder/supplier fact authority.
- `supplier_purchase_orders` and `supplier_purchase_order_items` remain the procurement authority.
- `inventory_receiving_claims` and `inventory_purchase_lots` remain receiving/provenance evidence under the existing receiving service.
- `/admin/inventory-operations/` remains the mutation owner.
- `/admin/inventory-operations/#inventoryReceivingMount` remains the audited receiving owner.

Build 19 performs no automatic purchase-order creation, submission or mutation; no inventory adjustment; no receiving action; no supplier message; and no provider execution.

## Threshold semantics

The view uses bounded operator-review thresholds only:

- draft purchase-order record unchanged for 3 days → review;
- ordered purchase-order record with open quantity unchanged for 10 days → review;
- inventory count 30+ days old while already in replenishment attention → count-confidence review.

The 10-day ordered-record condition is explicitly **not** a supplier due-date or late-delivery claim because no authoritative supplier due date is required by the current purchase-order schema.

## Safety boundary

- schema migration: NONE
- request-time DDL/DML in Build 19 projection: NONE
- new D1/R2 mutation authority: NONE
- provider execution/publication: NONE
- Cloudflare Access mutation: NONE
- `main` / Production mutation: NONE
- automatic Production promotion: NONE
- secret values emitted: NONE
- external lanes: `HOLD_EXTERNAL`

Canonical migrations remain exactly `0001`–`0004`. Production remains separately verified at Release 467 Build 15 `296e53b079bba53126c80902be36a9271d82cea4`, Production Pages Deploy `33655223149` SUCCESS.

## Acceptance

Build 19 is not complete until its exact feature SHA passes its Build 19 proof and full PR fanout, the unchanged green head is merged to `dev`, the exact merged SHA passes Build 19 proof, and the canonical System Gate deploys that exact merged SHA to the Development Preview with D1 migration/applicator proof, read-only data authority, binding proof, non-secret smoke acceptance and regression evidence all green.
