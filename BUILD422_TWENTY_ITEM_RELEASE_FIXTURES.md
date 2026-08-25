# Build 422 — Twenty-Item Local Release Fixtures / Remediation Planning

## Status

**READY FOR LOCAL 20-ITEM FIXTURE GATE / PRODUCTION WRITES CLOSED**

Build 421 completed all twenty live read-only evidence items and reported exactly one rollout blocker. Build 422 converts that evidence into local release-fixture authority without contacting Cloudflare or enabling a Production mutation path.

The exact blocker is intentionally read from the owner-generated `build421_production_evidence.txt`; Build 422 does not infer or guess it from the summary count.

## Build 422 — 20 completed source/fixture changes

1. Build 421 is formally recorded as **PASS — 20/20 complete with one rollout blocker**.
2. Added a local Build 421 evidence parser that requires the numbered PASS/BLOCKER records instead of relying only on the footer.
3. Added exact blocker-label and evidence-summary extraction.
4. Added blocker-family classification for accounting, constraint/default, fractional Inventory, FK/orphan, Product identity, and one-sided-table authority cases.
5. Added local `build422_blocker_mapping.local.md` generation; the mapping is evidence only and cannot mutate Production.
6. Added a source-only release fixture catalog for current Gift Card lookup columns and indexes.
7. Added explicit `gift_card_lookup_lockouts` fixture authority and retained readiness-gate ownership.
8. Added Notification outbox metadata/index fixture authority.
9. Added canonical Membership Build 395 column catalog and legacy alias map.
10. Retained Build 410 shadow/backup/rebuild logic as the proven data-preserving Membership compatibility reference; it remains Development-only.
11. Added the five-table fractional Inventory/Creative Project preservation family and exact quantity-column catalog.
12. Added the five-table Product/FK family and explicit referenced parent keys for orphan-gated rebuild planning.
13. Added the three-table Accounting rebuild family.
14. Added the four-table constraint/default review family (`product_costs`, `movie_catalog`, `product_resource_links`, `tax_classes`).
15. Added a thirteen-phase backup-first / promotion-last rollout sequence catalog.
16. Added explicit source flags keeping Production mutation, executable Production helper generation, broad Prod→Dev copy, and CAIP D1-only copy disabled.
17. Added blocker-parser regression coverage using a synthetic PASS/BLOCKER log.
18. Added a twenty-check local release-fixture gate that consumes the real Build 421 local evidence and manifest.
19. Preserved `search_query_terms` rows pending authority resolution and kept `__sql_test` retirement separate from table-count parity.
20. Kept the executable Production helper nonexistent/disabled; Build 422 prepares fixtures and remediation decisions only.

## Blocker policy

The single Build 421 blocker remains **fail-closed**. Build 422 may complete source/fixture work for unaffected migration families, but the blocked family cannot enter an executable Production helper until its local mapping has:

- the exact Build 421 evidence summary;
- an explicit remediation or preservation decision;
- a data-preserving regression fixture when rebuild is required;
- pre/post assertions;
- a rollback/export boundary.

## One-sided table policy

- `search_query_terms`: **preserve** the five Production rows while runtime/schema authority is resolved. Do not delete or copy them just to equalize table counts.
- `__sql_test`: remain untouched while retirement safety is reviewed. Its empty row count alone is not justification for deletion or recreation elsewhere.
- `gift_card_lookup_lockouts`: current required schema; Production eventually needs the table/index after reviewed additive migration preparation.

## Safety boundaries

```text
Production schema mutation                 DISABLED
Executable Production helper               DISABLED
Broad Production -> Development data copy  DISABLED / CANCELLED
CAIP D1-only metadata copy                 DISABLED / FORBIDDEN
Provider mutation during parity work       DISABLED
Production promotion                       CLOSED
```

## Local validation

Run from `dev` after Build 421 evidence files remain in the repository working directory:

```bash
python -m py_compile \
  scripts/build422_blocker_mapper.py \
  scripts/build422_release_fixture_catalog.py \
  scripts/build422_blocker_mapper_regression.py \
  scripts/build422_twenty_item_local_release_fixture_gate.py

python scripts/build422_blocker_mapper_regression.py
python scripts/build422_blocker_mapper.py
python scripts/build422_twenty_item_local_release_fixture_gate.py
```

No command above contacts Cloudflare.

## Next 20 ordered changes

1. Build 423: consume the exact Build 421 blocker mapping and add a blocker-specific remediation/preservation fixture.
2. Build 423: add a non-executing Gift Card additive migration plan for the five lookup-attempt columns.
3. Build 423: add Gift Card pre-schema assertions for existing legacy lookup-attempt rows/columns.
4. Build 423: add Gift Card post-schema assertions for all five current lookup-attempt columns.
5. Build 423: add `gift_card_lookup_lockouts` create/index fixture assertions.
6. Build 423: prove Gift Card additive fixture reruns idempotently without row loss.
7. Build 423: add a non-executing Notification `metadata_json`/index additive plan.
8. Build 423: add Notification pre/post schema and row-preservation assertions.
9. Build 423: resolve and fixture the `product_image_annotations(product_id, product_image_id)` additive index authority.
10. Build 423: build Membership legacy→Build 395 mapping fixtures for all supported old column aliases.
11. Build 423: prove Membership row-count and unique-tier preservation using representative legacy rows.
12. Build 423: build fractional Inventory table-copy fixtures with non-integer REAL values.
13. Build 423: add exact 1,041-row `site_item_inventory` preservation gate without seeding 1,041 fake rows.
14. Build 423: build Product/FK rebuild fixtures that refuse to run with any orphan reference.
15. Build 423: add semantic `products.product_number` uniqueness preservation including implicit UNIQUE behavior.
16. Build 423: build Accounting/default/nullability fixtures for blocker-free or explicitly mapped data only.
17. Build 423: add local constraint/default fixtures for Product Costs, Movie Catalog, Product Resource Links, and Tax Classes.
18. Build 423: resolve `search_query_terms` preserve/retire authority while retaining all five live rows until a decision is approved.
19. Build 423: resolve `__sql_test` retirement authority without using schema-count equality as a reason.
20. Build 423: produce a local release-candidate gate that still refuses executable Production mutation until every fixture family and the one blocker disposition are PASS.

## Gate status

```text
Build 410  Development D1 parity overlay          PASS
Build 412  Local RC                               PASS
Build 416  Development browser/read contracts     PASS
Build 417  Live schema/data mapping               PASS
Build 418  Live semantic classification           PASS
Build 419  Exact structural drift evidence        PASS
Build 420  20-item parity hardening               PASS (20/20 local)
Build 421  20-item Production evidence/manifest   PASS (20/20, 1 blocker)
Build 422  20-item local release fixtures          READY

Production schema mutation                        CLOSED
Production promotion                              CLOSED
```
