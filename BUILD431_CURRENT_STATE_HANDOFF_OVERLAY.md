# Build 431 — Current Parity Handoff Overlay

> Use this as the authoritative current parity/release overlay until final Production parity and browser/read-contract smoke are merged into the canonical handoff.

## Current gate state

```text
Build 427  Product-number Production stage                 PASS
Build 428  Remaining parity authorization boundary         PASS (20/20)
Build 429  Gift Card authorization boundary                PASS (20/20)
Build 430  Gift Card Production stage                      PASS
Build 430  Notification four-index authorization boundary  SUPERSEDED BY LIVE EVIDENCE
Build 431  First Notification execution attempt             SAFE STOP BEFORE BACKUP
Build 431  Full Build 403 Notification boundary             READY FOR READ-ONLY VALIDATION
```

## Proven completed Production families

### Product numbers

```text
Development Product numbers: 1084..1128 (45 unique)
Development sequence next: 1129
Production Product numbers: 1084..1128 (45 unique)
Production sequence next: 1129
Product identities equal: True
```

### Gift Card Build 384

```text
Dedicated Production backup: PASS
Gift Card additive postcheck: PASS
Gift Card final read-only postcheck: PASS
gift_card_lookup_attempts: 0 -> 0
gift_cards: 0 -> 0
gift_card_redemptions: 0 -> 0
```

## Current Notification Build 403 state

The first authorized Notification attempt stopped safely before backup because live Production proved the pre-existing `idx_notification_outbox_status_due` assumption was wrong.

Corrected current Production gap:

```text
metadata_json: absent
Missing indexes:
  idx_notification_outbox_status_due
  idx_notification_outbox_kind_destination
  idx_notification_outbox_order
  idx_notification_outbox_payment
  idx_notification_outbox_product
notification_outbox rows: 0
```

The prior token `AUTHORIZE-BUILD428-PROD-NOTIFICATION` is superseded/insufficient for this larger scope.

Prepared corrected token, not authorized:

```text
AUTHORIZE-BUILD431-PROD-NOTIFICATION-FULL-BUILD403
```

No Notification backup was created and no Notification DDL was executed.

## Still locked

- Build 197 Product-image annotation index.
- Membership Build 395 rebuild.
- Fractional Inventory/Creative Project rebuilds.
- Product/FK rebuilds.
- Accounting/default/nullability rebuilds.
- R2/provider mutation.

## Preserve / exclude

```text
site_item_inventory: 1041-row preservation boundary
search_query_terms: 5 Production rows preserved
__sql_test: 0 rows; leave untouched pending retirement authority
CAIP: 113 D1 media metadata rows plus private R2 remain excluded
CAIP D1-only copy: FORBIDDEN
```

## Current safety boundary

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

## Immediate next action

Run only the corrected Build 431 local regression, read-only full-Build-403 Notification preflight, and local 20-item authorization gate. Stop for a new explicit authorization if all are green.
