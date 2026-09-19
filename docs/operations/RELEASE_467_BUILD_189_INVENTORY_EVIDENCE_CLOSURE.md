# Release 467 — Build 189 Inventory Evidence Closure

## Goal

Build 189 closes the Inventory identity and operational-evidence gaps exposed by Build 183 while preserving Inventory Operations as the only owner of Tool/Supply stock, cost, lifecycle and count facts.

The focus is not bulk rewriting. The focus is a bounded reviewed queue for duplicate identity, supplier/source evidence, catalog-reference drift and count-due status.

## Scope

Build 189 should:

- surface unresolved duplicate-identity groups with enough evidence to compare them safely;
- distinguish missing supplier name from missing source/reference evidence;
- show catalog-reference matches, unmatched references and obvious stale-reference cases;
- make count-due items actionable without performing the count automatically;
- route edits to the existing Inventory Operations authority;
- support one-record recheck after a reviewed correction;
- preserve movement/audit history and lifecycle state;
- keep reorder/economic decisions advisory unless the existing Inventory owner already supports the reviewed action.

## Acceptance

Build 189 is GREEN only when:

1. Inventory review reads are bounded and provider-metered.
2. Duplicate groups are explainable and no automatic merge occurs.
3. Supplier/source corrections cannot silently rewrite stock quantity or historical cost.
4. Count-due review cannot manufacture a count result.
5. Catalog-reference repair fails closed when the referenced Product/catalog record no longer matches.
6. No page-load batch mutation or recurring polling is introduced.
7. Exact-SHA Development gates and protected-main Production promotion are GREEN.

## Safety boundary

Build 189 performs no:

- schema migration;
- request-time DDL;
- automatic duplicate merge;
- automatic supplier purchasing;
- automatic reorder;
- automatic on-hand quantity change;
- wholesale Production data replacement;
- R2 mutation;
- payment/refund action;
- accounting posting.

## Successor

Build 190 — Product & Inventory Media Evidence Closure.


## Implemented closure design

Build 189 extends the Build 183 Inventory identity authority rather than creating a second Inventory editor.

- The existing explicit queue remains capped at 40 issue rows.
- A new `mode=record&inventory_id=...` path rechecks exactly one Inventory target after a reviewed correction.
- The one-record recheck returns at most 12 active duplicate-group members and at most 12 same-key catalog candidates.
- Supplier-name, supplier-SKU and source-reference evidence are reported separately.
- Catalog evidence is classified as `matched`, `stale_archived`, `kind_drift` or `missing`.
- `catalog_reference_safe` is fail-closed unless the current target timestamp still matches and an active same-kind catalog record exists.
- Count-due state is evidence only. Build 189 never writes a physical count.
- Duplicate evidence is comparison-only. Build 189 never merges records or combines stock/cost values.
- Inventory Operations and Inventory Integrity remain the only mutation authorities.

## Development D1 budget

The exact Development Build 189 proof is provider-metered and capped at **20,000 rows read**. That ceiling is intentionally below the previous 50,000 Build 183 ceiling while leaving room for one grouped Inventory/catalog evidence scan. It performs **zero D1 mutation**.

## Production path

Build 189 is code-only and requires **no canonical migration**. Production promotion must therefore remain on the **zero-D1 code-only path**, with exact Production Pages deployment, Production Live Resource Integrity and retained Product public proofs GREEN.
