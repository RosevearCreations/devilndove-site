# Devil n Dove AI Context — Builds 346–348 Business & Administration Accounting Runtime Staged

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader roadmap.

Primary modular authorities include `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`, `docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md`, `docs/architecture/SOURCE_CONTROL_BRANCHING.md`, the Build 323–348 architecture notes, and validation files through `BUILD346_348_VALIDATION.md`.

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
Accounting page bridge audit                   323 validated
Accounting reads through 330                   validated
Accounting reads 331–345                       browser proven; local regressions outstanding
Accounting startup-read audit                  346 complete in source / local required
Business & Administration runtime impl         347 staged
Business Accounting runtime activation         348 staged
Contract catalog                               345
Passive service adapters                       345
Business & Administration mutation ownership   false
```

Build 306 and Build 308 retain their historical standalone local-signoff caveats; do not silently relabel them.

## Read-boundary rule

GET/read paths report schema readiness. Migrations/readiness tooling creates or repairs schema. Never restore request-time DDL to a read because Development reports `schema_ready=false`.

A loader/read-contract migration never implies mutation ownership. Existing compatibility POST/PUT/DELETE/upload/import paths remain legacy until dedicated mutation contracts are separately extracted.

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

Do not repair these inside GET handlers or the Business runtime. Fresh-install schema parity must be repaired and validated independently before any Production business-data copy.

Prior parity audit also identified Production-only active tables including `accounting_order_records`, `gift_cards`, several Command Center tables, and the `notification_dispatch_log` aggregate-schema execution discrepancy.

## Validation state

- Builds 325–330: fully validated.
- Builds 331–336: browser proven; local regressions still required.
- Builds 337–339: browser proven; local regression required; Builds 338/339 also exposed schema parity.
- Builds 340–342: browser proven; local regression required; Build 341 exposed three additional column-parity findings.
- Builds 343–345: browser proven; local regression required; all three were schema-ready in Development.
- Builds 346–348: staged / validation required.

## Build 346 — Accounting startup-read audit closure

`admin/accounting/index.html` loads eight Accounting feature scripts. The source audit confirms every automatic startup GET maps to an owned passive non-mutating read service extracted through Build 345. `admin-accounting-t2-presets.js` performs no network reads. User-triggered POSTs/uploads/imports/locks/journal actions remain compatibility mutations and are outside the startup-read activation prerequisite.

## Build 347 — passive Business & Administration runtime

`public/js/modules/business-administration/runtime.mjs` supports only the `accounting` domain and `/admin/accounting/`. It performs no network calls and no database/storage writes. It verifies registration of 26 automatic-startup read services plus the two interactive export read services. It explicitly reports `accountingMutationOwnership=false` and `createsNetworkTransport=false`.

## Build 348 — first Business & Administration activation

`business-administration` changes from planned/no runtime to in-progress with runtime domain `accounting` only. The only proven Business runtime page is `/admin/accounting/`. Marketing, Platform, Admin, Analytics, Command Center and every other Business & Administration route remain domain-bridge only.

The Accounting page cache-busts `admin.js?v=348`, which imports the Core runtime bridge with `v=348`. Core's existing verified-admin application-module lifecycle performs activation; no second loader is introduced.

Expected post-deploy state on `/admin/accounting/` after verified admin auth:

```text
application_module                       business-administration
application_mode                         active
active_application_module                business-administration
business_runtime_build                   347
business_activation_build                348
business_current_domain                  accounting
business_services_ready                  true
business_accounting_page_proven          true
business_creates_network_transport       false
business_accounting_mutation_ownership   false
```

## Next direction

1. Run the combined local checkpoint for Builds 331–348.
2. Run the Build 348 Firefox activation gate.
3. If both pass, mark Builds 331–348 according to their already-collected browser proofs and the new Business runtime proof.
4. Keep mutation ownership false; do not use runtime activation as permission to move Accounting writes.
5. Continue fresh-install schema parity separately, then choose the next bounded modular target (Business route coverage, Commerce remaining routes, or Creative & Production runtime) from source evidence.

## Validation preference

Batch related builds and provide one Git Bash block plus one Firefox-safe browser block whenever practical.
