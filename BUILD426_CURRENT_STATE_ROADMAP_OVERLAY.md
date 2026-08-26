# Build 426 — Current Parity Roadmap Overlay

> Use this overlay with `BUILD426_CURRENT_STATE_HANDOFF_OVERLAY.md` for the active parity/release sequence. The older Build 279 roadmap remains historical feature context until the Production parity release closes and the canonical roadmap is refreshed deliberately.

## Current objective

Finish Devil n Dove Development/Production schema parity without broad data copy, without copying CAIP metadata away from its private R2 objects, and without introducing request-time schema repair.

## Completed sequence

- Builds 410/412/416: Development parity overlay, local RC, and live browser/read-contract proof.
- Builds 417–419: live schema/data mapping, semantic classification, exact structural drift evidence.
- Builds 420–422: 20-item hardening, live Production evidence, local release fixtures.
- Builds 423–424: shared legacy Product-number gap identified and collision-free `1084..1128` reservation proven.
- Build 425: Development-only 45-row Product-number backfill completed and proven; sequence next `1129`; Production unchanged.

## Build 426 active work

1. Refresh live Product-number parity evidence.
2. Revalidate the Production reservation boundary and collision state.
3. Assemble guarded Product-number Production candidate SQL without execution.
4. Assemble Build 384 Gift Card additive candidate.
5. Assemble Build 403 Notification additive candidate.
6. Assemble Build 197 Product-image annotation index candidate.
7. Record Membership Build 395 rebuild blueprint and preservation assertions.
8. Record fractional Inventory/Creative Project rebuild blueprints with REAL affinity.
9. Require exact 1,041-row `site_item_inventory` preservation.
10. Freshen Product/FK orphan evidence.
11. Retain Accounting/default families behind compatibility gates.
12. Preserve five `search_query_terms` rows.
13. Leave empty `__sql_test` untouched.
14. Keep CAIP 113-row/private-R2 history outside the parity release.
15. Produce local candidate SQL + manifest.
16. Run a local candidate regression.
17. Run the 20-item release-candidate completion gate.
18. Keep Production backup status explicitly false in Build 426.
19. Keep Production execution explicitly disabled in Build 426.
20. Mark the next 20 Production execution/post-proof tasks only after Build 426 is green.

## Production release order after Build 426

The eventual Production write phase must be explicitly authorized and should follow this order:

1. fresh Production D1 export + SHA-256;
2. fresh stale-evidence/precondition proof;
3. Product-number guarded legacy backfill + sequence advance;
4. bounded additive Gift Card/Notification/index migrations;
5. live post-write proof;
6. data-preserving rebuild families one bounded family at a time with dedicated backups/pre/post assertions;
7. final semantic parity recheck;
8. browser/read-contract smoke;
9. only then consider Production promotion open.

Production mutation and promotion remain closed during Build 426.
