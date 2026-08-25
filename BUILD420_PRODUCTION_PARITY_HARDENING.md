# Build 420 — Production Parity Hardening (20-item batch)

## Status

**SOURCE / RELEASE-PLAN HARDENING COMPLETE — PRODUCTION WRITES CLOSED**

Builds 417–419 converted the old broad schema/data uncertainty into a bounded release problem. Build 420 deliberately batches roughly twenty related changes so the project does not return to one-small-change-at-a-time parity work.

This build does **not** apply DDL to Production, copy Production business data, copy CAIP metadata, or promote `dev` to `main`.

## Build 419 evidence carried forward

The live read-only Build 419 run completed against both D1 databases:

```text
Development user tables: 511
Production user tables: 512
Common tables: 510
CREATE-SQL-different common tables: 54

Exact core semantic match despite CREATE text: 14
Column-order/history-only candidates: 18
Actual structural candidates: 22
```

One-sided tables remain:

```text
__sql_test                 Dev MISSING / Prod 0
search_query_terms         Dev MISSING / Prod 5
gift_card_lookup_lockouts  Dev 0 / Prod MISSING
```

The main business-data anchors already match by row count. **Broad Production → Development business-data copy remains cancelled.**

## Build 420 — 20 completed changes

1. **Build 419 is formally closed as PASS.** Its live result is now treated as evidence, not an open audit.
2. **The 14 exact semantic matches are frozen from migration scope.** We will not rebuild them merely to make stored CREATE SQL text match.
3. **The 18 column-order/history-only tables are frozen from migration scope** unless a later runtime/constraint check proves a real semantic requirement.
4. **`packaging_project_ingredients` index whitespace is classified as cosmetic.** `(...id,packaging_project_id,sort_order)` and `(...id, packaging_project_id, sort_order)` are the same SQLite index definition and are not a migration reason.
5. **Future index comparison is normalized for comma/parenthesis whitespace and redundant ASC.** Build 420 adds a local regression helper so formatting cannot re-enter the structural-drift count.
6. **Gift Card lookup-attempt parity is classified ADDITIVE.** Production needs `lookup_email`, `code_suffix`, `ip_hash`, `user_agent`, and `result_status`, plus the current lookup indexes, before the Build 413 public lookup is considered schema-ready.
7. **`gift_card_lookup_lockouts` is classified REQUIRED CURRENT SCHEMA.** It is not Development drift and must not be removed merely to equalize table counts.
8. **Membership tier policy drift is classified DATA-PRESERVING REBUILD.** Development’s Build 395 shape (`policy_id`, `tier_code`, `title`, etc.) is canonical; the old Production `membership_tier_policy_id` / `code` / `name` shape must be mapped rather than overwritten.
9. **Notification outbox drift is classified ADDITIVE.** `metadata_json` and the current notification outbox indexes belong to the Build 403 shared notification authority.
10. **Creative Project inventory post/reversal quantity drift is grouped under the fractional-inventory authority.** Development REAL quantities are intentional; Production INTEGER affinities are legacy schema, not a reason to regress Development.
11. **`product_material_return_audit` and `site_inventory_movements` quantity drift are grouped with the same fractional-inventory authority.** Preserve fractional values during any eventual Production rebuild.
12. **`site_item_inventory` is classified high-risk/data-preserving.** REAL quantities and current defaults are canonical Development behaviour; the 1,041 existing rows must be preserved exactly through any schema alignment.
13. **Product FK hardening is grouped as one rebuild family.** `product_media_score_history`, `product_review_actions`, `products`, `site_page_views`, and `supplier_purchase_order_items` have Development foreign keys that Production lacks; these require orphan prechecks before any rebuild.
14. **Product capture/index hardening is separated from Product data.** Production’s 45 Products already match by count; schema/FK/index promotion must preserve those rows and must not be implemented as a Product data copy.
15. **Accounting drift is grouped as a separate rebuild-review family.** `accounting_expenses`, `accounting_writeoffs`, and `general_ledger_accounts` contain nullability/default/index differences that cannot be safely treated as blind ALTERs.
16. **`product_costs`, `movie_catalog`, `product_resource_links`, and `tax_classes` are classified constraint/default review items.** Their exact Production data must be prechecked before tightening NOT NULL/default/type semantics.
17. **Production-only `__sql_test` is classified empty residue pending retirement review.** It has zero rows; do not copy it to Development simply for count parity.
18. **Production-only `search_query_terms` is classified preserve/pending-authority.** Its five rows are not to be deleted or copied until current runtime/aggregate authority is resolved.
19. **CAIP’s 113-row delta is formally excluded from ordinary D1 copy.** Forty-five uploaded rows are linked to Creative Assets and their binaries live in the private Production R2 bucket; D1 metadata cannot be copied alone to Development.
20. **A fail-closed Production rollout sequence is now defined.** Backup/export evidence, data-null/orphan prechecks, additive changes first, data-preserving rebuilds second, FK/index verification, browser/read-contract validation, then promotion decision. Production remains closed until every gate is green.

## Build 420 production rollout classes

### A — No action / preserve historical difference

- 14 exact core semantic matches from Build 419.
- 18 column-order/history-only candidates from Build 419.
- `packaging_project_ingredients` index formatting difference.
- `__sql_test` remains Production-only until explicit retirement; do not create it in Development merely for parity.

### B — Additive candidates

- `gift_card_lookup_attempts`: add current lookup evidence columns and indexes.
- `gift_card_lookup_lockouts`: create current table/index.
- `notification_outbox`: add `metadata_json` and current indexes.
- `product_image_annotations`: current Development lookup index may be added after authority confirmation.

Additive does not mean auto-approved: Build 421 must still verify current migration authority and existing Production data before a write plan is executable.

### C — Data-preserving rebuild candidates

- `membership_tier_policies`
- `accounting_expenses`
- `accounting_writeoffs`
- `general_ledger_accounts`
- `creative_project_inventory_posts`
- `creative_project_inventory_reversals`
- `product_material_return_audit`
- `site_inventory_movements`
- `site_item_inventory`
- `product_media_score_history`
- `product_review_actions`
- `products`
- `site_page_views`
- `supplier_purchase_order_items`
- `product_costs`
- `movie_catalog`
- `product_resource_links`
- `tax_classes`

A rebuild candidate is **not permission to rebuild**. It means SQLite cannot express all desired type/default/FK/nullability changes safely with a simple additive ALTER. Every rebuild requires row-count/data checks, explicit column mapping, foreign-key verification and a rollback/export boundary.

## CAIP decision

Production Build 418 evidence recorded:

```text
aborted    1 row     467.8 MiB   linked_assets=0
archived  66 rows    114.3 GiB   linked_assets=0
failed     1 row       3.8 GiB   linked_assets=0
uploaded  45 rows     91.9 GiB   linked_assets=45
```

Development has zero `caip_media_upload_files` rows. Leave this dataset Production-only for the current parity release unless a later, explicit CAIP portability project copies/verifies the matching private-R2 objects and D1 relationships together.

## Required rollout order

1. Preserve a current Production D1 backup/export and record its identifier/date.
2. Run read-only row/null/orphan/duplicate prechecks for every table entering mutation scope.
3. Resolve `search_query_terms` authority and keep its five rows untouched until resolved.
4. Apply additive Gift Card changes first in the reviewed Production migration helper.
5. Apply additive Notification changes.
6. Apply any approved additive indexes.
7. Execute membership data-preserving rebuild only after legacy-to-current mapping is proven.
8. Execute fractional-inventory rebuild group only after fractional-value and row-count prechecks.
9. Execute Product/FK rebuild group only after orphan checks and Product identity uniqueness checks.
10. Execute Accounting/constraint rebuilds only after nullable/default compatibility checks.
11. Run `PRAGMA foreign_key_check` and targeted schema signatures.
12. Re-run bounded business-data anchor counts; counts must not unexpectedly shrink/grow.
13. Re-run Gift Card, Customer Documents, Orders/Payment browser/read contract proof.
14. Keep provider mutations fail-closed while validating.
15. Only then make a Production promotion decision.

## Next 20 ordered changes

These are the **next 20** to mark through in the canonical roadmap after Build 420:

1. Build 421: read-only Production nullability/data-risk preflight for `accounting_expenses` and `accounting_writeoffs`.
2. Build 421: read-only Production category/default preflight for `general_ledger_accounts`.
3. Build 421: read-only Product Cost null/identity preflight.
4. Build 421: read-only Movie Catalog `metadata_status` preflight.
5. Build 421: read-only Product Resource Links fractional/default preflight.
6. Build 421: read-only Tax Class code/rate preflight.
7. Build 421: read-only fractional-value scan for `site_item_inventory`.
8. Build 421: read-only fractional-value scan for `site_inventory_movements`.
9. Build 421: read-only fractional-value scan for Creative Project inventory posts/reversals.
10. Build 421: read-only fractional-value scan for Product material-return audit.
11. Build 421: orphan scan for `product_media_score_history` → Products/Users.
12. Build 421: orphan scan for `product_review_actions` → Users.
13. Build 421: orphan scan for Product capture user references.
14. Build 421: orphan scan for `site_page_views` → visitor sessions.
15. Build 421: orphan scan for supplier PO items → Inventory.
16. Build 421: verify `products.product_number` uniqueness semantically, including implicit UNIQUE indexes.
17. Build 421: resolve `search_query_terms` current runtime/schema authority while preserving its five Production rows.
18. Build 421: classify `__sql_test` aggregate-schema origin and retirement safety.
19. Build 421: generate the first **non-executing** Production migration manifest with ordered additive/rebuild phases and rollback boundaries.
20. Build 421: add a local release gate that refuses to produce an executable Production helper until all nineteen preceding evidence checks are PASS.

## Gate status

```text
Build 410  Development D1 parity overlay          PASS
Build 412  Local RC                               PASS
Build 416  Development browser/read contracts     PASS
Build 417  Live schema/data mapping               PASS
Build 418  Live semantic classification           PASS
Build 419  Exact structural drift evidence        PASS
Build 420  20-item parity hardening/rollout plan  PASS (source-only)

Broad Production -> Development data copy         CANCELLED
CAIP D1-only metadata copy                        FORBIDDEN
Production schema mutation                        CLOSED
Production promotion                              CLOSED
```

No Production mutation is authorized by this document.
