# Build 426 — Twenty-Item Production Release-Candidate Assembly

## Status

**READY FOR LIVE READ-ONLY EVIDENCE + LOCAL PACKAGE/REGRESSION/GATE / PRODUCTION WRITES CLOSED**

Build 425 passed 20/20 and completed the Development-only legacy Product-number backfill.

```text
Development legacy Product numbers: 1084..1128
Development next Product number: 1129
Production Product numbers: unchanged / still NULL
Production preview executable statements: ZERO
Production mutation executed: NO
PRODUCTION PROMOTION: CLOSED
```

Build 426 does not mutate Production. It refreshes the live preconditions and assembles the local release candidate that a later explicitly authorized Production execution phase may consume.

## Build 426 — 20 completed source/safety changes

1. Closed Build 425 as PASS (20/20) with Development Product numbers `1084..1128` and next `1129`.
2. Added a current parity handoff overlay covering Builds 417–426 so stale Build 279 handoff prose is not treated as current parity authority.
3. Added a current parity roadmap overlay with the remaining Production work and release ordering.
4. Added a bounded live read-only Dev/Prod Product-number parity refresh.
5. Added fresh Production reservation/collision evidence across `product_costs`, `product_deletion_audit`, and `products`.
6. Added exact Product identity and sequence-state revalidation before a Product-number candidate can be considered ready.
7. Added local guarded Production Product-number candidate assembly from the proven Development mapping; Build 426 never executes it.
8. Added explicit future Production backup requirement; Build 426 manifest records that no Production backup has yet been created for execution.
9. Added Build 384 Gift Card additive candidate assembly from canonical authority.
10. Added Build 403 Notification additive candidate assembly from canonical authority.
11. Added Build 197 Product-image annotation composite-index candidate assembly.
12. Added Membership Build 395 data-preserving rebuild blueprint classification with live Production row/column evidence.
13. Added five-table fractional Inventory/Creative Project rebuild evidence with live row counts and type differences.
14. Added exact `site_item_inventory` 1,041-row preservation boundary to the candidate manifest/regression.
15. Added fresh Product/FK orphan scans for Product media/review/capture, page-view sessions, and supplier PO Inventory references.
16. Retained Accounting/default/constraint families behind Build 421 compatibility authority and a fresh pre-write requirement before later execution.
17. Preserved `search_query_terms` live rows and kept `__sql_test` as no-action/retirement-review rather than count-parity cleanup.
18. Kept the CAIP D1/private-R2 delta outside the parity release and records the live CAIP metadata-row count.
19. Added a local 20-check candidate regression/gate requiring source authority, live evidence, candidate integrity and closed Production execution flags.
20. Build 426 contains no Production execution command; Production mutation/promotion remains a separate later explicit decision.

## Candidate package classes

### Ready bounded SQL candidates

- 45 guarded Product-number legacy updates, derived from the live proven Development mapping.
- monotonic Product-number sequence advance to at least `1129`.
- Build 384 Gift Card lookup-attempt additive columns/indexes and `gift_card_lookup_lockouts` table/index as live evidence requires.
- Build 403 Notification `metadata_json`/indexes as live evidence requires.
- Build 197 Product-image annotation composite index as live evidence requires.

### Review-required data-preserving rebuilds

- Membership Build 395 legacy → canonical mapping.
- five fractional Inventory/Creative Project tables.
- Product/FK tables, only while live orphan counts remain zero.
- Accounting/default/nullability families, only after fresh per-family compatibility proof immediately before execution.

These review-required families are documented in the candidate package but intentionally have no auto-executing rebuild DDL in Build 426.

### Preserve / exclude

- `search_query_terms`: preserve current Production rows pending explicit authority decision.
- `__sql_test`: no parity cleanup; leave untouched pending retirement authority.
- CAIP/private R2: excluded from schema parity. Never copy the D1 metadata alone.

## Local artifacts

Build 426 generates:

```text
build426_live_release_candidate_evidence.local.json
build426_production_release_candidate.local.sql
build426_production_release_candidate_manifest.local.json
```

These are ignored by Git and are not execution evidence.

## Canonical-document rule

`AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md` remain historically detailed but stale around Build 279. During the active parity release, use:

```text
BUILD426_CURRENT_STATE_HANDOFF_OVERLAY.md
BUILD426_CURRENT_STATE_ROADMAP_OVERLAY.md
```

as the current parity overlay. Merge the final parity result into the two canonical files after the Production execution/post-proof phase closes, avoiding another false "current" state while Production remains intentionally unchanged.

## Safety boundary

```text
Development Product-number remediation       COMPLETE / PROVEN
Production backup for execution              NOT YET CREATED
Production D1 mutation                       DISABLED IN BUILD 426
Production Product-number execution          DISABLED IN BUILD 426
R2/provider mutation                         DISABLED
Broad Production -> Development copy         CANCELLED
CAIP D1-only copy                            FORBIDDEN
Production promotion                         CLOSED
```

## Validation

See `BUILD426_VALIDATION.md`.

## Next 20 ordered changes — Build 427

1. Record Build 426 live/package/gate evidence as PASS in Markdown.
2. Merge the final current parity overlay into `AI_HANDOFF.md` once the Production execution sequence is explicitly opened.
3. Merge the final current parity roadmap into `PROJECT_STATUS_AND_ROADMAP.md` at the same controlled checkpoint.
4. Re-run the bounded Production Product-number preflight immediately before execution and reject stale candidate SQL.
5. Create a fresh full Production D1 export and record SHA-256/byte size before any Production write.
6. Require an explicit Production authorization token and hard Production name/UUID guard.
7. Apply only the guarded 45-row Production Product-number backfill + monotonic sequence advance first.
8. Prove Production has exact `1084..1128`, 45 unique values, unchanged Product identities and sequence `>=1129`.
9. Prove Development remains exact `1084..1128` after the Production Product-number write.
10. Apply the bounded Build 384 Gift Card additive candidate only after Product-number post-proof is green.
11. Prove Gift Card lookup-attempt columns/indexes and lockout table/index with row preservation.
12. Apply the bounded Build 403 Notification additive candidate and prove outbox row preservation.
13. Apply/prove the Build 197 Product-image annotation index if still missing.
14. Take a new semantic drift snapshot before any table-rebuild family.
15. Execute Membership Build 395 as its own backed-up data-preserving rebuild, not inside a broad migration batch.
16. Execute fractional Inventory/Creative Project rebuilds in bounded groups with exact REAL values and 1,041-row Inventory preservation.
17. Execute Product/FK rebuild families only while immediately refreshed orphan counts remain zero.
18. Execute Accounting/default/constraint families only after fresh compatibility checks and family-specific rollback boundaries.
19. Re-run full semantic parity + browser/read-contract smoke after all approved Production schema work; CAIP remains excluded.
20. Open Production promotion only if every Production post-write/parity/browser gate is green; otherwise keep it closed and retain backups.

## Gate status

```text
Build 410  Development D1 parity overlay             PASS
Build 412  Local RC                                  PASS
Build 416  Development browser/read contracts        PASS
Build 417  Live schema/data mapping                  PASS
Build 418  Live semantic classification              PASS
Build 419  Exact structural drift evidence           PASS
Build 420  20-item parity hardening                  PASS (20/20)
Build 421  Production evidence/manifest              PASS (20/20, 1 blocker)
Build 422  Local release fixtures                    PASS (20/20)
Build 423  Product-number evidence                   COMPLETE — shared legacy NULL gap
Build 424  Product-number reservation                PASS (20/20), 1084..1128
Build 425  Development Product-number backfill       PASS (20/20)
Build 426  Production release-candidate assembly     READY

Production mutation                                  CLOSED
Production promotion                                 CLOSED
```
