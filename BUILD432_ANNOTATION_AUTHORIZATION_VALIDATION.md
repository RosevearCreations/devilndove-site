# Build 432 — Build 197 Annotation-Index Authorization Boundary Validation

## Status

**READY — ANNOTATION READ-ONLY AUTHORIZATION PREFLIGHT + LOCAL 20/20 GATES / NO ANNOTATION PRODUCTION MUTATION AUTHORIZED**

Product numbers, Gift Card, and full Build 403 Notification Production parity are complete/proven. Build 197 annotation-index is now the only active authorization decision.

## Run now

```bash
cd /c/Dev/devilndove-site

git pull origin dev

python -m py_compile \
  scripts/build432_annotation_authorization_preflight.py \
  scripts/build432_annotation_authorization_regression.py \
  scripts/build432_annotation_authorization_gate.py \
  scripts/build428_production_additive_execution.py

python scripts/build432_annotation_authorization_regression.py

python -u scripts/build432_annotation_authorization_preflight.py --run \
  2>&1 | tee build432_annotation_authorization_preflight.txt

python scripts/build432_annotation_authorization_gate.py
```

Only the live preflight contacts Cloudflare/D1, and it performs read-only schema/count queries.

## Expected local regression

```text
BUILD 432 ANNOTATION AUTHORIZATION SAFETY REGRESSION: PASS (20/20)
Full Notification Production prerequisite: SOURCE-GATED
Annotation Production authorization inferred: NO
Production backup created by regression: NO
Production mutation executed: NO
Rebuild authorization inferred: NO
PRODUCTION PROMOTION: CLOSED
```

## Expected live preflight

The exact row count is live data and should be accepted if it is a non-negative integer. The index must still be absent and both indexed columns must be present.

```text
=== BUILD 432 BUILD 197 ANNOTATION AUTHORIZATION BOUNDARY ===
Annotation index exists: False
Required product_id/product_image_id columns present: True
product_image_annotations rows: <live>
Exact Build 197 index gap: YES
Safe to request annotation authorization: YES
Production backup created: NO
Annotation authorization received: NO
Production mutation executed: NO
Rebuild authorization: NOT RECEIVED
PRODUCTION PROMOTION: CLOSED
BUILD 432 ANNOTATION AUTHORIZATION PREFLIGHT: PASS
```

## Expected final gate

```text
BUILD 432 TWENTY-ITEM BUILD 197 ANNOTATION AUTHORIZATION-BOUNDARY GATE: PASS (20/20)
Product-number Production stage: COMPLETE / PROVEN
Gift Card Production stage: COMPLETE / PROVEN
Full Build 403 Notification Production stage: COMPLETE / PROVEN
Annotation backup: NOT CREATED
Annotation authorization: NOT RECEIVED
Annotation mutation executed: NO
Rebuild-family authorization: NOT RECEIVED
PRODUCTION PROMOTION: CLOSED
NEXT: explicit Build 197 annotation-index Production authorization is required before backup/apply.
```

## Do not run yet

Until the owner explicitly authorizes the Build 197 annotation stage, do not run any annotation `--backup` or `--apply` invocation.

Prepared token:

```text
AUTHORIZE-BUILD428-PROD-ANNOTATION-INDEX
```

Merely seeing or validating this token does not authorize it.

## Reviewed Build 197 scope

Canonical authority: `database_build197_application_resilience_media_catalog.sql`.

Only this composite index belongs to the bounded stage:

```sql
CREATE INDEX IF NOT EXISTS idx_product_image_annotations_product_image_build197
  ON product_image_annotations(product_id, product_image_id);
```

The future authorized stage must preserve the exact `product_image_annotations` row count observed immediately before DDL.

## Failure handling

- Cloudflare `7403`: classify as authorization/read interruption and stop.
- Index already exists: treat the stage as no longer requiring authorization; re-plan from current state rather than forcing a write.
- Missing `product_id` or `product_image_id`: block the stage and investigate schema drift.
- Missing/failed Product, Gift, or Notification prerequisite artifact: stop; do not bypass it.
- Local regression/gate failure: patch source only; do not create a Production backup as a workaround.
- Any gate failure: annotation remains unauthorized.

## Safety

```text
Product numbers                    complete / proven
Gift Card                          complete / proven
Full Build 403 Notification       complete / proven
Annotation reads                  bounded / read-only
Annotation backup                 not created
Annotation authorization          not received
Annotation mutation               locked
Membership/rebuild families       locked
R2/provider mutation              disabled
Production promotion              closed
```
