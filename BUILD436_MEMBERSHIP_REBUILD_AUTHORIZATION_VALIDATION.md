# Build 436 — Membership Build 395 Rebuild Authorization Validation

## Status

**SOURCE READY / READ-ONLY EXECUTION PREFLIGHT + LOCAL REBUILD SIMULATION + LOCAL 20/20 GATE / MEMBERSHIP REBUILD NOT AUTHORIZED / PRODUCTION PROMOTION CLOSED**

Build 435 proved the complete three-row legacy-to-canonical mapping is lossless. Build 436 adds the final dependency and execution-safety boundary before any Membership rebuild authorization can be accepted.

## What Build 436 proves before authorization

The live read-only preflight must prove:

```text
Fresh Build 435 lossless mapping: PASS
Membership rows: 3
Source-row SHA-256: <64 hex>
Canonical-preview SHA-256: <64 hex>
Policy IDs: positive / unique / complete
Canonical mapped values: all non-null
Canonical tiers: exactly bronze/silver/gold
User-defined Membership indexes/triggers: 0
Outbound Membership foreign keys: 0
Inbound Membership foreign keys: 0
Rebuild-name collisions: 0
Legacy sqlite_sequence: compatible
Safe to request Membership rebuild authorization: True
```

The local regression also executes the generated rebuild SQL against an in-memory legacy Membership table and requires exact preservation of all three IDs and every mapped business value.

## Prepared exact token

The future guarded controller accepts only:

```text
AUTHORIZE-BUILD436-PROD-MEMBERSHIP-BUILD395-REBUILD
```

Do **not** send that token until this owner-run Build 436 boundary is green. Source creation does not authorize it.

## Owner-run validation now

```bash
cd /c/Dev/devilndove-site

git pull origin dev

echo "============================================================"
echo "BUILD 436 MEMBERSHIP REBUILD SOURCE CHECK"
echo "============================================================"
python -m py_compile \
  scripts/build436_membership_rebuild_authorization_preflight.py \
  scripts/build436_production_membership_rebuild.py \
  scripts/build436_membership_rebuild_regression.py \
  scripts/build436_membership_rebuild_authorization_gate.py

echo
echo "============================================================"
echo "BUILD 436 MEMBERSHIP REBUILD SAFETY REGRESSION"
echo "============================================================"
python scripts/build436_membership_rebuild_regression.py

echo
echo "============================================================"
echo "BUILD 436 LIVE READ-ONLY MEMBERSHIP REBUILD PREFLIGHT"
echo "============================================================"
python -u scripts/build436_membership_rebuild_authorization_preflight.py --run \
  2>&1 | tee build436_membership_rebuild_authorization_preflight.txt

echo
echo "============================================================"
echo "BUILD 436 20-ITEM MEMBERSHIP REBUILD AUTHORIZATION GATE"
echo "============================================================"
python scripts/build436_membership_rebuild_authorization_gate.py
```

Only the preflight contacts Production and it is read-only. The regression and gate are local-only. Do not run `--backup` or `--apply` yet.

## Expected regression

```text
BUILD 436 MEMBERSHIP REBUILD SAFETY REGRESSION: PASS (20/20)
In-memory legacy -> canonical shadow rebuild: PASS
Complete three-row value preservation: PASS
Membership Production authorization inferred: NO
Cloudflare access: NONE
Production mutation executed: NO
Later rebuild authorization inferred: NO
PRODUCTION PROMOTION: CLOSED
```

## Expected live preflight core

```text
=== BUILD 436 MEMBERSHIP REBUILD AUTHORIZATION BOUNDARY ===
Membership rows: 3
Source-row SHA-256: <64 hex>
Canonical-preview SHA-256: <64 hex>
Policy IDs valid/unique/positive: True / <three ids>
Canonical required values non-null: True
Canonical tiers exact: True
User-defined Membership indexes/triggers: 0
Outbound Membership foreign keys: 0
Inbound Membership foreign keys: 0
Rebuild-name collisions: 0
Legacy sqlite_sequence: <live> / compatible=True
Safe to request Membership rebuild authorization: True
Production backup created: NO
Membership rebuild authorization received: NO
Production mutation executed: NO
Later rebuild authorization: NOT RECEIVED
PRODUCTION PROMOTION: CLOSED
BUILD 436 MEMBERSHIP REBUILD AUTHORIZATION PREFLIGHT: PASS
```

Any nonzero dependency/collision count blocks the rebuild boundary. Do not override it manually.

## Expected final gate

```text
BUILD 436 TWENTY-ITEM MEMBERSHIP BUILD 395 REBUILD AUTHORIZATION GATE: PASS (20/20)
Build 435 lossless mapping: COMPLETE / PROVEN
Membership source rows: 3 / fingerprinted
Source-row SHA-256: <same live digest>
Canonical-preview SHA-256: <same live digest from preflight>
Unhandled indexes/triggers/FKs/collisions: NONE
Membership Production backup: NOT CREATED
Membership rebuild authorization: NOT RECEIVED
Membership Production mutation executed: NO
Later rebuild-family authorization: NOT RECEIVED
PRODUCTION PROMOTION: CLOSED
```

## Prepared rebuild mechanics, still locked

After a future exact authorization, `scripts/build436_production_membership_rebuild.py` will:

1. rerun the full live Build 436 preflight;
2. create a fresh full Production D1 export;
3. verify backup bytes/SHA/UUID/age;
4. rerun the full preflight and require identical source/canonical fingerprints;
5. execute one D1 SQL file containing canonical shadow creation, exact source copy, in-batch assertions, legacy drop, and shadow rename;
6. prove exact canonical row values, schema, UNIQUE constraint, AUTOINCREMENT, sequence, and helper cleanup;
7. run a separate read-only postcheck.

Cloudflare documents that failed remote `d1 execute --file` execution returns the database to its original state. The rebuild SQL therefore deliberately omits explicit `BEGIN`/`COMMIT`, consistent with D1 import guidance that embedded transaction statements can produce a nested-transaction error.

## Still forbidden

- Membership backup before exact authorization;
- Membership Production DDL/DML before exact authorization;
- manual Build 395 migration execution in the D1 console;
- Build 395 seed overwrite of current values;
- fractional Inventory, Product/FK, Accounting/default rebuild authorization;
- R2/provider mutation;
- CAIP D1-only copy;
- Production promotion.
