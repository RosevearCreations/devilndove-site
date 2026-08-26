# Build 431 — Notification Production Execution Validation

## Status

**SAFE STOP BEFORE BACKUP / PRIOR FOUR-INDEX AUTHORIZATION SUPERSEDED / CORRECTED FULL BUILD 403 AUTHORIZATION BOUNDARY READY / PRODUCTION PROMOTION CLOSED**

Build 430 closed its Notification boundary at 20/20 under the reviewed assumption that `idx_notification_outbox_status_due` already existed and would be preserved.

The owner then explicitly supplied:

```text
AUTHORIZE-BUILD428-PROD-NOTIFICATION
```

That authorization covered only:

```text
metadata_json
idx_notification_outbox_kind_destination
idx_notification_outbox_order
idx_notification_outbox_payment
idx_notification_outbox_product
```

with `idx_notification_outbox_status_due` expected to remain intact.

## Owner-run Build 431 safe stop

The local execution safety regression passed 20/20, but the immediate live pre-write state found:

```text
metadata_json exists: False
Missing reviewed indexes: [
  'idx_notification_outbox_kind_destination',
  'idx_notification_outbox_order',
  'idx_notification_outbox_payment',
  'idx_notification_outbox_product'
]
idx_notification_outbox_status_due intact: False
notification_outbox rows: 0
Exact reviewed Build 403 gap: NO
BUILD 431 PRODUCTION NOTIFICATION: FAIL — Notification state drifted from the exact reviewed Build 403 gap before backup.
```

The stop occurred **before** the Production export call and before any DDL.

```text
Notification Production backup              NOT CREATED
Notification Production mutation            NOT EXECUTED
Production promotion                         CLOSED
```

This is a boundary/evidence correction, not a failed schema write.

## Corrected canonical Build 403 scope

`database_notification_runtime_parity.sql` defines `metadata_json` plus five canonical `notification_outbox` indexes:

```text
idx_notification_outbox_status_due
idx_notification_outbox_kind_destination
idx_notification_outbox_order
idx_notification_outbox_payment
idx_notification_outbox_product
```

Live Production currently lacks all five canonical indexes and `metadata_json`, with `notification_outbox` row count `0` at the safe stop.

## Authorization disposition

The previous token:

```text
AUTHORIZE-BUILD428-PROD-NOTIFICATION
```

is **SUPERSEDED / INSUFFICIENT** for the corrected scope. It must not be reused to create the additional missing `idx_notification_outbox_status_due` index.

A new prepared token is:

```text
AUTHORIZE-BUILD431-PROD-NOTIFICATION-FULL-BUILD403
```

It is not authorized merely by appearing in source or documentation.

## Corrected source boundary

Build 431 now provides:

- `scripts/build431_notification_full_authorization_preflight.py`
  - read-only;
  - requires Product-number + Gift Card proofs;
  - requires `metadata_json` absent;
  - requires all five canonical Build 403 indexes absent;
  - captures `notification_outbox` row count;
  - records old authorization insufficient;
  - cannot create a backup or mutate Production.

- `scripts/build431_production_notification_execution.py`
  - requires the new full-Build-403 token;
  - reruns the corrected preflight before backup;
  - requires exact five-index + metadata pre-write state;
  - creates a separate full Production D1 backup through the proven additive backup primitive;
  - verifies backup bytes/SHA/UUID/<=30-minute age;
  - generates only missing full Build 403 Notification DDL;
  - requires exact `notification_outbox` row preservation;
  - proves `metadata_json` plus all five canonical indexes after execution.

- `scripts/build431_notification_execution_regression.py`
  - local-only 20-check source/safety regression for the corrected scope.

- `scripts/build431_notification_full_authorization_gate.py`
  - local-only 20-item corrected authorization boundary.

## Run now — corrected read-only/local boundary only

Do not create a backup or run Notification DDL yet.

```bash
cd /c/Dev/devilndove-site

git pull origin dev

python -m py_compile \
  scripts/build431_notification_full_authorization_preflight.py \
  scripts/build431_production_notification_execution.py \
  scripts/build431_notification_execution_regression.py \
  scripts/build431_notification_full_authorization_gate.py

python scripts/build431_notification_execution_regression.py

python -u scripts/build431_notification_full_authorization_preflight.py --run \
  2>&1 | tee build431_notification_full_authorization_preflight.txt

python scripts/build431_notification_full_authorization_gate.py
```

Expected live core:

```text
metadata_json exists: False
Missing canonical Notification indexes: [
  'idx_notification_outbox_kind_destination',
  'idx_notification_outbox_order',
  'idx_notification_outbox_payment',
  'idx_notification_outbox_product',
  'idx_notification_outbox_status_due'
]
notification_outbox rows: 0
Exact full Build 403 gap: YES
Prior four-index authorization sufficient: NO
Safe to request full Notification authorization: YES
Production backup created: NO
Full Notification authorization received: NO
Production mutation executed: NO
PRODUCTION PROMOTION: CLOSED
BUILD 431 FULL NOTIFICATION AUTHORIZATION PREFLIGHT: PASS
```

Expected final local gate:

```text
BUILD 431 TWENTY-ITEM FULL NOTIFICATION AUTHORIZATION-BOUNDARY GATE: PASS (20/20)
Product-number Production stage: COMPLETE / PROVEN
Gift Card Production stage: COMPLETE / PROVEN
Prior four-index Notification authorization: SUPERSEDED / INSUFFICIENT
Full Build 403 Notification backup: NOT CREATED
Full Build 403 Notification authorization: NOT RECEIVED
Notification mutation executed: NO
Annotation-index authorization: NOT RECEIVED
Rebuild-family authorization: NOT RECEIVED
PRODUCTION PROMOTION: CLOSED
```

## Safety state

```text
Product-number Production stage           COMPLETE / PROVEN
Gift Card Production stage                COMPLETE / PROVEN
Old Notification authorization            SUPERSEDED / INSUFFICIENT
Full Build 403 Notification authorization NOT RECEIVED
Notification Production backup            NOT CREATED
Notification Production mutation          NOT EXECUTED
Annotation-index authorization            NOT RECEIVED
Rebuild-family authorization              NOT RECEIVED
R2/provider mutation                      DISABLED
Production promotion                      CLOSED
```
