# Devil n Dove AI Context — Build 358 Browser Proven

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader roadmap.

Primary modular authorities include `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`, `docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md`, architecture notes through Build 357, `BUILD352_354_VALIDATION.md`, `BUILD355_357_VALIDATION.md`, and `BUILD358_VALIDATION.md`.

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
Creative Process read contract                 352 browser-proven
Creative Process top-level activation           browser-proven after Build 358
Content Studio read contract                   355 staged
Creative & Production runtime coverage          357 staged
Creative dependency gate correction             358 browser-proven / local required
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

- Builds 325–345: fully validated through the existing batch checkpoints; Builds 338/339/341 retain separate schema-parity findings.
- Builds 346–348: fully validated. Business & Administration is active for `/admin/accounting/` only; mutation ownership remains false.
- Build 301 Packaging compatibility checkpoint: COMPLETE IN DEVELOPMENT.
- Builds 349–351: fully validated. Packaging remains on the proven Build 301 authority chain.
- Builds 352–354: original local regression passed. Initial browser activation failed for a real dependency-gate defect. Build 352 read contract itself passed. Browser activation now passes after Build 358. Corrected local regression still required.
- Builds 355–357: staged. Corrected local regression and Content Studio browser proof still required.
- Build 358: browser proof passed 2026-08-24. Corrected local regression required before final closure.

## Build 352 — Creative Process read contract

`/api/admin/contracts/creative-process-read` is GET-only and Creative-owned. Browser proof returned:

```text
status                         200
build                          352
legacy_build                   274
owner                          creative
contract                       creative-process-read
request_time_schema_mutation   false
mutation_ownership_moved       false
inventory_post_authority       inventory-post
inventory_reversal_authority   inventory-reverse
```

The legacy Creative Process POST authority is unchanged. `post_material_inventory`, `record_inventory_use`, and `correct_inventory_use` continue to consume Inventory-owned `inventory-post` and `inventory-reverse` HTTP authorities.

## Build 358 — dependency gate correction and browser proof

The initial Creative Process activation failed because the shared Creative runtime incorrectly required `inventory-post` and `inventory-reverse` as registered Core browser services. Those are mutation authorities, not passive activation services.

Build 358 now uses:

```text
Creative activation services:
  creative-process-read
  inventory-read

Retained mutation authorities:
  inventory-post
  inventory-reverse
```

Browser proof after Build 358 deployment:

```text
application_module                     creative-production
application_mode                       active
active_application_module              creative-production
creative_domain                        creative
runtime_entry                          ../modules/creative-production/runtime.mjs?v=358
runtime_build                          358
activation_build                       357
dependency_gate_fix_build              358
runtime_state                          active
services_ready                         true
required_service_count                 2
required_services                      ["creative-process-read","inventory-read"]
mutation_authority_count               2
mutation_authorities                   ["inventory-post","inventory-reverse"]
mutation_authorities_activation_gate   false
page_proven                            true
creates_network_transport              false
creative_mutation_ownership            false
contracts_ok                           true
services_ok                            true
```

No Inventory mutation browser service was invented. No POST implementation moved. Build 310 remains the authority definition for Inventory post/reverse.

## Build 355 — Content Studio read extraction

The automatic `/api/admin/content-studio` GET no longer calls `ensureContentAutomationSchema(db)`. Build 355 introduces a schema-aware non-mutating `content-studio-read` authority and contract.

The read service reports schema readiness and performs no CREATE/ALTER/INSERT/UPDATE/DELETE. Content Studio POST retains Build 273 mutation behavior and still owns create/refresh/update/media/deliverable/social-queue actions.

## Builds 356–357 — Content Studio top-level coverage

Creative & Production runtime domains are:

```text
packaging
creative
content
```

Explicit pages:

```text
/admin/packaging-studio/
/admin/creative-process/
/admin/content-studio/
```

Content requires only `content-studio-read`. Content mutation ownership remains false.

## CAIP startup-read audit correction

Earlier notes treated CAIP's `ensure...Schema()` calls as request-time schema creation. Current source shows that is not true.

`ensureCreativeAssetIntelligenceSchema(db)` is migration-owned verification only: it performs bounded SELECT checks against required CAIP tables and throws if the migration chain is missing. `ensureCreativeAssetOperationsSchema(db)` is likewise SELECT-only verification. `assertCaipMediaIntakeSchema(db)` verifies the media-intake tables with SELECTs and caches only successful capability checks.

The CAIP page currently starts two automatic GETs:

```text
/admin/creative-assets/ UI
  -> GET /api/admin/creative-assets

/admin/creative-assets/ media-intake UI
  -> GET /api/admin/caip-media-intake
```

The main CAIP GET calls the verification-only schema helpers, `listCreativeAssetProjects`, `getCreativeProjectDetail`, and `loadCreativeAssetOperations`. Those helpers repeat verification but do not create schema during GET.

The media-intake GET calls `listCaipMediaIntake`, `getCaipMediaIntakeReadiness`, and an optional duplicate audit. Its schema assertion is also verification-only.

Therefore CAIP is **not blocked by request-time DDL**. Its remaining modular gap is that these two startup reads are still direct compatibility reads with no explicit passive CAIP read contracts/services or top-level `caip` runtime coverage.

Do not activate CAIP merely because the DDL concern is cleared. First formalize both startup read boundaries and prove that the top-level runtime can require only passive/read services while leaving CAIP POST/upload/governance/probe/derivative/review-link mutations on their existing authorities.

## Windows Git pack cleanup note

Windows previously refused to unlink an obsolete `.git/objects/pack/*.idx` and matching `.pack` during automatic Git housekeeping. Fast-forward and regressions still succeeded. Use `git -c gc.auto=0 pull ...` while validating if needed; do not manually delete one half of a pack pair.

## Historical regression rule

Historical regression scripts verify durable boundaries introduced by their own build. They must not freeze later shared runtime build numbers/cache versions or encode mutation-authority registration as a prerequisite when that was never part of the boundary.

Build 349–351, Build 352–354, and Build 355–357 regressions are future-compatible with later Creative runtime changes.

## Next direction

1. Pull the browser-proof documentation checkpoint with automatic Git GC disabled if needed.
2. Run `build352_354`, `build355_357`, and `build358` corrected regressions.
3. Browser-validate `/admin/content-studio/` without POST actions.
4. If all local tests plus Content Studio browser proof pass, mark Builds 352–358 fully validated.
5. Keep Creative Process, Packaging and Content Studio mutation authority unchanged.
6. Next CAIP batch should formalize both automatic read boundaries first, then add `caip` top-level coverage only after those passive services are proven. Do not move CAIP POST/upload/governance/probe/derivative/review-link mutations.
7. Continue fresh-install schema parity separately before Production business-data copy.

## Validation preference

Batch related builds and provide one Git Bash block plus Firefox-safe browser blocks whenever practical.
