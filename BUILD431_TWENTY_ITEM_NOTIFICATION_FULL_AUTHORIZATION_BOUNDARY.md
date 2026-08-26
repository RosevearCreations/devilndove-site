# Build 431 — Corrected Full Build 403 Notification Authorization Boundary

## Status

**SAFE STOP RECORDED / LIVE DRIFT REVIEWED / FULL BUILD 403 NOTIFICATION AUTHORIZATION PENDING / NO NOTIFICATION BACKUP OR MUTATION EXECUTED / PRODUCTION PROMOTION CLOSED**

The first authorized Notification attempt stopped before backup because the immediate live pre-write state proved `idx_notification_outbox_status_due` is also absent.

The earlier four-index authorization was explicitly scoped to preserving that index, so it cannot be reused to create a fifth index.

## Safe-stop evidence

The owner-run Build 431 sequence reached:

```text
=== BUILD 431 NOTIFICATION IMMEDIATE PRE-WRITE STATE ===
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

Disposition:

```text
Notification Production backup              NOT CREATED
Notification Production mutation            NOT EXECUTED
Prior four-index authorization               SUPERSEDED / INSUFFICIENT
Production promotion                         CLOSED
```

## Corrected canonical Build 403 gap

Canonical authority: `database_notification_runtime_parity.sql`.

Current reviewed full Production gap:

```text
Missing column:
  metadata_json

Missing indexes:
  idx_notification_outbox_status_due
  idx_notification_outbox_kind_destination
  idx_notification_outbox_order
  idx_notification_outbox_payment
  idx_notification_outbox_product

notification_outbox rows:
  0
```

The corrected stage must preserve `notification_outbox` rows exactly while creating only the missing Build 403 column/indexes.

## Prior authorization is not reusable

Previously supplied token:

```text
AUTHORIZE-BUILD428-PROD-NOTIFICATION
```

That authorization covered a four-index scope in which `idx_notification_outbox_status_due` was expected to remain intact. Because live Production proves that index is absent, using the old token for the expanded five-index stage would exceed the authorized scope.

## New prepared authorization token — not authorized

```text
AUTHORIZE-BUILD431-PROD-NOTIFICATION-FULL-BUILD403
```

This new token is prepared only. Merely seeing it, running the corrected preflight, or passing the local gate does not authorize it.

## Build 431 — 20 completed source/safety corrections

1. Recorded the authorized Notification attempt as safely stopped before any backup or DDL.
2. Classified the issue as live scope drift/evidence incompleteness rather than a schema-write failure.
3. Proved `idx_notification_outbox_status_due` is absent in Production.
4. Recognized the actual Build 403 Production gap as `metadata_json` plus five canonical indexes.
5. Marked the prior four-index Notification authorization as insufficient for the expanded scope.
6. Added a corrected full-Build-403 read-only Notification authorization preflight.
7. Anchored that corrected preflight to the green Product-number prerequisite.
8. Anchored that corrected preflight to the completed Gift Card Production proof.
9. Hard-pinned corrected preflight/execution to Production name/UUID.
10. Added exact missing-index evidence for all five canonical `notification_outbox` indexes.
11. Retained exact `notification_outbox` row-count preservation evidence.
12. Added explicit evidence that no Notification backup was created by the failed attempt.
13. Added explicit evidence that no Notification Production mutation occurred.
14. Replaced the old execution token in the Build 431 controller with a new full-Build-403 token.
15. Added full Build 403 Notification SQL generation inside the guarded Build 431 controller.
16. Added creation of `idx_notification_outbox_status_due` only when missing.
17. Retained separate full Production backup, SHA-256, target UUID and <=30-minute age verification.
18. Retained immediate before/after state checks and exact outbox row preservation.
19. Added a corrected 20-check local full-Notification safety regression and authorization gate.
20. Kept annotation, Membership, fractional Inventory, Product/FK, Accounting/default, R2/provider and Production promotion outside this scope.

## Next 20 ordered changes — Build 432

1. Record the corrected Build 431 full-Notification preflight/regression/gate evidence as PASS.
2. Accept full Build 403 Notification Production authorization only through exact token `AUTHORIZE-BUILD431-PROD-NOTIFICATION-FULL-BUILD403`.
3. Rerun the corrected targeted Notification preflight immediately before backup.
4. Prove `metadata_json` remains absent before the authorized write.
5. Prove all five canonical Build 403 indexes remain absent before the authorized write.
6. Prove the `notification_outbox` row boundary remains unchanged from the corrected preflight.
7. Create a fresh full Production D1 export dedicated to the full Notification stage.
8. Verify Notification backup path, nonzero byte count, SHA-256, Production UUID and <=30-minute age.
9. Re-read the exact full Notification state after backup and refuse any drift.
10. Add `metadata_json` only if still missing.
11. Add `idx_notification_outbox_status_due` only if still missing.
12. Add the four remaining canonical Build 403 Notification indexes only if still missing.
13. Prove `notification_outbox` row count is unchanged after DDL.
14. Prove `metadata_json` and all five canonical indexes now exist.
15. Run an independent read-only full Notification postcheck and record backup/apply/postcheck evidence.
16. Add a dedicated read-only Build 197 annotation-index Production authorization preflight.
17. Add a local annotation-index authorization regression and 20-item gate.
18. Keep Membership and all rebuild families locked while annotation authorization remains pending.
19. Update the current handoff/roadmap overlays with full Notification complete and annotation-index next.
20. Keep Production promotion closed until approved schema work plus semantic/browser/read-contract smoke are green.

## Gate state

```text
Build 427  Product-number Production stage                 PASS
Build 428  Remaining parity authorization boundary         PASS (20/20)
Build 429  Gift Card authorization boundary                PASS (20/20)
Build 430  Gift Card Production stage                      PASS
Build 430  Notification four-index authorization boundary  SUPERSEDED BY LIVE EVIDENCE
Build 431  First Notification execution attempt             SAFE STOP BEFORE BACKUP
Build 431  Full Build 403 Notification boundary             READY FOR READ-ONLY VALIDATION

Production promotion                                       CLOSED
```
