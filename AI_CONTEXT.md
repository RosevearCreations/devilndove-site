# Devil n Dove AI Context — Build 348 Business & Administration Accounting Runtime Validated

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
Accounting reads through 342                   validated
Accounting reads 343–345                       browser proven; corrected local rerun required
Accounting startup-read audit                  346 validated
Business & Administration runtime impl         347 validated
Business Accounting runtime activation         348 validated
Contract catalog                               345
Passive service adapters                       345
Business & Administration mutation ownership   false
```

Build 306 and Build 308 retain their historical standalone local-signoff caveats; do not silently relabel them.

## Read-boundary rule

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

Do not repair these inside GET handlers or the Business runtime. Fresh-install schema parity must be repaired and validated independently before any Production business-data copy.

Prior parity audit also identified Production-only active tables including `accounting_order_records`, `gift_cards`, several Command Center tables, and the `notification_dispatch_log` aggregate-schema execution discrepancy.

## Validation state

- Builds 325–330: fully validated.
- Builds 331–336: fully validated 2026-08-24.
- Builds 337–339: fully validated 2026-08-24; Builds 338/339 retain separate schema-parity findings.
- Builds 340–342: fully validated 2026-08-24; Build 341 retains separate schema-parity findings.
- Builds 343–345: browser proven and schema-ready. Original local run reached a stale historical assertion requiring `business-administration.entry === null`; Build 348 intentionally invalidated that assumption. The regression was corrected in commit `d630c11f6241fb4cab1bc897bfc6396033961811`; corrected local rerun still required.
- Builds 346–348: fully validated 2026-08-24. Local regression passed and Firefox proved active `business-administration` Accounting runtime with 28 required services, no runtime network transport and mutation ownership false.

## Build 346 — Accounting startup-read audit closure

`admin/accounting/index.html` loads eight Accounting feature scripts. Every automatic startup GET maps to an owned passive non-mutating read service extracted through Build 345. `admin-accounting-t2-presets.js` performs no network reads. User-triggered POSTs/uploads/imports/locks/journal actions remain compatibility mutations and are outside the startup-read activation prerequisite.

## Build 347 — passive Business & Administration runtime

`public/js/modules/business-administration/runtime.mjs` supports only the `accounting` domain and `/admin/accounting/`. It performs no network calls and no database/storage writes. It verifies registration of 26 automatic-startup read services plus two interactive export read services. It reports `accountingMutationOwnership=false` and `createsNetworkTransport=false`.

## Build 348 — first Business & Administration activation

`business-administration` is `in-progress` with runtime domain `accounting` only. The only proven Business runtime page is `/admin/accounting/`. Marketing, Platform, Admin, Analytics, Command Center and every other Business & Administration route remain domain-bridge only.

Validated Development state:

```text
application_module                       business-administration
application_mode                         active
active_application_module                business-administration
business_runtime_build                   347
business_activation_build                348
business_current_domain                  accounting
business_services_ready                  true
business_required_service_count          28
business_accounting_page_proven          true
business_creates_network_transport       false
business_accounting_mutation_ownership   false
```

## Historical regression rule

Historical regression scripts verify the durable boundaries introduced by their own build. They must not freeze later architectural state. In particular, a Build 343–345 regression must not require Business & Administration to remain inactive after Build 348 activates it.

## Next direction

1. Pull current `dev` and rerun only `scripts/build343_345_accounting_read_batch_test.py` to close the historical 343–345 local gap.
2. Source-audit the existing Packaging domain runtime as the safest candidate for the first bounded top-level `creative-production` activation.
3. If Packaging audit is clean, stage Builds 349–351 as Packaging runtime audit, passive Creative & Production runtime implementation, and `/admin/packaging-studio/`-only activation.
4. Keep mutation ownership unchanged during that activation.
5. Continue fresh-install schema parity separately before any Production business-data copy.

## Validation preference

Batch related builds and provide one Git Bash block plus one Firefox-safe browser block whenever practical.
