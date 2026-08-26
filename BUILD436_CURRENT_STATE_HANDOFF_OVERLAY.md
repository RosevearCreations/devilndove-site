# Build 436 — Current Parity Handoff Overlay

## Current state

```text
Product numbers                                      COMPLETE / PROVEN
Gift Card Build 384                                  COMPLETE / PROVEN
Full Notification Build 403                          COMPLETE / PROVEN
Build 197 annotation index                           COMPLETE / PROVEN
Membership Build 434 authorization boundary          PASS (20/20)
Membership Build 435 lossless mapping boundary       PASS (20/20)
Membership Build 436 rebuild source                  PREPARED / D1 FK DISCOVERY REPAIRED / RERUN PENDING
Membership Production backup                         NOT CREATED
Membership Production mutation                       NOT EXECUTED
Fractional rebuild authorization                     NOT RECEIVED
Product/FK authorization                             NOT RECEIVED
Accounting/default authorization                     NOT RECEIVED
R2/provider mutation                                 DISABLED
CAIP D1-only copy                                    FORBIDDEN
Production promotion                                 CLOSED
```

## Membership evidence now proven

Production remains on the reviewed eleven-column legacy Membership shape with exactly three rows.

```text
Raw tier codes: bronze,silver,gold
name/display_title conflict: NONE
Source-row SHA-256: 5db4bfd5f948a33432834210fd232a1e4b222dd6400193d65c644b501ba92057
Lossless canonical mapping: PROVEN
```

Canonical mapping:

```text
membership_tier_policy_id -> policy_id
code                      -> tier_code
display_title             -> title
name                      -> title (exact equality proven)
short_description         -> short_description
benefits_json             -> benefits_json
badge_color               -> badge_color
sort_order                -> sort_order
is_visible                -> is_visible
created_at                -> created_at
updated_at                -> updated_at
```

## Build 436 first owner-run result

The first Build 436 owner run passed the 20/20 local rebuild simulation and reran Build 435 successfully. It then stopped during a read-only inbound-FK discovery query with Cloudflare D1:

```text
not authorized: SQLITE_AUTH [code: 7500]
```

The failed query used a dynamic `JOIN pragma_foreign_key_list(m.name)` over `sqlite_schema`. Because the preflight stopped before writing its artifact, the later Build 436 gate correctly showed 14 downstream failures for missing preflight evidence.

Safety classification:

```text
Membership Production backup        NOT CREATED
Membership Production DDL/DML       NOT EXECUTED
Membership partial rebuild          NO
Build 435 source fingerprint        STILL PROVEN
Production promotion                CLOSED
```

Source is now repaired to use a D1-compatible two-step read-only inbound-FK proof: narrow candidate tables from `sqlite_schema`, then run fixed-table `PRAGMA foreign_key_list("TABLE_NAME")` only for those candidates. Actual PRAGMA results, not schema text, determine whether an inbound FK exists.

## Current Build 436 boundary

Prepared files:

```text
scripts/build436_membership_rebuild_authorization_preflight.py
scripts/build436_production_membership_rebuild.py
scripts/build436_membership_rebuild_regression.py
scripts/build436_membership_rebuild_authorization_gate.py
BUILD436_MEMBERSHIP_REBUILD_AUTHORIZATION_VALIDATION.md
BUILD436_TWENTY_ITEM_MEMBERSHIP_REBUILD_AUTHORIZATION_BOUNDARY.md
```

The repaired Build 436 must be owner-run read-only/local again. The live preflight checks:

- exact three-row/fingerprint boundary;
- canonical-preview fingerprint;
- positive unique policy IDs;
- non-null canonical values;
- zero user-defined Membership indexes/triggers;
- zero outbound Membership foreign keys;
- zero PRAGMA-confirmed inbound Membership foreign keys;
- zero reserved rebuild-name collisions;
- compatible Membership sqlite_sequence.

## Prepared token — not yet authorized

```text
AUTHORIZE-BUILD436-PROD-MEMBERSHIP-BUILD395-REBUILD
```

Do not infer this token from continuation language, Build 435 success, or the repaired Build 436 source. It remains unauthorized until the repaired Build 436 owner-run gate passes and the owner sends the exact token separately.

## Production mutation rules

Before the token is explicitly supplied:

```text
Membership full backup: FORBIDDEN
Membership shadow table: FORBIDDEN
Membership DDL/DML: FORBIDDEN
Membership swap/drop/rename: FORBIDDEN
```

After a future exact token, only the guarded Build 436 controller may perform the Membership stage. Do not manually run Build 395 SQL in the D1 console.

## Still-preserved broader decisions

- Production promotion remains closed.
- `site_item_inventory` remains protected at the last known 1,041-row boundary unless fresh legitimate activity changes a later pre-write boundary.
- `search_query_terms` Production rows remain preserve-in-place.
- `__sql_test` remains pending retirement proof; do not create it in Development merely for parity.
- CAIP D1-only copying remains forbidden; D1/R2 must move together if ever approved.
- Every later rebuild family requires its own fresh evidence and authorization.
