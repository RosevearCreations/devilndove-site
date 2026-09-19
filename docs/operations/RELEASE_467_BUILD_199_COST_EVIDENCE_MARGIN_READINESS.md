# Release 467 Build 199 — Cost Evidence & Margin Readiness

## Goal

Close linked-resource cost-evidence gaps through existing Inventory/Product-resource authorities and expose explainable Product margin readiness without becoming an accounting system.

## Measured starting point

- Linked resources: 8 across 2 Products.
- Missing Inventory matches: 0.
- Missing-cost links: 4.
- Known-cost links: 3.
- Non-depleting/story-only links: 1.
- Margin-ready Products: 0.
- Margin-review Products: 2.

## Required scope

- queue only cost-required links whose cost evidence is unknown;
- route to the exact Inventory cost authority rather than writing costs from the Product-resource view;
- preserve reusable/story-only = not applicable;
- expose quantity/unit conversion and lot evidence alongside cost;
- exact recheck after a reviewed Inventory cost correction;
- Product linked-resource total remains unknown until every required link is evidenced;
- show resource-only margin separately from full accounting profitability;
- keep publication readiness separate.

## Safety boundary

No cost invention, automatic cost write, Inventory quantity change, accounting journal/posting, purchasing, payment/refund, price change or Production data overwrite.

## Acceptance

Unknown must never become silent zero. Margin-ready status is allowed only from evidenced inputs and must remain explicitly scoped to linked resources.
