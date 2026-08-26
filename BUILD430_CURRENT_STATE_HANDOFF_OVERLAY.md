# Build 430 — Current Parity Handoff Overlay

> Use this as the authoritative parity/release overlay until final Production parity and browser/read-contract smoke are merged into `AI_HANDOFF.md`.

## Current gate state

```text
Build 425  Development Product-number backfill       PASS (20/20)
Build 426  Production release-candidate assembly     PASS (20/20)
Build 427  Production Product-number stage           PASS
Build 428  Remaining parity authorization boundary   PASS (20/20)
Build 429  Gift Card authorization boundary          PASS (20/20)
Build 430  Gift Card Production stage                PASS
Build 430  Notification authorization boundary       PASS (20/20)
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
Backup bytes: 19002028
Backup SHA-256: 8860e0b76e240f74ae0c5de538292cf827f742d3f88ecf3f6cf40ff8d05fd29f
Gift Card additive postcheck: PASS
Gift Card final read-only postcheck: PASS
gift_card_lookup_attempts: 0 -> 0
gift_cards: 0 -> 0
gift_card_redemptions: 0 -> 0
```

The five lookup columns, three reviewed indexes, and `gift_card_lookup_lockouts` are proven present in Production.

## Current next Production family — Notification Build 403

The read-only/local authorization boundary is green at 20/20. The separately authorized stage is limited to the reviewed Build 403 gap:

```text
metadata_json
idx_notification_outbox_kind_destination
idx_notification_outbox_order
idx_notification_outbox_payment
idx_notification_outbox_product
```

`idx_notification_outbox_status_due` must remain intact. `notification_outbox` rows must be preserved exactly.

Notification authorization has **not** been received yet. No Notification backup or mutation has occurred.

## Still locked

- Build 197 Product-image annotation index.
- Membership Build 395 three-row data-preserving rebuild.
- Five fractional Inventory/Creative Project table rebuild families.
- Product/FK families; latest orphan evidence was zero.
- Accounting/default/nullability rebuild families.

## Preserve / exclude

```text
site_item_inventory: 1041-row preservation boundary
search_query_terms: 5 Production rows preserved
__sql_test: 0 rows; leave untouched pending retirement authority
CAIP: 113 D1 media metadata rows plus private R2 remain excluded from parity
CAIP D1-only copy: FORBIDDEN
```

## Safety boundary

```text
Product-number Production stage           COMPLETE / PROVEN
Gift Card Production stage                COMPLETE / PROVEN
Notification authorization                NOT RECEIVED
Notification Production backup            NOT CREATED
Notification Production mutation          NOT EXECUTED
Annotation-index authorization            NOT RECEIVED
Rebuild-family authorization              NOT RECEIVED
R2/provider mutation                      DISABLED
Production promotion                      CLOSED
```

## Immediate next action

Stop at the explicit Notification authorization boundary. Notification may proceed only after the owner supplies exactly:

```text
AUTHORIZE-BUILD428-PROD-NOTIFICATION
```

That token authorizes Notification only and does not authorize annotation, rebuild families, provider/R2 work, or Production promotion.
