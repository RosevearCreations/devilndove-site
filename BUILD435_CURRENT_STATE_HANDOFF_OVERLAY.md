# Build 435 — Current Parity Handoff Overlay

> Use this as the authoritative current parity/release overlay until the Membership rebuild boundary is fully resolved.

## Current gate state

```text
Build 427  Product-number Production stage                    PASS
Build 430  Gift Card Production stage                         PASS
Build 432  Full Build 403 Notification Production stage       PASS
Build 433  Build 197 annotation-index Production stage        PASS
Build 434  Membership Build 395 authorization boundary        PASS (20/20)
Build 435  Membership complete-row value-mapping boundary     SOURCE READY / OWNER RUN PENDING
```

## Proven completed Production families

```text
Product numbers                COMPLETE / PROVEN
Gift Card Build 384            COMPLETE / PROVEN
Notification Build 403         COMPLETE / PROVEN
Annotation Build 197           COMPLETE / PROVEN
```

Annotation final evidence:

```text
product_image_annotations rows: 70 -> 70
idx_product_image_annotations_product_image_build197: PRESENT
independent postcheck: PASS
```

## Membership Build 395 live legacy boundary

Owner-run Build 434 proved:

```text
Production columns:
  membership_tier_policy_id
  code
  name
  display_title
  short_description
  benefits_json
  badge_color
  is_visible
  sort_order
  created_at
  updated_at
Membership rows: 3
Normalized tiers: bronze,gold,silver
Legacy alias mapping present: True
Rebuild required: True
Authorization boundary: PASS (20/20)
Inert preview executable SQL: 0
```

No Membership backup or Production mutation has occurred.

## Current unresolved proof

The legacy table contains both `name` and `display_title`; canonical Build 395 contains only `title`. Build 435 therefore requires exact equality across all three rows before a rebuild controller can be created.

Build 435 also captures:

- all three complete source rows;
- raw tier codes;
- all direct-preservation business fields;
- a deterministic SHA-256 of the complete source-row boundary;
- an inert canonical mapping preview with zero executable SQL.

If any title pair differs, the boundary blocks and no data is discarded automatically.

## Current safety state

```text
Membership Production backup                  NOT CREATED
Membership rebuild authorization              NOT RECEIVED
Membership Production mutation                NOT EXECUTED
Fractional Inventory rebuild authorization    NOT RECEIVED
Product/FK authorization                      NOT RECEIVED
Accounting/default authorization              NOT RECEIVED
R2/provider mutation                          DISABLED
CAIP D1-only copy                             FORBIDDEN
Production promotion                          CLOSED
```

## Immediate next action

Run only the Build 435 local regression, read-only complete-row Membership preflight, inert lossless-mapping preview, and local 20-item gate. Do not run Membership SQL or create a Production backup.
