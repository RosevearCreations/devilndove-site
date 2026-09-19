# Release 467 — Build 185 Product Resource / Cost / Usage Linkage

## Goal

Build 185 repairs the connection between finished Products and the Tools/Supplies used to make them without creating a new catalog authority.

The owning authorities remain:

- `product_resource_links` — Product-to-Tool/Supply relationship, quantity-per-use/batch, consumption mode and lot-size semantics.
- `site_item_inventory` — Tool/Supply identity, purchase-unit cost and package quantity.
- `site_inventory_usage_profiles` — exact/estimated/reusable/log-only usage behavior.
- `site_inventory_base_balances` — canonical usable/base-unit quantity and cost conversion.
- `inventory_purchase_lots` + `inventory_lot_policies` — purchase-lot evidence and reconciliation.
- `product_resource_ingredient_profiles` — Supply ingredient/label facts.

No Build 185 schema migration is required.

## Problems corrected

### Per-link Inventory/catalog rescans

The prior selected-Product loader resolved Inventory and catalog identity with correlated subqueries for every Product resource link. Build 185 uses ranked Inventory and catalog CTEs plus a grouped purchase-lot projection so each contributing authority is read once for the selected Product request.

### N+1 base-balance reads

After loading links, the Release 461 overlay performed one base-balance lookup per linked Tool/Supply. Build 185 collects the selected Product's Inventory IDs and loads canonical base balances with one bounded `IN (...)` query.

### Hidden linkage quality

The Product-resource editor already stored quantity, consumption mode and lot-size facts, but it did not clearly expose whether a saved link had:

- no Inventory match;
- inactive Inventory;
- no cost evidence;
- a defaulted quantity-per-use;
- defaulted Supply usage setup;
- a Tool using a consumable tracking mode;
- end-of-lot semantics with no purchase lot;
- purchase lots requiring reconciliation.

Build 185 returns explicit per-link health and a selected-Product summary. It does not mutate anything automatically.

## Runtime behavior

Product Resources remains paused when Inventory Operations first opens.

An operator must choose **Load Product resources**. The initial explicit request loads:

- at most 120 Product identities for the selector;
- links for one selected Product only;
- one grouped/ranked Inventory/catalog projection for those links;
- one batched base-balance read for the matched Inventory IDs;
- no blank Tool/Supply resource catalog.

Tool/Supply search still requires a typed search term and returns at most 120 rows in the compatibility path.

## Linkage health

Each saved link is classified as `ready` or `review`.

Review codes include:

- `missing_inventory_match`
- `inactive_inventory_match`
- `missing_cost_evidence`
- `quantity_per_use_defaulted`
- `lot_size_defaulted`
- `usage_profile_defaulted`
- `tool_usage_mode_attention`
- `end_of_lot_without_purchase_lot`
- `lot_reconciliation_attention`

The summary reports ready/review counts, missing Inventory matches, missing cost evidence, usage/lot attention and estimated resource cost per finished Product.

## Save authority

Build 185 does not introduce a new write endpoint.

`POST /api/admin/product-resources` continues to use the proven shared atomic replacement authority in `_productResourcePersistence.js`. Product links are reviewed and saved explicitly by the operator.

No automatic Inventory consumption, reservation, receiving, lot reconciliation, Product publication, provider action or accounting posting is added.

## D1 acceptance

The Build 185 workflow executes the live Development D1 evidence query only for the exact SHA pushed to `dev`.

Pull-request iterations perform source/local proof only.

The exact Development query uses ranked/grouped Inventory, usage-profile and purchase-lot authorities and records Cloudflare/Wrangler `meta.rows_read`.

Hard ceiling:

- Build 185 Product resource linkage proof: **25,000 rows read**

A functionally correct query that exceeds this provider-metered ceiling fails Development acceptance.

## Safety boundary

Build 185 performs:

- no schema migration;
- no Production business-data copy;
- no automatic Product-resource write;
- no automatic Inventory quantity/cost mutation;
- no automatic lot reconciliation;
- no R2 mutation or listing;
- no provider/publication execution;
- no payment/refund action;
- no accounting posting.

Production may receive the exact fully GREEN Development source SHA only after the provider-metered Development proof passes.
