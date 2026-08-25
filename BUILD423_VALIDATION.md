# Build 423 Validation

## Status

**READY — ONE LIVE READ-ONLY PRODUCT-NUMBER EVIDENCE GATE + LOCAL FIXTURES / PRODUCTION WRITES CLOSED**

Build 423 clears the single Build 421 blocker only if Development and Production contain the same 45 logical Products and Development has a complete, unique, canonical 1000+ Product-number assignment while Production still has no conflicting assigned Product numbers.

## Run

From `dev`:

```bash
git pull origin dev

python -m py_compile \
  scripts/build423_product_number_backfill_evidence.py \
  scripts/build423_nonexecuting_migration_catalog.py \
  scripts/build423_release_fixture_regression.py \
  scripts/build423_twenty_item_release_candidate_gate.py

python -u scripts/build423_product_number_backfill_evidence.py --run 2>&1 | tee build423_product_number_evidence.txt

python scripts/build423_release_fixture_regression.py

python scripts/build423_twenty_item_release_candidate_gate.py
```

## Expected live evidence

The Product-number evidence must end with:

```text
Development Products: 45
Production Products: 45
Shared Product IDs: 45
Identity mismatches: 0
Development missing product_number: 0
Development duplicate product_number: False
Production missing product_number: 45
Production existing numbered rows: 0
Non-executing mapping safe to prepare: YES
No database or R2 mutation was executed.
Executable Production helper generated: NO
PRODUCTION PROMOTION: CLOSED
BUILD 423 PRODUCT NUMBER BACKFILL EVIDENCE: PASS
```

The Development/Production sequence-table existence lines are evidence only; absence of the sequence table does not crash the read-only gate.

## Expected local fixture result

```text
BUILD 423 LOCAL RELEASE FIXTURE REGRESSION: PASS (20/20)
Gift Card additive/idempotent fixture: PASS
Notification additive fixture: PASS
Membership preservation fixture: PASS
Fractional Inventory preservation fixture: PASS
Product/FK orphan refusal fixture: PASS
Product-number uniqueness/sequence fixture: PASS
No Cloudflare resource was contacted.
No database or R2 mutation was executed.
Executable Production helper generated: NO
PRODUCTION PROMOTION: CLOSED
```

## Expected 20-item gate

```text
BUILD 423 TWENTY-ITEM LOCAL RELEASE CANDIDATE GATE: PASS (20/20)
Product-number blocker disposition: exact non-executing 45-row mapping proven; Production write still disabled.
No Cloudflare resource was contacted by this local gate.
No database or R2 mutation was executed.
Executable Production helper generated: NO
PRODUCTION PROMOTION: CLOSED
```

## Failure rule

If the live Product-number evidence is `BLOCKED`, do not continue to the local 20-item gate as though the blocker were resolved. Preserve the output. Build 423 must not create an executable backfill from a partial or mismatched Product identity set.

If source compilation or the local fixture regression fails, fix the source/fixture defect locally; do not rerun Builds 417–422 and do not change Production.

## Safety

- Production D1 DDL/DML: **none**.
- Product-number Production update: **none**.
- R2/provider mutation: **none**.
- executable Production helper: **none**.
- broad Production → Development copy: **cancelled**.
- CAIP metadata-only copy: **forbidden**.
- Production promotion: **closed**.
