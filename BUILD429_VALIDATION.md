# Build 429 Validation

## Status

**READY — GIFT CARD READ-ONLY AUTHORIZATION PREFLIGHT + LOCAL 20/20 GATES / NO GIFT CARD PRODUCTION MUTATION AUTHORIZED**

Build 428 is closed PASS (20/20). Product numbers remain proven in both environments and every remaining Production family is still separately locked.

## Run now — safe before Gift Card authorization

```bash
cd /c/Dev/devilndove-site

git pull origin dev

python -m py_compile \
  scripts/build429_gift_card_authorization_preflight.py \
  scripts/build429_gift_card_authorization_regression.py \
  scripts/build429_gift_card_authorization_gate.py \
  scripts/build428_production_additive_execution.py

python scripts/build429_gift_card_authorization_regression.py

python -u scripts/build429_gift_card_authorization_preflight.py --run \
  2>&1 | tee build429_gift_card_authorization_preflight.txt

python scripts/build429_gift_card_authorization_gate.py
```

Only the live preflight contacts Cloudflare/D1 and it performs schema/count SELECT-style reads only. It has no mutation path.

## Expected core result

```text
BUILD 429 GIFT CARD AUTHORIZATION SAFETY REGRESSION: PASS (20/20)
Gift Card Production authorization inferred: NO
Production backup created by regression: NO
Production mutation executed: NO
Notification/annotation/rebuild authorization inferred: NO
PRODUCTION PROMOTION: CLOSED
```

Fresh live preflight should report the currently reviewed Build 384 gap:

```text
=== BUILD 429 GIFT CARD AUTHORIZATION BOUNDARY ===
Missing lookup columns: ['code_suffix', 'ip_hash', 'lookup_email', 'result_status', 'user_agent']
Missing Gift Card indexes: ['idx_gift_card_lookup_attempts_created', 'idx_gift_card_lookup_attempts_email', 'idx_gift_card_lookup_lockouts_status']
Gift Card lockout table exists: False
gift_card_lookup_attempts rows: <live>
gift_cards rows: <live>
gift_card_redemptions rows: <live>
Exact known Build 384 gap: YES
Safe to request Gift Card authorization: YES
Production backup created: NO
Gift Card authorization received: NO
Production mutation executed: NO
Notification/annotation/rebuild authorization: NOT RECEIVED
PRODUCTION PROMOTION: CLOSED
BUILD 429 GIFT CARD AUTHORIZATION PREFLIGHT: PASS
```

The final local gate should end:

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
NEXT: explicit Gift Card Production authorization is required before its backup/apply sequence.
```

## Do not run yet

Until the owner explicitly authorizes the Gift Card stage, do not run:

```text
scripts/build428_production_additive_execution.py --stage gift --backup ...
scripts/build428_production_additive_execution.py --stage gift --apply ...
```

The prepared Gift Card token is documented in `BUILD429_TWENTY_ITEM_GIFT_CARD_AUTHORIZATION_BOUNDARY.md`, but merely seeing or validating the token does not authorize it.

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
