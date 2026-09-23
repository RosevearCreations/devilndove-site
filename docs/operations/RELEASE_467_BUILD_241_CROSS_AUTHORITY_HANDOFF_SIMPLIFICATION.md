# Release 467 Build 241 — Cross-Authority Handoff Simplification

Build 241 starts from exact Build 240 Development head `3fb60a9f3be8c40ca415ecd3cdcf7a44bff081d8` and shared tree `6388a8259bdf4902e220fed5e1dd9f21766c2357`, promoted to Production main `a9efe9826c6ad7e400fa174f7cd6a8e6d980c452`.

## Scope

Build 241 reduces duplicate re-entry between existing Product, Media, Creative, Custom Work, Inventory, Finance and Content workflows.

The shared Admin handoff client:

- carries existing identifiers between compatible Admin workspaces by same-origin query string only;
- preserves a destination identifier if that destination already supplied one;
- lets existing destination clients preselect records using the identifiers they already understand;
- adds a safe return-to-source link when a handoff provides `return_to`;
- rejects cross-origin return targets;
- never copies an authoritative business record;
- adds no new API, schema, D1/R2 mutation, provider action, Product publication, Inventory movement or Finance posting.

## Identifier families

- Product: `product_id`
- Creative / CAIP / Content: `creative_project_id`, `creative_work_project_id`, `project_id`, `content_project_id`
- Inventory: `inventory_id`, `site_item_inventory_id`
- Custom Work: `custom_request_id`
- Creation / Media: `creation_id`, `creation_key`

## Return contract

Build 241 uses `handoff_from`, `handoff_label` and `return_to` only as navigation context. The return target must resolve to the same origin and an `/admin/` route.

## Acceptance

Build 241 is accepted only when:
1. Build 240 is represented as exact Development + Production GREEN predecessor evidence;
2. the shared handoff client is injected across Admin surfaces;
3. identifier propagation is route-bounded;
4. return links are same-origin Admin-only;
5. authoritative business-record copying remains false;
6. all System, Application Quality, I.T. runtime, Repository Branch Hygiene and Build 241 dedicated gates are GREEN on the exact Development head.

Next authorized release: **Build 242 — Release, Diagnostics & Evidence Streamlining**.
