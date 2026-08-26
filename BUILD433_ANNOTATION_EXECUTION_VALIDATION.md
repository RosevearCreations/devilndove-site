# Build 433 — Authorized Build 197 Annotation-Index Production Execution Validation

## Status

**ANNOTATION AUTHORIZED / GUARDED BACKUP + APPLY + POSTCHECK PENDING / ALL REBUILD FAMILIES LOCKED / PRODUCTION PROMOTION CLOSED**

The owner explicitly authorized only:

```text
AUTHORIZE-BUILD428-PROD-ANNOTATION-INDEX
```

The authorized scope is exactly:

```sql
CREATE INDEX IF NOT EXISTS idx_product_image_annotations_product_image_build197
  ON product_image_annotations(product_id, product_image_id);
```

Do not run this SQL manually in the Cloudflare D1 console. Use the guarded Build 433 controller so the backup, exact-state checks, row-preservation proof, and independent postcheck are all enforced.

## Preconditions already proven

```text
Product-number Production stage                    COMPLETE / PROVEN
Gift Card Production stage                         COMPLETE / PROVEN
Full Build 403 Notification Production stage       COMPLETE / PROVEN
Build 197 annotation authorization boundary        PASS (20/20)
Boundary product_image_annotations rows             70
Build 197 annotation index                          ABSENT
Required product_id/product_image_id columns        PRESENT
```

The immediate pre-write row count is live. If legitimate activity changes the count from 70 before execution, the fresh preflight count becomes the preservation boundary.

## Guarded controller

Use only:

```text
scripts/build433_production_annotation_execution.py
```

It requires:

1. exact annotation authorization token;
2. green Product-number Production proof;
3. green Gift Card Production proof;
4. green corrected full Build 403 Notification Production proof;
5. fresh Build 432 annotation read-only preflight;
6. both required annotation columns present;
7. Build 197 composite index still absent;
8. exact live annotation row boundary;
9. fresh full Production D1 backup;
10. backup UUID/bytes/SHA-256/<=30-minute verification;
11. post-backup state reread with drift refusal;
12. only the canonical Build 197 composite index DDL;
13. exact annotation-row preservation;
14. independent read-only postcheck;
15. Production promotion closed.

## Run sequence

Run from `dev` only. `set -o pipefail` prevents `tee` from hiding a failed Python stage. The `&&` chain prevents advancement after any non-zero result.

```bash
cd /c/Dev/devilndove-site

git pull origin dev

set -o pipefail

python -m py_compile \
  scripts/build433_production_annotation_execution.py \
  scripts/build433_annotation_execution_regression.py \
  scripts/build432_annotation_authorization_preflight.py \
  scripts/build428_production_additive_execution.py \
&& \
python scripts/build433_annotation_execution_regression.py \
&& \
echo \
&& echo "============================================================" \
&& echo "BUILD 433 FRESH BUILD 197 ANNOTATION PRE-WRITE CHECK" \
&& echo "============================================================" \
&& python -u scripts/build432_annotation_authorization_preflight.py --run \
  2>&1 | tee build433_annotation_fresh_prewrite.txt \
&& \
echo \
&& echo "============================================================" \
&& echo "BUILD 433 AUTHORIZED ANNOTATION PRODUCTION BACKUP" \
&& echo "============================================================" \
&& python -u scripts/build433_production_annotation_execution.py \
  --backup \
  --confirm AUTHORIZE-BUILD428-PROD-ANNOTATION-INDEX \
  2>&1 | tee build433_annotation_backup.txt \
&& \
echo \
&& echo "============================================================" \
&& echo "BUILD 433 AUTHORIZED BUILD 197 ANNOTATION INDEX WRITE" \
&& echo "============================================================" \
&& python -u scripts/build433_production_annotation_execution.py \
  --apply \
  --confirm AUTHORIZE-BUILD428-PROD-ANNOTATION-INDEX \
  2>&1 | tee build433_annotation_apply.txt \
&& \
echo \
&& echo "============================================================" \
&& echo "BUILD 433 FINAL ANNOTATION READ-ONLY POSTCHECK" \
&& echo "============================================================" \
&& python -u scripts/build433_production_annotation_execution.py \
  --postcheck \
  2>&1 | tee build433_annotation_postcheck.txt
```

## Required pre-write proof

Before backup:

```text
Annotation index exists: False
Required product_id/product_image_id columns present: True
product_image_annotations rows: <live>
Exact Build 197 index gap: YES
BUILD 432 ANNOTATION AUTHORIZATION PREFLIGHT: PASS
```

The Build 433 controller then repeats the exact state boundary:

```text
=== BUILD 433 BUILD 197 ANNOTATION PRE-WRITE STATE ===
Required columns present: True
Annotation index exists: False
product_image_annotations rows: <same live count>
Exact Build 197 index gap: YES
```

## Required backup proof

```text
BUILD 428 PRODUCTION ANNOTATION BACKUP: PASS
Backup: local_backups/<annotation-specific full Production export>.sql
Bytes: <nonzero>
SHA-256: <digest>
Production mutation executed: NO

BUILD 433 BUILD 197 ANNOTATION BACKUP BOUNDARY: PASS
product_image_annotations rows preserved across backup: <before> -> <same>
Production mutation executed: NO
PRODUCTION PROMOTION: CLOSED
```

## Required apply proof

```text
BUILD 433 PRODUCTION BUILD 197 ANNOTATION POSTCHECK: PASS
product_image_annotations rows preserved: <before> -> <same>
Build 197 annotation index present: True
PRODUCTION PROMOTION: CLOSED
```

## Required independent postcheck

```text
BUILD 433 PRODUCTION BUILD 197 ANNOTATION READ-ONLY POSTCHECK: PASS
product_image_annotations rows: <preserved>
Build 197 annotation index present: True
PRODUCTION PROMOTION: CLOSED
```

## Stop conditions

- Local regression failure: stop before Cloudflare access.
- Fresh annotation preflight drift: stop before backup.
- Build 197 index already exists: do not force a write; reclassify the stage from current state.
- Required indexed column missing: stop and investigate schema drift.
- Cloudflare `7403`: stop and classify as authorization/read interruption unless DDL may have started; if DDL may have started, run only the read-only annotation postcheck and retain any completed backup.
- Backup missing/stale/hash mismatch: stop and recreate only the annotation backup under the same authorized token.
- Apply/postcheck failure: stop every rebuild family and retain the annotation backup.

## Safety state before execution

```text
Annotation Production authorization          RECEIVED
Annotation Production backup                 NOT CREATED
Annotation Production mutation               NOT EXECUTED
Membership rebuild authorization             NOT RECEIVED
Fractional Inventory authorization           NOT RECEIVED
Product/FK authorization                     NOT RECEIVED
Accounting/default authorization             NOT RECEIVED
R2/provider mutation                         DISABLED
CAIP D1-only copy                            FORBIDDEN
Production promotion                         CLOSED
```
