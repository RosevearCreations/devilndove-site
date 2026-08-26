# Build 436 Membership Rebuild Validation — Superseded by Build 437

Build 436 established the guarded Membership rebuild mechanics and discovered two important Production facts:

1. D1 inbound-FK discovery must use fixed-table `PRAGMA foreign_key_list(...)` calls rather than a dynamic table-valued PRAGMA join.
2. Production has one intentional Membership user object: `idx_membership_tier_policies_sort(sort_order, code)`.

Both findings are now incorporated into the consolidated current authority:

`BUILD437_MEMBERSHIP_COMPLETION_RELEASE.md`

Build 437 preserves that index as `idx_membership_tier_policies_sort(sort_order, tier_code)`, aligns runtime reads/writes and DB sanity with the canonical Build 395 schema, and owns the single final Membership execution sequence.

Historical Build 436 owner-run evidence remains valid:

```text
Membership rows: 3
Policy IDs: 1,2,3
Source-row SHA-256: 5db4bfd5f948a33432834210fd232a1e4b222dd6400193d65c644b501ba92057
Canonical-preview SHA-256: 5d2d8369acd086bfa701de7ec19bd9d67537cd8736cd2c228d42a098ca71e2c8
Outbound FKs: 0
Inbound FKs: 0
Rebuild-name collisions: 0
sqlite_sequence: 3 / compatible
Legacy sort index: idx_membership_tier_policies_sort(sort_order, code)
Membership Production backup: NOT CREATED
Membership Production mutation: NOT EXECUTED
Production promotion: CLOSED
```

Do not use this historical file as the current execution guide. Use Build 437.
