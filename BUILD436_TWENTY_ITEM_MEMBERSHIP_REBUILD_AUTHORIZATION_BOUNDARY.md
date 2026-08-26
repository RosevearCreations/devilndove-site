# Build 436 — Membership Build 395 Rebuild Execution Authorization Boundary

## Status

**BUILD 435 LOSSLESS VALUE MAPPING PROVEN / GUARDED BUILD 395 REBUILD SOURCE PREPARED / MEMBERSHIP REBUILD NOT AUTHORIZED / PRODUCTION PROMOTION CLOSED**

Build 435 owner-run evidence proved:

```text
Membership rows: 3
Raw codes: bronze,silver,gold
name == display_title: exact equality for all three tiers
Source-row SHA-256: 5db4bfd5f948a33432834210fd232a1e4b222dd6400193d65c644b501ba92057
Lossless canonical mapping possible: True
Final mapping gate: PASS (20/20)
```

No Membership backup or mutation occurred in Build 435.

## Build 436 — 20 source/safety changes

1. Recorded the owner-run Build 435 complete-row value-mapping PASS.
2. Recorded the exact three-row source fingerprint `5db4bfd5f948a33432834210fd232a1e4b222dd6400193d65c644b501ba92057`.
3. Recorded exact `name == display_title` equality for Bronze, Silver, and Gold.
4. Added a fresh Build 436 read-only rebuild-authorization preflight.
5. Made Build 436 rerun the full Build 435 complete-row mapping proof before any decision.
6. Added canonical-preview SHA-256 fingerprinting.
7. Added positive/unique Membership policy-ID validation.
8. Added non-null validation for every canonical Build 395 value.
9. Added live user-defined Membership index/trigger discovery and fail-closed handling.
10. Added live outbound Membership foreign-key discovery and fail-closed handling.
11. Added live inbound Membership foreign-key discovery and fail-closed handling.
12. Added reserved shadow/assert object collision discovery and fail-closed handling.
13. Added legacy `sqlite_sequence` compatibility evidence.
14. Added a stage-specific exact authorization token path `AUTHORIZE-BUILD436-PROD-MEMBERSHIP-BUILD395-REBUILD`.
15. Added a guarded Membership full-backup/fingerprint boundary.
16. Added a canonical Build 395 shadow-table SQL generator with explicit legacy mappings and no seed-default overwrite.
17. Added in-batch row-count, tier-identity, title-alias, and complete-value assertions before swap.
18. Added canonical postchecks for columns, tiers, full value fingerprint, UNIQUE constraint, AUTOINCREMENT, sequence, and helper cleanup.
19. Added a 20-check local regression that executes the generated rebuild SQL against an in-memory legacy Membership table.
20. Kept Membership authorization, later rebuild families, R2/provider mutation, CAIP copy, and Production promotion closed.

## Exact future authorization token

The prepared controller accepts only:

```text
AUTHORIZE-BUILD436-PROD-MEMBERSHIP-BUILD395-REBUILD
```

Source preparation does **not** authorize that token. Generic continuation language must never be treated as Membership rebuild authorization.

## Guarded controller

Prepared source:

```text
scripts/build436_production_membership_rebuild.py
```

Actions:

```text
--backup     exact token required
--apply      exact token required
--postcheck  read-only
```

The controller has no action for any other rebuild family.

## D1 batch model

The generated rebuild file deliberately does not contain `BEGIN TRANSACTION` or `COMMIT`. Cloudflare D1 remote SQL-file execution is transaction-managed; a failed file execution returns the database to its original state, and D1 import guidance warns that embedded transaction statements can cause a nested-transaction error.

The authorized batch, if later approved, performs only:

1. create canonical Build 395 shadow table;
2. copy the exact three current rows through explicit mappings;
3. run SQL assertions for source shape, row count, tier identities, title equality, and complete mapped values;
4. drop the legacy table only after those assertions pass;
5. rename the canonical shadow table to `membership_tier_policies`;
6. remove the assertion helper table.

No Build 395 seed values are applied over existing Production values.

## Next 20 ordered changes — Build 437

1. Record Build 436 owner-run preflight/regression/gate evidence as PASS if green.
2. Accept Membership rebuild Production authorization only through exact token `AUTHORIZE-BUILD436-PROD-MEMBERSHIP-BUILD395-REBUILD`.
3. Rerun the full Build 436 read-only preflight immediately before any Membership backup.
4. Require exactly three source rows and preserve the fresh source/canonical fingerprints.
5. Require zero unhandled Membership indexes/triggers, inbound FKs, outbound FKs, and rebuild-name collisions.
6. Create a fresh full Production D1 export dedicated to Membership only after explicit authorization.
7. Verify backup path, nonzero bytes, SHA-256, Production UUID, and <=30-minute age.
8. Rerun the full Build 436 preflight after backup and refuse any source/fingerprint drift.
9. Execute only the prepared Build 395 Membership batch through the guarded controller.
10. Create only the canonical Build 395 shadow table; do not invoke request-handler DDL or seed logic.
11. Copy only the three live rows through the explicit reviewed mappings.
12. Require all in-batch row/tier/title/value assertions to pass before the legacy table can be dropped.
13. Complete the legacy-drop/shadow-rename swap only within the same D1 file-execution atomic boundary.
14. Prove Membership row count remains exactly three.
15. Prove canonical value fingerprint equals the pre-write canonical-preview fingerprint.
16. Prove canonical column order, tier UNIQUE constraint, AUTOINCREMENT, and sequence are correct.
17. Prove no Build 436 shadow/assert helper object remains.
18. Run an independent read-only Membership postcheck and record backup/apply/postcheck evidence.
19. Mark Membership complete only after independent postcheck PASS, then prepare the first fractional Inventory/Creative Project rebuild family as a new inert/read-only boundary.
20. Keep every later family separately locked and Production promotion closed.

## Current safety state

```text
Product numbers                                      COMPLETE / PROVEN
Gift Card                                            COMPLETE / PROVEN
Full Build 403 Notification                          COMPLETE / PROVEN
Build 197 annotation index                           COMPLETE / PROVEN
Build 434 Membership authorization boundary          PASS (20/20)
Build 435 Membership lossless mapping boundary       PASS (20/20)
Build 436 guarded rebuild source                     PREPARED / NOT AUTHORIZED
Membership Production backup                         NOT CREATED
Membership rebuild authorization                     NOT RECEIVED
Membership Production mutation                       NOT EXECUTED
Fractional rebuild authorization                     NOT RECEIVED
Product/FK authorization                             NOT RECEIVED
Accounting/default authorization                     NOT RECEIVED
R2/provider mutation                                 DISABLED
CAIP D1-only copy                                    FORBIDDEN
Production promotion                                 CLOSED
```
