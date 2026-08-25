# Devil n Dove AI Context — Creative Browser-Proven / Operations Membership Staged Through Build 364

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader roadmap.

Primary modular authorities include `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`, `docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md`, architecture notes through Build 364, and validation files through `BUILD362_364_VALIDATION.md`.

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
Commerce/Operations runtime                    363 staged
Operations Membership read contract            362 staged
Operations Membership activation               364 staged
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

All four Creative & Production domains now have a browser-proven top-level runtime page. Do not extend or rework that loader again merely to create more evidence; close the corrected local regressions, then leave that loader stable.

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
- Builds 355–357: Content Studio browser proof passed 2026-08-24; corrected local regression still required.
- Build 358: browser proof passed 2026-08-24; corrected local regression still required.
- Builds 359–361: CAIP browser proof passed 2026-08-24; local regression still required.
- Builds 362–364: staged / local + Membership browser validation required.

## Creative & Production browser-proven state

Creative Process after Build 358:

```text
creative domain required services  ["creative-process-read","inventory-read"]
retained mutation authorities       ["inventory-post","inventory-reverse"]
mutation authorities activation gate false
page proven                          true
creates network transport            false
creative mutation ownership          false
```

Content Studio proof returned Build 355 legacy/contract reads at 200 with `schema_ready=true`, `request_time_schema_mutation=false`, one registered `content-studio-read` service, active `creative-production`, one required service, and `contentMutationOwnership=false`.

CAIP proof returned both Build 359 contracts at 200 with verification-only/non-mutating metadata, both passive services registered, active `/admin/creative-assets/` runtime Build 360/activation 361, two required read services, `currentCaipPageProven=true`, and `caipMutationOwnership=false`.

No Creative Process, Content Studio, CAIP, R2, binary, upload, governance, probe, derivative, secure-review, duplicate-cleanup, or public-promotion mutation was invoked merely to prove those loader/read boundaries.

## Builds 362–364 — Operations Membership boundary

Source audit selected `/admin/membership/` as the next bounded Commerce & Operations page. `/admin/members/` is much more coupled, while Gift Cards has known fresh-install schema parity and is deliberately not mixed into this activation batch.

Automatic Membership reads are:

```text
GET /api/admin/users
GET /api/admin/access-tiers
GET /api/admin/tier-policies
```

The first two are SELECT-only. Before Build 362, Tier Policy GET called `ensureTierPolicyTable()` and `seedDefaultPolicies()`, creating `membership_tier_policies` and inserting Bronze/Silver/Gold rows during a read.

### Build 362

`functions/api/_lib/membershipTierPolicyReadService.js` now owns non-mutating Tier Policy reads. Missing or empty state is represented with in-memory defaults and explicit readiness metadata:

```text
schema_ready
missing_tables
request_time_schema_mutation=false
defaults_materialized
source
```

`GET /api/admin/tier-policies` delegates to that read service and no longer creates/seeds schema. The retained POST still owns its legacy ensure/seed/update behavior.

`GET /api/admin/contracts/operations-membership-read` aggregates the users, active access tiers, and Tier Policy reads under Operations ownership with `mutation_ownership_moved=false`.

### Build 363

`operations-membership-read` is registered passively in the Commerce & Operations runtime. Registration performs no request.

Operations service requirements are now page-specific:

```text
/admin/operations/          catalog-read, inventory-read, accounting-read
/admin/customer-documents/  catalog-read, inventory-read, accounting-read
/admin/orders/              catalog-read, inventory-read, accounting-read
/admin/membership/          operations-membership-read
```

The original three proven Operations pages therefore retain their established service boundary, while Membership does not inherit unrelated dependencies.

### Build 364

`/admin/membership/` joins explicit Operations top-level coverage. The page loads `admin.js?v=364` before the retained Membership UI scripts.

Build 364 also fixes an existing page/script mount mismatch:

```text
page previously: adminTierPolicyMount
script expects:   tierPolicyAdminMount
```

The corrected mount restores the intended Tier Policy panel. No assignment/removal or policy-edit mutation moves to the top-level runtime.

If `membership_tier_policies` is absent on a fresh install, the GET reports `schema_ready=false` and returns in-memory defaults; that missing table belongs to schema-parity work and must not be repaired inside GET.

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

Prior parity audit also identified Production-only active tables including `accounting_order_records`, `gift_cards`, several Command Center tables, and the `notification_dispatch_log` aggregate-schema execution discrepancy. `membership_tier_policies` should be treated as additional parity evidence if the Build 362 read reports it missing on a true fresh install.

Keep schema parity separate from module activation and resolve it before Production business-data copy.

## Windows Git pack cleanup note

Windows previously refused to unlink an obsolete `.git/objects/pack/*.idx` and matching `.pack` during automatic Git housekeeping. Fast-forward and regressions still succeeded. Use `git -c gc.auto=0 pull ...` while validating if needed; do not manually delete one half of a pack pair.

## Historical regression rule

Historical regression scripts verify durable boundaries introduced by their own build. They must not freeze later shared runtime/cache versions, require a later domain/page to remain inactive, or confuse retained mutation authorities with passive activation services.

## Next direction

1. Pull the staged Build 364 checkpoint with automatic Git GC disabled if needed.
2. Run corrected regressions for Builds 352–354, 355–357, 358, 359–361, plus the new 362–364 Membership regression.
3. If the first four pass, mark Builds 352–361 fully validated; they already have browser proof.
4. Browser-validate `/admin/membership/` using GET/runtime checks only. If `schema_ready=false`, record the missing table as parity evidence; do not add DDL back to GET.
5. If Membership local + browser gates pass, close Builds 362–364 without moving assignment/policy mutations.
6. Continue Commerce & Operations source audit after Membership. Avoid Gift Cards unless schema parity is deliberately the batch target.
7. Continue fresh-install schema parity separately and before Production business-data copy.

## Validation preference

Batch related builds and provide one Git Bash block plus one Firefox-safe browser block whenever practical.
