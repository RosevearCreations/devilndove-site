# Build 428 Validation

## Status

**READY — READ-ONLY REMAINING-PARITY EVIDENCE + LOCAL AUTHORIZATION-BOUNDARY GATES / NO REMAINING PRODUCTION MUTATION AUTHORIZED**

Build 427 Product-number Production remediation is complete and proven:

```text
Production Product numbers: 1084..1128 (45 unique)
Production sequence next: 1129
Development Product numbers: 1084..1128 (45 unique)
Development sequence next: 1129
Product identities equal: True
BUILD 427 PRODUCTION PRODUCT-NUMBER POSTCHECK: PASS
```

Build 428 does not execute any remaining Production schema mutation.

## Run now

```bash
cd /c/Dev/devilndove-site

git pull origin dev

python -m py_compile \
  scripts/build428_live_remaining_parity_evidence.py \
  scripts/build428_membership_nonexecuting_preview.py \
  scripts/build428_production_additive_execution.py \
  scripts/build428_remaining_parity_regression.py \
  scripts/build428_twenty_item_remaining_parity_gate.py

python scripts/build428_remaining_parity_regression.py

python -u scripts/build428_live_remaining_parity_evidence.py --run \
  2>&1 | tee build428_live_remaining_parity_evidence.txt

python scripts/build428_membership_nonexecuting_preview.py

python scripts/build428_twenty_item_remaining_parity_gate.py
```

Only `build428_live_remaining_parity_evidence.py --run` contacts Cloudflare. It uses SELECT/schema-inspection reads only.

## Expected core result

```text
BUILD 428 REMAINING PARITY SAFETY REGRESSION: PASS (20/20)

=== BUILD 428 REMAINING PARITY SUMMARY ===
Gift Card missing columns: ['code_suffix', 'ip_hash', 'lookup_email', 'result_status', 'user_agent']
Gift Card lockout exists: False
Notification metadata_json exists: False
Notification missing indexes: ['idx_notification_outbox_kind_destination', 'idx_notification_outbox_payment', 'idx_notification_outbox_product']
Build 197 annotation index exists: False
Membership rows: 3; rebuild required: True
Product/FK orphan counts all zero: True
site_item_inventory Production rows: 1041
search_query_terms rows preserved: 5
__sql_test rows untouched: 0
CAIP rows excluded: 113
Remaining Production authorization inferred: NO
Production mutation executed: NO
PRODUCTION PROMOTION: CLOSED
BUILD 428 LIVE READ-ONLY REMAINING PARITY EVIDENCE: PASS

BUILD 428 MEMBERSHIP NON-EXECUTING PREVIEW: PASS
Production rows represented: 3
Legacy alias map entries: 4
Executable SQL statements generated: ZERO
Production mutation executed: NO
PRODUCTION PROMOTION: CLOSED

BUILD 428 TWENTY-ITEM REMAINING PARITY AUTHORIZATION-BOUNDARY GATE: PASS (20/20)
Product-number Production stage: COMPLETE / PROVEN
Gift Card authorization: NOT RECEIVED
Notification authorization: NOT RECEIVED
Annotation-index authorization: NOT RECEIVED
Rebuild-family authorization: NOT RECEIVED
Production mutation executed by Build 428: NO
PRODUCTION PROMOTION: CLOSED
```

## Do not run yet

The Build 428 additive controller is source-ready but no remaining mutation is authorized. Do not run any `--backup` or `--apply` form yet.

Prepared future stage tokens are documented in `BUILD428_TWENTY_ITEM_REMAINING_PARITY_BOUNDARY.md`; each token authorizes one family only and each family requires its own fresh full Production D1 backup.

## Failure handling

- Source/regression failure: patch source only; do not contact Production to work around it.
- Live evidence `7403`: classify as Cloudflare authorization/read interruption; do not infer schema state.
- Live evidence drift: keep the relevant family blocked and regenerate its plan from current evidence.
- Membership preview failure: do not make a rebuild executable.
- Any gate failure: no remaining Production authorization should be exercised.

## Safety

```text
Product-number Production remediation    complete / proven
Remaining Production reads               bounded / read-only
Gift Card mutation                       locked
Notification mutation                    locked
Annotation-index mutation                locked
Rebuild families                         locked
R2/provider mutation                     disabled
Production promotion                     closed
```
