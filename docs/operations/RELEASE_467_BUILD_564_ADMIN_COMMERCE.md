# Release 467 · Build 564 — Admin Modernization: Commerce

## Scope and decisions

This build applies the existing modern Admin direction to the remaining Commerce workspaces without replacing their business logic. The Build 556 static route audit is provisional and does not imply owner visual acceptance.

| Admin route | Audit decision | Build 564 change | Source / authority retained |
| --- | --- | --- | --- |
| `/admin/products/` | KEEP | **No markup or CSS opt-in change** | Existing low-read Product Browser and its original workbench |
| `/admin/orders/` | IMPROVE | Shared Commerce header, four-destination navigation, KPI/list/detail card refinement, compact optional safety guidance | Single Build 150 Orders renderer, existing order-detail authority, local drafts, explicit/idempotent fulfilment and tracking audit |
| `/admin/order-fulfillment-care/` | REVIEW | Shared Commerce header/navigation, readable queue/transition states, optional safety guidance | Build 111 readiness reconciliation, Build 82 transitions with Build 150 response-loss bridge, maker evidence, and read-only customer-care queue |
| `/admin/inventory-operations/` | REVIEW | Shared Commerce header/navigation, improved status panels and stock desk surfaces, optional safety guidance | Existing receiving, provenance, asset parity, material-usage reconciliation, stock/unit, cost review, Product Resources and taxonomy operations |

The new `css/admin-commerce-564.css` only applies under the explicit `data-dd-commerce-v564` attribute. No general `styles.css` change, data migration, worker/API change, payment/refund/carrier action, or new inventory transition is introduced. Every existing operational renderer, element ID and script entry remains mounted. Existing source-backed KPIs and data states are **not** replaced with mock counts.

## Operator safeguards

- Payment, refunds, buyer sending, carrier calls and accounting posting remain outside Orders and Fulfilment. Fulfilment changes retain explicit confirmation and stable `client_action_id` replay protection.
- Canada-only shipping / the existing U.S. sales and shipping suspension remains in force.
- Inventory base-unit authority is unchanged. Process assignments cannot alter stock, cost or Product links. Cost review stays explicit; navigation to the desk triggers no scan or write.
- Four-way navigation exposes Orders, Fulfilment, Inventory and the unmodified Products Browser. Each route has exactly one `aria-current="page"`; contextual information is collapsed by default without obscuring primary actions.
- The layout has small-screen breakpoints, focus-visible affordances and reduced-motion handling. The original print-only Orders packing-slip rules remain in effect.

## Proof and promotion

1. `node scripts/release467_build556_admin_interface_inventory.mjs --check` — deterministic all-Admin route audit.
2. `node --test scripts/release467_build564_commerce_modernization.test.mjs` — scoped CSS, accessible navigation, preserved mounts and workflow scripts, shipping / action safety and exact release marker.
3. Run current Application Quality and the independent Development System Gate, I.T. Admin Runtime Proof and Repository Branch Hygiene against **the same dev SHA**.
4. Promote the reviewed dev commit through a `dev → main` PR only after all four green; verify the Cloudflare production deploy and Production Live Resource Integrity Proof on **the same main SHA**.
5. Confirm `https://devilndove.com/release-version.json` shows `"build":564`, `"branch":"main"` and `"source_sha"` equal to the merged production SHA. A deployed workflow alone does not constitute live GREEN.

## Completion handoff

After full promotion, announce **Build 565 — Admin Modernization: Workshop Operations**: selectively modernize legacy requests/commissions, production calendar, workstations, capacity and work orders while keeping modern screens and critical business workflows intact.
