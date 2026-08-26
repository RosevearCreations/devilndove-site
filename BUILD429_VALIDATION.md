# Build 429 Validation

## Status

**LIVE GIFT CARD PREFLIGHT PASS / AUTHORIZATION GATE PASS (20/20) / LOCAL REGRESSION FALSE-NEGATIVE REPAIRED / NO GIFT CARD PRODUCTION MUTATION AUTHORIZED**

Build 428 is closed PASS (20/20). Product numbers remain proven in both environments and every remaining Production family is still separately locked.

## Owner-run Build 429 evidence

The source compile passed.

The first local Gift Card safety regression reported one false-negative:

```text
BUILD 429 GIFT CARD AUTHORIZATION SAFETY REGRESSION: FAIL (1/20 failed)
 - Gift Card executor requires a full remote Production D1 export
```

The executor itself was already correct. It defines `export_backup(stage: str)` and invokes Wrangler with the full remote Production export command:

```text
wrangler d1 export devilndove-prod --remote --skip-confirmation --output=<stage backup>
```

The regression had incorrectly required the literal source call `export_backup(stage)`, while the real controller dispatches the selected stage through `args.stage`. The assertion has been repaired to inspect the actual export function and Wrangler export arguments instead of that brittle call spelling.

The live read-only Gift Card preflight passed and established the exact reviewed Build 384 gap:

```text
Missing lookup columns: ['code_suffix', 'ip_hash', 'lookup_email', 'result_status', 'user_agent']
Missing Gift Card indexes: ['idx_gift_card_lookup_attempts_created', 'idx_gift_card_lookup_attempts_email', 'idx_gift_card_lookup_lockouts_status']
Gift Card lockout table exists: False
gift_card_lookup_attempts rows: 0
gift_cards rows: 0
gift_card_redemptions rows: 0
Exact known Build 384 gap: YES
Safe to request Gift Card authorization: YES
Production backup created: NO
Gift Card authorization received: NO
Production mutation executed: NO
Notification/annotation/rebuild authorization: NOT RECEIVED
PRODUCTION PROMOTION: CLOSED
BUILD 429 GIFT CARD AUTHORIZATION PREFLIGHT: PASS
```

The local authorization gate passed all twenty checks:

```text
BUILD 429 TWENTY-ITEM GIFT CARD AUTHORIZATION-BOUNDARY GATE: PASS (20/20)
Product-number Production stage: COMPLETE / PROVEN
Gift Card backup: NOT CREATED
Gift Card authorization: NOT RECEIVED
Gift Card mutation executed: NO
Notification authorization: NOT RECEIVED
Annotation-index authorization: NOT RECEIVED
Rebuild-family authorization: NOT RECEIVED
PRODUCTION PROMOTION: CLOSED
```

## Rerun now — local regression only

The live Gift Card preflight and 20-item gate do not need to be rerun because the repair changes only the local static regression assertion.

```bash
cd /c/Dev/devilndove-site

git pull origin dev

python -m py_compile scripts/build429_gift_card_authorization_regression.py
python scripts/build429_gift_card_authorization_regression.py
```

Expected:

```text
BUILD 429 GIFT CARD AUTHORIZATION SAFETY REGRESSION: PASS (20/20)
Gift Card Production authorization inferred: NO
Production backup created by regression: NO
Production mutation executed: NO
Notification/annotation/rebuild authorization inferred: NO
PRODUCTION PROMOTION: CLOSED
```

Once that local rerun passes, Build 429 is fully green and the workflow may request the separate Gift Card Production authorization token. The regression repair itself does not grant authorization.

## Do not run yet

Until the owner explicitly authorizes the Gift Card stage, do not run:

```text
scripts/build428_production_additive_execution.py --stage gift --backup ...
scripts/build428_production_additive_execution.py --stage gift --apply ...
```

Notification, annotation-index, Membership, fractional Inventory, Product/FK, and Accounting/default families remain separately locked.

## Failure handling

- `7403`: classify as Cloudflare authorization/read interruption; do not infer Gift Card schema state.
- Different missing-column/index set: treat as live drift and keep Gift Card authorization blocked until reviewed.
- Lockout table unexpectedly exists: re-plan from fresh state; do not force the older candidate.
- Local regression/gate defect: patch source only; do not create a Production backup as a workaround.
- Any preflight/gate failure: no Gift Card authorization should be exercised.

## Safety

```text
Product-number prerequisite              complete / proven
Gift Card Production reads               bounded / read-only
Gift Card Production backup              not created
Gift Card Production authorization       not received
Gift Card Production mutation            locked
Notification/annotation/rebuild families locked
R2/provider mutation                     disabled
Production promotion                     closed
```
