# Release 467 Build 203 — Cost Evidence & Margin Readiness

## Goal

Turn unknown required Product-resource cost evidence into a bounded operator repair queue while preserving Inventory Operations as the cost mutation owner, Product Resources as the link/usage owner, and Finance/Accounting as a separate financial authority.

## Exact starting boundary

- Build 202 Development: `41d3fc3c30c0de0513847437e684d0d6623e761c`.
- Build 202 protected-`main` Production merge: `09745a82b5f8d23e0fe1c681b90ec32b4605a38a`.
- Exact Build 202 source tree: `531e8c404046a7849d41a58212b33bb061d1429d`.
- Build 202 Development reconciliation proof: **5,907 / 12,500 provider-metered rows read**.
- Build 202 Production Pages deployment: GREEN on the exact Production SHA.
- `dev` was synchronized non-force to the exact Build 202 Production SHA before Build 203 began.

## Historical evidence baseline

The earlier Build 191 / pre-insertion planning evidence measured:

- 8 linked resources across 2 Products.
- 0 missing Inventory matches.
- 4 missing-cost links.
- 3 known-cost links.
- 1 reusable/story-only non-depleting link.
- 0 margin-ready Products.
- 2 margin-review Products.

These are a baseline, not immutable current facts. Build 203 refreshes the live Development evidence through its exact-SHA proof.

## Build 203 scope

### Explicit-only Cost Evidence & Margin Readiness workbench

Inventory Operations gains a read-only workbench that does not load cost evidence on page startup.

The operator may explicitly:

- load a bounded cost/margin summary;
- load up to 40 required links whose cost evidence is unknown;
- search by Product, SKU, resource, source key or ID;
- open the exact Inventory cost authority for a linked Tool/Supply;
- open the exact Product Resources authority for link/usage correction;
- recheck one Product-resource link after a reviewed correction.

### Unknown cost remains unknown

A cost-required link is classified as:

- `known` — matching Inventory row and positive reviewed unit cost;
- `unknown_missing_cost` — Inventory matches but unit cost is absent/non-positive;
- `unknown_inventory_match` — Product-resource identity does not resolve to Inventory;
- `not_applicable` — reusable/log-only Tool or story-only link.

Unknown required cost is never coerced to zero. A Product is margin-ready only when all required linked-resource costs are evidenced.

### Margin boundary

Build 203 reports **linked-resource margin readiness only**.

It does not claim full accounting profit and excludes:

- labour;
- overhead;
- marketplace fees;
- payment fees;
- shipping;
- tax;
- accounting adjustments.

Publication readiness remains separate from margin readiness.

## Existing mutation authorities

- Inventory Operations owns reviewed Tool/Supply unit cost.
- Product Resources owns Product-resource identity, quantity-per-use/batch and consumption mode.
- Finance/Accounting remains the accounting authority.

The Build 203 workbench is orchestration/read evidence only and cannot write cost, stock, Product price or accounting state.

## Stale-safe recheck

One-link recheck returns a deterministic evidence token built from:

- Product-resource link identity;
- Inventory identity;
- unit cost;
- usage quantity and conversion;
- consumption mode / lot size;
- usage tracking mode;
- Inventory updated timestamp.

If that token changed since the queue row was loaded, the result is marked stale. Build 203 never resolves a stale record automatically.

## Safety boundary

No automatic cost write, Inventory quantity change, Product price change, Product publication, accounting journal/posting, supplier purchasing, payment/refund action, provider publication, R2 mutation, schema migration or Production business-data overwrite.

## D1 budget contract

The exact Development proof:

- uses one ranked Inventory projection plus Product-resource/usage joins;
- measures linked resources, missing Inventory matches, missing/known cost, non-depleting links and margin-ready/review Products;
- is capped at **12,500 provider-metered D1 rows read**;
- performs **zero D1 mutation**;
- performs no schema migration or R2 mutation.

Production promotion is code-only and uses the zero-D1 path.

## Acceptance

Build 203 is GREEN only when:

1. The workbench performs no startup cost read, polling or write.
2. The missing-cost queue is server-bounded to 40 rows.
3. Unknown required cost is never silently zero.
4. Reusable/log-only Tools and story-only links remain not applicable.
5. Repair routes point to existing Inventory/Product Resources authorities.
6. One-link recheck is stale-safe and read-only.
7. Linked-resource margin remains explicitly separate from accounting profit and publication readiness.
8. The exact Development proof remains at or below 12,500 provider-metered rows read.
9. Retained Build 202, Build 191, Build 185 and Build 194 source contracts remain GREEN.

## Numbering note

An older pre-insertion planning file named `RELEASE_467_BUILD_199_COST_EVIDENCE_MARGIN_READINESS.md` is historical provenance only. The current autonomous roadmap makes **Release 467 Build 203** the canonical delivery of this scope.

## Next

Build 204 — Storefront Launch Set & Autonomous Closure.
