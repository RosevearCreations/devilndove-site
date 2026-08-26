# Build 437

## Membership canonical completion and release alignment

## Summary

- Completes the Membership Build 395 legacy-to-canonical transition as one guarded release package.
- Preserves the three existing `bronze` / `silver` / `gold` rows, policy IDs, complete business values, `AUTOINCREMENT` sequence, UNIQUE tier constraint, and the reviewed Membership sort index.
- Translates `idx_membership_tier_policies_sort` from legacy `(sort_order, code)` to canonical `(sort_order, tier_code)`.
- Keeps Membership reads compatible with the reviewed legacy table until the guarded Production swap is complete.
- Locks admin Membership writes until the exact canonical ten-column schema is active, rather than allowing canonical SQL to fail against the legacy table.
- Routes member tier-policy reads through the shared non-mutating compatibility service.
- Aligns Platform DB Sanity with canonical `membership_tier_policies.policy_id` and includes Membership index visibility.
- Advances the release manifest generator and current release descriptor to Build 437.
- Keeps fractional Inventory, Product/FK, Accounting/default, R2/provider, CAIP-copy, and Production promotion separately locked.

## Canonical Membership authority

`database_membership_tier_policy_runtime_parity.sql` remains the fresh-install/canonical authority. The canonical table is:

```text
policy_id
tier_code
title
short_description
benefits_json
badge_color
sort_order
is_visible
created_at
updated_at
```

The canonical performance index is:

```sql
CREATE INDEX IF NOT EXISTS idx_membership_tier_policies_sort
  ON membership_tier_policies(sort_order ASC, tier_code ASC);
```

Do **not** run this authority directly against the existing legacy Production table. Production uses only the guarded Build 436/437 shadow-table rebuild controller after exact authorization.

## Proven Production source boundary before rebuild

```text
Membership rows: 3
Raw tiers: bronze,silver,gold
Policy IDs: 1,2,3
name == display_title: TRUE for all three tiers
Source-row SHA-256: 5db4bfd5f948a33432834210fd232a1e4b222dd6400193d65c644b501ba92057
Canonical-preview SHA-256: 5d2d8369acd086bfa701de7ec19bd9d67537cd8736cd2c228d42a098ca71e2c8
Outbound Membership FKs: 0
Inbound Membership FKs: 0
Rebuild-name collisions: 0
Legacy sqlite_sequence: 3 / compatible
Legacy sort index: idx_membership_tier_policies_sort(sort_order, code)
```

## Required Production execution boundary

The only prepared Membership Production authorization token is:

```text
AUTHORIZE-BUILD436-PROD-MEMBERSHIP-BUILD395-REBUILD
```

Source preparation does not authorize it. After explicit authorization, only `scripts/build436_production_membership_rebuild.py` may create the Membership backup or execute the rebuild.

The guarded controller must:

1. rerun the full live lossless/dependency preflight;
2. prove the reviewed legacy sort index is the only user object;
3. create and verify a fresh full Production D1 backup;
4. require identical source/canonical fingerprints after backup;
5. create the exact canonical shadow table;
6. copy all three rows through explicit mappings;
7. run in-batch row/tier/title/value assertions;
8. drop the legacy table and rename the validated shadow;
9. recreate `idx_membership_tier_policies_sort` on `(sort_order, tier_code)`;
10. independently verify schema, values, UNIQUE, AUTOINCREMENT, index columns, sequence, and helper cleanup.

## Release validation

Run `scripts/build437_membership_release_regression.py` before any Membership Production backup/write. It is local-only and validates the entire Membership release surface in one 20-check gate.

The Build 436 rebuild simulation remains local-only and must also pass 20/20.

## Release package manifest

- Mutable release truth: `data/site/current-release.json` — Build 437.
- Manifest generator: `scripts/generate_release_manifest.py` — Build 437.
- Release-note generator: `scripts/generate_release_notes.py` — reads `data/site/current-release.json`.
- `data/site/release-package-manifest.json` must be regenerated from the checked-out Build 437 source before packaging/deployment so its file hashes reflect the actual release tree.
- Historical release-note data remains preserved in `data/site/release-notes.json` and archived build-history documents.

## Current lock state

```text
Membership source/runtime completion              PREPARED
Membership Production rebuild authorization       NOT RECEIVED
Membership Production backup                      NOT CREATED
Membership Production mutation                    NOT EXECUTED
Fractional Inventory authorization                 NOT RECEIVED
Product/FK authorization                          NOT RECEIVED
Accounting/default authorization                  NOT RECEIVED
R2/provider mutation                              DISABLED
CAIP D1-only copy                                 FORBIDDEN
Production promotion                              CLOSED
```
