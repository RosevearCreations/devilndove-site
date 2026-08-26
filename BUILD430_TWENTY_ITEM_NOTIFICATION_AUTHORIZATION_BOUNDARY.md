# Build 430 — Gift Card Completion + Notification Authorization Boundary

## Status

**GIFT CARD PRODUCTION PASS / NOTIFICATION READ-ONLY AUTHORIZATION BOUNDARY READY / NOTIFICATION AUTHORIZATION PENDING / PRODUCTION PROMOTION CLOSED**

## Build 430 — 20 completed/ordered changes

1. Recorded Build 429 Gift Card authorization boundary PASS (20/20).
2. Accepted only the explicit Gift Card token `AUTHORIZE-BUILD428-PROD-GIFT-CARD`.
3. Reran the targeted Gift Card pre-write state and proved the exact reviewed Build 384 gap.
4. Created a fresh full Production D1 export dedicated to the Gift Card stage.
5. Verified the Gift Card backup path, nonzero byte count, SHA-256, Production UUID, and fresh age.
6. Re-read the targeted Gift Card state immediately before the authorized write.
7. Applied only the missing Build 384 lookup-attempt columns.
8. Applied only the missing Build 384 lookup indexes plus `gift_card_lookup_lockouts` and its index.
9. Proved `gift_card_lookup_attempts` rows were preserved 0 -> 0.
10. Proved `gift_cards` and `gift_card_redemptions` rows were each preserved 0 -> 0.
11. Proved the Gift Card schema stage completed and the independent read-only postcheck passed.
12. Recorded the Gift Card backup/apply/postcheck evidence while keeping Production promotion closed.
13. Added a dedicated Build 430 read-only Notification Production authorization preflight.
14. Added fresh Notification `metadata_json`, four-index, and `notification_outbox` row evidence.
15. Added a local 20-check Notification authorization safety regression against Build 403 authority and the backed-up additive executor.
16. Added a local 20-check Notification authorization-boundary gate with no inferred authorization.
17. Kept annotation-index authorization false and outside the Notification stage.
18. Kept Membership/fractional/Product-FK/Accounting rebuild authorization false.
19. Added Build 430 current-state handoff/roadmap overlays reflecting Gift Card complete and Notification next.
20. Recorded the next 20 Build 431 actions; Production promotion remains closed.

## Proven Gift Card Production state

```text
Gift Card backup: PASS
Backup bytes: 19002028
Backup SHA-256: 8860e0b76e240f74ae0c5de538292cf827f742d3f88ecf3f6cf40ff8d05fd29f
Gift Card additive postcheck: PASS
gift_card_lookup_attempts: 0 -> 0
gift_cards: 0 -> 0
gift_card_redemptions: 0 -> 0
Final read-only Gift Card postcheck: PASS
```

## Reviewed Build 403 Notification gap

The canonical authority is `database_notification_runtime_parity.sql`.

Expected current Production gap before Notification authorization:

```text
Missing column:
  metadata_json

Missing indexes:
  idx_notification_outbox_kind_destination
  idx_notification_outbox_order
  idx_notification_outbox_payment
  idx_notification_outbox_product
```

The authorized Notification stage, if later approved, must preserve the pre-write `notification_outbox` row count exactly.

The existing `idx_notification_outbox_status_due` is not part of this gap and must remain intact.

## Notification authorization token — prepared, not authorized

```text
AUTHORIZE-BUILD428-PROD-NOTIFICATION
```

A successful Build 430 read-only/local boundary does **not** authorize use of the token. The owner must explicitly provide it in a later turn.

## Future authorized Notification execution boundary

After explicit Notification authorization only, the Build 428 additive controller may run with `--stage notification`.

Before any Notification write it must:

1. verify the green Product-number prerequisite;
2. verify the completed Gift Card prerequisite through the Build 430 boundary workflow;
3. hard-pin Production name/UUID;
4. create a fresh full Production D1 export dedicated to Notification;
5. verify backup path, bytes, SHA-256, target UUID and <=30-minute age;
6. re-read the targeted Notification before-state;
7. apply only `metadata_json` if still missing and the four reviewed indexes;
8. re-read Notification state;
9. prove `notification_outbox` row count is unchanged;
10. keep Production promotion closed.

## Safety boundary

```text
Product-number Production remediation        COMPLETE / PROVEN
Gift Card Production stage                   COMPLETE / PROVEN
Notification Production authorization        NOT RECEIVED
Notification Production backup               NOT CREATED
Notification Production mutation             NOT EXECUTED
Annotation-index Production authorization    NOT RECEIVED
Membership/fractional/FK/accounting rebuild  NOT AUTHORIZED
R2/provider mutation                         DISABLED
CAIP D1-only copy                            FORBIDDEN
Production promotion                         CLOSED
```

## Next 20 ordered changes — Build 431

1. Record Build 430 Gift Card execution and Notification authorization-boundary evidence as PASS in Markdown.
2. Accept Notification Production authorization only through exact token `AUTHORIZE-BUILD428-PROD-NOTIFICATION`.
3. Rerun the targeted Notification before-state immediately before the authorized backup/apply sequence.
4. Create a fresh full Production D1 export dedicated to Notification.
5. Verify Notification backup path, nonzero bytes, SHA-256, target UUID, and <=30-minute age.
6. Re-read the targeted Notification before-state after backup and refuse unexpected drift.
7. Add `metadata_json` only if it is still missing.
8. Add only the four reviewed Build 403 Notification indexes that remain missing.
9. Prove `notification_outbox` row count is unchanged after the write.
10. Prove `metadata_json` and all four reviewed indexes now exist while `idx_notification_outbox_status_due` remains intact.
11. Run the independent read-only Notification postcheck and record backup/apply/postcheck evidence.
12. Add a dedicated read-only Build 197 annotation-index Production authorization preflight.
13. Refresh the annotation-index existence and `product_image_annotations` row boundary from live Production.
14. Add a local annotation-index authorization safety regression against Build 197 authority and the backed-up additive executor.
15. Add a local annotation-index authorization-boundary gate with no inferred authorization.
16. Keep Membership rebuild preview inert and rebuild authorization false.
17. Refresh Membership three-row/tier evidence only after the annotation boundary is separately closed.
18. Update the current handoff/roadmap overlays with Notification complete and annotation-index next.
19. Record the next 20 ordered changes after the annotation authorization boundary.
20. Keep Production promotion closed until all approved schema families plus semantic/browser/read-contract smoke are green.

## Gate state

```text
Build 425  Development Product-number backfill       PASS (20/20)
Build 426  Production release-candidate assembly     PASS (20/20)
Build 427  Production Product-number stage           PASS
Build 428  Remaining parity authorization boundary   PASS (20/20)
Build 429  Gift Card authorization boundary          PASS (20/20)
Build 430  Gift Card Production stage                PASS
Build 430  Notification authorization boundary       READY

Production promotion                                 CLOSED
```
