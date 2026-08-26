# Build 432 — Current Parity Handoff Overlay

> Use this as the authoritative current parity/release overlay until final Production parity and browser/read-contract smoke are merged into the canonical handoff.

## Current gate state

```text
Build 427  Product-number Production stage                    PASS
Build 428  Remaining parity authorization boundary            PASS (20/20)
Build 429  Gift Card authorization boundary                   PASS (20/20)
Build 430  Gift Card Production stage                         PASS
Build 431  Full Build 403 Notification boundary               PASS (20/20)
Build 432  Full Build 403 Notification Production stage       PASS
Build 432  Build 197 annotation-index authorization boundary  READY
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

### Notification Build 403

```text
Dedicated Production backup: PASS
Backup bytes: 19002868
Backup SHA-256: e4b4e4ea2f328aaf244b6f080f1bdc1d1bd599a421e19d914ce6b45545acd149
notification_outbox rows: 0 -> 0
metadata_json present: True
All five canonical notification_outbox indexes present: True
Independent read-only postcheck: PASS
```

The prior four-index Notification authorization remains superseded and is closed history only.

## Current next Production family — Build 197 annotation index

Canonical candidate:

```text
idx_product_image_annotations_product_image_build197
ON product_image_annotations(product_id, product_image_id)
```

Build 432 prepares a read-only/local authorization boundary. The preflight must prove the required columns, current row boundary, and whether the index remains absent.

Prepared token, not authorized:

```text
AUTHORIZE-BUILD428-PROD-ANNOTATION-INDEX
```

No annotation backup or mutation is authorized yet.

## Still locked

- Membership Build 395 data-preserving rebuild.
- Five fractional Inventory/Creative Project rebuild families.
- Product/FK rebuild families.
- Accounting/default/nullability rebuild families.
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
Product-number Production stage             COMPLETE / PROVEN
Gift Card Production stage                  COMPLETE / PROVEN
Full Build 403 Notification stage           COMPLETE / PROVEN
Build 197 annotation authorization          NOT RECEIVED
Annotation Production backup                NOT CREATED
Annotation Production mutation              NOT EXECUTED
Membership/rebuild authorization            NOT RECEIVED
R2/provider mutation                        DISABLED
Production promotion                        CLOSED
```

## Immediate next action

Run only the Build 432 annotation source regression, live read-only preflight, and local 20-item authorization-boundary gate. If all are green, stop for the explicit annotation authorization token.
