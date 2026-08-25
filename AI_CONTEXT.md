# Devil n Dove AI Context — Fully Validated Through Build 364 / Build 365 Local Rerun Pending

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader roadmap.

Primary modular authorities include `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`, `docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md`, architecture notes through Build 365, and validation files through `BUILD365_VALIDATION.md`.

## Production safety

Real Devil n Dove Production remains frozen unless deliberately promoted through the separate Production workflow. `main` must not advance merely because Development is ahead.

## Authoritative structure

```text
                     DEVIL N DOVE APPLICATION CORE
                               |
              +----------------+----------------+
              |                |                |
       COMMERCE &         CREATIVE &       BUSINESS &
       OPERATIONS          PRODUCTION      ADMINISTRATION
```

Domains remain ownership/service boundaries beneath exactly three top-level modules. Core owns shared infrastructure only; business rules remain domain-owned.

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
Commerce & Operations runtime                  363
Operations Membership read contract            362
Operations Membership activation               364
Membership read implementation hardening       365 browser-passed / corrected local pending
Business & Administration Accounting runtime   348 validated
Packaging compatibility baseline               301 validated
Creative Packaging runtime                     351 validated
Creative Process read/runtime                   352–354 fully validated
Content Studio read/runtime                     355–357 fully validated
Creative dependency correction                 358 fully validated
CAIP read/runtime                               359–361 fully validated
Contract catalog                               345
Default passive service adapters               345
Accounting mutation ownership moved            false
Operations/Membership mutation ownership moved false
Creative/Packaging mutation ownership moved    false
Content mutation ownership moved               false
CAIP mutation ownership moved                  false
```

All four Creative & Production domains are now fully validated at the top-level loader/read boundary. Do not expand or rework that loader merely to create more evidence.

Build 306 and Build 308 retain their historical standalone local-signoff caveats; do not silently relabel them.

## Read/runtime boundary rule

GET/read paths report or verify schema readiness; migrations/readiness tooling creates or repairs schema. Never restore request-time DDL/default seeding to a read because Development reports a schema deficit.

A loader/read-contract migration or top-level runtime activation never implies mutation ownership. Existing compatibility POST/PUT/DELETE/upload/import paths remain legacy until dedicated mutation contracts are separately extracted.

## Validation state

```text
Builds 325–345   fully validated through existing checkpoints
Builds 346–348   fully validated
Builds 349–351   fully validated
Builds 352–354   fully validated 2026-08-25
Builds 355–357   fully validated 2026-08-25
Build 358        fully validated 2026-08-25
Builds 359–361   fully validated 2026-08-25
Builds 362–364   fully validated 2026-08-25 after Build 365 read correction
Build 365        browser passed; corrected local regression still required
```

The user-run local checkpoint on 2026-08-25 returned exact PASS for:

```text
BUILDS 352-354 CREATIVE PROCESS RUNTIME: PASS
BUILDS 355-357 CONTENT STUDIO RUNTIME: PASS
BUILD 358 CREATIVE DEPENDENCY GATE FIX: PASS
BUILDS 359-361 CAIP RUNTIME: PASS
BUILDS 362-364 OPERATIONS MEMBERSHIP RUNTIME: PASS
```

The first Build 365 local run failed only because its regression searched the entire source file for the literal text `sqlite_master`; that term remained solely in a comment describing the removed implementation. The test has been corrected to inspect the executable `readStoredRows` section instead. Do not interpret that assertion failure as an implementation failure.

## Creative & Production — closed loader/read boundary

```text
packaging -> /admin/packaging-studio/   validated
creative  -> /admin/creative-process/   validated
content   -> /admin/content-studio/      validated
caip      -> /admin/creative-assets/     validated
```

Activation services remain:

```text
packaging: inventory-read, catalog-read, content-media
creative:  creative-process-read, inventory-read
content:   content-studio-read
caip:      caip-read, caip-media-intake-read
```

The Creative top-level runtime creates no network transport and owns no Packaging, Creative, Content, or CAIP mutations.

## Operations Membership — Builds 362–365

Automatic Membership reads are:

```text
GET /api/admin/users
GET /api/admin/access-tiers
GET /api/admin/tier-policies
```

Before Build 362, Tier Policy GET created `membership_tier_policies` and seeded Bronze/Silver/Gold during a read. Build 362 moved GET to a non-mutating read authority and added GET-only `operations-membership-read`. Retained POST still owns legacy ensure/seed/update behavior.

Build 363 registers `operations-membership-read` passively and makes Membership page-specific:

```text
/admin/operations/          catalog-read, inventory-read, accounting-read
/admin/customer-documents/  catalog-read, inventory-read, accounting-read
/admin/orders/              catalog-read, inventory-read, accounting-read
/admin/membership/          operations-membership-read
```

Build 364 activates `/admin/membership/` and fixes `adminTierPolicyMount` -> `tierPolicyAdminMount`.

The first browser proof showed runtime 363/364 active but both Build 362 reads returning HTTP 500. Build 365 corrected the read implementation without changing the public contract or loader:

- `BUILD=362`, `IMPLEMENTATION_BUILD=365`;
- bounded `SELECT * FROM membership_tier_policies` during the compatibility window;
- defensive mapping for known legacy aliases;
- genuine missing table -> in-memory defaults with `schema_ready=false`, no GET mutation;
- unexpected direct-read error -> structured JSON;
- aggregate child throw -> structured `failed_read` instead of opaque platform 500.

### Build 365 browser proof — PASSED 2026-08-25

```text
membership_contract_status                 200
membership_contract_build                  362
membership_contract_implementation_build   365
membership_contract_schema_ready           true
membership_contract_missing_tables         []
tier_policy_status                         200
tier_policy_build                          362
tier_policy_implementation_build           365
tier_policy_schema_ready                   true
tier_policy_source                         database
tier_policy_defaults_materialized          true
tier_policy_item_count                     3
tier_policy_codes                          bronze,silver,gold
application_module                         commerce-operations
application_mode                           active
active_application_module                  commerce-operations
operations_domain                          operations
runtime_entry                              ../modules/commerce-operations/runtime.mjs?v=363
runtime_build                              363
activation_build                           364
runtime_state                              active
services_ready                             true
required_service_count                     1
required_services                          ["operations-membership-read"]
membership_page_proven                     true
creates_network_transport                  false
operations_mutation_ownership              false
membership_mutation_ownership              false
contracts_ok                               true
services_ok                                true
```

Development therefore has a usable `membership_tier_policies` table with Bronze, Silver, and Gold rows. No Membership table parity deficit was observed in this Development database.

## Development schema-parity track — separate

```text
Build 324  orders.total_amount|total
Build 338  accounting_fixed_assets.location_note
Build 339  hst_gst_review_records
Build 339  accountant_export_manifests
Build 341  user_profiles.profile_id
Build 341  access_tiers.tier_id
Build 341  payment_disputes.payment_dispute_id
```

Prior parity audit also identified Production-only active tables including `accounting_order_records`, `gift_cards`, several Command Center tables, and the `notification_dispatch_log` aggregate-schema execution discrepancy.

Keep schema parity separate from module activation and resolve it before Production business-data copy.

## Historical regression rule

Historical regression scripts verify durable boundaries introduced by their own build. They must not freeze later shared runtime/cache/read implementations, require a later domain/page to remain inactive, confuse retained mutation authorities with passive activation services, or match explanatory comments instead of executable behavior.

## Next direction

1. Pull current `dev` with automatic Git GC disabled if needed.
2. Run only `python scripts/build365_membership_read_resilience_test.py` plus `git status --short`.
3. If Build 365 passes with a clean tree, mark Build 365 fully validated. No additional Membership Firefox proof is needed.
4. Continue the Commerce & Operations source audit with another bounded read/runtime page. Prefer a clean page such as Custom Requests or Today Tasks after source audit; avoid Gift Cards unless schema parity is deliberately the batch target.
5. Keep `/admin/members/` outside the narrow Membership boundary until its many account/engagement/gift-card/timeline startup reads are audited separately.
6. Continue fresh-install schema parity separately and before Production business-data copy.

## Validation preference

Batch related builds and provide one Git Bash block plus Firefox-safe browser blocks whenever practical.
