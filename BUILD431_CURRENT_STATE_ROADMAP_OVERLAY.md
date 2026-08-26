# Build 431 — Current Parity Roadmap Overlay

## Immediate objective

The corrected full Build 403 Notification authorization boundary is now green. Await a new explicit full-scope Notification authorization, then continue remaining Production parity one separately authorized family at a time.

## Ordered path

1. **Corrected full Build 403 Notification authorization boundary — complete**
   - local 20-check regression: PASS;
   - live read-only corrected preflight: PASS;
   - proved `metadata_json` plus all five canonical indexes are missing;
   - captured `notification_outbox` row boundary at 0;
   - proved old four-index token is insufficient;
   - final corrected authorization gate: PASS (20/20).

2. **Full Build 403 Notification execution — awaiting new token**
   - require exact token `AUTHORIZE-BUILD431-PROD-NOTIFICATION-FULL-BUILD403`;
   - rerun the corrected preflight;
   - fresh full Production D1 export;
   - bytes/SHA/UUID/age proof;
   - exact targeted reread;
   - add only missing `metadata_json` and five canonical indexes;
   - preserve `notification_outbox` row count;
   - independent postcheck.

3. **Build 197 annotation-index authorization boundary**
   - read-only index/row evidence;
   - separate regression/gate;
   - stop for explicit annotation authorization.

4. **Build 197 annotation-index execution**
   - own Production backup;
   - create only `idx_product_image_annotations_product_image_build197` if still missing;
   - preserve annotation rows.

5. **Membership Build 395 rebuild**
   - refresh exact three-row/tier state;
   - keep preview inert until separate rebuild authorization;
   - full backup + shadow/rebuild + identity/uniqueness proof.

6. **Fractional Inventory/Creative Project rebuilds**
   - non-executing previews first;
   - preserve exact REAL values;
   - keep `site_item_inventory` at exactly 1,041 rows.

7. **Product/FK families**
   - refresh zero-orphan evidence immediately before each rebuild;
   - refuse any nonzero orphan state.

8. **Accounting/default/nullability families**
   - fresh family-specific compatibility proof;
   - family-specific backup/rollback boundary;
   - no broad rebuild batch.

9. **Release closure**
   - rerun full semantic parity;
   - preserve `search_query_terms`, `__sql_test`, and CAIP decisions;
   - rerun browser/read-contract/provider fail-closed smoke;
   - merge final state into canonical handoff/roadmap;
   - open Production promotion only when every approved gate is green.

## Current status

```text
Product numbers                              COMPLETE / PROVEN
Gift Card                                    COMPLETE / PROVEN
Old four-index Notification authorization    SUPERSEDED / INSUFFICIENT
Full Build 403 Notification boundary         PASS (20/20)
Full Build 403 Notification authorization    NOT RECEIVED
Notification Production backup               NOT CREATED
Notification Production mutation             NOT EXECUTED
Annotation index                             LOCKED
Membership rebuild                           LOCKED
Fractional rebuilds                          LOCKED
Product/FK rebuilds                          LOCKED
Accounting/default rebuilds                  LOCKED
Production promotion                         CLOSED
```
