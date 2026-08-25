# Build 424 — Twenty-Item Product-Number Reservation / Non-Executing Preview

## Status

**READY FOR LIVE READ-ONLY RESERVATION EVIDENCE + LOCAL NON-EXECUTING 20-ITEM GATE / PRODUCTION WRITES CLOSED**

Build 423 refined the single Product-number blocker. The 45 logical Products match exactly between Development and Production, but **all 45 Product-number values are NULL in both environments**.

Recorded Build 423 evidence:

```text
Development Products: 45
Production Products: 45
Shared Product IDs: 45
Identity mismatches: 0
Development missing product_number: 45
Production missing product_number: 45
Development sequence table exists: True
Production sequence table exists: True
```

Build 423's local fixture regression passed 20/20. Its release-candidate gate correctly remained blocked because Development did not contain a mapping that could be copied.

The historical cause is now identified: Build 195 created `catalog_product_number_sequence` but explicitly stated that it **does not change existing product numbers or SKUs**. Therefore the pre-existing legacy Products were never backfilled.

Current numbering authority remains:

- internal numeric Product number;
- canonical default start 1000;
- Product numbers are never reused;
- SKU is separate and may use the readable `DND-xxxxx` format.

## Build 424 — 20 completed source/safety changes

1. Reclassified the Product-number issue from Production-only missing data to a **shared legacy backfill gap** affecting both Dev and Prod.
2. Recorded Build 195 as the source of the gap: sequence creation was additive and intentionally did not alter existing Product numbers.
3. Added a live read-only reservation-boundary helper for both D1 databases.
4. Added exact 45/45 Product identity reconfirmation before a candidate block may be produced.
5. Added exact discovery of every live table containing a real `product_number` column rather than assuming only `products` can reserve history.
6. Added per-table Product-number count/min/max evidence in both environments.
7. Added invalid/non-positive historical Product-number detection; any ambiguous historical value blocks preview preparation.
8. Added current sequence-state inspection in Development and Production.
9. Added current `site.catalog.product_number_start` inspection, falling back to canonical 1000 only when the setting is absent/invalid.
10. Candidate reservation start is now the maximum safe boundary across canonical/configured starts, both sequence values, and all positive historical Product-number values + 1.
11. Added a deterministic 45-row candidate mapping ordered by the already-proven shared Product IDs.
12. Candidate mapping is generated only when all 45 identities still match and all 90 current Product-number cells remain NULL.
13. Added a local JSON reservation artifact; it contains evidence/mapping only and cannot modify D1.
14. Added a local SQL preview generator with exactly one guarded Product update per mapped Product ID.
15. Every mutation-looking line in the SQL preview is prefixed with `-- PREVIEW:` so the generated file contains zero executable statements.
16. Added slug guards alongside Product IDs in every Product-number update preview.
17. Added a sequence-upsert preview that may raise `next_product_number` but can never lower it.
18. Added postcondition preview requirements for 45 unique non-null values, unchanged Product identities, and a sequence value beyond the mapped maximum.
19. Added a twenty-check local Build 424 gate verifying live evidence, mapping integrity, inert SQL output, and safety boundaries.
20. Production mutation, executable helper generation, broad Prod→Dev copy, CAIP metadata-only copy, provider mutation, and promotion all remain disabled/closed.

## Reservation rule

Build 424 does **not** assume the first legacy number is 1000.

The candidate start is:

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

The candidate block then contains exactly 45 consecutive numbers in ascending shared `product_id` order. This preserves deterministic Dev/Prod alignment without reusing any number already evidenced as consumed/reserved.

If sequence/history evidence changes before an eventual write, the preview becomes stale and must be regenerated.

## Generated local artifacts

The live read-only helper creates:

```text
build424_product_number_reservation_evidence.local.json
```

If and only if that evidence is safe, the local generator creates:

```text
build424_nonexecuting_product_number_preview.local.sql
```

The `.local.sql` file is intentionally inert. All DML/sequence lines are comments.

## Existing parity families retained

Build 424 does not discard the already-green Build 423 fixtures:

- Gift Card lookup-attempt columns/indexes + lockout table/index remain additive Build 384 authority.
- Notification `metadata_json` + four indexes remain additive Build 403 authority.
- Product image annotations composite index remains additive/rerunnable Build 197 authority.
- Membership remains a data-preserving Build 395 legacy→canonical rebuild family.
- Fractional Inventory/Creative Project quantities remain REAL-authority rebuild families.
- Product/FK rebuild families remain orphan-gated.
- Accounting/default/nullability families remain fail-closed on incompatible legacy values.
- `search_query_terms` five Production rows remain preserved pending authority decision.
- `__sql_test` remains untouched pending retirement proof.
- CAIP 113-row metadata/R2 history remains Production-only for this parity release.

## Safety boundary

```text
Development Product-number mutation                 CLOSED
Production Product-number mutation                  CLOSED
Production schema/data mutation                      CLOSED
Executable Production helper                       DISABLED
Broad Production -> Development data copy           CANCELLED
CAIP D1-only metadata copy                         FORBIDDEN
Provider mutation                                   DISABLED
Production promotion                                CLOSED
```

## Validation

```bash
python -m py_compile \
  scripts/build424_product_number_reservation_evidence.py \
  scripts/build424_nonexecuting_product_number_preview.py \
  scripts/build424_twenty_item_nonexecuting_gate.py

python -u scripts/build424_product_number_reservation_evidence.py --run 2>&1 | tee build424_product_number_reservation.txt
python scripts/build424_nonexecuting_product_number_preview.py
python scripts/build424_twenty_item_nonexecuting_gate.py
```

Only the reservation-evidence command contacts Cloudflare, and it is SELECT/inspection-only.

## Next 20 ordered changes

1. Build 425: record the exact Build 424 reservation block and sequence/history evidence in Markdown.
2. Build 425: compare the candidate Product-number block against any SKU values that encode historical DND numbers; informational conflicts must be reviewed without conflating SKU and Product number.
3. Build 425: create a Development-only Product-number backfill migration candidate from the reviewed inert preview.
4. Build 425: add a hard target UUID/name guard so that candidate cannot point at Production.
5. Build 425: add pre-write Development assertions for 45 matching Product identities and still-NULL Product numbers.
6. Build 425: add pre-write sequence/history stale-evidence detection.
7. Build 425: add exact 45-row update-count assertion.
8. Build 425: add Development sequence advance/no-rollback assertion.
9. Build 425: add post-write 45 unique Product-number assertion.
10. Build 425: add post-write Product ID/slug/name preservation assertion.
11. Build 425: add Development rollback/export boundary before any Product-number write.
12. Build 425: add local in-memory regression proving rerun performs zero second-pass Product updates.
13. Build 425: run the Development-only backfill only after the candidate gate passes and explicit target proof is printed.
14. Build 425: rerun live read-only Dev Product-number evidence after the Development write.
15. Build 425: keep Production Product numbers NULL while Development validation is performed.
16. Build 425: verify Product create/mobile-create allocate from the advanced sequence after the legacy block without consuming a real new Product during validation.
17. Build 425: assemble the Production Product-number migration preview only after Development proof is green.
18. Build 425: retain Gift Card/Notification/Product-image additive families in the non-executing Production package.
19. Build 425: update canonical `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md` with Builds 417–425 parity evidence after Development Product-number proof closes.
20. Build 425: produce the next 20-item gate; Production mutation/promotion remains closed until the Development-only Product-number backfill is proven and separately reviewed.

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
Build 423  Product-number evidence/fixtures          COMPLETE — blocker refined: Dev+Prod both 45 NULL
Build 424  Product-number reservation/preview        READY

Production schema/data mutation                      CLOSED
Executable Production helper                       DISABLED
Production promotion                                CLOSED
```
