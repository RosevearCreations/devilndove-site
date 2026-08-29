# Release 456 — Inventory & Tool Operational Workflow Depth

Updated: 2026-08-29

## Boundary

Release 456 is a **source-only Development release** on `dev` / `devilndove-site-dev.pages.dev`. It does not add a D1 migration. Development D1 remains independently verified through Release 453.

The separate live Production site remains untouched. The `devilndove-site-dev` Pages Production deployment is the writable Development application.

## Authority decision

The Release 456 source audit confirms there is one durable Tool lifecycle family:

- `site_item_inventory` — Tool identity, quantity, sourcing, reorder and `do_not_reuse`.
- `inventory_tool_lifecycle_profiles` — lifecycle status, condition, acquisition/warranty, service schedule and replacement planning.
- `inventory_tool_lifecycle_events` — inspection, maintenance, repair, calibration, damage, out-of-service, return-to-service, retirement and replacement evidence.
- `product_resource_links` — truthful Product contribution/linkage.

No parallel `site_tool_lifecycle_*` authority is present on current `dev`, so Release 456 does not manufacture a convergence migration or a second lifecycle ledger.

## Implemented workflow depth

Inventory Intelligence now joins lifecycle context read-only for Tool rows and surfaces blocked reuse, unsafe/damaged/out-of-service state, overdue/due-soon service, replacement planning, missing lifecycle review, and lifecycle/Inventory alignment issues. Tool rows link directly to their durable Tool Lifecycle workspace.

Tool Lifecycle now adds operational summary/filtering, acquisition and warranty fields already supported by the durable schema, clearer Inventory reuse alignment, service and replacement status, responsive list/detail behavior and richer lifecycle history.

Lifecycle event handling is also corrected: maintenance, repair and calibration now advance `last_service_at` even when `condition_after` is omitted, and a configured service interval advances `next_service_at`. Retirement/out-of-service/return-to-service/replacement events update lifecycle state consistently. A Tool marked `do_not_reuse` cannot be saved active or returned to service, and an unsafe Tool cannot be active.

Lifecycle events never consume Tool quantity and do not silently rewrite the Inventory `do_not_reuse` authority.

## Carried-forward proof

- Release 455 Storefront discovery/media/SEO: carried forward.
- Release 454 Admin convergence: carried forward.
- Release 453 D1/provider authority: mutation `33258377328`, independent verifier `33258415391`.
- Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- Release 456 migration: **NONE**.
- Provider execution/publication: CLOSED.
- Separate live Production mutation/promotion: CLOSED.

## Next

Financials depth is next: reconciliation, commerce-cost and reporting workflow improvements without duplicating the accounting ledger.
