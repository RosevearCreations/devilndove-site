# Build 429 Validation

## Status

**PASS (20/20) — GIFT CARD READ-ONLY AUTHORIZATION BOUNDARY CLOSED / GIFT CARD PRODUCTION AUTHORIZATION RECEIVED / GIFT CARD BACKUP+WRITE PENDING / PRODUCTION PROMOTION CLOSED**

Build 428 is closed PASS (20/20). Product numbers remain proven in both environments and every remaining Production family is separately locked unless explicitly stated below.

## Owner-run Build 429 evidence

Source compile passed.

The initial local Gift Card safety regression reported one false-negative because its source assertion looked for the literal call spelling `export_backup(stage)` rather than the actual typed function plus Wrangler export command. The executor itself was already correctly backup-gated. That regression assertion was repaired without changing Production behavior.

The repaired local regression then passed:

```text
BUILD 429 GIFT CARD AUTHORIZATION SAFETY REGRESSION: PASS (20/20)
Gift Card Production authorization inferred: NO
Production backup created by regression: NO
Production mutation executed: NO
Notification/annotation/rebuild authorization inferred: NO
PRODUCTION PROMOTION: CLOSED
```

The live read-only Gift Card preflight passed and established the exact reviewed Build 384 gap:

```text
Missing lookup columns: ['code_suffix', 'ip_hash', 'lookup_email', 'result_status', 'user_agent']
Missing Gift Card indexes: ['idx_gift_card_lookup_attempts_created', 'idx_gift_card_lookup_attempts_email', 'idx_gift_card_lookup_lockouts_status']
Gift Card lockout table exists: False
gift_card_lookup_attempts rows: 0
gift_cards rows: 0
gift_card_redemptions rows: 0
Exact known Build 384 gap: YES
Safe to request Gift Card authorization: YES
Production backup created: NO
Gift Card authorization received: NO
Production mutation executed: NO
Notification/annotation/rebuild authorization: NOT RECEIVED
PRODUCTION PROMOTION: CLOSED
BUILD 429 GIFT CARD AUTHORIZATION PREFLIGHT: PASS
```

The local Gift Card authorization-boundary gate passed all twenty checks:

```text
BUILD 429 TWENTY-ITEM GIFT CARD AUTHORIZATION-BOUNDARY GATE: PASS (20/20)
Product-number Production stage: COMPLETE / PROVEN
Gift Card backup: NOT CREATED
Gift Card authorization: NOT RECEIVED
Gift Card mutation executed: NO
Notification authorization: NOT RECEIVED
Annotation-index authorization: NOT RECEIVED
Rebuild-family authorization: NOT RECEIVED
PRODUCTION PROMOTION: CLOSED
```

## Build 429 disposition

Build 429 is fully green and closed. That PASS did not itself authorize a Gift Card Production write.

## Explicit Gift Card Production authorization — RECEIVED

The owner subsequently supplied the exact stage token:

```text
AUTHORIZE-BUILD428-PROD-GIFT-CARD
```

This authorization applies **only** to the bounded Build 384 Gift Card lookup-attempt/lockout additive stage. It does not authorize Notification, annotation-index, Membership, fractional Inventory, Product/FK, Accounting/default, R2/provider, or promotion work.

Before using the authorization, the Gift Card executor was further hardened so post-write PASS now requires preservation of all three Build 429 row boundaries:

```text
gift_card_lookup_attempts
gift_cards
gift_card_redemptions
```

The local safety regression was also strengthened to verify those three preservation checks in source.

## Authorized Gift Card execution sequence

The authorized stage must proceed in this order:

1. compile and rerun the local Gift Card safety regression after the preservation hardening;
2. rerun the targeted Build 429 Gift Card before-state and require the exact reviewed Build 384 gap;
3. create a fresh full Production D1 backup dedicated to Gift Card;
4. verify target UUID, path, nonzero byte count, SHA-256 and <=30-minute age;
5. reread targeted Gift Card state after backup;
6. apply only the missing Build 384 lookup columns/indexes/lockout table;
7. prove `gift_card_lookup_attempts`, `gift_cards`, and `gift_card_redemptions` row counts are preserved;
8. prove all five canonical columns, all three canonical indexes, and the lockout table exist;
9. keep Production promotion closed.

## Safety

```text
Product-number prerequisite              COMPLETE / PROVEN
Build 429 Gift Card boundary             PASS (20/20)
Gift Card Production authorization       RECEIVED — GIFT CARD ONLY
Gift Card Production backup              NOT YET CREATED FOR AUTHORIZED WRITE
Gift Card Production mutation            NOT YET EXECUTED
Notification authorization               NOT RECEIVED
Annotation-index authorization           NOT RECEIVED
Rebuild-family authorization             NOT RECEIVED
R2/provider mutation                     DISABLED
Production promotion                     CLOSED
```
