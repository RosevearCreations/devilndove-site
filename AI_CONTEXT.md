# Devil n Dove AI Context — Build 358 Creative Dependency Gate Fix Staged

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
Creative Process read contract                 352 read contract browser-proven
Creative Process top-level activation           354 local proven; initial browser activation failed
Content Studio read contract                   355 staged
Creative & Production runtime coverage          357 staged
Creative dependency gate correction             358 staged
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
- Builds 352–354: local regression passed. Initial browser proof on `/admin/creative-process/` exposed a real top-level activation dependency defect. The Build 352 read contract itself returned 200 and correct non-mutating metadata.
- Builds 355–357: staged / validation required.
- Build 358: staged dependency-gate correction; local + browser revalidation required.

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

## Initial Build 354 browser failure

Observed on `/admin/creative-process/` after the Build 357 deployment:

```text
Creative & Production creative boundary is missing required services: inventory-post, inventory-reverse
```

State:

```text
application_module          creative-production
application_mode            activation-failed
active_application_module   null
creative_domain             creative
runtime_build               356
activation_build            357
runtime_state               registered
services_ready              false
page_proven                 false
contracts_ok                true
services_ok                 true
```

This was a real runtime defect, not a stale historical assertion.

## Root cause

Core's default passive browser service adapters register read services such as `inventory-read` and `inventory-cost`; they do not register `inventory-post` or `inventory-reverse`.

Build 310 intentionally defines those two as Inventory-owned mutation authorities and creates no network transport. The retained Creative Process POST path calls the Inventory contracts directly when a user explicitly posts/reverses reviewed material usage.

The top-level Creative runtime therefore must not require those mutation authorities as passive browser services merely to activate the page.

## Build 358 — dependency gate correction

Creative activation services are now:

```text
creative-process-read
inventory-read
```

Retained mutation authorities are declared separately:

```text
inventory-post
inventory-reverse
```

Runtime invariants:

```text
BUILD                                      358
ACTIVATION_BUILD                           357
DEPENDENCY_GATE_FIX_BUILD                  358
createsNetworkTransport                    false
creativeMutationOwnership                  false
ownsCreativeMutations                      false
mutationAuthoritiesRequiredAsActivationServices false
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

## CAIP blocker

CAIP is not activation-ready. `/api/admin/creative-assets` GET still executes:

```text
ensureCreativeAssetIntelligenceSchema(state.db)
ensureCreativeAssetOperationsSchema(state.db)
```

CAIP also has a separate automatic `/api/admin/caip-media-intake` GET. Keep `caip` outside `creative-production.runtimeDomains` until both startup read paths are extracted/audited and GET-time schema creation is removed.

## Windows Git pack cleanup note

Windows previously refused to unlink an obsolete `.git/objects/pack/*.idx` and matching `.pack` during automatic Git housekeeping. Fast-forward and regressions still succeeded. Use `git -c gc.auto=0 pull ...` while validating if needed; do not manually delete one half of a pack pair.

## Historical regression rule

Historical regression scripts verify durable boundaries introduced by their own build. They must not freeze later shared runtime build numbers/cache versions or encode mutation-authority registration as a prerequisite when that was never part of the boundary.

Build 349–351, Build 352–354, and Build 355–357 regressions are future-compatible with later Creative runtime changes.

## Next direction

1. Pull Build 358 with automatic Git GC disabled if needed.
2. Run `build352_354`, `build355_357`, and `build358` regressions.
3. Repeat the Firefox GET/runtime proof on `/admin/creative-process/`; expected required service count is now 2.
4. If Creative Process activates, browser-validate Content Studio without POST actions.
5. Keep Creative Process, Packaging and Content Studio mutation authority unchanged.
6. Extract/audit CAIP automatic reads next; do not activate CAIP while GET creates schema.
7. Continue fresh-install schema parity separately before Production business-data copy.

## Validation preference

Batch related builds and provide one Git Bash block plus Firefox-safe browser blocks whenever practical.
