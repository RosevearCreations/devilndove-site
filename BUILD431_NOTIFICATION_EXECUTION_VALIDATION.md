# Build 431 — Authorized Notification Production Execution Validation

## Status

**NOTIFICATION PRODUCTION AUTHORIZED / EXECUTION CONTROLLER HARDENED / FRESH BACKUP + APPLY + POSTCHECK PENDING / ALL LATER PRODUCTION FAMILIES LOCKED**

Build 430 Notification authorization boundary is closed PASS (20/20). The owner explicitly authorized only:

```text
AUTHORIZE-BUILD428-PROD-NOTIFICATION
```

This authorization applies only to the reviewed Build 403 `notification_outbox` additive gap:

```text
Missing column:
  metadata_json

Missing indexes:
  idx_notification_outbox_kind_destination
  idx_notification_outbox_order
  idx_notification_outbox_payment
  idx_notification_outbox_product
```

The existing `idx_notification_outbox_status_due` must remain present. The `notification_outbox` row count must be preserved exactly.

No annotation-index, Membership, fractional Inventory, Product/FK, Accounting/default, R2/provider, CAIP-copy, or Production-promotion operation is authorized.

## Additional execution hardening

Build 431 adds `scripts/build431_production_notification_execution.py`, a Notification-only execution controller around the already-proven Build 428 additive primitives.

Before backup/apply it requires:

1. green Build 427 Product-number postcheck;
2. green completed Gift Card Production postcheck with row preservation;
3. exact Notification authorization token;
4. hard Production target inherited from the backed-up additive controller;
5. fresh Build 430 Notification read-only preflight;
6. exact pre-write state: `metadata_json` absent, all four reviewed indexes absent, and `idx_notification_outbox_status_due` present;
7. a fresh full Production D1 export dedicated to Notification;
8. backup byte/SHA/age verification before DDL;
9. an immediate targeted reread after backup and before DDL;
10. exact `notification_outbox` row preservation plus status-due-index preservation after DDL.

The controller exposes only `--backup`, `--apply`, and `--postcheck` for Notification. It has no annotation or rebuild-family execution action.

## Authorized run sequence

Run from `dev` only. Stop if any stage reports FAIL/BLOCKED or exits nonzero.

```bash
cd /c/Dev/devilndove-site

git pull origin dev

python -m py_compile \
  scripts/build431_production_notification_execution.py \
  scripts/build431_notification_execution_regression.py \
  scripts/build430_notification_authorization_preflight.py \
  scripts/build428_production_additive_execution.py

python scripts/build431_notification_execution_regression.py

python -u scripts/build431_production_notification_execution.py \
  --backup \
  --confirm AUTHORIZE-BUILD428-PROD-NOTIFICATION

python -u scripts/build431_production_notification_execution.py \
  --apply \
  --confirm AUTHORIZE-BUILD428-PROD-NOTIFICATION

python -u scripts/build431_production_notification_execution.py --postcheck
```

## Expected safety regression

```text
BUILD 431 NOTIFICATION EXECUTION SAFETY REGRESSION: PASS (20/20)
Notification Production authorization token path: PRESENT / NOT EXERCISED
Notification full-backup boundary: PASS
Exact pre-write drift refusal: PASS
notification_outbox row preservation: PASS
idx_notification_outbox_status_due preservation: PASS
Annotation/rebuild execution path: NONE
Cloudflare access: NONE
Production mutation executed: NO
PRODUCTION PROMOTION: CLOSED
```

## Expected backup boundary

The backup action reruns the fresh Notification preflight and immediate exact state check, then creates the full remote D1 export. It must end with both the underlying backup PASS and:

```text
BUILD 431 NOTIFICATION BACKUP BOUNDARY: PASS
Production mutation executed: NO
PRODUCTION PROMOTION: CLOSED
```

If `metadata_json`, any of the four reviewed missing indexes, or `idx_notification_outbox_status_due` differ from the exact reviewed state, the backup/apply sequence fails closed.

## Expected apply/post-proof

```text
BUILD 431 PRODUCTION NOTIFICATION ADDITIVE POSTCHECK: PASS
notification_outbox rows preserved: <before> -> <same after>
metadata_json present: True
Four reviewed indexes present: True
idx_notification_outbox_status_due preserved: True
PRODUCTION PROMOTION: CLOSED
```

Final independent read-only proof:

```text
BUILD 431 PRODUCTION NOTIFICATION READ-ONLY POSTCHECK: PASS
notification_outbox rows: <preserved>
metadata_json present: True
Four reviewed indexes present: True
idx_notification_outbox_status_due preserved: True
PRODUCTION PROMOTION: CLOSED
```

## Stop conditions

- Any local regression failure: do not contact Production; repair source first.
- Cloudflare `7403`: stop and classify as authorization/read interruption unless DDL already began; if DDL may have begun, run only the read-only Notification postcheck and retain the backup.
- Unexpected Notification state before backup or apply: stop; do not normalize unreviewed drift.
- Missing/stale/hash-mismatched backup: stop and recreate only the Notification backup using the same authorized token.
- Apply/postcheck failure: stop all later Production families and retain the Notification backup.

## Current safety state

```text
Product-number Production stage          COMPLETE / PROVEN
Gift Card Production stage               COMPLETE / PROVEN
Notification authorization               RECEIVED
Notification Production backup           PENDING
Notification Production mutation         PENDING
Annotation-index authorization           NOT RECEIVED
Rebuild-family authorization             NOT RECEIVED
R2/provider mutation                     DISABLED
Production promotion                     CLOSED
```
