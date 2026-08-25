# Devil n Dove AI Context — Builds 352–354 Creative Process Runtime Staged

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader roadmap.

Primary modular authorities include `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`, `docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md`, `docs/architecture/SOURCE_CONTROL_BRANCHING.md`, architecture notes through Build 354, and validation files through `BUILD352_354_VALIDATION.md`.

## Production safety

Real Devil n Dove Production remains frozen unless deliberately promoted through the separate Production workflow. `main` must not advance merely because Development is ahead.

## Authoritative application structure

```text
                     DEVIL N DOVE APPLICATION CORE
                               |
              +----------------+----------------+
              |                |                |
       COMMERCE &         CREATIVE &       BUSINESS &
       OPERATIONS          PRODUCTION      ADMINISTRATION
```

Domains remain internal ownership/service boundaries beneath exactly three top-level modules. Core owns shared infrastructure only; business rules remain domain-owned.

## Source-control rule

```text
main  = retained Production/legacy release line
dev   = active modularization and Development integration line
```

Application modules are not permanent Git branches.

## Current modular state

```text
Core architecture                              302
Core runtime implementation                    305
Commerce/Operations runtime                    315
Accounting reads through 342                   validated
Accounting reads 343–345                       browser proven; corrected local rerun required
Business & Administration Accounting runtime   348 validated
Packaging compatibility baseline               301 validated
Creative Packaging runtime                     351 browser proven; local required
Creative Process read contract                 352 staged
Creative & Production runtime implementation   353 staged
Creative Process runtime activation            354 staged
Contract catalog                               345
Default passive service adapters               345
Creative Process passive service registration  353 runtime-local
Accounting mutation ownership moved            false
Creative/Packaging mutation ownership moved    false
```

Build 306 and Build 308 retain their historical standalone local-signoff caveats; do not silently relabel them.

## Read/runtime boundary rule

GET/read paths report schema readiness; migrations/readiness tooling creates or repairs schema. Never restore request-time DDL to a read because Development reports a schema deficit.

A loader/read-contract migration or top-level runtime activation never implies mutation ownership. Existing compatibility POST/PUT/DELETE/upload/import paths remain legacy until dedicated mutation contracts are separately extracted.

## Development schema-parity findings — separate track

```text
Build 324  orders.total_amount|total
Build 338  accounting_fixed_assets.location_note
Build 339  hst_gst_review_records
Build 339  accountant_export_manifests
Build 341  user_profiles.profile_id
Build 341  access_tiers.tier_id
Build 341  payment_disputes.payment_dispute_id
```

Do not repair these inside GET handlers or top-level runtimes. Fresh-install schema parity must be repaired and validated independently before any Production business-data copy.

Prior parity audit also identified Production-only active tables including `accounting_order_records`, `gift_cards`, several Command Center tables, and the `notification_dispatch_log` aggregate-schema execution discrepancy.

## Validation state

- Builds 325–330: fully validated.
- Builds 331–336: fully validated 2026-08-24.
- Builds 337–339: fully validated 2026-08-24; Builds 338/339 retain separate schema-parity findings.
- Builds 340–342: fully validated 2026-08-24; Build 341 retains separate schema-parity findings.
- Builds 343–345: browser proven and schema-ready. The historical regression was corrected after Build 348 invalidated its obsolete inactive-Business assertion; corrected local rerun still required.
- Builds 346–348: fully validated 2026-08-24. Business & Administration is active only for `/admin/accounting/`; its runtime creates no network transport and owns no Accounting mutations.
- Build 301 Packaging compatibility checkpoint: COMPLETE IN DEVELOPMENT with native reads/writes, verified Save Project, Build 297 legacy GET fallback removal, and Build 292 -> 291 write provenance.
- Builds 349–351: browser proven 2026-08-24; local regression required. Firefox proved active `creative-production` Packaging runtime while the Build 301 Packaging chain remained healthy and mutation ownership unchanged.
- Builds 352–354: staged / validation required.

## Builds 349–351 browser proof

Validated Development state:

```text
application_module                       creative-production
application_mode                         active
active_application_module                creative-production
creative_runtime_build                   350
creative_activation_build                351
creative_current_domain                  packaging
creative_services_ready                  true
creative_required_service_count          3
creative_packaging_page_proven           true
creative_creates_network_transport       false
creative_packaging_mutation_ownership    false
packaging_domain_runtime_state           active
packaging_client_transport_build         297
packaging_client_transport_ready         true
packaging_legacy_get_fallback_removed    true
packaging_legacy_server_get_reachable    false
compatibility_build                      301
compatibility_state                      active
native_read_status                       200
```

## Build 352 — Creative Process read contract

`/api/admin/contracts/creative-process-read` is GET-only and Creative-owned. It wraps the retained non-mutating Creative Process GET and reports Build 352, legacy Build 274, owner `creative`, `request_time_schema_mutation=false`, and `mutation_ownership_moved=false`.

The legacy Creative Process POST authority is unchanged. `post_material_inventory`, `record_inventory_use`, and `correct_inventory_use` continue to consume Inventory-owned `inventory-post` and `inventory-reverse` authorities.

## Build 353 — Creative & Production runtime expansion

`public/js/modules/creative-production/runtime.mjs` now supports `packaging` and `creative` only. Packaging keeps its three existing requirements. Creative Process requires four services:

```text
creative-process-read
inventory-read
inventory-post
inventory-reverse
```

`public/js/modules/creative-production/creative-process-read-service.mjs` passively registers `creative-process-read` into Core's shared registry when the Creative runtime loads. Registration performs no HTTP request; `list()` calls the Build 352 contract only when explicitly invoked.

The top-level runtime still creates no network transport and owns no Packaging or Creative mutations.

## Build 354 — Creative Process activation

`creative-production` runtime domains are now `packaging` and `creative`. Explicit page coverage is limited to:

```text
/admin/packaging-studio/
/admin/creative-process/
```

The Creative Process page loads `admin.js?v=354` before its retained Build 274 UI script. CAIP and Content remain without top-level Creative runtime coverage.

## Historical regression rule

Historical regression scripts verify durable boundaries introduced by their own build. They must not freeze later architectural state.

## Next direction

1. Run the combined local checkpoint for Builds 343–345, 349–351 and 352–354.
2. Browser-validate Build 354 on `/admin/creative-process/` using GET/read checks only.
3. If clean, mark those remaining local/browser gates validated.
4. Keep Creative Process and Packaging mutation authority unchanged.
5. Continue fresh-install schema parity separately, then source-audit CAIP and Content as the remaining Creative & Production domains before expanding top-level coverage.

## Validation preference

Batch related builds and provide one Git Bash block plus one Firefox-safe browser block whenever practical.
