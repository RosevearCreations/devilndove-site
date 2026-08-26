# Build 434 — Current Parity Roadmap Overlay

## Immediate objective

Validate the Membership Build 395 legacy-to-canonical rebuild boundary with fresh Production reads and an inert zero-SQL preview. Do not authorize or execute a Membership rebuild until that boundary is separately reviewed and approved.

## Ordered path

1. **Product numbers — complete/proven**
   - exact 1084..1128 block in Development and Production;
   - sequences >=1129;
   - identities equal.

2. **Gift Card Build 384 — complete/proven**
   - dedicated Production backup;
   - lookup columns/indexes/lockout aligned;
   - all Gift Card row boundaries preserved.

3. **Notification Build 403 — complete/proven**
   - corrected full-scope authorization used;
   - dedicated Production backup;
   - `metadata_json` + five canonical indexes aligned;
   - `notification_outbox` rows preserved 0 -> 0;
   - independent postcheck PASS.

4. **Product-image annotation Build 197 — complete/proven**
   - dedicated Production backup;
   - only `idx_product_image_annotations_product_image_build197` created;
   - `product_image_annotations` rows preserved 70 -> 70;
   - independent postcheck PASS.

5. **Membership Build 395 authorization boundary — current / inert**
   - local 20-check safety regression;
   - fresh live read-only column/row/CREATE-SQL evidence;
   - require exactly three rows;
   - normalize exactly to bronze/silver/gold;
   - require reviewed legacy aliases;
   - classify canonical-vs-legacy shape;
   - generate inert preview with zero executable statements;
   - local 20-item authorization gate;
   - stop without a rebuild token.

6. **Membership Build 395 execution — only after a future separate token**
   - rerun exact live evidence immediately before backup;
   - capture full source values for all three tiers;
   - fresh full Production backup;
   - canonical shadow table matching Build 395 exactly;
   - explicit legacy-to-canonical mapping;
   - preserve existing business values rather than overwriting them with seed defaults;
   - validate row count, tier uniqueness, constraints, and rollback boundary before swap;
   - independent semantic postcheck.

7. **Fractional Inventory/Creative Project rebuilds**
   - one bounded family at a time;
   - inert previews first;
   - preserve exact REAL quantities/values;
   - refresh `site_item_inventory` row boundary before any future write.

8. **Product/FK families**
   - refresh orphan evidence immediately before each family;
   - refuse any rebuild on nonzero orphan counts.

9. **Accounting/default/nullability families**
   - fresh compatibility proof per family;
   - separate backup/rollback boundary;
   - no broad rebuild batch.

10. **Release closure**
    - rerun full semantic drift/parity;
    - preserve `search_query_terms`, `__sql_test`, and CAIP decisions;
    - rerun browser/read-contract/provider fail-closed smoke;
    - merge final state into canonical handoff/roadmap;
    - Production promotion opens only after every approved gate is green.

## Current status

```text
Product numbers                              COMPLETE / PROVEN
Gift Card                                    COMPLETE / PROVEN
Full Build 403 Notification                  COMPLETE / PROVEN
Build 197 annotation index                   COMPLETE / PROVEN
Membership Build 395 boundary                CURRENT / READ-ONLY / INERT
Membership rebuild authorization             NOT RECEIVED
Membership Production backup                 NOT CREATED
Membership Production mutation               NOT EXECUTED
Fractional rebuilds                          LOCKED
Product/FK rebuilds                          LOCKED
Accounting/default rebuilds                  LOCKED
R2/provider mutation                         DISABLED
CAIP D1-only copy                            FORBIDDEN
Production promotion                         CLOSED
```
