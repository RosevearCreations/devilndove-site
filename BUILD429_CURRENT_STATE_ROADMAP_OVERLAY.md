# Build 429 — Current Parity Roadmap Overlay

## Immediate objective

Close the remaining Production schema parity work one family at a time, preserving the Product-number proof and keeping Production promotion closed until semantic parity plus browser/read-contract smoke are green.

## Ordered release path

1. **Gift Card Build 384 authorization boundary — current**
   - run Build 429 read-only Gift Card preflight;
   - prove exact five-column/three-index/lockout-table gap;
   - capture Gift Card lookup/card/redemption row boundaries;
   - stop for explicit Gift Card authorization.

2. **Gift Card backed-up additive execution — after explicit token only**
   - fresh full Production D1 export;
   - byte/SHA/age verification;
   - targeted before-state refresh;
   - apply only missing lookup columns/indexes/lockout table;
   - prove row preservation and complete Build 384 Gift Card parity.

3. **Notification Build 403 authorization boundary**
   - fresh read-only `metadata_json` + four-index + outbox-row evidence;
   - separate local regression/gate;
   - stop for explicit Notification authorization.

4. **Notification backed-up additive execution**
   - its own full Production backup;
   - apply only current Build 403 gap;
   - prove outbox-row preservation.

5. **Build 197 annotation-index boundary/execution**
   - separate token and backup;
   - add only `idx_product_image_annotations_product_image_build197` if still absent;
   - prove annotation row preservation.

6. **Membership Build 395 rebuild**
   - fresh three-row/tier snapshot;
   - convert inert preview to explicit candidate only after separate rebuild authorization;
   - full Production backup;
   - data-preserving shadow/rebuild;
   - preserve canonical uniqueness and all tier identities.

7. **Fractional Inventory/Creative Project rebuilds**
   - non-executing previews first;
   - bounded table groups;
   - exact REAL value preservation;
   - `site_item_inventory` must remain exactly 1,041 rows.

8. **Product/FK rebuild families**
   - fresh zero-orphan scan immediately before each family;
   - refuse any family if a nonzero orphan appears.

9. **Accounting/default/nullability families**
   - fresh compatibility proof per family;
   - family-specific backup/rollback boundary;
   - no broad rebuild batch.

10. **Release closure**
    - rerun semantic drift;
    - keep `search_query_terms`, `__sql_test`, and CAIP decisions unchanged;
    - rerun browser/read-contract/provider fail-closed smoke;
    - merge final state into `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`;
    - open Production promotion only when every approved gate is green.

## Current status

```text
Product numbers                    COMPLETE / PROVEN
Gift Card authorization boundary   CURRENT / NOT AUTHORIZED
Notification                       LOCKED
Annotation index                   LOCKED
Membership rebuild                 LOCKED
Fractional rebuilds                LOCKED
Product/FK rebuilds                LOCKED
Accounting/default rebuilds        LOCKED
Production promotion               CLOSED
```
