# Build 425 — Twenty-Item Development-First Product-Number Backfill

## Status

**PASS — 20/20 DEVELOPMENT PRODUCT-NUMBER BACKFILL / PRODUCTION UNCHANGED / PRODUCTION PROMOTION CLOSED**

Owner-run Build 425 completed successfully on August 25, 2026.

```text
BUILD 425 TWENTY-ITEM DEVELOPMENT PRODUCT NUMBER COMPLETION GATE: PASS (20/20)
Development legacy Product numbers: 1084..1128
Development next Product number: 1129
Production Product numbers: unchanged / still NULL
Production preview executable statements: ZERO
Production mutation executed: NO
PRODUCTION PROMOTION: CLOSED
```

## Authoritative Build 425 result

- Development contains the same 45 logical Products proven in Builds 417–424.
- Development Product numbers are now exactly `1084..1128`, one unique number per legacy Product.
- Development `catalog_product_number_sequence.next_product_number` is `1129`.
- The Development write was guarded by exact database name/UUID, fresh identity/state/sequence evidence and a full remote D1 export before mutation.
- The Development rollback export and its SHA-256 are local evidence artifacts and are excluded from Git.
- SKU overlap preflight was `0`; SKU and Product number remain separate identities.
- The in-memory backfill regression proved first pass = 45 Product updates and second pass = 0.
- Live post-write proof confirmed Product IDs/slugs/names were unchanged.
- Production remained at 45 NULL Product numbers with sequence next `1084`.
- The generated Production Product-number preview contained zero executable statements.
- No Production schema/data mutation occurred.

## Build 425 — 20 completed safety changes

1. Recorded Build 424 PASS with reservation `1084..1128` and next value `1129`.
2. Added a Development-only Product-number backfill helper with no Production write command.
3. Hard-pinned Development database name `devilndove-dev`.
4. Hard-pinned Development D1 UUID `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
5. Added refusal when `wrangler.toml` unexpectedly contains the Production D1 UUID.
6. Added live pre-write Product identity checks against the 45-row Build 424 map.
7. Required all 45 Development Product numbers to remain NULL immediately before first write.
8. Confirmed all 45 Production Product numbers remained NULL immediately before Development write.
9. Added exact Development/Production sequence stale-evidence checks.
10. Added live collision checks across Product-number-bearing tables.
11. Added DND-formatted SKU overlap evidence; owner-run result was zero overlaps.
12. Added a full remote Development D1 export before mutation.
13. Recorded backup SHA-256 and byte size locally.
14. Applied the deterministic guarded 45-row Development backfill.
15. Advanced Development sequence monotonically to `1129` without rollback capability.
16. Proved first pass = 45 updates and rerun = 0 updates in local regression.
17. Proved live Development mapping is exactly 45 unique values `1084..1128`.
18. Proved Product IDs/slugs/names stayed unchanged and Production stayed untouched.
19. Generated an inert Production Product-number preview only after Development proof passed.
20. Passed the Build 425 completion gate 20/20 with Production mutation/promotion closed.

## Safety boundary after Build 425

```text
Development legacy Product-number remediation       COMPLETE / PROVEN
Production Product-number write                     CLOSED
Production schema/data mutation                     CLOSED
Executable Production helper                        NOT RUN / NOT AUTHORIZED
Broad Production -> Development copy                CANCELLED
CAIP D1-only metadata copy                          FORBIDDEN
Provider mutation                                    DISABLED
Production promotion                                 CLOSED
```

## Next 20 ordered changes — Build 426

1. Record the exact Build 425 Development backfill and post-write proof in the current parity handoff.
2. Refresh the current-state handoff overlay for Builds 417–425 and Product-number disposition.
3. Refresh the current-state roadmap overlay with remaining Production work.
4. Rerun bounded live Product-number parity evidence: Dev mapped `1084..1128`, Prod still 45 NULL.
5. Rebuild the Production Product-number preflight from current live state and invalidate stale previews.
6. Require a fresh Production backup/export boundary before any later Production write.
7. Assemble the reviewed Production Product-number SQL candidate, but do not execute it in Build 426.
8. Define Production Product-number post-write proof mirroring Development assertions.
9. Assemble Gift Card additive candidate from Build 384 authority.
10. Assemble Notification additive candidate from Build 403 authority.
11. Assemble Build 197 Product-image annotation index candidate.
12. Assemble Membership Build 395 data-preserving rebuild blueprint.
13. Assemble fractional Inventory/Creative Project REAL-affinity rebuild blueprints.
14. Require exact 1,041-row `site_item_inventory` preservation.
15. Keep Product/FK rebuilds gated on fresh zero-orphan evidence.
16. Keep Accounting/default candidates gated on fresh/recorded compatibility evidence.
17. Preserve the five `search_query_terms` Production rows pending explicit authority.
18. Leave empty `__sql_test` untouched pending retirement authority.
19. Keep the 113-row CAIP/private-R2 delta outside the schema parity release.
20. Produce a complete local Production release-candidate package/gate; actual Production mutation remains a separate explicit decision.

## Gate status

```text
Build 410  Development D1 parity overlay             PASS
Build 412  Local RC                                  PASS
Build 416  Development browser/read contracts        PASS
Build 417  Live schema/data mapping                  PASS
Build 418  Live semantic classification              PASS
Build 419  Exact structural drift evidence           PASS
Build 420  20-item parity hardening                  PASS (20/20)
Build 421  20-item Production evidence/manifest      PASS (20/20, 1 blocker)
Build 422  20-item local release fixtures            PASS (20/20)
Build 423  Product-number evidence/fixtures          COMPLETE — shared legacy NULL gap identified
Build 424  Product-number reservation/preview        PASS (20/20), block 1084..1128
Build 425  Development-first Product-number backfill PASS (20/20)
Build 426  Production release-candidate assembly     NEXT

Production schema/data mutation                      CLOSED
Production promotion                                 CLOSED
```
