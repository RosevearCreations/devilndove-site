# Devil n Dove AI Context — Builds 355–357 Content Studio Runtime Staged

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader roadmap.

Primary modular authorities include `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`, `docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md`, `docs/architecture/SOURCE_CONTROL_BRANCHING.md`, architecture notes through Build 357, and validation files through `BUILD355_357_VALIDATION.md`.

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
Accounting reads through 345                   validated
Business & Administration Accounting runtime   348 validated
Packaging compatibility baseline               301 validated
Creative Packaging runtime                     351 validated
Creative Process read contract                 352 local proven; browser required
Creative Process top-level activation           354 local proven; browser required
Content Studio read contract                   355 staged
Creative & Production runtime implementation   356 staged
Content Studio top-level activation            357 staged
Contract catalog                               345
Default passive service adapters               345
Creative Process passive service registration  353 runtime-local
Content Studio passive service registration    356 runtime-local
Accounting mutation ownership moved            false
Creative/Packaging mutation ownership moved    false
Content mutation ownership moved               false
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
- Builds 343–345: fully validated 2026-08-24. Browser and corrected local regression both passed; no new schema-parity deficit appeared.
- Builds 346–348: fully validated 2026-08-24. Business & Administration is active only for `/admin/accounting/`; its runtime creates no network transport and owns no Accounting mutations.
- Build 301 Packaging compatibility checkpoint: COMPLETE IN DEVELOPMENT with native reads/writes, verified Save Project, Build 297 legacy GET fallback removal, and Build 292 -> 291 write provenance.
- Builds 349–351: fully validated 2026-08-24. Browser proof and corrected local regression both passed; Packaging remains on its proven Build 301 authority chain.
- Builds 352–354: local regression passed 2026-08-24. Browser activation proof on `/admin/creative-process/` remains required.
- Builds 355–357: staged / validation required.

## Builds 349–351 validated Packaging boundary

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

Historical regressions must validate this durable Packaging boundary rather than freeze later Creative runtime expansion.

## Build 352 — Creative Process read contract

`/api/admin/contracts/creative-process-read` is GET-only and Creative-owned. It wraps the retained non-mutating Creative Process GET and reports Build 352, legacy Build 274, owner `creative`, `request_time_schema_mutation=false`, and `mutation_ownership_moved=false`.

The legacy Creative Process POST authority is unchanged. `post_material_inventory`, `record_inventory_use`, and `correct_inventory_use` continue to consume Inventory-owned `inventory-post` and `inventory-reverse` authorities.

## Builds 353–354 — Creative Process activation

The Creative & Production runtime gained the `creative` domain and `/admin/creative-process/` coverage. Creative Process requires:

```text
creative-process-read
inventory-read
inventory-post
inventory-reverse
```

Local regression passed. Browser activation proof remains required.

## Build 355 — Content Studio read extraction

The old automatic `/api/admin/content-studio` GET called `ensureContentAutomationSchema(db)`, and the shared read helpers called the same schema-creating function internally.

Build 355 introduces `functions/api/_lib/contentStudioReadService.js` and `/api/admin/contracts/content-studio-read`.

The read service:

- inspects D1 with `sqlite_master` and `PRAGMA table_info` only;
- reports `schema_ready`, missing tables/columns and optional Creative/CAIP table availability;
- reads Content projects, approved products, Creative Process links, project media, deliverables and recent events;
- reports `request_time_schema_mutation=false` and `mutation_ownership_moved=false`;
- performs no CREATE/ALTER/INSERT/UPDATE/DELETE.

The legacy Content Studio GET now delegates to the Build 355 read service. POST retains Build 273 behavior and still calls `ensureContentAutomationSchema(db)` before mutations.

## Build 356 — Creative & Production Content expansion

The top-level Creative runtime now supports:

```text
packaging
creative
content
```

Content requires one passive runtime-local service:

```text
content-studio-read
```

`public/js/modules/creative-production/content-studio-read-service.mjs` registers that service without making a request. `list()` is the only HTTP boundary.

The top-level runtime still creates no network transport and owns no Packaging, Creative or Content mutations.

## Build 357 — Content Studio activation

Explicit Creative & Production coverage is now:

```text
/admin/packaging-studio/
/admin/creative-process/
/admin/content-studio/
```

`/admin/content-studio/` already belongs to the `content` domain in `dd-module-definitions.mjs`. The page now loads `admin.js?v=357` before the retained Build 273 Content Studio UI script.

Content Studio create/refresh/update/media/deliverable/social-queue POST actions remain on the legacy endpoint and are not owned by the top-level runtime.

## CAIP audit result / blocker

CAIP is not activation-ready yet. `/api/admin/creative-assets` GET still executes:

```text
ensureCreativeAssetIntelligenceSchema(state.db)
ensureCreativeAssetOperationsSchema(state.db)
```

CAIP also has a separate automatic `/api/admin/caip-media-intake` GET. Keep the `caip` domain outside `creative-production.runtimeDomains` until both startup read paths are extracted/audited and GET-time schema creation is removed.

## Windows Git pack cleanup note

During the 2026-08-24 pull to Build 354, Windows refused to unlink an obsolete `.git/objects/pack/*.idx` and matching `.pack` during Git housekeeping. The fast-forward completed successfully and Python regressions executed. Treat this as a local file-handle/cleanup issue, not a build regression. Use `git -c gc.auto=0 pull ...` while validating if needed; do not manually delete one half of a pack pair.

## Historical regression rule

Historical regression scripts verify durable boundaries introduced by their own build. They must not freeze later architectural state. Later module expansion may advance shared runtime build numbers, cache-bust versions, and supported-domain lists while preserving an earlier proven boundary.

Build 349–351 and Build 352–354 regressions are now future-compatible with later Creative runtime expansion.

## Next direction

1. Browser-validate Build 354 on `/admin/creative-process/` using GET/read checks only.
2. Pull Build 357 with automatic Git GC disabled if the Windows pack lock persists.
3. Run `build349_351`, `build352_354`, and `build355_357` regressions because Build 356 advanced the shared Creative runtime again.
4. Browser-validate Build 357 on `/admin/content-studio/` without invoking POST actions.
5. If clean, mark Builds 352–357 fully validated.
6. Keep Creative Process, Packaging and Content Studio mutation authority unchanged.
7. Extract/audit CAIP automatic reads next; do not activate CAIP while its GET still creates schema.
8. Continue fresh-install schema parity separately before Production business-data copy.

## Validation preference

Batch related builds and provide one Git Bash block plus Firefox-safe browser blocks whenever practical.
