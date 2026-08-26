# Build 437 — Membership Completion Release

## Status

**MEMBERSHIP BUILD 395 PRODUCTION REBUILD COMPLETE / PROVEN / AUTHORIZATION TOKEN SPENT / RELEASE METADATA REGENERATED LOCALLY / PRODUCTION PROMOTION CLOSED**

Build 437 is the final Membership completion authority. Builds 434–436 remain historical evidence only and must not be treated as current execution instructions.

## Final proven Production result

The owner-run final Build 437 sequence completed successfully against:

```text
Production database: devilndove-prod
Production database ID: 0dc8fa3e-319c-45f7-a515-34c8acd89fcf
Membership rows before: 3
Membership rows after: 3
Raw/canonical tiers: bronze,silver,gold
Policy IDs protected: [1,2,3]
Source-row SHA-256: 5db4bfd5f948a33432834210fd232a1e4b222dd6400193d65c644b501ba92057
Canonical-preview SHA-256: 5d2d8369acd086bfa701de7ec19bd9d67537cd8736cd2c228d42a098ca71e2c8
Canonical columns exact: True
Canonical tier identities exact: True
Canonical values fingerprint preserved: True
Tier UNIQUE constraint present: True
AUTOINCREMENT present: True
Canonical sort index present: True
Canonical sort-index columns: sort_order,tier_code
Leftover rebuild helper objects: 0
Independent read-only postcheck: PASS
Production promotion: CLOSED
```

## Final Production backup

The successful authorized stage created a fresh full Production D1 export before the rebuild:

```text
Backup: local_backups\build428_prod_before_membership_20260826T025115Z.sql
Bytes: 19003564
SHA-256: 2f94f5bcd0006f98c4cdfcc2bc6de9441d047a4f97ccc702c735191a90cf5513
Backup age at verification: 31–32 seconds
Production mutation executed during backup: NO
```

Retain this backup as the Membership pre-rebuild recovery point.

## Final Production write evidence

The guarded D1 file execution completed successfully:

```text
Wrangler: 4.126.0
Queries processed: 13
Queries executed: 13
Rows read: 14300
Rows written: 550
D1 reported changes: 9
Database size after: 20.53 MB / 20525056 bytes
Final bookmark: 00000d48-00000006-000050d3-dc23940f2dba8f8defefe8c58f115840
Attempts: 1
Success: true
```

The high D1 rows-written number is engine-level rebuild work for the guarded table/index replacement; the application-level Membership boundary remained exactly three preserved policy rows.

## Canonical Membership contract now active in Production

The active `membership_tier_policies` table is the canonical ten-column Build 395 shape:

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

The legacy mappings were applied losslessly:

```text
membership_tier_policy_id -> policy_id
code                      -> tier_code
name/display_title         -> title
short_description          -> short_description
benefits_json              -> benefits_json
badge_color                -> badge_color
sort_order                 -> sort_order
is_visible                 -> is_visible
created_at                 -> created_at
updated_at                 -> updated_at
```

`name == display_title` had already been proven for all three live tiers before the write, so the canonical `title` mapping discarded no distinct value.

## Canonical index contract

The reviewed legacy index:

```sql
CREATE INDEX idx_membership_tier_policies_sort
  ON membership_tier_policies(sort_order ASC, code ASC);
```

was intentionally translated and preserved as:

```sql
CREATE INDEX idx_membership_tier_policies_sort
  ON membership_tier_policies(sort_order ASC, tier_code ASC);
```

The post-write verifier and independent read-only postcheck both proved exact column order:

```text
['sort_order', 'tier_code']
```

## Runtime/source completion

Build 437 also completed the Membership runtime and release surface:

1. Canonical Build 395 Membership schema remains the focused authority.
2. The canonical sort index is part of that authority.
3. Shared Membership reads support legacy and canonical field names during transition/recovery.
4. Admin Membership writes fail closed unless the canonical schema is active.
5. Member tier-policy reads use the shared compatibility service.
6. Platform DB sanity expects canonical `policy_id` and exposes Membership indexes.
7. The stale root duplicate `member/tier-policies.js` is retired.
8. Build 418-compatible metadata reads are used in both pre-write and post-write verification.
9. The local rebuild regression simulates the real legacy index and proves its canonical preservation.
10. Release-note and release-manifest generators label the current release Build 437.

## Authorization disposition

The exact token:

```text
AUTHORIZE-BUILD436-PROD-MEMBERSHIP-BUILD395-REBUILD
```

is now **SPENT / COMPLETE**.

It must never be reused for Membership or interpreted as authorization for any other Production mutation.

## Release metadata

The successful owner-run chain regenerated locally:

```text
RELEASE_NOTES.md                        Build 437
data/site/release-package-manifest.json Build 437
Manifest file count: 2062
Manifest total size: 407707002 bytes
```

Those generated local files should be retained with the successful release evidence. They are not a new Production mutation boundary.

## Membership closure

Membership is now:

```text
Schema authority                         COMPLETE
Legacy-to-canonical mapping              COMPLETE / PROVEN
Production backup                        COMPLETE / VERIFIED
Production rebuild                       COMPLETE / PROVEN
Three policy rows                        PRESERVED 3 -> 3
Canonical values                         PRESERVED
UNIQUE tier constraint                   PRESENT
AUTOINCREMENT                            PRESENT
Sort index                               PRESENT / canonical columns
Independent read-only postcheck          PASS
Membership authorization token           SPENT / COMPLETE
Membership micro-gates                   CLOSED
```

No further Membership-specific parity/rebuild work is required unless a future source change explicitly invalidates this proof.

## Work still outside Build 437

Build 437 does **not** authorize or complete:

```text
Fractional Inventory/Creative Project rebuilds   NOT AUTHORIZED
Product/FK rebuilds                              NOT AUTHORIZED
Accounting/default/nullability rebuilds          NOT AUTHORIZED
R2/provider mutation                             DISABLED
CAIP D1-only copy                                FORBIDDEN
Broad Production promotion                       CLOSED
```

Those are separate future scopes. Devil n Dove feature/application work may now proceed without continuing Membership micro-gates.
