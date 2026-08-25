# Build 423 — Twenty-Item Product-Number Blocker Remediation / Release Fixtures

## Status

**READY FOR ONE LIVE READ-ONLY PRODUCT-IDENTITY GATE + LOCAL 20-ITEM FIXTURE GATE / PRODUCTION WRITES CLOSED**

Build 422 passed 20/20 and identified the single Build 421 blocker exactly:

```text
products.product_number semantic uniqueness including implicit UNIQUE indexes
missing_product_number=45
producer duplicate_groups=0
production_unique_index=True
development_unique_index=True
```

The blocker is therefore **missing Production Product-number data**, not missing uniqueness enforcement.

Current Product-number authority in `functions/api/admin/_product-numbering.js` says:

- Product numbers are internal numeric sequence values.
- Default sequence start is `1000`.
- Product numbers are never reused.
- Human-readable fallback SKU values use `DND-xxxxx`; SKU is separate from Product number.

Build 423 does not invent Product numbers and does not assume Development values may be copied. It first requires exact live Product identity parity before it emits a local, non-executing mapping artifact.

## Build 423 — 20 completed source/fixture changes

1. Recorded the single blocker as Product-number data readiness rather than index readiness.
2. Added a live read-only Development/Production Product identity comparator.
3. Product identity comparison requires exact `product_id + slug + name` agreement before any mapping is considered safe.
4. Added exact 45/45 Product row/ID-set validation.
5. Added Development Product-number completeness validation.
6. Added Development Product-number uniqueness validation.
7. Added Product-number lower-bound validation against canonical start `1000`.
8. Added Production existing-number conflict detection; current blocker expects all 45 values missing.
9. Added conditional Product-sequence-table evidence so a missing sequence table is reported rather than crashing the gate.
10. Added local `build423_product_number_backfill_mapping.local.json` generation only when all identity/number checks pass; this artifact cannot mutate D1.
11. Added local Product-number backfill regression preserving Product IDs and advancing the sequence beyond the mapped maximum.
12. Added non-executing Gift Card additive fixture authority for five lookup-attempt columns, two lookup indexes, lockout table/index, rerun idempotency, and row preservation.
13. Added non-executing Notification additive fixture authority for `metadata_json`, four current indexes, and row preservation.
14. Resolved `product_image_annotations(product_id, product_image_id)` to Build 197 additive/rerunnable migration authority.
15. Added Membership legacy alias → Build 395 canonical mapping fixture with row-count and unique-tier preservation.
16. Added fractional Inventory/Creative Project table-copy fixture using actual non-integer REAL values.
17. Added Product/FK orphan-refusal fixture; rebuild planning remains fail-closed while any orphan exists.
18. Added Accounting NOT-NULL/default fixture that refuses tightening while incompatible legacy data exists, plus bounded four-table constraint/default scope.
19. Retained one-sided table decisions: preserve five `search_query_terms` rows; leave empty `__sql_test` untouched until retirement authority is proven.
20. Added a 20-check local Build 423 release-candidate gate that requires the live Product-number evidence artifact and still disables every Production mutation/copy/promotion capability.

## Product-number blocker disposition rule

Build 423 may mark the blocker **mapped for remediation** only if all of these are true:

```text
Development Products                  45
Production Products                   45
Shared Product IDs                    45
Development-only Product IDs           0
Production-only Product IDs            0
Identity mismatches                     0
Development missing product_number      0
Development duplicate product_number    0
Development minimum product_number   >=1000
Production missing product_number      45
Production existing numbered rows       0
```

If any condition is false, the Product-number family stays blocked and no backfill map is trusted.

Even when all conditions are true, Build 423 only produces a **local JSON mapping artifact**. It does not produce or execute Production UPDATE statements.

## Migration fixture decisions

### Additive / fixture-ready

- Gift Card lookup-attempt columns/indexes.
- `gift_card_lookup_lockouts` table/index.
- Notification `metadata_json` and current outbox indexes.
- Build 197 Product image annotation composite index.

### Data-preserving rebuild fixture-ready

- Membership tier policies.
- Five fractional Inventory/Creative Project tables.
- Product/FK family, but only after live orphan gates remain zero.
- Accounting/default/nullability family, but only after live data compatibility stays zero/mapped.

### Preserve / no count-parity action

- `search_query_terms`: preserve five Production rows while authority remains unresolved.
- `__sql_test`: empty Production residue stays untouched pending explicit retirement authority.
- CAIP 113-row metadata delta remains Production-only unless D1 + private R2 portability is handled as a separate project.

## Safety boundary

```text
Production schema mutation                 DISABLED
Production Product-number UPDATE            DISABLED
Executable Production helper               DISABLED
Broad Production -> Development data copy  DISABLED / CANCELLED
CAIP D1-only metadata copy                 DISABLED / FORBIDDEN
Provider mutation                           DISABLED
Production promotion                       CLOSED
```

## Validation

Run from `dev`:

```bash
python -m py_compile \
  scripts/build423_product_number_backfill_evidence.py \
  scripts/build423_nonexecuting_migration_catalog.py \
  scripts/build423_release_fixture_regression.py \
  scripts/build423_twenty_item_release_candidate_gate.py

python -u scripts/build423_product_number_backfill_evidence.py --run 2>&1 | tee build423_product_number_evidence.txt
python scripts/build423_release_fixture_regression.py
python scripts/build423_twenty_item_release_candidate_gate.py
```

Only the first Build 423 command after compilation contacts Cloudflare, and it is read-only.

## Next 20 ordered changes

1. Build 424: record Build 423 live Product-number identity/mapping evidence in Markdown.
2. Build 424: convert the proven local Product-number map into a reviewed **non-executing SQL preview** with one guarded row per Product ID.
3. Build 424: add Product-number SQL-preview assertions requiring every target Production value to still be NULL before update eligibility.
4. Build 424: add Product-number SQL-preview assertions requiring no target number to exist on another Product.
5. Build 424: add Product-number sequence-upsert preview to `max(mapped_number)+1` without allowing sequence rollback.
6. Build 424: add Product-number post-preview assertions for 45 non-null unique 1000+ values and unchanged Product IDs/slugs.
7. Build 424: assemble Gift Card additive SQL preview from canonical Build 384 authority only.
8. Build 424: add Gift Card pre/post/rerun preview tests against representative legacy rows.
9. Build 424: assemble Notification additive SQL preview from Build 403 authority only.
10. Build 424: add Notification pre/post/rerun preview tests and row-count preservation.
11. Build 424: assemble approved Build 197 Product-image-annotation additive index preview.
12. Build 424: build Membership rebuild SQL preview with explicit legacy→canonical column mapping and backup/shadow boundaries.
13. Build 424: add Membership fixture proving all three live tier identities survive rebuild with canonical uniqueness.
14. Build 424: build fractional Inventory/Creative Project rebuild SQL previews with explicit REAL affinity and exact row/value preservation assertions.
15. Build 424: add exact live `site_item_inventory` 1,041-row before/after assertion to the non-executing manifest.
16. Build 424: build Product/FK rebuild SQL previews only for families whose Build 421 orphan counts were zero.
17. Build 424: build Accounting/constraint SQL previews only for families whose Build 421 compatibility checks were zero or explicitly mapped.
18. Build 424: classify `search_query_terms` current aggregate/runtime authority into preserve-current or later-retire; do not mutate its five rows.
19. Build 424: classify `__sql_test` aggregate origin and later-retirement eligibility; do not remove it in the parity release.
20. Build 424: produce a full local **non-executing Production migration package** and release gate; actual Production execution remains a separate explicit later authorization.

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
Build 423  Product-number remediation + fixtures     READY

Production schema/data mutation                      CLOSED
Production promotion                                 CLOSED
```
