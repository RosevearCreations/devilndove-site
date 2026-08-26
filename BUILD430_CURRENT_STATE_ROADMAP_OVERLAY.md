# Build 430 — Current Parity Roadmap Overlay

## Immediate objective

Advance remaining Production schema parity one separately authorized family at a time. Product numbers and Gift Card are complete/proven. Notification is the next read-only authorization boundary.

## Ordered release path

1. **Product-number remediation — complete**
   - exact 1084..1128 in Development and Production;
   - both sequences at 1129;
   - Product identities equal.

2. **Gift Card Build 384 — complete**
   - dedicated Production backup;
   - five lookup columns added;
   - lookup/lockout indexes and lockout table added;
   - lookup/card/redemption row counts preserved;
   - independent postcheck PASS.

3. **Notification Build 403 authorization boundary — current**
   - fresh read-only `metadata_json` existence check;
   - fresh four-index gap check;
   - capture `notification_outbox` row boundary;
   - local 20-check source regression and authorization gate;
   - stop for explicit Notification token.

4. **Notification backed-up additive execution — only after explicit token**
   - its own full Production D1 export;
   - backup bytes/SHA/age verification;
   - targeted before-state refresh;
   - apply only `metadata_json` plus missing reviewed indexes;
   - prove outbox-row preservation and independent postcheck.

5. **Build 197 annotation-index boundary/execution**
   - separate preflight, token and backup;
   - add only `idx_product_image_annotations_product_image_build197` if still absent;
   - prove annotation row preservation.

6. **Membership Build 395 rebuild**
   - fresh three-row/tier snapshot;
   - keep inert preview until separate rebuild authorization;
   - dedicated backup;
   - data-preserving canonical rebuild with rollback shadow.

7. **Fractional Inventory/Creative Project rebuilds**
   - non-executing previews first;
   - exact REAL-affinity/value preservation;
   - `site_item_inventory` remains exactly 1,041 rows.

8. **Product/FK rebuilds**
   - fresh zero-orphan scans immediately before each family;
   - block on any nonzero orphan.

9. **Accounting/default/nullability rebuilds**
   - family-specific compatibility checks and backup boundaries;
   - no broad rebuild batch.

10. **Release closure**
    - semantic parity refresh;
    - preserve `search_query_terms`, `__sql_test`, and CAIP decisions;
    - browser/read-contract/provider fail-closed smoke;
    - merge final state into canonical `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`;
    - open Production promotion only after all approved gates are green.

## Current status

```text
Product numbers                    COMPLETE / PROVEN
Gift Card                          COMPLETE / PROVEN
Notification authorization        CURRENT / NOT AUTHORIZED
Annotation index                   LOCKED
Membership rebuild                 LOCKED
Fractional rebuilds                LOCKED
Product/FK rebuilds                LOCKED
Accounting/default rebuilds        LOCKED
Production promotion               CLOSED
```
