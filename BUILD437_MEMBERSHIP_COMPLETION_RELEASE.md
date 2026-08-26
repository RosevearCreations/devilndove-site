# Build 437 — Membership Completion Release

## Status

**SOURCE/RUNTIME/REBUILD PACKAGE COMPLETE / PRODUCTION MEMBERSHIP REBUILD AUTHORIZATION NOT RECEIVED / ONE FINAL GUARDED EXECUTION REMAINS / PRODUCTION PROMOTION CLOSED**

Build 437 supersedes the fragmented Membership working notes from Builds 434–436 as the current Membership completion authority. Those earlier artifacts remain historical evidence only.

## What is complete in source

1. Build 395 canonical ten-column Membership schema is retained.
2. Canonical `idx_membership_tier_policies_sort(sort_order, tier_code)` is now part of Membership schema authority.
3. The reviewed Production legacy sort index `(sort_order, code)` is classified as handled, not unknown drift.
4. The guarded rebuild recreates the same index name on canonical columns.
5. Rebuild postchecks require the exact canonical sort-index column order.
6. Build 435 source rows remain fully fingerprinted and losslessly mapped.
7. Shared Membership reads recognize legacy `membership_tier_policy_id` and canonical `policy_id`.
8. Shared Membership reads recognize legacy `display_title`/`name` and canonical `title`.
9. Admin Membership writes are fail-closed until the exact canonical schema is active.
10. Member tier-policy reads use the shared compatibility service instead of canonical-only SQL.
11. Platform DB Sanity now expects canonical `policy_id`.
12. Platform DB Sanity includes Membership in index visibility.
13. Build 436 D1-compatible fixed-table FK discovery remains enforced.
14. Build 436 rebuild simulation now includes the real legacy sort index and proves canonical preservation.
15. Build 436 authorization gate accepts only that reviewed sort index and still blocks every other unknown user object.
16. Build 437 adds one consolidated 20-check Membership release regression.
17. `data/site/current-release.json` is the current Build 437 release descriptor.
18. Release-note generation now reads the current release descriptor while preserving historical release data separately.
19. Release manifest generation now labels the tree as Build 437.
20. Every later rebuild family and Production promotion remains separately locked.

## Proven Production legacy boundary

Owner-run read-only evidence established:

```text
Membership rows: 3
Raw tier codes: bronze,silver,gold
Policy IDs: [1,2,3]
name == display_title: True for every tier
Source-row SHA-256: 5db4bfd5f948a33432834210fd232a1e4b222dd6400193d65c644b501ba92057
Canonical-preview SHA-256: 5d2d8369acd086bfa701de7ec19bd9d67537cd8736cd2c228d42a098ca71e2c8
Outbound foreign keys: 0
Inbound foreign keys: 0
Rebuild-name collisions: 0
sqlite_sequence: 3 / compatible
Legacy user object count: 1
Legacy user object: idx_membership_tier_policies_sort
Legacy index columns: sort_order, code
```

No Membership backup has been created and no Membership Production mutation has occurred.

## Exact final Production scope

The final authorized Membership rebuild may only transform:

```text
membership_tier_policy_id -> policy_id
code                      -> tier_code
name/display_title         -> title (exact equality already proven)
short_description         -> short_description
benefits_json             -> benefits_json
badge_color               -> badge_color
sort_order                -> sort_order
is_visible                -> is_visible
created_at                -> created_at
updated_at                -> updated_at
```

and recreate:

```sql
CREATE INDEX idx_membership_tier_policies_sort
  ON membership_tier_policies(sort_order ASC, tier_code ASC);
```

No Build 395 seed value may overwrite an existing Production business value.

## Exact authorization token

Only this literal token authorizes the Membership Production rebuild:

```text
AUTHORIZE-BUILD436-PROD-MEMBERSHIP-BUILD395-REBUILD
```

Do not infer it from continuation language or from the owner's request to finish Membership source work.

## One final owner-run sequence after explicit authorization

After the exact token is supplied, use one guarded command chain only:

```bash
cd /c/Dev/devilndove-site

git pull origin dev

set -o pipefail

python -m py_compile \
  scripts/build435_membership_value_mapping_preflight.py \
  scripts/build436_membership_rebuild_authorization_preflight.py \
  scripts/build436_production_membership_rebuild.py \
  scripts/build436_membership_rebuild_regression.py \
  scripts/build436_membership_rebuild_authorization_gate.py \
  scripts/build437_membership_release_regression.py \
  scripts/generate_release_notes.py \
  scripts/generate_release_manifest.py \
&& python scripts/build437_membership_release_regression.py \
&& python scripts/build436_membership_rebuild_regression.py \
&& python -u scripts/build436_membership_rebuild_authorization_preflight.py --run \
  2>&1 | tee build437_membership_final_preflight.txt \
&& python scripts/build436_membership_rebuild_authorization_gate.py \
&& python -u scripts/build436_production_membership_rebuild.py \
  --backup \
  --confirm AUTHORIZE-BUILD436-PROD-MEMBERSHIP-BUILD395-REBUILD \
  2>&1 | tee build437_membership_backup.txt \
&& python -u scripts/build436_production_membership_rebuild.py \
  --apply \
  --confirm AUTHORIZE-BUILD436-PROD-MEMBERSHIP-BUILD395-REBUILD \
  2>&1 | tee build437_membership_apply.txt \
&& python -u scripts/build436_production_membership_rebuild.py \
  --postcheck \
  2>&1 | tee build437_membership_postcheck.txt \
&& python scripts/generate_release_notes.py \
&& python scripts/generate_release_manifest.py
```

The `&&` chain prevents advancement after any failed stage. Do not use `set -e`.

## Required successful ending

```text
BUILD 437 CONSOLIDATED MEMBERSHIP RELEASE REGRESSION: PASS (20/20)
BUILD 436 MEMBERSHIP REBUILD SAFETY REGRESSION: PASS (20/20)
BUILD 436 MEMBERSHIP REBUILD AUTHORIZATION PREFLIGHT: PASS
BUILD 436/437 TWENTY-ITEM MEMBERSHIP BUILD 395 REBUILD AUTHORIZATION GATE: PASS (20/20)
BUILD 436/437 MEMBERSHIP BACKUP/FINGERPRINT BOUNDARY: PASS
BUILD 436/437 PRODUCTION MEMBERSHIP BUILD 395 REBUILD POSTCHECK: PASS
BUILD 436/437 PRODUCTION MEMBERSHIP BUILD 395 READ-ONLY POSTCHECK: PASS
Canonical sort index present: True / ['sort_order', 'tier_code']
Membership rows: 3
Canonical values fingerprint preserved: True
PRODUCTION PROMOTION: CLOSED
```

If any command fails, stop at that command. If Cloudflare returns an authorization error before DDL, treat it as a safe access interruption. If an error occurs after DDL may have started, do not rerun `--apply`; run only the read-only `--postcheck` and retain the completed backup.

## Release state after successful final execution

After the successful final sequence, Membership is considered **COMPLETE / PROVEN** and the Membership-specific authorization token is spent. The next work may move to another feature or family without continuing Membership micro-gates.

The following remain explicitly outside Membership authorization:

```text
Fractional Inventory/Creative Project rebuilds   NOT AUTHORIZED
Product/FK rebuilds                              NOT AUTHORIZED
Accounting/default/nullability rebuilds          NOT AUTHORIZED
R2/provider mutation                             DISABLED
CAIP D1-only copy                                FORBIDDEN
Production promotion                             CLOSED
```
