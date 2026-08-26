# Build 429 — Current Parity Handoff Overlay

> Use this file as the authoritative current parity/release overlay until the final parity result is merged into `AI_HANDOFF.md` after Production schema work and browser/read-contract smoke close.

## Current gate state

```text
Build 425  Development Product-number backfill       PASS (20/20)
Build 426  Production release-candidate assembly     PASS (20/20)
Build 427  Production Product-number stage           PASS
Build 428  Remaining parity authorization boundary   PASS (20/20)
Build 429  Gift Card authorization boundary          READY
```

## Proven Product-number state

```text
Development Product numbers: 1084..1128 (45 unique)
Development sequence next: 1129
Production Product numbers: 1084..1128 (45 unique)
Production sequence next: 1129
Product identities equal: True
```

## Current remaining Production schema state

### Gift Card — next bounded family

Fresh Build 428 evidence:

```text
Missing lookup columns: code_suffix, ip_hash, lookup_email, result_status, user_agent
Missing indexes: idx_gift_card_lookup_attempts_created, idx_gift_card_lookup_attempts_email, idx_gift_card_lookup_lockouts_status
Gift Card lockout table: absent
```

Build 429 prepares a Gift Card-only authorization boundary. No Gift Card backup or mutation is authorized yet.

### Notification — still locked

```text
metadata_json: absent
Missing indexes:
  idx_notification_outbox_kind_destination
  idx_notification_outbox_order
  idx_notification_outbox_payment
  idx_notification_outbox_product
```

Notification remains a separate later authorization boundary.

### Product image annotation index — still locked

`idx_product_image_annotations_product_image_build197` remains absent and separately authorized later.

### Membership / rebuild families — still locked

- Membership Build 395: three live rows; inert rebuild preview only.
- Fractional Inventory/Creative Project: five bounded table families.
- `site_item_inventory`: 1,041-row preservation boundary.
- Product/FK: latest live orphan counts all zero.
- Accounting/default/nullability: still requires family-specific compatibility checks.

### Preserve / exclude

```text
search_query_terms: 5 Production rows preserved
__sql_test: 0 rows; leave untouched pending retirement authority
CAIP: 113 D1 media metadata rows plus private R2 remain excluded from parity
```

## Current safety boundary

```text
Gift Card authorization                    NOT RECEIVED
Gift Card Production backup                NOT CREATED
Gift Card Production mutation              NOT EXECUTED
Notification authorization                 NOT RECEIVED
Annotation-index authorization             NOT RECEIVED
Rebuild-family authorization               NOT RECEIVED
R2/provider mutation                       DISABLED
CAIP D1-only copy                          FORBIDDEN
Production promotion                       CLOSED
```

## Immediate next action

Run the Build 429 Gift Card source regression, read-only live authorization preflight, and local 20-item authorization-boundary gate. If all are green, stop at the explicit Gift Card authorization boundary; do not infer authorization from PASS.
