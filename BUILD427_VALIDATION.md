# Build 427 Validation

## Status

**AUTHORIZATION BOUNDARY PASS (20/20) / PRODUCT-NUMBER STAGE AUTHORIZED / BACKUP PASS / APPLY NOT YET EXECUTED / PRODUCTION PROMOTION CLOSED**

The Build 427 source/read-only authorization boundary passed after the Windows UTF-8 console repair:

```text
BUILD 427 PRODUCTION EXECUTION SAFETY REGRESSION: PASS (20/20)
BUILD 427 PRODUCTION EXECUTION PREFLIGHT: PASS
BUILD 427 TWENTY-ITEM PRODUCTION AUTHORIZATION-BOUNDARY GATE: PASS (20/20)
```

Fresh live preflight proved:

```text
Product-number candidate fresh: YES
Candidate block: 1084..1128
Candidate next: 1129
Product/FK zero-orphan gate: True
site_item_inventory rows: 1041
search_query_terms rows preserved: 5
__sql_test rows untouched: 0
CAIP rows excluded: 113
Safe to open Product-number execution phase: YES
Production backup created: NO
Production authorization received: NO
Production mutation executed: NO
PRODUCTION PROMOTION: CLOSED
```

## Explicit Product-number authorization received

The owner subsequently supplied the exact token:

```text
AUTHORIZE-BUILD427-PROD-PRODUCT-NUMBERS
```

That authorization applies **only** to the Product-number legacy backfill/sequence stage. Gift Card, Notification, Product-image annotation index, Membership, fractional Inventory, Product/FK and Accounting/default families remain separately locked.

## Authorized Production backup — PASS

The authorized backup phase reran the green preflight and created a full remote Production D1 export before any mutation:

```text
BUILD 427 PRODUCTION BACKUP: PASS
Backup: local_backups\build427_prod_before_product_numbers_20260826T003614Z.sql
Bytes: 19002028
SHA-256: 5ec4fd7731706c598e2958e831ad5a9ddce327b2a78c4dec261a718b0261ceed
Production mutation executed: NO
```

## First apply attempt — safely blocked before mutation

The first authorized `--apply-product-numbers` invocation did **not** reach the D1 write. Its second full Build 426 evidence refresh received Cloudflare authorization code `7403` while reading the unrelated Development `site_inventory_movements` count:

```text
The given account is not valid or is not authorized to access this service [code: 7403]
BUILD 418 LIVE SEMANTIC CLASSIFICATION: FAIL — BUILD 426 DEVELOPMENT site_inventory_movements COUNT blocked by Cloudflare authorization (7403).
BUILD 427 PRODUCTION EXECUTION PREFLIGHT: FAIL — Build 426 fresh live evidence returned 1.
BUILD 427 PRODUCTION PRODUCT NUMBERS: FAIL — fresh Build 427 preflight failed with exit code 1.
```

This is classified as an **authorization/read interruption**, not schema evidence. No Product-number DML was submitted.

The immediate read-only Product-number postcheck then proved the safe no-write state:

```text
Production Product numbers: 0..0 (0 unique)
Production sequence next: 1084
Development Product numbers: 1084..1128 (45 unique)
Development sequence next: 1129
Product identities equal: True
PRODUCTION PROMOTION: CLOSED
BUILD 427 PRODUCTION PRODUCT-NUMBER POSTCHECK: FAIL
```

The postcheck is expected to report FAIL here because Production intentionally remained unchanged; it confirms there was no partial Product-number write.

## Build 427 focused-prewrite repair

The Product-number executor has been tightened so the immediate pre-write check no longer reruns unrelated Build 426 schema families after the authorization boundary is already green.

Immediately before the Product-number write it now re-proves only facts capable of invalidating this stage:

1. exact 45 Product IDs/slugs/names in Development and Production;
2. exact Development Product-number map `1084..1128`;
3. all 45 Production Product numbers still NULL;
4. Production sequence still `1084`;
5. Development sequence still `>=1129`;
6. no candidate-number collision in Production `product_costs` or `product_deletion_audit`.

It does **not** query Gift Card, Notification, CAIP, Inventory row counts, FK-orphan families, Membership or Accounting/default families during this immediate Product-number-only write check. Those remain separate later gates.

Before accepting an existing Production backup, the executor now also re-verifies:

- hard Production name + UUID;
- backup file still exists;
- byte count still matches recorded evidence;
- SHA-256 still matches recorded evidence;
- backup age is no more than 1,800 seconds (30 minutes).

If any backup check fails, the Product-number write remains blocked and the authorized `--backup` stage must be rerun first.

## Current Product-number stage state

```text
Production Product-number authorization              RECEIVED
Production backup                                     CREATED / MUST PASS RECHECK
Production Product-number mutation                    NOT YET EXECUTED
Production Product-number values                      still NULL
Production Product-number sequence                    1084
Development Product-number values                     1084..1128
Development Product-number sequence                   1129
Gift Card/Notification/index/rebuild mutation         NOT AUTHORIZED
Production promotion                                  CLOSED
```

## Continue only this authorized scope

After pulling the focused-prewrite repair:

```bash
python -m py_compile \
  scripts/build427_production_product_number_execution.py \
  scripts/build427_execution_safety_regression.py

python scripts/build427_execution_safety_regression.py

python -u scripts/build427_production_product_number_execution.py \
  --apply-product-numbers \
  --confirm AUTHORIZE-BUILD427-PROD-PRODUCT-NUMBERS

python -u scripts/build427_production_product_number_execution.py --postcheck
```

If the existing backup is older than 30 minutes when the apply command runs, the helper will fail closed. In that case rerun the already-authorized Product-number backup stage, then apply and postcheck.

## Expected successful Product-number postcheck

```text
Production Product numbers: 1084..1128 (45 unique)
Production sequence next: 1129
Development Product numbers: 1084..1128 (45 unique)
Development sequence next: 1129
Product identities equal: True
PRODUCTION PROMOTION: CLOSED
BUILD 427 PRODUCTION PRODUCT-NUMBER POSTCHECK: PASS
```

## Gate state

```text
Build 425  Development Product-number backfill       PASS (20/20)
Build 426  Production release-candidate assembly     PASS (20/20)
Build 427  Production authorization boundary         PASS (20/20)
Build 427  Production Product-number backup          PASS
Build 427  Production Product-number apply           PENDING — prior attempt safely blocked before DML

Production Product-number authorization              RECEIVED
Production mutation                                  NOT YET EXECUTED
Production promotion                                 CLOSED
```
