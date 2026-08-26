# Build 437

## Membership canonical completion and release alignment

## Summary

- Completes and proves the Membership Build 395 legacy-to-canonical Production transition.
- Preserves the three existing bronze/silver/gold rows, policy IDs, complete business values, AUTOINCREMENT sequence, UNIQUE tier constraint, and reviewed sort-index semantics.
- Translates idx_membership_tier_policies_sort from legacy (sort_order, code) to canonical (sort_order, tier_code) and independently verifies the resulting index columns.
- Keeps shared Membership reads compatibility-safe while canonical Production writes now target the proven ten-column schema.
- Routes member tier-policy reads through the shared non-mutating service, aligns platform DB sanity with canonical policy_id, and removes the stale root duplicate member/tier-policies.js.
- Records the successful full Production backup, guarded 13-query rebuild, immediate postcheck, and independent read-only postcheck.
- Closes Membership micro-gates; all other rebuild families and broad Production promotion remain separately locked.

## Production completion evidence

- Database: `devilndove-prod`
- Database ID: `0dc8fa3e-319c-45f7-a515-34c8acd89fcf`
- Backup: `local_backups\build428_prod_before_membership_20260826T025115Z.sql`
- Backup bytes: `19003564`
- Backup SHA-256: `2f94f5bcd0006f98c4cdfcc2bc6de9441d047a4f97ccc702c735191a90cf5513`
- Rows: `3 -> 3`
- Queries executed: `13`
- Final bookmark: `00000d48-00000006-000050d3-dc23940f2dba8f8defefe8c58f115840`
- Canonical values preserved: `True`
- Canonical sort index columns: `["sort_order", "tier_code"]`
- Independent read-only postcheck: `PASS`

## Release package manifest

- Static manifest: `data/site/release-package-manifest.json`
- Manifest build label: `Build 437`
- Manifest source scope: `git_tracked_release_files`
- Generation order: regenerate `RELEASE_NOTES.md` first, then regenerate the manifest so the manifest hashes the final notes.

## Changed files

- `database_membership_tier_policy_runtime_parity.sql`
- `functions/api/_lib/membershipTierPolicyReadService.js`
- `functions/api/admin/tier-policies.js`
- `functions/api/member/tier-policies.js`
- `functions/api/_lib/platformDbSanityReadService.js`
- `member/tier-policies.js (removed)`
- `scripts/build436_membership_rebuild_authorization_preflight.py`
- `scripts/build436_production_membership_rebuild.py`
- `scripts/build437_production_membership_rebuild.py`
- `scripts/build436_membership_rebuild_regression.py`
- `scripts/build436_membership_rebuild_authorization_gate.py`
- `scripts/generate_release_manifest.py`
- `scripts/generate_release_notes.py`
- `scripts/build437_membership_release_regression.py`
- `BUILD437_MEMBERSHIP_COMPLETION_RELEASE.md`

## D1 migration summary

- Production Membership Build 395 rebuild is complete/proven through the guarded Build 436/437 controller; do not rerun the canonical migration or spent token.
- The three live policy rows were copied losslessly to the canonical table and idx_membership_tier_policies_sort was recreated on (sort_order, tier_code).

## Required post-deploy actions

- Do not rerun Membership backup/apply/postcheck unless a future Membership source change explicitly invalidates the proof.
- Retain the successful local backup and generated Build 437 release evidence.
- Resume non-Membership application work or open a separately authorized parity family when desired.
- Keep broad Production promotion closed until the remaining release/parity gates are complete.

## Validation

- Build 437 consolidated Membership release regression passed 20/20.
- Build 436 Membership rebuild safety regression passed 20/20.
- Fresh Build 436/437 Production authorization preflight passed with no unhandled indexes/triggers/FKs/collisions.
- Production Membership rebuild postcheck passed with 3 -> 3 rows and exact canonical value fingerprint preservation.
- Independent read-only Production postcheck passed and proved canonical sort-index columns [sort_order, tier_code].
- Production promotion remains closed.
