# Build 428 — Twenty-Item Remaining Production Parity Boundary

## Status

**READY FOR LIVE READ-ONLY REMAINING-PARITY EVIDENCE + LOCAL 20/20 GATES / ALL REMAINING PRODUCTION AUTHORIZATIONS PENDING / PROMOTION CLOSED**

Build 427 closed the Product-number blocker completely:

```text
Development Product numbers: 1084..1128 (45 unique)
Development sequence next: 1129
Production Product numbers: 1084..1128 (45 unique)
Production sequence next: 1129
Product identities equal: True
BUILD 427 PRODUCTION PRODUCT-NUMBER POSTCHECK: PASS
```

The remaining work is now schema/additive parity rather than Product-number remediation.

## Build 428 — 20 completed source/safety changes

1. Recorded the successful Build 427 Production Product-number backup/apply/postcheck and closed the original Product-number rollout blocker.
2. Recorded the safe first apply interruption (`7403`) as an authorization/read interruption with no partial Production write.
3. Added a Build 428 live read-only remaining-parity evidence helper anchored to the green Build 427 Product-number postcheck.
4. Hard-pinned Build 428 live evidence to `devilndove-prod` UUID `0dc8fa3e-319c-45f7-a515-34c8acd89fcf` and the known Development evidence target.
5. Added Windows UTF-8/replacement-safe console handling to the new live helper.
6. Added fresh Gift Card lookup-attempt five-column, index, lockout-table and row-count evidence.
7. Added fresh Notification `metadata_json`, current-index and outbox-row evidence.
8. Added fresh Build 197 Product-image annotation index and row-count evidence.
9. Added fresh Membership Build 395 Development/Production column-shape comparison and exact live row snapshot.
10. Added fresh evidence for the five fractional Inventory/Creative Project table families and their Dev/Prod type differences.
11. Retained exact live `site_item_inventory` row-count preservation evidence rather than hard-coding a migration result.
12. Added fresh Product/FK orphan scans covering media score, review actions, Product capture users, visitor sessions and supplier PO Inventory links.
13. Retained `search_query_terms` preservation, `__sql_test` no-action and CAIP/private-R2 exclusion evidence.
14. Added explicit false authorization flags for Gift Card, Notification, annotation index and rebuild families in the live evidence artifact.
15. Added a comment-only Membership Build 395 rebuild preview with four legacy aliases and zero executable SQL.
16. The Membership preview retains the old table as a rollback shadow through the initial rebuild proof rather than dropping it immediately.
17. Added a Build 428 twenty-check local remaining-parity source/safety regression.
18. Added a Build 428 twenty-check local remaining-parity authorization-boundary gate.
19. Replaced the older additive execution path for future use with a Build 428 controller requiring a separate full Production D1 export, byte count, SHA-256 and <=30-minute age check for each additive stage.
20. The Build 428 additive controller requires separate tokens and before/after row preservation for Gift Card, Notification and annotation-index stages; it contains no Membership/fractional/FK/Accounting rebuild path and Build 428 executes none of those stages.

## Remaining authorization tokens — prepared, not authorized

No token below has been authorized by the successful Product-number stage:

```text
AUTHORIZE-BUILD428-PROD-GIFT-CARD
AUTHORIZE-BUILD428-PROD-NOTIFICATION
AUTHORIZE-BUILD428-PROD-ANNOTATION-INDEX
```

Each additive family requires its own fresh Production backup before its own write. A token for one family never authorizes another family.

## Membership rebuild boundary

Build 395 remains the canonical Membership shape:

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

Legacy aliases retained for explicit mapping:

```text
membership_tier_policy_id -> policy_id
code                      -> tier_code
name                      -> title
display_title             -> title
```

Build 428 creates only an inert preview. No Membership rebuild authorization exists yet.

## Safety boundary

```text
Product-number Production remediation        COMPLETE / PROVEN
Gift Card Production mutation                NOT AUTHORIZED
Notification Production mutation             NOT AUTHORIZED
Annotation-index Production mutation         NOT AUTHORIZED
Membership rebuild                           NOT AUTHORIZED
Fractional Inventory rebuilds                NOT AUTHORIZED
Product/FK rebuilds                          NOT AUTHORIZED
Accounting/default rebuilds                  NOT AUTHORIZED
R2/provider mutation                         DISABLED
CAIP D1-only copy                            FORBIDDEN
Production promotion                         CLOSED
```

## Next 20 ordered changes — Build 429

1. Record Build 428 live/regression/gate evidence as PASS in Markdown.
2. Accept Gift Card Production authorization only through the exact Build 428 Gift Card token.
3. Create and verify a fresh full Production D1 backup dedicated to the Gift Card stage.
4. Re-read the targeted Gift Card before-state immediately before its authorized write.
5. Apply only the missing Build 384 Gift Card lookup columns/indexes/lockout table and prove lookup-attempt row preservation.
6. Accept Notification Production authorization only through the exact Build 428 Notification token.
7. Create and verify a fresh full Production D1 backup dedicated to the Notification stage.
8. Re-read the targeted Notification before-state immediately before its authorized write.
9. Apply only Build 403 `metadata_json`/missing notification indexes and prove outbox-row preservation.
10. Accept annotation-index Production authorization only through the exact Build 428 annotation token.
11. Create and verify a fresh full Production D1 backup dedicated to the annotation-index stage.
12. Apply/prove only the Build 197 `product_image_annotations(product_id, product_image_id)` index with annotation row preservation.
13. Run a fresh aggregate read-only additive parity proof after all separately authorized additive stages that actually run.
14. Take a new full Production D1 export before the first table-rebuild family.
15. Convert the inert Membership preview into an explicit executable candidate only after fresh three-row/tier evidence and separate rebuild authorization.
16. Add a local Membership rebuild fixture proving exact preservation of all three tier identities and canonical uniqueness.
17. Generate fractional Inventory/Creative Project non-executing rebuild previews with explicit REAL affinity and exact value preservation.
18. Refresh Product/FK zero-orphan evidence and Accounting/default/nullability compatibility immediately before any rebuild candidate becomes executable.
19. Re-run semantic drift after each approved rebuild family and leave `search_query_terms`, `__sql_test`, and CAIP exclusions unchanged.
20. Produce the next twenty-item release gate; Production promotion stays closed until all approved schema work plus browser/read-contract smoke is green.

## Gate state

```text
Build 425  Development Product-number backfill       PASS (20/20)
Build 426  Production release-candidate assembly     PASS (20/20)
Build 427  Production Product-number stage           PASS
Build 428  Remaining parity authorization boundary   READY

Production promotion                                 CLOSED
```
