# Devil n Dove AI Context — Builds 349–351 Creative & Production Packaging Runtime Staged

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader roadmap.

Primary modular authorities include `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`, `docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md`, `docs/architecture/SOURCE_CONTROL_BRANCHING.md`, the Build 323–351 architecture notes, and validation files through `BUILD349_351_VALIDATION.md`.

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
Accounting startup-read audit                  346 validated
Business & Administration runtime impl         347 validated
Business Accounting runtime activation         348 validated
Packaging compatibility baseline               301 validated
Packaging top-level audit                      349 staged
Creative & Production runtime impl             350 staged
Creative Packaging runtime activation          351 staged
Contract catalog                               345
Passive service adapters                       345
Accounting mutation ownership                  false
Creative/Packaging mutation ownership moved    false
```

Build 306 and Build 308 retain their historical standalone local-signoff caveats; do not silently relabel them.

## Read/runtime boundary rule

GET/read paths report schema readiness. Migrations/readiness tooling creates or repairs schema. Never restore request-time DDL to a read because Development reports `schema_ready=false`.

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
- Builds 343–345: browser proven and schema-ready. The historical local regression was corrected to stop freezing pre-348 Business runtime state; corrected local rerun still required.
- Builds 346–348: fully validated 2026-08-24. Firefox proved active `business-administration` Accounting runtime with 28 registered required services, no runtime network transport and mutation ownership false.
- Build 301 Packaging compatibility checkpoint: COMPLETE IN DEVELOPMENT with native reads/writes, verified Save Project, Build 297 fallback removal and Build 292 -> 291 write provenance.
- Builds 349–351: staged / validation required.

## Builds 349–351

### Build 349 — Packaging top-level runtime audit

The completed Build 301 Packaging checkpoint is approved as the safest first `creative-production` page. Its startup gate, client/native read transport, native client, save stabilization, read authority and write authority are already proven. No new read/write extraction is required merely to wrap it at the top-level application-module layer.

### Build 350 — passive Creative & Production runtime

`public/js/modules/creative-production/runtime.mjs` supports only `packaging` and `/admin/packaging-studio/`. It requires the existing `inventory-read`, `catalog-read`, and `content-media` services, performs no reads/writes itself, creates no network transport, and owns no Packaging/Creative mutations. It only reports the existing Packaging domain-runtime status dynamically.

### Build 351 — first Creative & Production activation

`creative-production` now has runtime domain `packaging` only. The Packaging page cache-busts `admin.js?v=351`, which loads the current Core bridge. The existing Packaging Build 297/298/300/301 script chain remains unchanged. `creative`, `caip`, and `content` remain without top-level Creative runtime coverage.

Expected Development state after verified auth and Packaging load:

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
```

## Historical regression rule

Historical regression scripts verify the durable boundaries introduced by their own build. They must not freeze later architectural state. Build 343–345 therefore does not require Business & Administration to remain inactive after Build 348.

## Next direction

1. Run the corrected Build 343–345 local regression plus the Build 349–351 local regression in one pull/checkpoint.
2. Browser-validate Build 351 on `/admin/packaging-studio/` without performing a mutation.
3. If both pass, mark Builds 343–345 and 349–351 validated.
4. Keep all Packaging/Creative mutation ownership unchanged.
5. Continue fresh-install schema parity separately, then source-audit either additional Creative domains or remaining Commerce/Business route coverage.

## Validation preference

Batch related builds and provide one Git Bash block plus one Firefox-safe browser block whenever practical.
