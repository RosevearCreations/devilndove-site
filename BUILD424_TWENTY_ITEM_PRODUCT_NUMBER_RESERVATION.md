# Build 424 — Twenty-Item Product-Number Reservation / Non-Executing Preview

## Status

**PASS — LIVE READ-ONLY RESERVATION EVIDENCE + LOCAL NON-EXECUTING GATE 20/20 / PRODUCTION WRITES CLOSED**

Build 424 completed successfully on 2026-08-25.

## Recorded live result

```text
Development Products: 45
Production Products: 45
Shared Product IDs: 45
Identity mismatches: 0
Development missing product_number: 45
Production missing product_number: 45
Development product_number tables: product_costs, product_deletion_audit, products
Production product_number tables: product_costs, product_deletion_audit, products
Invalid historical numeric rows: 0
Historical maximum Product number: 0
Development sequence next: 1000
Production sequence next: 1084
Candidate reservation block: 1084..1128
Candidate next Product number: 1129
Non-executing preview safe to prepare: YES
```

The generated SQL preview contained exactly 45 commented guarded Product updates and **zero executable statements**. The local Build 424 gate passed **20/20**.

## Why the block starts at 1084

Build 195 created the never-reused Product-number sequence but explicitly did not backfill legacy Products. Both current databases therefore still had 45 matching Product rows with NULL `product_number` values.

Build 424 did not assume that legacy numbering should start at 1000. It calculated the first safe block as:

```text
MAX(
  1000,
  Development configured start,
  Production configured start,
  Development sequence next,
  Production sequence next,
  highest positive product_number found in any live product_number-bearing table + 1
)
```

Production's sequence was already `1084`, while no positive historical Product-number value was present in `products`, `product_costs`, or `product_deletion_audit`. The deterministic legacy block is therefore `1084..1128`, with the next sequence value `1129`.

## Build 424 — 20 completed source/safety changes

1. Reclassified the Product-number issue as a shared legacy backfill gap affecting both Dev and Prod.
2. Recorded Build 195 as the source of the gap: sequence creation did not alter existing Product numbers.
3. Added a live read-only reservation-boundary helper for both D1 databases.
4. Added exact 45/45 Product identity reconfirmation.
5. Added exact discovery of every live table containing a real `product_number` column.
6. Added per-table Product-number count/min/max evidence.
7. Added invalid/non-positive historical Product-number detection.
8. Added Development and Production sequence-state inspection.
9. Added `site.catalog.product_number_start` inspection with canonical 1000 fallback.
10. Added a maximum-safe-boundary reservation rule across configured starts, sequences, and history.
11. Added deterministic 45-row candidate mapping in shared Product-ID order.
12. Required all 90 current Dev/Prod Product-number cells to remain NULL before mapping.
13. Added local JSON reservation evidence.
14. Added a local SQL preview generator with one guarded Product update per Product ID.
15. Made every mutation-looking preview line inert with `-- PREVIEW:`.
16. Added slug guards alongside Product IDs.
17. Added a sequence-upsert preview that may advance but never roll back.
18. Added postcondition requirements for exact unique values, preserved identities, and sequence advancement.
19. Added a twenty-check local Build 424 gate.
20. Kept Production mutation/helper generation/copy/provider/promotion capabilities disabled.

## Local artifacts

```text
build424_product_number_reservation_evidence.local.json
build424_nonexecuting_product_number_preview.local.sql
```

These are local evidence artifacts and are not canonical source data.

## Existing parity families retained

- Gift Card lookup-attempt columns/indexes + lockout table/index remain additive Build 384 authority.
- Notification `metadata_json` + current indexes remain additive Build 403 authority.
- Product image annotation composite index remains additive/rerunnable Build 197 authority.
- Membership remains a data-preserving Build 395 legacy→canonical rebuild family.
- Fractional Inventory/Creative Project quantities remain REAL-authority rebuild families.
- Product/FK rebuild families remain orphan-gated.
- Accounting/default/nullability families remain fail-closed on incompatible legacy values.
- `search_query_terms` five Production rows remain preserved pending authority decision.
- `__sql_test` remains untouched pending retirement proof.
- CAIP 113-row metadata/private-R2 history remains outside this schema parity release.

## Safety boundary

```text
Development Product-number mutation                 CLOSED in Build 424
Production Product-number mutation                  CLOSED
Production schema/data mutation                     CLOSED
Executable Production helper                       DISABLED
Broad Production -> Development data copy           CANCELLED
CAIP D1-only metadata copy                          FORBIDDEN
Provider mutation                                   DISABLED
Production promotion                                CLOSED
```

## Validation result

```text
BUILD 424 PRODUCT NUMBER RESERVATION EVIDENCE: PASS
BUILD 424 NON-EXECUTING PRODUCT NUMBER PREVIEW: PASS
BUILD 424 TWENTY-ITEM LOCAL NON-EXECUTING RESERVATION GATE: PASS (20/20)
Candidate Product-number block: 1084..1128
Candidate next Product number: 1129
Executable statements in preview: ZERO
```

## Next 20 ordered changes

The next 20 are implemented/prepared under Build 425 and tracked in `BUILD425_TWENTY_ITEM_DEVELOPMENT_PRODUCT_NUMBER_BACKFILL.md`:

1. Record the exact Build 424 reservation block and sequence/history evidence.
2. Compare the block against DND-formatted SKU values without conflating SKU and Product-number identity.
3. Create a Development-only Product-number backfill candidate.
4. Hard-guard the Development database name/UUID.
5. Require exact 45-row pre-write Development identities and NULL Product numbers.
6. Require fresh sequence/history evidence.
7. Require exact first-pass 45-row Product update behavior.
8. Advance the Development sequence monotonically.
9. Prove 45 unique Development Product numbers after write.
10. Prove Product ID/slug/name preservation.
11. Create a full Development rollback/export boundary before write.
12. Prove a second pass changes zero Product rows.
13. Require explicit Development-only confirmation before the write.
14. Run live read-only Development post-write proof.
15. Keep Production Product numbers NULL during Development proof.
16. Verify read-only next allocation from the advanced sequence without creating a Product.
17. Generate an inert Production Product-number preview only after Development proof.
18. Retain the Gift Card/Notification/Product-image additive families in the later Production package.
19. Refresh canonical handoff/roadmap after Development proof closes.
20. Produce the Build 425 completion gate while keeping Production closed.

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
Build 423  Product-number evidence/fixtures          COMPLETE — shared legacy NULL gap identified
Build 424  Product-number reservation/preview        PASS (20/20), 1084..1128 -> 1129
Build 425  Development-first Product-number backfill READY

Production schema/data mutation                      CLOSED
Executable Production helper                       DISABLED
Production promotion                                CLOSED
```
