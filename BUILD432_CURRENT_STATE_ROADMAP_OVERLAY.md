# Build 432 — Current Parity Roadmap Overlay

## Immediate objective

Execute the separately authorized Build 197 annotation-index stage through the guarded Build 433 workflow, then move into the first data-preserving rebuild family only after separate evidence and authorization.

## Ordered path

1. **Product numbers — complete/proven**
   - exact 1084..1128 block in Development and Production;
   - sequences >=1129;
   - identities equal.

2. **Gift Card Build 384 — complete/proven**
   - dedicated Production backup;
   - five lookup columns + three indexes + lockout table aligned;
   - all three Gift Card row boundaries preserved.

3. **Notification Build 403 — complete/proven**
   - corrected full-scope authorization used;
   - dedicated Production backup;
   - `metadata_json` + five canonical indexes aligned;
   - `notification_outbox` rows preserved 0 -> 0;
   - independent read-only postcheck PASS.

4. **Build 197 annotation-index authorization boundary — complete**
   - local 20-check regression: PASS;
   - live read-only index/required-column/row evidence: PASS;
   - composite index absent;
   - required `product_id` and `product_image_id` columns present;
   - `product_image_annotations` preservation boundary: 70 rows;
   - final authorization gate: PASS (20/20).

5. **Build 197 annotation-index execution — authorized/current**
   - exact token `AUTHORIZE-BUILD428-PROD-ANNOTATION-INDEX` received;
   - use only `scripts/build433_production_annotation_execution.py`;
   - rerun targeted annotation preflight;
   - fresh full Production D1 backup;
   - bytes/SHA/UUID/age proof;
   - targeted reread;
   - create only `idx_product_image_annotations_product_image_build197` if still missing;
   - preserve annotation row count;
   - independent postcheck;
   - do not manually run SQL in the D1 console.

6. **Membership Build 395 rebuild authorization boundary**
   - refresh exact three-row/tier Production state;
   - prove canonical Build 395 shape and legacy alias mapping;
   - regenerate inert non-executing preview;
   - local safety regression/gate;
   - stop for a separate rebuild authorization.

7. **Membership Build 395 execution — only after separate rebuild token**
   - full Production backup;
   - shadow/rebuild with rollback path;
   - preserve all three tier identities and canonical uniqueness;
   - semantic postcheck.

8. **Fractional Inventory/Creative Project rebuilds**
   - non-executing previews first;
   - bounded table groups;
   - exact REAL value preservation;
   - `site_item_inventory` remains exactly 1,041 rows unless fresh legitimate activity changes the pre-write boundary.

9. **Product/FK families**
   - refresh zero-orphan evidence immediately before each rebuild;
   - refuse any family on nonzero orphan evidence.

10. **Accounting/default/nullability families**
    - fresh family-specific compatibility proof;
    - separate backup/rollback boundaries;
    - no broad rebuild batch.

11. **Release closure**
    - rerun full semantic drift/parity;
    - preserve `search_query_terms`, `__sql_test`, and CAIP decisions;
    - rerun browser/read-contract/provider fail-closed smoke;
    - merge final state into canonical handoff/roadmap;
    - open Production promotion only when every approved gate is green.

## Current status

```text
Product numbers                              COMPLETE / PROVEN
Gift Card                                    COMPLETE / PROVEN
Full Build 403 Notification                  COMPLETE / PROVEN
Build 197 annotation boundary                PASS (20/20)
Build 197 annotation authorization           RECEIVED
Annotation Production backup                 NOT CREATED
Annotation Production mutation               NOT EXECUTED
Membership rebuild                           LOCKED
Fractional rebuilds                          LOCKED
Product/FK rebuilds                          LOCKED
Accounting/default rebuilds                  LOCKED
R2/provider mutation                         DISABLED
Production promotion                         CLOSED
```
