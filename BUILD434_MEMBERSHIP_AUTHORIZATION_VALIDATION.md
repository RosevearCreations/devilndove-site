# Build 434 — Membership Build 395 Authorization Boundary Validation

## Status

**READY — LIVE READ-ONLY MEMBERSHIP EVIDENCE + INERT REBUILD PREVIEW + LOCAL 20/20 GATES / MEMBERSHIP REBUILD NOT AUTHORIZED / PRODUCTION PROMOTION CLOSED**

Build 433 annotation-index Production work is complete/proven. Build 434 begins the first rebuild-family boundary, but it remains strictly read-only/inert.

## Canonical authority

`database_membership_tier_policy_runtime_parity.sql` (Build 395) defines the canonical Membership policy table with ten columns and the three tier identities `bronze`, `silver`, and `gold`.

Reviewed legacy aliases:

```text
membership_tier_policy_id -> policy_id
code                      -> tier_code
name                      -> title
display_title             -> title
```

## Run now

```bash
cd /c/Dev/devilndove-site

git pull origin dev

python -m py_compile \
  scripts/build434_membership_authorization_preflight.py \
  scripts/build434_membership_rebuild_preview.py \
  scripts/build434_membership_authorization_regression.py \
  scripts/build434_membership_authorization_gate.py

python scripts/build434_membership_authorization_regression.py

python -u scripts/build434_membership_authorization_preflight.py --run \
  2>&1 | tee build434_membership_authorization_preflight.txt

python scripts/build434_membership_rebuild_preview.py

python scripts/build434_membership_authorization_gate.py
```

Only `build434_membership_authorization_preflight.py --run` contacts Cloudflare/D1, and it performs read-only SELECT/PRAGMA queries. The preview, regression, and gate are local-only.

## Expected safety regression

```text
BUILD 434 MEMBERSHIP AUTHORIZATION SAFETY REGRESSION: PASS (20/20)
Completed Product/Gift/Notification/Annotation prerequisites: SOURCE-GATED
Membership rebuild preview executable statements: 0
Membership rebuild authorization inferred: NO
Cloudflare access: NONE
Production mutation executed: NO
Later rebuild authorizations inferred: NO
PRODUCTION PROMOTION: CLOSED
```

## Expected live preflight core

The current reviewed state is expected to remain a three-row legacy shape. The exact printed column list comes from live Production.

```text
=== BUILD 434 MEMBERSHIP BUILD 395 AUTHORIZATION BOUNDARY ===
Production columns: <live legacy columns>
Membership rows: 3
Normalized tiers: ['bronze', 'gold', 'silver']
Exactly bronze/silver/gold: True
Canonical column names exact: False
Legacy alias mapping present: True
Rebuild required: True
Safe to request Membership rebuild authorization: True
Production backup created: NO
Membership rebuild authorization received: NO
Production mutation executed: NO
Later rebuild authorizations: NOT RECEIVED
PRODUCTION PROMOTION: CLOSED
BUILD 434 MEMBERSHIP AUTHORIZATION PREFLIGHT: PASS
```

The normalized tier list is alphabetically sorted by the script, so `bronze`, `gold`, `silver` is expected display order even though the canonical business tiers are Bronze/Silver/Gold.

If Production is already canonical, if row count is not exactly three, if tier identities differ, or if the reviewed aliases are absent, the preflight must report BLOCKED and no rebuild should be authorized.

## Expected inert preview

```text
BUILD 434 MEMBERSHIP REBUILD PREVIEW: PASS / INERT
Membership rows protected: 3
Normalized tiers: ['bronze', 'gold', 'silver']
Legacy aliases: {'membership_tier_policy_id': 'policy_id', 'code': 'tier_code', 'name': 'title', 'display_title': 'title'}
Executable SQL statements: 0
Cloudflare access: NONE
Production backup created: NO
Production mutation executed: NO
PRODUCTION PROMOTION: CLOSED
```

The preview intentionally contains no executable SQL, no backup action, no shadow-table action, and no mutation capability.

## Expected final gate

```text
BUILD 434 TWENTY-ITEM MEMBERSHIP BUILD 395 AUTHORIZATION-BOUNDARY GATE: PASS (20/20)
Product/Gift/Notification/Annotation Production stages: COMPLETE / PROVEN
Membership rows: 3 / bronze,silver,gold
Membership rebuild preview executable statements: 0
Membership Production backup: NOT CREATED
Membership rebuild authorization: NOT RECEIVED
Membership Production mutation executed: NO
Later rebuild-family authorization: NOT RECEIVED
PRODUCTION PROMOTION: CLOSED
NEXT: explicit Membership rebuild Production authorization would be required before any backup/rebuild controller is created or exercised.
```

## Do not run

Do not run Build 395 migration SQL directly against Production. Do not create a Membership backup, shadow table, data copy, rename/swap, drop, or seed operation in this Build 434 boundary.

A future rebuild token is deliberately **not prepared yet**. It should only be created after owner-run Build 434 evidence proves the exact live three-tier legacy state and the inert preview/gate are green.

## Safety state

```text
Product numbers                              COMPLETE / PROVEN
Gift Card                                    COMPLETE / PROVEN
Full Build 403 Notification                  COMPLETE / PROVEN
Build 197 annotation index                   COMPLETE / PROVEN
Membership Build 395 boundary                READY / READ-ONLY / INERT
Membership Production backup                 NOT CREATED
Membership rebuild authorization             NOT RECEIVED
Membership Production mutation               NOT EXECUTED
Fractional rebuild authorization             NOT RECEIVED
Product/FK authorization                     NOT RECEIVED
Accounting/default authorization             NOT RECEIVED
R2/provider mutation                         DISABLED
CAIP D1-only copy                            FORBIDDEN
Production promotion                         CLOSED
```
