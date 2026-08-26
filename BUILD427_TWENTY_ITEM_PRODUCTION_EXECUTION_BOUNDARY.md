# Build 427 — Twenty-Item Production Execution Boundary

## Status

**SOURCE / SAFETY TOOLING READY — EXPLICIT PRODUCTION AUTHORIZATION PENDING / PRODUCTION PROMOTION CLOSED**

Build 426 passed all local/live release-candidate gates:

```text
BUILD 426 RELEASE-CANDIDATE REGRESSION: PASS (20/20)
BUILD 426 TWENTY-ITEM PRODUCTION RELEASE-CANDIDATE GATE: PASS (20/20)
Development Product numbers: 1084..1128; next >=1129
Production Product numbers: unchanged / still NULL
Production release candidate: assembled locally, NOT executed
Production backup for execution: NOT YET CREATED
Production mutation executed: NO
PRODUCTION PROMOTION: CLOSED
```

Fresh Build 426 live evidence also recorded:

```text
Production sequence next: 1084
Product-number Production candidate ready: YES
Gift Card missing lookup columns: code_suffix, ip_hash, lookup_email, result_status, user_agent
Gift Card lockout table: missing
Notification metadata_json: missing
Notification current missing indexes: kind_destination, payment, product
Build 197 Product-image annotation index: missing
Membership rebuild required: YES
Product/FK orphan counts: all zero
site_item_inventory Production rows: 1041
search_query_terms rows: 5
__sql_test rows: 0
CAIP media upload rows: 113
```

Build 427 prepares the execution machinery but does **not** infer authorization from Build 426 passing. The first Production write remains separately gated.

## Build 427 — 20 source/safety changes

1. Recorded Build 426 live/package/gate evidence as PASS and retained Production mutation/promotion as closed.
2. Added a fresh Build 427 read-only Production execution preflight that reruns the bounded Build 426 live evidence immediately before execution.
3. Added stale-candidate refusal: the Product-number phase opens only if Production still has 45 NULL Product numbers, sequence `1084`, no candidate collisions, exact Dev mapping `1084..1128`, and Dev sequence `>=1129`.
4. Added preservation checks for Product/FK zero-orphan evidence, `site_item_inventory=1041`, `search_query_terms=5`, `__sql_test=0`, and CAIP rows `113`.
5. Added a hard Production database-name guard for `devilndove-prod`.
6. Added a hard Production D1 UUID guard for `0dc8fa3e-319c-45f7-a515-34c8acd89fcf`.
7. Added the literal Product-number Production authorization token `AUTHORIZE-BUILD427-PROD-PRODUCT-NUMBERS`.
8. Added a full remote Production D1 export stage that must succeed before the Product-number write.
9. Added local Production backup byte-size and SHA-256 evidence.
10. Added a Product-number-only SQL builder containing exactly 45 guarded updates plus a monotonic sequence advance to at least `1129`.
11. Explicitly prohibited Build 427 from bulk-executing `build426_production_release_candidate.local.sql`.
12. Added live Production Product-number postcheck requiring 45 unique values exactly `1084..1128`, sequence `>=1129`, and exact Product identity parity with Development.
13. Added live Development postcheck in the same phase so the already-green Dev mapping must remain unchanged after Production remediation.
14. Added a separate Gift Card Build 384 additive executor that cannot run until Product-number Production postcheck is green.
15. Added a separate Notification Build 403 additive executor with its own authorization token and Product-number postcheck dependency.
16. Added a separate Build 197 Product-image annotation-index executor with its own authorization token and Product-number postcheck dependency.
17. Added an aggregate additive postcheck for Gift Card columns/indexes/lockout table, Notification metadata/indexes, and the Build 197 annotation index.
18. Kept Membership, fractional Inventory, Product/FK and Accounting/default families out of the additive executor; they remain separate backed-up rebuild phases.
19. Added a 20-check local execution-safety regression and a 20-check local authorization-boundary gate.
20. Build 427 source preparation does not create a Production execution backup, does not claim authorization, performs no Production mutation, and leaves Production promotion closed.

## Current execution boundary

The following are now **prepared but not authorized/executed**:

```text
Production Product-number backup/export stage       PREPARED
Production Product-number 45-row backfill stage     PREPARED / LOCKED
Production Product-number postcheck                  PREPARED
Gift Card additive stage                             PREPARED / LOCKED
Notification additive stage                          PREPARED / LOCKED
Build 197 annotation-index stage                     PREPARED / LOCKED
Membership rebuild                                   NOT IN ADDITIVE EXECUTOR
Fractional Inventory rebuilds                        NOT IN ADDITIVE EXECUTOR
Product/FK rebuilds                                  NOT IN ADDITIVE EXECUTOR
Accounting/default rebuilds                          NOT IN ADDITIVE EXECUTOR
Production promotion                                 CLOSED
```

The Product-number execution sequence cannot begin merely because this source gate is green. A separate explicit authorization is still required.

## Production authorization token

The first Production mutation stage requires this exact token:

```text
AUTHORIZE-BUILD427-PROD-PRODUCT-NUMBERS
```

Do not treat prior “continue”, “next”, Build 426 PASS output, or successful read-only validation as equivalent authorization.

## Validation before authorization

Only source/local/read-only checks should be run before authorization:

```bash
python -m py_compile \
  scripts/build427_production_execution_preflight.py \
  scripts/build427_production_product_number_execution.py \
  scripts/build427_production_additive_execution.py \
  scripts/build427_execution_safety_regression.py \
  scripts/build427_authorization_boundary_gate.py

python scripts/build427_execution_safety_regression.py
python -u scripts/build427_production_execution_preflight.py --run 2>&1 | tee build427_production_execution_preflight.txt
python scripts/build427_authorization_boundary_gate.py
```

These commands perform no Production mutation. Only the middle command contacts Cloudflare/D1, and it is read-only.

## Next 20 ordered changes

1. Build 428: after explicit authorization, rerun Build 427 fresh Product-number preflight and refuse stale state.
2. Build 428: create the fresh full Production D1 backup and verify SHA-256/byte size.
3. Build 428: apply only the 45 guarded Production Product-number updates + monotonic sequence advance.
4. Build 428: immediately run Product-number Production/Development post-proof.
5. Build 428: if Product-number post-proof fails, stop all later Production families and retain the backup.
6. Build 428: with a green Product-number post-proof, authorize/apply Build 384 Gift Card additive alignment as its own stage.
7. Build 428: prove five lookup-attempt columns, two lookup indexes, lockout table/index, and row preservation.
8. Build 428: authorize/apply Build 403 Notification additive alignment as its own stage.
9. Build 428: prove `metadata_json`, four current indexes, and outbox row preservation.
10. Build 428: authorize/apply the Build 197 Product-image annotation composite index if still missing.
11. Build 428: take a fresh Production export before the first rebuild family.
12. Build 428: execute Membership Build 395 as a separate data-preserving shadow/rebuild with exact 3-row/tier proof.
13. Build 428: take a fresh semantic drift snapshot after Membership before fractional rebuilds.
14. Build 428: rebuild fractional Inventory/Creative Project tables in bounded groups preserving exact REAL values.
15. Build 428: require exact 1,041-row `site_item_inventory` preservation before and after its rebuild.
16. Build 428: refresh orphan counts immediately before each Product/FK rebuild family and refuse any nonzero orphan count.
17. Build 428: refresh Accounting/default/nullability compatibility immediately before each family and create family-specific rollback evidence.
18. Build 428: rerun full semantic parity after all approved Production schema changes while leaving `search_query_terms`, `__sql_test`, and CAIP exclusions unchanged.
19. Build 428: rerun Development/Production browser/read-contract smoke and provider fail-closed checks.
20. Build 428: merge the final parity result into `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md` and open Production promotion only if every gate is green.

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
Build 426  Production release-candidate assembly     PASS (20/20)
Build 427  Production execution tooling              SOURCE READY / AUTHORIZATION PENDING

Production backup for execution                      NOT CREATED
Production mutation                                  CLOSED / NOT AUTHORIZED
Production promotion                                 CLOSED
```
