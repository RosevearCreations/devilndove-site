# Build 421 — Twenty-Item Production Evidence / Manifest Gate

## Status

**READY FOR LIVE READ-ONLY EVIDENCE / PRODUCTION WRITES CLOSED**

Build 420 passed both local gates:

```text
BUILD 420 INDEX SEMANTICS REGRESSION: PASS
BUILD 420 TWENTY-ITEM PARITY HARDENING PREFLIGHT: PASS (20/20)
```

Build 421 executes the next approximately twenty items as one bounded live evidence batch instead of returning to one-change-at-a-time work.

It performs **no DDL, DML, R2 mutation, provider mutation, deploy, branch promotion, or Production data copy**.

## Build 421 twenty-item batch

1. Production `accounting_expenses` data-risk/nullability scan.
2. Production `accounting_writeoffs` data-risk/nullability scan.
3. Production `general_ledger_accounts.category` default/data scan.
4. Production `product_costs` Product-number/effective-date scan.
5. Production `movie_catalog.metadata_status` scan.
6. Production `product_resource_links` lot/fractional/default scan.
7. Production `tax_classes` code/rate/duplicate scan.
8. Production `site_item_inventory` fractional-value scan.
9. Production `site_inventory_movements` fractional-value scan.
10. Production Creative Project inventory post/reversal fractional-value scan.
11. Production `product_material_return_audit` fractional-value scan.
12. Production `product_media_score_history` Product/User orphan scan.
13. Production `product_review_actions` User orphan scan.
14. Production Product capture-created/updated User orphan scan.
15. Production `site_page_views` → visitor-session orphan scan.
16. Production supplier PO item → Inventory orphan scan.
17. Live Development/Production semantic `products.product_number` uniqueness verification, including implicit UNIQUE indexes.
18. `search_query_terms` row/source/runtime authority classification; existing Production rows remain preserved.
19. `__sql_test` row/source/runtime classification; empty residue may become a later retirement candidate only if runtime refs remain absent.
20. Generate a local **non-executing** Production migration manifest and prove that no executable Production helper is generated.

## Blocker meaning

A Build 421 line may be marked `BLOCKER` without Build 421 itself failing.

`BLOCKER` means live data needs explicit remediation/mapping before a future schema write. It does **not** authorize Build 421 to change that data.

Examples:

- a nullable legacy column contains values that cannot satisfy the current NOT NULL authority;
- a Product/FK family contains an orphan row;
- a Product identity is missing or duplicated;
- a table thought to be empty residue has active runtime references.

The evidence batch is complete when all twenty checks execute and the non-executing manifest is generated. Any blockers become inputs to the next remediation/release-planning batch.

## Run

From `dev`:

```bash
python -m py_compile scripts/build421_twenty_item_production_evidence.py
python -u scripts/build421_twenty_item_production_evidence.py --run 2>&1 | tee build421_production_evidence.txt
```

The script reuses the proven Build 418 Windows-safe live transport:

- pinned `npx --yes wrangler@4.126.0`;
- Windows SQL batching cap;
- child-process-tree timeout handling;
- exact temporary D1 bindings;
- SELECT/inspection-only SQL guard.

## Expected completion footer

```text
=== BUILD 421 SUMMARY ===
Items completed: 20/20
Rollout blockers observed: <count>
Non-executing manifest: build421_non_executing_production_migration_manifest.local.md
Executable Production helper generated: NO
No database or R2 mutation was executed.
PRODUCTION PROMOTION: CLOSED

BUILD 421 TWENTY-ITEM LIVE READ-ONLY PRODUCTION EVIDENCE / MANIFEST: COMPLETE
```

The locally generated `.local.md` manifest is evidence only and is intentionally not a committed migration helper.

## Next 20 after Build 421

The exact contents depend on Build 421 blocker counts, but the next batch is already bounded:

1. Record Build 421 evidence and blocker count in Markdown.
2. Map every blocker to remediation or explicit preservation.
3. Confirm current Production D1 backup/export procedure and rollback identifier format.
4. Build the reviewed additive Gift Card migration SQL only.
5. Add idempotent Gift Card pre/post schema assertions.
6. Add Gift Card lookup-attempt column preservation checks.
7. Add `gift_card_lookup_lockouts` create/index assertions.
8. Build the reviewed additive Notification migration SQL only.
9. Add Notification outbox pre/post schema assertions.
10. Review/approve any additive `product_image_annotations` index.
11. Build Membership legacy→Build 395 mapping fixtures from live shape evidence.
12. Add Membership row-count/unique-tier preservation regression.
13. Build fractional Inventory table-rebuild fixtures against representative REAL values.
14. Add exact 1,041-row `site_item_inventory` preservation assertion.
15. Build Product/FK rebuild fixtures with orphan checks fail-closed.
16. Add `products.product_number` semantic uniqueness preservation assertion.
17. Build Accounting/default/nullability rebuild fixtures only for blocker-free/mapped data.
18. Resolve `search_query_terms` preservation/retirement decision without changing its five rows prematurely.
19. Resolve `__sql_test` retirement decision without using count parity as justification.
20. Produce Build 422 local release candidate gate; executable Production mutation remains disabled until all approved migration families pass fixtures.

## Gate

```text
Build 410  Development D1 parity overlay          PASS
Build 412  Local RC                               PASS
Build 416  Development browser/read contracts     PASS
Build 417  Live schema/data mapping               PASS
Build 418  Live semantic classification           PASS
Build 419  Exact structural drift evidence        PASS
Build 420  20-item parity hardening               PASS (20/20 local)
Build 421  20-item Production evidence/manifest   READY

Broad Production -> Development data copy         CANCELLED
CAIP D1-only metadata copy                        FORBIDDEN
Production schema mutation                        CLOSED
Production promotion                              CLOSED
```
