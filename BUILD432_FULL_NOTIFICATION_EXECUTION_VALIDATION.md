# Build 432 — Authorized Full Build 403 Notification Execution Validation

## Status

**FULL BUILD 403 NOTIFICATION AUTHORIZED / BACKUP + APPLY + POSTCHECK PENDING / ALL LATER PRODUCTION FAMILIES LOCKED / PRODUCTION PROMOTION CLOSED**

The owner explicitly authorized only:

```text
AUTHORIZE-BUILD431-PROD-NOTIFICATION-FULL-BUILD403
```

The authorized scope is limited to the corrected Build 403 `notification_outbox` additive gap:

```text
metadata_json
idx_notification_outbox_status_due
idx_notification_outbox_kind_destination
idx_notification_outbox_order
idx_notification_outbox_payment
idx_notification_outbox_product
```

The current corrected pre-authorization evidence showed `notification_outbox` rows = 0. The execution controller reruns live state and must preserve the exact row count it sees immediately before DDL.

No Build 197 annotation-index, Membership, fractional Inventory, Product/FK, Accounting/default, R2/provider, CAIP-copy, or Production-promotion operation is authorized.

## Guarded execution controller

Use only:

```text
scripts/build431_production_notification_execution.py
```

It requires:

1. green Product-number Production proof;
2. green Gift Card Production proof;
3. exact full-Build-403 authorization token;
4. fresh corrected Notification read-only preflight;
5. exact `metadata_json` + five-index missing state before backup;
6. fresh full Production D1 export;
7. backup target/bytes/SHA-256/<=30-minute verification;
8. exact state reread after backup;
9. only the missing Build 403 Notification DDL;
10. exact `notification_outbox` row preservation;
11. independent final read-only postcheck.

## Run sequence

Run from `dev` only and stop if any stage returns nonzero:

```bash
cd /c/Dev/devilndove-site

git pull origin dev

set -o pipefail

python -m py_compile \
  scripts/build431_notification_full_authorization_preflight.py \
  scripts/build431_production_notification_execution.py \
  scripts/build431_notification_execution_regression.py

python scripts/build431_notification_execution_regression.py

python -u scripts/build431_notification_full_authorization_preflight.py --run \
  2>&1 | tee build432_notification_fresh_prewrite.txt

python -u scripts/build431_production_notification_execution.py \
  --backup \
  --confirm AUTHORIZE-BUILD431-PROD-NOTIFICATION-FULL-BUILD403 \
  2>&1 | tee build432_notification_backup.txt

python -u scripts/build431_production_notification_execution.py \
  --apply \
  --confirm AUTHORIZE-BUILD431-PROD-NOTIFICATION-FULL-BUILD403 \
  2>&1 | tee build432_notification_apply.txt

python -u scripts/build431_production_notification_execution.py \
  --postcheck \
  2>&1 | tee build432_notification_postcheck.txt
```

For a single chained shell block, use `&&` between stages so a failure cannot advance to a later command.

## Required fresh pre-write proof

Before backup the live state must still be the exact corrected scope:

```text
metadata_json exists: False
Missing canonical Notification indexes:
  idx_notification_outbox_status_due
  idx_notification_outbox_kind_destination
  idx_notification_outbox_order
  idx_notification_outbox_payment
  idx_notification_outbox_product
Exact full Build 403 gap: YES
```

If live state differs, stop before backup and re-plan from current evidence.

## Required backup proof

The dedicated Notification backup must report:

```text
BUILD 428 PRODUCTION NOTIFICATION BACKUP: PASS
Backup: local_backups/<notification-specific full Production export>.sql
Bytes: <nonzero>
SHA-256: <digest>
Production mutation executed: NO

BUILD 431 FULL BUILD 403 NOTIFICATION BACKUP BOUNDARY: PASS
Production mutation executed: NO
PRODUCTION PROMOTION: CLOSED
```

## Required apply proof

The authorized apply must finish:

```text
BUILD 431 PRODUCTION FULL BUILD 403 NOTIFICATION POSTCHECK: PASS
notification_outbox rows preserved: <before> -> <same after>
metadata_json present: True
All five canonical indexes present: True
PRODUCTION PROMOTION: CLOSED
```

## Required independent postcheck

```text
BUILD 431 PRODUCTION FULL BUILD 403 NOTIFICATION READ-ONLY POSTCHECK: PASS
notification_outbox rows: <preserved>
metadata_json present: True
All five canonical indexes present: True
PRODUCTION PROMOTION: CLOSED
```

## Stop conditions

- Local regression failure: stop before Cloudflare access.
- Fresh preflight drift: stop before backup.
- Cloudflare `7403`: classify as authorization/read interruption; if DDL has not begun, do not continue. If DDL may have begun, run only the read-only Notification postcheck and retain any completed backup.
- Backup missing/stale/hash mismatch: stop and recreate only the Notification backup under the same full-scope authorization.
- Apply/postcheck failure: stop all later Production families and retain the Notification backup.

## Safety state before execution

```text
Product-number Production stage             COMPLETE / PROVEN
Gift Card Production stage                  COMPLETE / PROVEN
Full Build 403 Notification boundary        PASS (20/20)
Full Build 403 Notification authorization   RECEIVED
Notification Production backup              NOT CREATED
Notification Production mutation            NOT EXECUTED
Annotation-index authorization              NOT RECEIVED
Rebuild-family authorization                NOT RECEIVED
R2/provider mutation                        DISABLED
Production promotion                        CLOSED
```
