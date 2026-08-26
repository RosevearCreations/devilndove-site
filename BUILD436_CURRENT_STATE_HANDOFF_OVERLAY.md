# Build 436 — Current Parity Handoff Overlay

## Current state

```text
Product numbers                                      COMPLETE / PROVEN
Gift Card Build 384                                  COMPLETE / PROVEN
Full Notification Build 403                          COMPLETE / PROVEN
Build 197 annotation index                           COMPLETE / PROVEN
Membership Build 434 authorization boundary          PASS (20/20)
Membership Build 435 lossless mapping boundary       PASS (20/20)
Membership Build 436 rebuild source                  PREPARED / NOT AUTHORIZED
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

Build 436 must be owner-run read-only/local first. The live preflight adds checks for:

- exact three-row/fingerprint boundary;
- canonical-preview fingerprint;
- positive unique policy IDs;
- non-null canonical values;
- zero user-defined Membership indexes/triggers;
- zero outbound Membership foreign keys;
- zero inbound Membership foreign keys;
- zero reserved rebuild-name collisions;
- compatible Membership sqlite_sequence.

## Prepared token — not yet authorized

```text
AUTHORIZE-BUILD436-PROD-MEMBERSHIP-BUILD395-REBUILD
```

Do not infer this token from continuation language or from the successful Build 435 mapping proof.

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
