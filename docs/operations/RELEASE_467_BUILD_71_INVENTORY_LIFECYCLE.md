# Release 467 Build 71 — Inventory Lifecycle

Build 71 starts from the exact fully-green Build 70 Production/Development checkpoint:

- Source SHA: `ead7dcbf565ab57a02c9982eabbbd9e759d3d1d1`
- Source tree: `445d640fcc5b51b80e425082eaf9962e1a0dabd0`
- Canonical D1 migrations: `0001`–`0004`
- Build 70 Development System Gate: GREEN
- Build 70 Production Pages Deploy: GREEN
- Build 70 Production Live Resource Integrity Proof: GREEN

## Purpose

Converge the Inventory lifecycle so quantity changes stop being a collection of loosely related manual counters. Build 71 defines one fail-closed mutation authority for **receiving → storage → reservation → Product/project use → release/return → write-off → reorder request**, while retaining the existing specialist receiving, lot, kit, Product-production and Creative posting authorities.

Build 71 is deliberately schema-neutral. The existing `site_item_inventory`, `site_inventory_movements`, `site_inventory_usage_movements`, Release 461 base balances, purchase lots and administrator audit log remain the authoritative records.

## Build 71 contract

1. **One lifecycle service owns generic Inventory quantity transitions.** `inventoryLifecycle.js` is the current mutation contract for manual receive, reserve, release, direct consume, base-unit usage, return-to-stock, write-off and reorder-request actions.
2. **Release 461 package/base authority remains intact.** Package quantities continue to live on `site_item_inventory`; usable/base balances remain synchronized by the existing wrapper and migration-owned compatibility layer.
3. **Build 70 unit conversion remains the usage arithmetic authority.** `consume_usage` delegates to `planInventoryUsage`; Build 71 does not invent another package/base conversion formula.
4. **Reservations may use only unreserved stock.** A reservation is rejected when requested package quantity exceeds `on_hand - reserved`.
5. **Reservation release is fail-closed.** Release no longer silently clamps below zero; attempting to release more than the aggregate reserved quantity returns a conflict.
6. **Reserved stock cannot be consumed or written off.** Direct package consumption and write-off both use only the unreserved available balance.
7. **Lifecycle commits are stale-copy guarded.** Generic item mutations compare on-hand, reserved and incoming quantities at commit time and execute stock update plus movement evidence in one D1 batch.
8. **Product resource reservations are atomic across the Product resource set.** Build 71 validates all linked resources first, then updates reservations and movement history as one D1 batch. A missing or insufficient Inventory resource blocks the whole reservation/release operation instead of accepting a partial Product reservation.
9. **Reusable/log-only usage remains non-depleting.** Tools and log-only materials use the Build 70 usage path; recording use does not make physical stock disappear.
10. **Product stock remains a separate owner.** Generic Supply/Tool lifecycle actions reject Product-owned stock; Product production and finished-inventory workflows remain authoritative for Product quantities.
11. **Receiving means physical stock arrived.** Manual receive increases on-hand and reduces confirmed incoming by at most the quantity received. Receiving more than the currently marked incoming quantity is allowed as a manual physical-count correction, but incoming never becomes negative.
12. **Dedicated receiving remains preferred for supplier receipts.** Barcode/source identity, idempotent receiving claims, purchase-order lines and lot provenance remain owned by the established `inventoryReceiving.js` workflow.
13. **Return-to-stock is explicit.** `return_stock` adds previously depleted consumable stock back to storage and requires an auditable reason of at least eight characters.
14. **Write-off is explicit.** `write_off` removes only unreserved stock, requires an auditable reason of at least eight characters, and records a correction movement rather than hiding the loss inside an arbitrary stock edit.
15. **Return/write-off do not pretend to post accounting journals.** Each lifecycle plan exposes inventory value delta, direction and Finance-review context; `journal_posted` is always false in Build 71.
16. **Reorder request is a planning signal, not incoming stock.** Requesting reorder quantity marks the item for reorder and records the requested quantity in audit context, but does **not** increase `incoming_quantity`.
17. **`do_not_reorder` is fail-closed.** A reorder request cannot be placed for an item explicitly marked do not reorder.
18. **Movement history remains the lifecycle evidence stream.** Each accepted lifecycle action creates a `site_inventory_movements` row; base-unit use also creates `site_inventory_usage_movements` evidence.
19. **Existing Product reservation API names remain compatible.** `reserve_product_resources` and `release_product_resources` continue to work through the current Inventory endpoint, but are intercepted by the Build 71 lifecycle authority before the legacy compatibility implementation.
20. **Legacy Inventory create/edit/catalog reconciliation remains retained.** Build 71 intercepts lifecycle mutations only; mature catalog sync, create, edit, classification and source-material workflows remain on the compatibility implementation.
21. **No runtime schema repair is added.** Build 71 performs no request-time CREATE/ALTER/DROP work.
22. **No new D1 migration is required.** Canonical migration authority remains `0001`–`0004`.
23. **No Production business-data rewrite, R2 deletion, payment execution, social publication or supplier auto-purchase is introduced.**
24. **Production promotion remains exact-green only.** System Gate, Current Application Quality Proof, I.T. Admin Runtime Proof and Repository Branch Hygiene must all pass on the exact Development SHA before `main` can fast-forward.

## Lifecycle state transitions

| Action | On hand | Reserved | Incoming | Accounting context |
| --- | ---: | ---: | ---: | --- |
| Receive | increases | unchanged | decreases up to received qty | inventory asset increase; Finance review |
| Reserve | unchanged | increases | unchanged | no inventory value change |
| Release | unchanged | decreases | unchanged | no inventory value change |
| Record use | Build 70 conversion rules | unchanged | unchanged | asset decrease only when stock depletes |
| Return stock | increases | unchanged | unchanged | inventory asset increase; Finance review |
| Write-off | decreases from unreserved stock only | unchanged | unchanged | inventory asset decrease; Finance review |
| Reorder request | unchanged | unchanged | **unchanged** | planning signal only; no journal |

## Important reorder correction

Before Build 71, the generic `reorder_request` compatibility action increased `incoming_quantity`. That mixed an internal request with actual ordered/confirmed stock and could make availability look healthier than reality. Build 71 closes that ambiguity: **incoming quantity changes only when a real purchasing/receiving workflow establishes incoming stock.** Build 72 may recommend reorder quantities and supplier economics, but it must not auto-purchase or create false incoming inventory.

## Accounting boundary

Build 71 computes an informational inventory-value delta using the current package unit cost:

- Receive / return: positive inventory value delta.
- Consume / write-off: negative inventory value delta when stock actually depletes.
- Reserve / release / reorder request: zero inventory value delta.

This information is written into administrator audit context and lifecycle movement notes for later Finance review. It is **not** a journal entry, AP transaction, bank transaction or automatic accounting post. Finance/Accounting remains the owner of actual journal posting.

## D1 / R2 boundary

Build 71 adds no table, column, index, trigger or canonical migration. It does not replace Production data, delete R2 objects, invoke payment/social providers or perform supplier purchasing. All mutation work is bounded to the existing Inventory records and movement/audit ledgers.

## Acceptance

The Build 71 source gate and Node runtime acceptance prove:

- reserve cannot exceed available unreserved stock;
- release cannot exceed reserved stock;
- receiving cannot make incoming negative;
- Build 70 base-unit usage remains authoritative;
- return-to-stock and write-off require explicit reasons;
- write-off cannot consume reserved stock;
- reusable Tool usage remains non-depleting;
- `do_not_reorder` blocks reorder requests;
- reorder request does not modify incoming stock;
- Product-owned stock remains outside generic Inventory lifecycle ownership;
- current wrapper intercepts item and Product-resource lifecycle mutations;
- no schema/provider/R2/polling behavior is added.

## Next build

After Build 71 is exact-green, continue with **Release 467 Build 72 — Inventory / Reorder Economics**.
