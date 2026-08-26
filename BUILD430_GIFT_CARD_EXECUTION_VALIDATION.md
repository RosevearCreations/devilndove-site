# Build 430 — Authorized Gift Card Production Execution Validation

## Status

**GIFT CARD PRODUCTION AUTHORIZED / SOURCE HARDENED / FRESH GIFT BACKUP + APPLY + POSTCHECK PENDING / ALL OTHER PRODUCTION FAMILIES LOCKED**

Build 429 is closed PASS (20/20). The owner explicitly authorized only:

```text
AUTHORIZE-BUILD428-PROD-GIFT-CARD
```

The authorized scope is limited to the reviewed Build 384 Gift Card lookup-attempt/lockout additive gap:

```text
Missing lookup columns:
  code_suffix
  ip_hash
  lookup_email
  result_status
  user_agent

Missing indexes:
  idx_gift_card_lookup_attempts_created
  idx_gift_card_lookup_attempts_email
  idx_gift_card_lookup_lockouts_status

Missing table:
  gift_card_lookup_lockouts
```

No default-template seed, Gift Card table rebuild, Notification, annotation-index, Membership, fractional Inventory, Product/FK, Accounting/default, R2/provider, or promotion operation is authorized.

## Additional pre-write hardening

Before exercising the authorization, `scripts/build428_production_additive_execution.py` was tightened so a Gift Card PASS requires all three preservation boundaries to remain unchanged:

```text
gift_card_lookup_attempts
gift_cards
gift_card_redemptions
```

The local Build 429 regression was updated to prove those checks exist.

## Authorized run sequence

Run from `dev` only:

```bash
cd /c/Dev/devilndove-site

git pull origin dev

python -m py_compile \
  scripts/build428_production_additive_execution.py \
  scripts/build429_gift_card_authorization_preflight.py \
  scripts/build429_gift_card_authorization_regression.py

python scripts/build429_gift_card_authorization_regression.py

python -u scripts/build429_gift_card_authorization_preflight.py --run \
  2>&1 | tee build430_gift_card_fresh_prewrite.txt

python -u scripts/build428_production_additive_execution.py \
  --stage gift \
  --backup \
  --confirm AUTHORIZE-BUILD428-PROD-GIFT-CARD \
  2>&1 | tee build430_gift_card_backup.txt

python -u scripts/build428_production_additive_execution.py \
  --stage gift \
  --apply \
  --confirm AUTHORIZE-BUILD428-PROD-GIFT-CARD \
  2>&1 | tee build430_gift_card_apply.txt

python -u scripts/build428_production_additive_execution.py \
  --stage gift \
  --postcheck \
  2>&1 | tee build430_gift_card_postcheck.txt
```

Do not continue to a later command if the immediately preceding stage reports FAIL/BLOCKED or exits nonzero.

## Expected pre-write proof

The fresh read-only preflight must still show:

```text
Exact known Build 384 gap: YES
Safe to request Gift Card authorization: YES
gift_card_lookup_attempts rows: 0
gift_cards rows: 0
gift_card_redemptions rows: 0
Production mutation executed: NO
PRODUCTION PROMOTION: CLOSED
BUILD 429 GIFT CARD AUTHORIZATION PREFLIGHT: PASS
```

The preflight intentionally prints `Gift Card authorization received: NO`; the read-only helper never infers authorization from conversation state. Authorization is enforced separately by the literal token passed to the executor.

## Expected backup proof

```text
BUILD 428 PRODUCTION GIFT BACKUP: PASS
Backup: local_backups/<gift-specific full Production export>.sql
Bytes: <nonzero>
SHA-256: <digest>
Production mutation executed: NO
```

The apply stage re-verifies the backup file, target UUID, byte count, SHA-256 and <=30-minute age.

## Expected apply/post-proof

The authorized apply may modify only the bounded Build 384 lookup/lockout schema. It must finish with:

```text
BUILD 428 PRODUCTION GIFT ADDITIVE POSTCHECK: PASS
gift_card_lookup_attempts rows preserved: 0 -> 0
gift_cards rows preserved: 0 -> 0
gift_card_redemptions rows preserved: 0 -> 0
PRODUCTION PROMOTION: CLOSED
```

The final read-only postcheck must report:

```text
BUILD 428 PRODUCTION GIFT READ-ONLY POSTCHECK: PASS
gift_card_lookup_attempts rows: 0
gift_cards rows: 0
gift_card_redemptions rows: 0
PRODUCTION PROMOTION: CLOSED
```

## Stop conditions

- Any Cloudflare `7403`: stop; classify as authorization/read interruption unless it occurs after DDL submission, then run only the read-only Gift Card postcheck and retain the backup.
- Backup missing/stale/hash mismatch: stop and recreate only the Gift Card backup with the same authorized token.
- Unexpected Gift Card preflight drift: stop; do not force the reviewed candidate.
- Apply/postcheck failure: stop all later Production families and retain the Gift Card backup.

## Safety boundary

```text
Product-number Production stage          COMPLETE / PROVEN
Build 429 Gift Card boundary             PASS (20/20)
Gift Card Production authorization       RECEIVED
Gift Card Production backup              PENDING
Gift Card Production mutation            PENDING
Notification authorization               NOT RECEIVED
Annotation-index authorization           NOT RECEIVED
Rebuild-family authorization             NOT RECEIVED
R2/provider mutation                     DISABLED
Production promotion                     CLOSED
```
