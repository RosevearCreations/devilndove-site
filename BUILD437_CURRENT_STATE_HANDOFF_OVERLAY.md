# Build 437 — Current State Handoff Overlay

## Current release

**Build 437 — Membership canonical completion and release alignment**

Membership Build 395 Production work is **COMPLETE / PROVEN**. Builds 434–436 are historical evidence only and must not be reopened or rerun unless a future Membership source change explicitly invalidates the final proof.

## Proven completed Production families

```text
Product numbers                              COMPLETE / PROVEN
Gift Card                                    COMPLETE / PROVEN
Full Build 403 Notification                  COMPLETE / PROVEN
Build 197 annotation index                   COMPLETE / PROVEN
Membership Build 395                         COMPLETE / PROVEN
```

## Membership final evidence

```text
Production database: devilndove-prod
Production database ID: 0dc8fa3e-319c-45f7-a515-34c8acd89fcf
Rows preserved: 3 -> 3
Policy IDs: [1,2,3]
Tiers: bronze,silver,gold
Source SHA-256: 5db4bfd5f948a33432834210fd232a1e4b222dd6400193d65c644b501ba92057
Canonical preview SHA-256: 5d2d8369acd086bfa701de7ec19bd9d67537cd8736cd2c228d42a098ca71e2c8
Canonical columns exact: True
Canonical values preserved: True
Tier UNIQUE constraint: True
AUTOINCREMENT: True
Canonical sort index: ['sort_order','tier_code']
Leftover helper objects: 0
Independent read-only postcheck: PASS
```

Backup:

```text
local_backups\build428_prod_before_membership_20260826T025115Z.sql
Bytes: 19003564
SHA-256: 2f94f5bcd0006f98c4cdfcc2bc6de9441d047a4f97ccc702c735191a90cf5513
```

Successful D1 execution:

```text
Queries executed: 13
Rows read: 14300
Rows written: 550
D1 changes: 9
Final bookmark: 00000d48-00000006-000050d3-dc23940f2dba8f8defefe8c58f115840
Success: true
```

The engine-level write count reflects table/index rebuild work; the Membership business-row boundary remained exactly 3 -> 3.

## Authorization state

```text
AUTHORIZE-BUILD436-PROD-MEMBERSHIP-BUILD395-REBUILD
SPENT / COMPLETE
```

Never reuse this token.

## Runtime state

- Shared Membership reads support both legacy and canonical names for recovery/compatibility.
- Admin Membership writes require the exact canonical schema and perform no request-time DDL.
- Member tier-policy reads use the shared Membership service.
- Platform DB sanity expects canonical `policy_id` and exposes Membership indexes.
- The stale root `member/tier-policies.js` duplicate is removed.
- The canonical sort index is `idx_membership_tier_policies_sort(sort_order,tier_code)`.

## Still locked / separate future scopes

```text
Fractional Inventory/Creative Project rebuilds   NOT AUTHORIZED
Product/FK rebuilds                              NOT AUTHORIZED
Accounting/default/nullability rebuilds          NOT AUTHORIZED
R2/provider mutation                             DISABLED
CAIP D1-only copy                                FORBIDDEN
Broad Production promotion                       CLOSED
```

## Working rule going forward

Do not continue Membership micro-gates. Resume normal Devil n Dove feature/application work, or open another parity family only as a separately scoped read-only/authorization process when the owner chooses to do so.
