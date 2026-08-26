# Build 436 — Membership Build 395 Rebuild Authorization Validation

## Status

**OWNER RUN SAFELY STOPPED ON D1 SQLITE_AUTH 7500 / FK DISCOVERY REPAIRED IN SOURCE / RERUN REQUIRED / MEMBERSHIP REBUILD NOT AUTHORIZED / PRODUCTION PROMOTION CLOSED**

Build 435 proved the complete three-row legacy-to-canonical mapping is lossless. Build 436 adds the final dependency and execution-safety boundary before any Membership rebuild authorization can be accepted.

## Owner-run safe stop and repair

The first owner-run Build 436 validation passed the local 20/20 rebuild regression and reran the complete Build 435 lossless mapping successfully. The live Build 436 preflight then stopped on the inbound-FK discovery query with:

```text
not authorized: SQLITE_AUTH [code: 7500]
BUILD 418 LIVE SEMANTIC CLASSIFICATION: FAIL — BUILD 436 PRODUCTION MEMBERSHIP INBOUND FKS failed with exit code 1.
```

No Membership backup was created and no Production mutation was attempted. The subsequent 14 gate failures were expected downstream missing-artifact failures because the Build 436 preflight artifact was never written.

The blocked query dynamically joined `sqlite_schema` to `pragma_foreign_key_list(m.name)` across every table. Build 436 now uses a D1-compatible two-step read-only method instead:

1. query `sqlite_schema` for the small set of CREATE TABLE definitions that mention `membership_tier_policies`;
2. run the documented fixed-table `PRAGMA foreign_key_list("TABLE_NAME")` only for those candidates;
3. treat the PRAGMA result, not the text search, as authoritative inbound-FK evidence.

The outbound FK check also uses the documented fixed-table PRAGMA form. The 20-check local regression now explicitly refuses the old dynamic `JOIN pragma_foreign_key_list(...)` pattern.

This repair does not weaken the boundary: any actual inbound or outbound Membership foreign key still blocks authorization.

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

Do **not** send that token until the repaired owner-run Build 436 boundary is green. Source creation does not authorize it.

## Owner-run validation now

```bash
cd /c/Dev/devilndove-site

git pull origin dev

echo "============================================================"
echo "BUILD 436 REPAIRED MEMBERSHIP REBUILD SOURCE CHECK"
echo "============================================================"
python -m py_compile \
  scripts/build436_membership_rebuild_authorization_preflight.py \
  scripts/build436_production_membership_rebuild.py \
  scripts/build436_membership_rebuild_regression.py \
  scripts/build436_membership_rebuild_authorization_gate.py

echo
echo "============================================================"
echo "BUILD 436 REPAIRED MEMBERSHIP REBUILD SAFETY REGRESSION"
echo "============================================================"
python scripts/build436_membership_rebuild_regression.py

echo
echo "============================================================"
echo "BUILD 436 REPAIRED LIVE READ-ONLY MEMBERSHIP PREFLIGHT"
echo "============================================================"
python -u scripts/build436_membership_rebuild_authorization_preflight.py --run \
  2>&1 | tee build436_membership_rebuild_authorization_preflight.txt

echo
echo "============================================================"
echo "BUILD 436 REPAIRED 20-ITEM MEMBERSHIP AUTHORIZATION GATE"
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
Inbound FK candidate tables: <count> / <names>
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

Candidate-table count may be nonzero. That does not itself block the boundary; only an actual PRAGMA-confirmed inbound FK blocks it.

Any actual dependency/collision count above zero blocks the rebuild boundary. Do not override it manually.

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

## Still forbidden

- Membership backup before exact authorization;
- Membership Production DDL/DML before exact authorization;
- manual Build 395 migration execution in the D1 console;
- Build 395 seed overwrite of current values;
- fractional Inventory, Product/FK, Accounting/default rebuild authorization;
- R2/provider mutation;
- CAIP D1-only copy;
- Production promotion.
