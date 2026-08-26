# Build 427 Validation

## Status

**SOURCE/READ-ONLY AUTHORIZATION BOUNDARY READY — NO PRODUCTION MUTATION AUTHORIZED**

Build 426 is green. Build 427 prepares the staged Production execution tooling but does not authorize or execute it.

## Run now — safe before Production authorization

```bash
cd /c/Dev/devilndove-site

git pull origin dev

python -m py_compile \
  scripts/build427_production_execution_preflight.py \
  scripts/build427_production_product_number_execution.py \
  scripts/build427_production_additive_execution.py \
  scripts/build427_execution_safety_regression.py \
  scripts/build427_authorization_boundary_gate.py

python scripts/build427_execution_safety_regression.py

python -u scripts/build427_production_execution_preflight.py --run \
  2>&1 | tee build427_production_execution_preflight.txt

python scripts/build427_authorization_boundary_gate.py
```

The safety regression and authorization-boundary gate are local-only. The Production execution preflight contacts Development/Production D1 using SELECT/inspection-only evidence inherited from Build 426.

## Expected result

```text
BUILD 427 PRODUCTION EXECUTION SAFETY REGRESSION: PASS (20/20)
Production live access: NONE
Production mutation executed: NO
Authorization tokens exercised: NO
Broad Build 426 candidate execution path: NONE
PRODUCTION PROMOTION: CLOSED
```

Fresh live preflight should retain:

```text
Product-number candidate fresh: YES
Candidate block: 1084..1128
Candidate next: 1129
Product/FK zero-orphan gate: True
site_item_inventory rows: 1041
search_query_terms rows preserved: 5
__sql_test rows untouched: 0
CAIP rows excluded: 113
Safe to open Product-number execution phase: YES
Production backup created: NO
Production authorization received: NO
Production mutation executed: NO
PRODUCTION PROMOTION: CLOSED
BUILD 427 PRODUCTION EXECUTION PREFLIGHT: PASS
```

The final local gate should end:

```text
BUILD 427 TWENTY-ITEM PRODUCTION AUTHORIZATION-BOUNDARY GATE: PASS (20/20)
Production backup for execution: NOT CREATED
Production authorization received: NO
Production mutation executed: NO
PRODUCTION PROMOTION: CLOSED
NEXT: explicit Production authorization is required before the Build 427 backup/apply sequence may be invoked.
```

## Do not run yet

Do not invoke any of these until a separate explicit Production authorization is given:

```text
scripts/build427_production_product_number_execution.py --backup
scripts/build427_production_product_number_execution.py --apply-product-numbers
scripts/build427_production_additive_execution.py --apply-gift-card
scripts/build427_production_additive_execution.py --apply-notification
scripts/build427_production_additive_execution.py --apply-annotation-index
```

The Product-number stage requires the literal token documented in `BUILD427_TWENTY_ITEM_PRODUCTION_EXECUTION_BOUNDARY.md`. The additive stages each require their own separate token and cannot run until the Product-number Production postcheck is green.

## Safety

```text
Production D1 reads during preflight      allowed / bounded
Production backup                         not created yet
Production Product-number write           locked
Production Gift Card write                locked
Production Notification write             locked
Production annotation-index write         locked
Production rebuild families               not part of additive executor
R2/provider mutation                      disabled
Production promotion                      closed
```
