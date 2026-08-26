# Build 434 — Current Parity Handoff Overlay

> Use this as the authoritative current parity/release overlay until the next completed Production family supersedes it.

## Current gate state

```text
Build 427  Product-number Production stage                    PASS
Build 430  Gift Card Production stage                         PASS
Build 432  Full Build 403 Notification Production stage       PASS
Build 433  Build 197 annotation-index Production stage        PASS
Build 434  Membership Build 395 authorization boundary        READY / READ-ONLY / INERT
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

### Product-image annotation Build 197

```text
Dedicated Production backup: PASS
Backup: local_backups\build428_prod_before_annotation_20260826T015019Z.sql
Backup bytes: 19003438
Backup SHA-256: 049a2b85313ac1d411f4c12d736a44f4a5f4f3efb12f3b72e15f7f5d58b481de
Wrangler queries executed: 1
product_image_annotations rows: 70 -> 70
idx_product_image_annotations_product_image_build197 present: True
Independent read-only postcheck: PASS
```

## Current Production family — Membership Build 395

Canonical authority: `database_membership_tier_policy_runtime_parity.sql`.

Canonical ten-column shape:

```text
policy_id
tier_code
title
short_description
benefits_json
badge_color
sort_order
is_visible
created_at
updated_at
```

Canonical tier identities:

```text
bronze
silver
gold
```

Reviewed legacy aliases:

```text
membership_tier_policy_id -> policy_id
code                      -> tier_code
name                      -> title
display_title             -> title
```

Build 434 is evidence-only. Its live preflight must reconfirm exactly three rows and the reviewed aliases. Its rebuild preview must remain inert with zero executable SQL statements.

No Membership Production backup or rebuild is authorized.

## Still locked

- Membership Build 395 data-preserving rebuild execution.
- Fractional Inventory/Creative Project rebuild families.
- Product/FK rebuild families.
- Accounting/default/nullability rebuild families.
- R2/provider mutation.

## Preserve / exclude

```text
site_item_inventory: 1041-row preservation boundary unless fresh legitimate activity changes a future pre-write boundary
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
Build 197 annotation Production stage       COMPLETE / PROVEN
Membership Build 395 boundary               CURRENT / READ-ONLY / INERT
Membership Production backup                NOT CREATED
Membership rebuild authorization            NOT RECEIVED
Membership Production mutation              NOT EXECUTED
Fractional/Product-FK/Accounting auth        NOT RECEIVED
R2/provider mutation                        DISABLED
CAIP D1-only copy                           FORBIDDEN
Production promotion                        CLOSED
```

## Immediate next action

Run only the Build 434 Membership local safety regression, live read-only preflight, inert rebuild preview, and local 20-item authorization gate. Stop at that boundary. No Membership token or executable rebuild controller exists yet.
