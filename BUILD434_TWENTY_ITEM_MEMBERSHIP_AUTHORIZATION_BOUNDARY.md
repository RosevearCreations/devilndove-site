# Build 434 — Annotation Completion + Membership Build 395 Authorization Boundary

## Status

**BUILD 197 ANNOTATION PRODUCTION PASS / MEMBERSHIP BUILD 395 READ-ONLY + INERT AUTHORIZATION BOUNDARY READY / MEMBERSHIP REBUILD NOT AUTHORIZED / PRODUCTION PROMOTION CLOSED**

## Build 434 — 20 completed source/safety changes

1. Recorded the successful Build 433 annotation Production backup/apply/postcheck evidence.
2. Recorded annotation backup `local_backups\build428_prod_before_annotation_20260826T015019Z.sql`.
3. Recorded annotation backup bytes `19003438` and SHA-256 `049a2b85313ac1d411f4c12d736a44f4a5f4f3efb12f3b72e15f7f5d58b481de`.
4. Recorded the exact one-query Build 197 index execution.
5. Proved `product_image_annotations` rows remained 70 -> 70.
6. Proved `idx_product_image_annotations_product_image_build197` exists after execution.
7. Recorded the independent annotation read-only postcheck PASS.
8. Kept Production promotion closed after annotation completion.
9. Revalidated Build 395 as the canonical Membership tier-policy authority.
10. Pinned the canonical ten-column Membership shape.
11. Pinned canonical tier identities `bronze`, `silver`, and `gold`.
12. Added a fresh read-only Production Membership preflight.
13. Anchored Membership preflight to Product-number, Gift Card, full Notification, and annotation Production proofs.
14. Added live Membership column, complete-row, CREATE-SQL, and row-count evidence.
15. Preserved the reviewed aliases `membership_tier_policy_id -> policy_id` and `code -> tier_code`.
16. Preserved the reviewed aliases `name -> title` and `display_title -> title`.
17. Added an inert Membership rebuild preview with zero executable SQL statements.
18. Added a local 20-check Membership authorization safety regression.
19. Added a local 20-item Membership rebuild authorization-boundary gate with no inferred authorization.
20. Kept fractional Inventory, Product/FK, Accounting/default, R2/provider, CAIP-copy, and Production promotion locked.

## Proven Build 197 annotation Production state

```text
Dedicated Production backup: PASS
Backup: local_backups\build428_prod_before_annotation_20260826T015019Z.sql
Backup bytes: 19003438
Backup SHA-256: 049a2b85313ac1d411f4c12d736a44f4a5f4f3efb12f3b72e15f7f5d58b481de
Wrangler queries executed: 1
product_image_annotations rows: 70 -> 70
Build 197 annotation index present: True
Independent read-only postcheck: PASS
```

## Membership Build 395 authority

Canonical file: `database_membership_tier_policy_runtime_parity.sql`.

Canonical columns:

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

Canonical seed identities:

```text
bronze
silver
gold
```

Reviewed legacy alias mapping:

```text
membership_tier_policy_id -> policy_id
code                      -> tier_code
name                      -> title
display_title             -> title
```

## Build 434 boundary rules

The live preflight may only report the Membership rebuild safe to authorize if:

1. every completed Production prerequisite remains green;
2. `membership_tier_policies` is readable;
3. exactly three rows exist;
4. those rows normalize to exactly `bronze`, `silver`, and `gold`;
5. the reviewed legacy alias columns are present;
6. the live column names are not already the exact canonical ten-column order;
7. no backup has been created;
8. no rebuild authorization is inferred;
9. no Production mutation occurs.

If the table is already canonical, the rebuild is unnecessary and must be reclassified instead of authorized. If tier identities or aliases differ, the boundary blocks for review.

## Inert rebuild preview

`scripts/build434_membership_rebuild_preview.py` consumes only the local read-only preflight artifact. It records the future data-preservation plan but contains:

```text
Executable SQL statements: 0
Cloudflare access: NONE
Production backup created: NO
Membership rebuild authorization received: NO
Production mutation executed: NO
PRODUCTION PROMOTION: CLOSED
```

No Membership Production backup, DDL, shadow table, copy, rename, drop, or seed operation is part of Build 434.

## Next 20 ordered changes — Build 435

1. Record Build 434 Membership preflight/preview/regression/gate evidence as PASS if owner-run evidence is green.
2. Prepare a dedicated Membership rebuild authorization token only after the exact live three-tier legacy state is proven.
3. Do not accept generic continuation language as Membership rebuild authorization.
4. Before any future Membership backup, rerun the full read-only Membership preflight.
5. Require exactly three live Membership rows immediately before rebuild execution.
6. Require normalized tier identities remain exactly bronze/silver/gold.
7. Require the reviewed legacy alias mapping remains valid immediately before execution.
8. Capture complete source-row values for all three tiers as the preservation boundary.
9. Create a fresh full Production D1 backup dedicated to Membership only after separate authorization.
10. Verify backup path, nonzero bytes, SHA-256, Production UUID, and <=30-minute age.
11. Generate executable rebuild SQL only inside a separately authorized Build 435 controller, never in request handlers.
12. Use a canonical shadow table matching Build 395 exactly.
13. Copy the three rows through explicit reviewed mappings; do not silently apply Build 395 seed defaults over existing business values.
14. Validate shadow row count, tier identities, uniqueness, and required canonical constraints before any swap.
15. Perform the swap only if every pre-swap proof is green and rollback backup remains valid.
16. Prove all three tier identities and preserved values survive the rebuild.
17. Run an independent read-only Membership semantic postcheck after any authorized rebuild.
18. Keep fractional Inventory, Product/FK, Accounting/default, R2/provider, and CAIP-copy families separately locked.
19. Update handoff/roadmap with Membership complete only after independent postcheck PASS.
20. Keep Production promotion closed and then prepare the first fractional Inventory/Creative Project rebuild family as a new inert/read-only boundary.

## Gate state before owner run

```text
Build 427  Product-number Production stage                    PASS
Build 430  Gift Card Production stage                         PASS
Build 432  Full Build 403 Notification Production stage       PASS
Build 433  Build 197 annotation-index Production stage        PASS
Build 434  Membership Build 395 authorization boundary        READY FOR READ-ONLY/INERT VALIDATION

Membership Production backup                                  NOT CREATED
Membership rebuild authorization                              NOT RECEIVED
Membership Production mutation                                NOT EXECUTED
Production promotion                                          CLOSED
```
