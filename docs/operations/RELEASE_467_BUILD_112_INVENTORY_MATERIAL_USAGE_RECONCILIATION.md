# Release 467 Build 112 — Inventory & Material-Usage Reconciliation

## Starting authority

Build 112 starts from externally verified Build 111:

- Exact Build 111 Development SHA: `a234b874b6e03442af96c0110d3cc22db074fe34`
- Exact tree: `4e82696773761595e57bb69eb48c053f95060e2c`
- System Gate: `34669983965`
- Current Application Quality Proof: `34669983954`
- I.T. Admin Runtime Proof: `34669983974`
- Repository Branch Hygiene: `34669983946`
- Production Pages Deploy: `34670059768`
- Production Live Resource Integrity: `34670099134`

Build 112 records that Build 111 closure as **ingested by Build 112**. Build 111 itself remains historically correct: it did not self-record proof that occurred after its source commit.

## Problem

Inventory truth is distributed across existing authoritative systems:
- current stock/reservations/cost in Inventory;
- Product resource plans;
- Product production runs/material snapshots;
- reviewed Creative consumption posts;
- Inventory movements and usage movements;
- purchased-kit opening/component provenance.

Without one reconciliation view, missing links, unexplained reservations, shortages and contradictory usage evidence can be difficult to spot.

## Build 112 solution

Build 112 adds a pure reconciliation helper, one authenticated GET-only admin endpoint, and a read-only Inventory Operations panel.

The reconciliation derives:
- current on-hand / reserved / incoming / available stock;
- reserve/release ledger net vs current aggregate reservation;
- Product material requirement per finished unit;
- planned shortages;
- Product production material evidence;
- Creative reviewed-consumption/post/detail evidence;
- reusable/log-only depletion contradictions;
- kit opening/component provenance exceptions;
- aggregate current kit-child remnant evidence;
- current Inventory cost authority and missing-cost review.

## Important attribution rules

`site_item_inventory.reserved_quantity` remains aggregate Inventory authority. Build 112 **does not synthesize Product-specific ownership** when ledger provenance is ambiguous.

Kit child Inventory balance is aggregate remnant evidence. If a child component has stock from multiple sources, Build 112 does not claim a remaining quantity came from a particular purchased kit.

Current cost authority remains `site_item_inventory.unit_cost_cents`. Cost history is optional evidence only.

## Mutation boundaries

Existing owners remain unchanged:
- Build 71 — Inventory lifecycle reserve/release.
- Build 309 — reviewed Creative Inventory posting plus existing Inventory reversal authority.
- Build 440 — Product production material posting.
- Build 440 — kit opening/component-use authority.

Build 112 has:
- no POST handler;
- no synthetic stock movement;
- no Inventory/Product/Creative/Finance mutation;
- no request-time schema repair;
- no R2 or provider action.

## D1 / release safety

Canonical migrations remain exactly `0001`–`0004`; Build 112 introduces no `0005`.

Build 112 is a closure candidate and must not self-record later exact-head proof. Build 113 must ingest Build 112's final external closure.
