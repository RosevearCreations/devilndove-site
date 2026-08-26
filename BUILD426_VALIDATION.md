# Build 426 Validation

## Status

**READY — ONE LIVE READ-ONLY EVIDENCE PASS + LOCAL PACKAGE/REGRESSION/GATE / PRODUCTION WRITES CLOSED**

Build 426 assembles the Production release candidate but does not execute it.

## Run

From `dev`:

```bash
git pull origin dev

python -m py_compile \
  scripts/build426_live_release_candidate_evidence.py \
  scripts/build426_production_release_candidate_package.py \
  scripts/build426_release_candidate_regression.py \
  scripts/build426_twenty_item_release_candidate_gate.py

python scripts/build426_release_candidate_regression.py

python -u scripts/build426_live_release_candidate_evidence.py --run \
  2>&1 | tee build426_live_release_candidate_evidence.txt

python scripts/build426_production_release_candidate_package.py

python scripts/build426_twenty_item_release_candidate_gate.py
```

Do not add `set -e`; preserving all output is more useful if one gate reports an unexpected live-state change.

## Expected regression

```text
BUILD 426 RELEASE-CANDIDATE REGRESSION: PASS (20/20)
Product-number 45-row candidate: PASS
Gift Card additive candidate: PASS
Notification additive candidate: PASS
Product-image index candidate: PASS
Rebuild-family review boundaries: PASS
Production execution enabled: NO
No Cloudflare resource was contacted.
```

## Expected live evidence core

The exact Gift Card/Notification/index missing lists are evidence and may legitimately shrink if a separate authorized migration occurred, but the Product-number and preservation boundaries should remain:

```text
Development Product numbers: 1084..1128 (45 rows)
Development sequence next: 1129
Production Product numbers assigned: 0
Production sequence next: 1084
Product-number Production candidate ready: YES
Product/FK live orphan counts all zero: True
site_item_inventory Production rows: 1041
search_query_terms rows: 5
__sql_test rows: 0
CAIP media upload rows: 113
No database or R2 mutation was executed.
PRODUCTION PROMOTION: CLOSED
BUILD 426 LIVE READ-ONLY RELEASE-CANDIDATE EVIDENCE: COMPLETE
```

If Product-number readiness becomes `NO`, or any orphan count becomes nonzero, Build 426 must remain blocked and the candidate package must not be used later.

## Expected package

```text
BUILD 426 PRODUCTION RELEASE-CANDIDATE PACKAGE: PASS
Product-number guarded updates: 45
Ready candidate families: [...]
Review-required rebuild families: membership, fractional Inventory, Product/FK, accounting/defaults
Candidate SQL: build426_production_release_candidate.local.sql
Manifest: build426_production_release_candidate_manifest.local.json
Cloudflare access: NONE
Production execution enabled: NO
Production mutation executed: NO
PRODUCTION PROMOTION: CLOSED
```

The generated SQL is an **executable candidate file**, not a command and not authorization. Do not pass it to `wrangler d1 execute` during Build 426. A later Production execution phase must first create a fresh Production backup and re-prove the live preconditions.

## Expected 20-item gate

```text
BUILD 426 TWENTY-ITEM PRODUCTION RELEASE-CANDIDATE GATE: PASS (20/20)
Development Product numbers: 1084..1128; next >=1129
Production Product numbers: unchanged / still NULL
Production release candidate: assembled locally, NOT executed
Production backup for execution: NOT YET CREATED
Production mutation executed: NO
PRODUCTION PROMOTION: CLOSED
```

## Failure handling

- Compile/regression failure: source/fixture defect; do not contact Production to work around it.
- Live evidence Product-number failure: state changed; candidate is stale and must be rebuilt from new evidence.
- Live orphan failure: leave that rebuild family blocked.
- Package/gate failure: preserve local evidence; do not manually execute partial SQL.
- Do not rerun Builds 417–425 unless a source change explicitly invalidates their evidence.

## Safety

```text
Build 426 Production DDL/DML      none
Build 426 Production backup       none
Build 426 R2/provider mutation    none
Production candidate SQL          local artifact only
Production promotion              closed
```
