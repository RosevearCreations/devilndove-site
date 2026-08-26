# Build 435 — Membership Build 395 Complete-Row Value-Mapping Validation

## Status

**SOURCE READY / READ-ONLY COMPLETE-ROW MAPPING + INERT PREVIEW + LOCAL 20/20 GATES / NO MEMBERSHIP BACKUP / NO REBUILD AUTHORIZATION / PRODUCTION PROMOTION CLOSED**

Build 434 proved the Membership table has exactly three legacy rows and the reviewed legacy aliases. Build 435 resolves the only remaining ambiguity before an executable rebuild controller can be designed: both `name` and `display_title` exist in the legacy table, while canonical Build 395 has one `title` column.

## Build 435 safety objective

The boundary passes only if fresh live Production evidence proves all of the following:

```text
Legacy columns exactly match the reviewed eleven-column shape
Membership row count remains exactly 3
Raw code values are exactly bronze/silver/gold
Normalized tier identities remain exactly bronze/silver/gold
name == display_title exactly for every tier
All direct-preservation fields exist
Complete source rows are captured
Complete source-row SHA-256 is recorded
Lossless mapping is possible
```

If any `name` and `display_title` pair differs, Build 435 blocks. It does not choose one field, merge strings, or discard data.

## Canonical lossless mapping candidate

Only after the live equality proof passes:

```text
membership_tier_policy_id -> policy_id
code                      -> tier_code
display_title             -> title
name                      -> title (must be exactly equal to display_title)
short_description         -> short_description
benefits_json             -> benefits_json
badge_color               -> badge_color
sort_order                -> sort_order
is_visible                -> is_visible
created_at                -> created_at
updated_at                -> updated_at
```

No Build 395 seed default may overwrite an existing Production business value during a future rebuild.

## Run sequence

```bash
cd /c/Dev/devilndove-site

git pull origin dev

python -m py_compile \
  scripts/build435_membership_value_mapping_preflight.py \
  scripts/build435_membership_lossless_mapping_preview.py \
  scripts/build435_membership_value_mapping_regression.py \
  scripts/build435_membership_value_mapping_gate.py

python scripts/build435_membership_value_mapping_regression.py

python -u scripts/build435_membership_value_mapping_preflight.py --run \
  2>&1 | tee build435_membership_value_mapping_preflight.txt

python scripts/build435_membership_lossless_mapping_preview.py

python scripts/build435_membership_value_mapping_gate.py
```

Only the preflight contacts Production and it uses read-only SELECT/PRAGMA operations. The preview, regression, and gate are local-only.

## Expected regression

```text
BUILD 435 MEMBERSHIP VALUE-MAPPING SAFETY REGRESSION: PASS (20/20)
Complete legacy-row capture: SOURCE-GATED
name/display_title loss check: SOURCE-GATED
Complete-row SHA-256 boundary: SOURCE-GATED
Executable SQL statements: 0
Cloudflare access: NONE
Membership rebuild authorization inferred: NO
Production mutation executed: NO
PRODUCTION PROMOTION: CLOSED
```

## Expected live evidence

```text
=== BUILD 435 MEMBERSHIP VALUE-MAPPING BOUNDARY ===
Legacy column shape exact: True
Membership rows: 3
Raw tier codes: <live values>
Raw codes exactly bronze/silver/gold: True
Normalized tiers: ['bronze', 'gold', 'silver']
name == display_title for every tier: True
  bronze: name=<live> / display_title=<same live> / equal=True
  silver: name=<live> / display_title=<same live> / equal=True
  gold: name=<live> / display_title=<same live> / equal=True
Direct preservation fields present: True
Complete source-row SHA-256: <64 hex chars>
Lossless canonical mapping possible: True
Safe to prepare Membership execution boundary: True
Production backup created: NO
Membership rebuild authorization received: NO
Production mutation executed: NO
Later rebuild authorization: NOT RECEIVED
PRODUCTION PROMOTION: CLOSED
BUILD 435 MEMBERSHIP VALUE-MAPPING PREFLIGHT: PASS
```

If title equality is false for any tier, stop. Do not create or authorize rebuild SQL.

## Expected inert preview

```text
BUILD 435 MEMBERSHIP LOSSLESS MAPPING PREVIEW: PASS / INERT
Source rows protected: 3
Source-row SHA-256: <same digest>
name/display_title conflict: NONE / EXACT EQUALITY PROVEN
Canonical mapped rows: 3
Executable SQL statements: 0
Cloudflare access: NONE
Production backup created: NO
Membership rebuild authorization received: NO
Production mutation executed: NO
PRODUCTION PROMOTION: CLOSED
```

## Expected final gate

```text
BUILD 435 TWENTY-ITEM MEMBERSHIP LOSSLESS VALUE-MAPPING GATE: PASS (20/20)
Build 434 Membership authorization boundary: COMPLETE / PROVEN
Membership source rows: 3 / COMPLETE-ROW FINGERPRINTED
Raw tier codes: bronze,silver,gold
name/display_title conflict: NONE / EXACT EQUALITY PROVEN
Source-row SHA-256: <same digest>
Membership mapping preview executable statements: 0
Membership Production backup: NOT CREATED
Membership rebuild authorization: NOT RECEIVED
Membership Production mutation executed: NO
Later rebuild-family authorization: NOT RECEIVED
PRODUCTION PROMOTION: CLOSED
```

## What is still forbidden

- no Membership Production backup;
- no Membership shadow table;
- no DDL/DML rebuild SQL;
- no rename/swap/drop;
- no Build 395 seed application to Production;
- no inferred authorization;
- no fractional Inventory, Product/FK, Accounting/default, R2/provider, or CAIP-copy work;
- no Production promotion.

A Membership rebuild execution token will only be prepared after owner-run Build 435 proves the mapping is lossless.
