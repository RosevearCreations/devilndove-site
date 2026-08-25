# Devil n Dove AI Context — Creative Browser-Proven / Membership Read Patch Through Build 365

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader roadmap.

Primary modular authorities include `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`, `docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md`, architecture notes through Build 365, and validation files including `BUILD362_364_VALIDATION.md`.

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
Commerce/Operations runtime                    363 browser-proven on Membership
Operations Membership read contract            362 browser failed / Build 365 patch staged
Operations Membership activation               364 browser-proven
Membership read implementation hardening       365 staged
Accounting reads through 345                   validated
Business & Administration Accounting runtime   348 validated
Packaging compatibility baseline               301 validated
Creative Packaging runtime                     351 validated
Creative Process read/runtime                   browser-proven; corrected local required
Content Studio read/runtime                     browser-proven; corrected local required
Creative dependency correction                 358 browser-proven; corrected local required
CAIP startup read contracts                    359 browser-proven; local required
Creative & Production runtime implementation   360 browser-proven; local required
CAIP top-level activation                      361 browser-proven; local required
Contract catalog                               345
Default passive service adapters               345
Creative Process passive service               353 runtime-local
Content Studio passive service                 356 runtime-local
CAIP passive read services                     360 runtime-local
Operations Membership passive service          363 runtime-local
Accounting mutation ownership moved            false
Operations/Membership mutation ownership moved false
Creative/Packaging mutation ownership moved    false
Content mutation ownership moved               false
CAIP mutation ownership moved                  false
```

All four Creative & Production domains have browser-proven top-level runtime pages. Do not extend or rework that loader merely to create more evidence; close the remaining local regressions and leave the loader stable.

Build 306 and Build 308 retain their historical standalone local-signoff caveats; do not silently relabel them.

## Read/runtime boundary rule

GET/read paths report or verify schema readiness; migrations/readiness tooling creates or repairs schema. Never restore request-time DDL/default seeding to a read because Development reports a schema deficit.

A loader/read-contract migration or top-level runtime activation never implies mutation ownership. Existing compatibility POST/PUT/DELETE/upload/import paths remain legacy until dedicated mutation contracts are separately extracted.

## Validation state

- Builds 325–345: fully validated through existing checkpoints; Builds 338/339/341 retain separate schema-parity findings.
- Builds 346–348: fully validated; Business & Administration is active only for `/admin/accounting/`.
- Build 301 Packaging compatibility checkpoint: complete in Development.
- Builds 349–351: fully validated; Packaging remains on the proven Build 301 authority chain.
- Builds 352–354: browser activation passes after Build 358; corrected local regression still required.
- Builds 355–357: Content Studio browser proof passed; corrected local regression still required.
- Build 358: browser proof passed; corrected local regression still required.
- Builds 359–361: CAIP browser proof passed 2026-08-25; local regression still required.
- Builds 362–364: Membership top-level runtime/browser activation passed, but Build 362 Tier Policy and aggregate GET both returned opaque HTTP 500 before contract metadata could be parsed.
- Build 365: staged read-resilience correction; local + browser revalidation required.

## Creative & Production browser-proven state

Creative Process after Build 358:

```text
creative domain required services   ["creative-process-read","inventory-read"]
retained mutation authorities        ["inventory-post","inventory-reverse"]
mutation authorities activation gate false
page proven                          true
creates network transport            false
creative mutation ownership          false
```

Content Studio proof returned Build 355 legacy/contract reads at 200 with `schema_ready=true`, `request_time_schema_mutation=false`, one registered `content-studio-read` service, active `creative-production`, one required service, and `contentMutationOwnership=false`.

CAIP proof returned both Build 359 contracts at 200 with verification-only/non-mutating metadata, both passive services registered, active `/admin/creative-assets/` runtime Build 360/activation 361, exactly two required read services, `currentCaipPageProven=true`, and `caipMutationOwnership=false`.

No Creative Process, Content Studio, CAIP, R2, binary, upload, governance, probe, derivative, secure-review, duplicate-cleanup, or public-promotion mutation was invoked merely to prove those loader/read boundaries.

## Operations Membership boundary — Builds 362–365

Source audit selected `/admin/membership/` as the next bounded Commerce & Operations page. `/admin/members/` is much more coupled, while Gift Cards has known fresh-install schema parity and is deliberately not mixed into this activation batch.

Automatic Membership reads are:

```text
GET /api/admin/users
GET /api/admin/access-tiers
GET /api/admin/tier-policies
```

The first two are SELECT-only. Before Build 362, Tier Policy GET called `ensureTierPolicyTable()` and `seedDefaultPolicies()`, creating `membership_tier_policies` and inserting Bronze/Silver/Gold rows during a read.

### Build 362

Build 362 introduced a non-mutating Tier Policy read authority and `GET /api/admin/contracts/operations-membership-read`. The retained POST still owns legacy ensure/seed/update behavior. Public contract identity remains Build 362.

### Build 363/364

`operations-membership-read` is registered passively. Membership has a page-specific Operations service gate:

```text
/admin/operations/          catalog-read, inventory-read, accounting-read
/admin/customer-documents/  catalog-read, inventory-read, accounting-read
/admin/orders/              catalog-read, inventory-read, accounting-read
/admin/membership/          operations-membership-read
```

`/admin/membership/` joins explicit Operations top-level coverage. Build 364 also corrected `adminTierPolicyMount` -> `tierPolicyAdminMount`, restoring the intended Tier Policy panel.

### Browser evidence — 2026-08-25

The runtime itself passed:

```text
membership_service_registered           true
application_module                      commerce-operations
application_mode                        active
active_application_module               commerce-operations
operations_domain                       operations
runtime_entry                           ../modules/commerce-operations/runtime.mjs?v=363
runtime_build                           363
activation_build                        364
runtime_state                           active
current_domain                          operations
last_pathname                           /admin/membership/
services_ready                          true
required_service_count                  1
required_services                       ["operations-membership-read"]
membership_page_proven                  true
creates_network_transport               false
operations_mutation_ownership           false
membership_mutation_ownership           false
contracts_ok                            true
services_ok                             true
```

But both reads failed before metadata could be returned:

```text
GET /api/admin/tier-policies                         500
GET /api/admin/contracts/operations-membership-read  500
```

Because a genuinely missing table was already supposed to return HTTP 200 with `schema_ready=false`, this failure is interpreted as a thrown legacy-schema/read assumption rather than normal missing-table readiness.

### Build 365 correction

Build 365 preserves public Build 362 identity but hardens the implementation:

- `membershipTierPolicyReadService.js` exports `IMPLEMENTATION_BUILD=365`.
- The Tier Policy read is bounded to `membership_tier_policies` but no longer depends on `sqlite_master` or a fixed explicit column list.
- It uses `SELECT *` during this compatibility window and maps known legacy aliases defensively.
- Genuine missing-table errors still return in-memory defaults, `schema_ready=false`, and no schema mutation.
- Unexpected Tier Policy errors return structured JSON with `error_code=membership_tier_policy_read_failed`.
- The aggregate Membership contract catches thrown child reads and reports `failed_read` / structured error data rather than collapsing into a generic Pages Functions 500.
- Build 363/364 loader/runtime identities remain unchanged.
- Membership assignment/removal and Tier Policy POST mutation ownership remain unchanged.

Do not add CREATE/INSERT back to GET to solve a Development schema issue.

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

Prior parity audit also identified Production-only active tables including `accounting_order_records`, `gift_cards`, several Command Center tables, and the `notification_dispatch_log` aggregate-schema execution discrepancy. If Build 365 returns `schema_ready=false`, add `membership_tier_policies` as explicit parity evidence.

Keep schema parity separate from module activation and resolve it before Production business-data copy.

## Historical regression rule

Historical regression scripts verify durable boundaries introduced by their own build. They must not freeze later shared runtime/cache/read implementations, require a later domain/page to remain inactive, or confuse retained mutation authorities with passive activation services.

## Next direction

1. Pull current `dev` with automatic Git GC disabled if needed.
2. Run corrected local regressions for Builds 352–354, 355–357, 358, 359–361, 362–364, and Build 365.
3. If the first four Creative gates pass, mark Builds 352–361 fully validated; they already have browser proof.
4. Re-run the read-only Membership browser proof after Build 365 deploys.
5. If Build 365 returns 200, accept either `schema_ready=true` or explicit `schema_ready=false`; the latter becomes schema-parity evidence rather than a GET-time repair.
6. If a 500 remains, use the new structured `error_code`, `failed_read`, and `error` fields to correct the exact remaining drift without guessing.
7. After Membership closes, continue Commerce & Operations source audit. Avoid Gift Cards unless schema parity is deliberately the batch target.
8. Continue fresh-install schema parity separately and before Production business-data copy.

## Validation preference

Batch related builds and provide one Git Bash block plus one Firefox-safe browser block whenever practical.
