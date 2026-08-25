# Build 423 — Product-Number Blocker Remediation / Release Fixtures

## Status

**EVIDENCE COMPLETE — SHARED LEGACY PRODUCT-NUMBER GAP IDENTIFIED / LOCAL FIXTURES PASS / PRODUCTION WRITES CLOSED**

Build 422 passed 20/20 and identified the Build 421 blocker as `products.product_number` readiness. Build 423 then proved the blocker was broader than the initial Production-only hypothesis.

Owner-run live read-only evidence on August 25, 2026:

```text
Development Products: 45
Production Products: 45
Shared Product IDs: 45
Identity mismatches: 0
Development missing product_number: 45
Development duplicate product_number: False
Development number range: None..None
Production missing product_number: 45
Production existing numbered rows: 0
Development sequence table exists: True
Production sequence table exists: True
Non-executing mapping safe to prepare: NO
BUILD 423 PRODUCT NUMBER BACKFILL EVIDENCE: BLOCKED
```

The local Build 423 fixture regression nevertheless passed **20/20**, confirming the planned Gift Card, Notification, Membership, fractional Inventory, Product/FK, Product-number sequence, Accounting and constraint/default fixture behavior.

The local release-candidate gate failed exactly three Product-number mapping assertions because Development had no populated numbers to copy:

```text
05. FAIL — Product-number live identity evidence is safe to prepare as a non-executing backfill map
08. FAIL — Development has a complete unique Product-number mapping
10. FAIL — Non-executing Product-number map contains 45 unique IDs and 45 unique 1000+ numbers
```

This was a **correct fail-closed result**, not a schema/runtime failure.

## Root cause

Build 195 (`database_build195_product_lifecycle_sku_inventory_cards.sql`) introduced `catalog_product_number_sequence` and explicitly stated that the migration **does not change existing product numbers or SKUs**. The 45 existing legacy Products therefore remained NULL.

Current runtime authority in `functions/api/admin/_product-numbering.js` remains:

- Product numbers are internal numeric sequence values;
- default start is 1000 unless configured higher;
- Product numbers are never reused;
- SKU is separate and may use the readable `DND-xxxxx` fallback.

Therefore Build 423 must **not** copy Product numbers from Development to Production. Both environments require the same legacy-backfill design after a never-reuse reservation boundary is proven.

## Build 423 source/fixture accomplishments

1. Preserved the Build 421 Product-number blocker fail-closed.
2. Added live Dev/Prod Product identity comparison.
3. Proved 45/45 Product IDs match.
4. Proved all shared Product ID + slug + name identities match.
5. Proved Development also has 45 NULL Product numbers.
6. Proved Production has 45 NULL Product numbers.
7. Confirmed Product-number uniqueness infrastructure exists in both schemas.
8. Confirmed sequence tables exist in both environments.
9. Prevented a false Dev→Prod mapping when Development had no source numbers.
10. Preserved a local evidence artifact rather than generating unsafe SQL.
11. Added Product-number sequence/backfill in-memory regression.
12. Added Gift Card additive/idempotent fixture coverage.
13. Added Notification additive/row-preservation fixture coverage.
14. Resolved Product-image annotation index to Build 197 authority.
15. Added Membership legacy→Build 395 mapping/preservation fixtures.
16. Added fractional Inventory REAL-value preservation fixtures.
17. Added Product/FK orphan-refusal fixtures.
18. Added Accounting NOT-NULL/default fail-closed fixtures.
19. Preserved one-sided-table/CAIP no-copy decisions.
20. Kept every Production mutation/copy/promotion capability disabled.

## Handoff to Build 424

Build 424 replaces the invalid “copy Development numbers” assumption with a reservation-boundary model. It must inspect both live sequence values plus every live table containing an exact `product_number` column and choose a deterministic 45-number block **above every evidenced consumed/reserved number**.

See `BUILD424_TWENTY_ITEM_PRODUCT_NUMBER_RESERVATION.md`.

## Gate status

```text
Build 410  Development D1 parity overlay             PASS
Build 412  Local RC                                  PASS
Build 416  Development browser/read contracts        PASS
Build 417  Live schema/data mapping                  PASS
Build 418  Live semantic classification              PASS
Build 419  Exact structural drift evidence           PASS
Build 420  20-item parity hardening                  PASS (20/20)
Build 421  20-item Production evidence/manifest      PASS (20/20, 1 blocker)
Build 422  20-item local release fixtures            PASS (20/20)
Build 423  Product-number evidence/fixtures          COMPLETE — shared legacy gap identified
Build 424  Reservation-boundary evidence             NEXT

Production schema/data mutation                      CLOSED
Production promotion                                 CLOSED
```
