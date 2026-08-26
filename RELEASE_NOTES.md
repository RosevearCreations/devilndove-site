# Build 437

## Membership canonical completion and release alignment

## Summary

- Completes the Membership Build 395 legacy-to-canonical transition as one guarded release package.
- Preserves the three existing bronze/silver/gold rows, policy IDs, complete business values, AUTOINCREMENT sequence, UNIQUE tier constraint, and the reviewed sort index.
- Translates idx_membership_tier_policies_sort from legacy (sort_order, code) to canonical (sort_order, tier_code).
- Keeps Membership reads compatible before the Production swap while locking writes until the exact canonical schema is active.
- Routes member tier-policy reads through the shared non-mutating compatibility service, aligns platform DB sanity with canonical policy_id, and removes the unreferenced root duplicate member/tier-policies.js.
- Records explicit Membership-only Production rebuild authorization; execution remains guarded and Production promotion remains closed.
- Repairs the Build 418 SQL-guard compatibility issue for sort-index metadata reads in both pre-write and post-write validation without widening mutation scope.

## Release package manifest

- Static manifest: `data/site/release-package-manifest.json`
- Manifest build label: `Build 246`
- Regenerate the manifest after source/release-note changes so hashes are current.

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

- Production Membership is not upgraded by running database_membership_tier_policy_runtime_parity.sql directly. Use only the guarded Build 436/437 Membership rebuild controller with the exact authorized token.
- The guarded rebuild creates the canonical Build 395 table, copies all three existing rows losslessly, recreates idx_membership_tier_policies_sort on (sort_order, tier_code), and validates the result.

## Required post-deploy actions

- Run the single Build 437 guarded Membership backup -> apply -> independent read-only postcheck chain using scripts/build437_production_membership_rebuild.py and the exact authorized token.
- Regenerate RELEASE_NOTES.md and data/site/release-package-manifest.json only after the Membership postcheck passes.
- Mark the Membership authorization token spent/complete after successful execution.
- Keep Production promotion closed until the broader parity/release gates are complete.

## Validation

- Build 435 complete-row source SHA-256 remains 5db4bfd5f948a33432834210fd232a1e4b222dd6400193d65c644b501ba92057 before the authorized rebuild.
- Canonical preview SHA-256 remains 5d2d8369acd086bfa701de7ec19bd9d67537cd8736cd2c228d42a098ca71e2c8 before the authorized rebuild.
- The prior authorized attempts stopped before backup or DDL because direct PRAGMA index_info was rejected by the Build 418 SQL guard; no Production mutation occurred.
- Build 437 release regression, fresh read-only preflight, and authorization gate must pass before the Membership Production backup/write sequence can advance.
