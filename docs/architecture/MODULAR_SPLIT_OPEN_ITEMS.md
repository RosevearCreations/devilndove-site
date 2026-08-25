# Devil n Dove Modular Split — Open Items and Source-Control Rules

Updated through browser-proven Build 365 on 2026-08-25.

## Architectural invariant

Devil n Dove has exactly one shared Core and three top-level application modules:

```text
                     DEVIL N DOVE APPLICATION CORE
                               |
              +----------------+----------------+
              |                |                |
       COMMERCE &         CREATIVE &       BUSINESS &
       OPERATIONS          PRODUCTION      ADMINISTRATION
```

Domains remain ownership/service boundaries beneath those modules. Core owns shared infrastructure only; business rules remain domain-owned.

## Source-control state

```text
main  = retained Production/legacy release line
dev   = active modularization and Development integration line
```

Application modules are not permanent Git branches.

## Current identities

```text
Core architecture                       302
Core runtime implementation             305
Commerce runtime                        363
Operations Membership read contract     362
Operations Membership activation        364 validated after Build 365
Membership read hardening               365 browser-passed / local rerun pending
Contract catalog                        345
Default passive adapters                345
Business Accounting activation          348 validated
Packaging baseline                      301 validated
Creative Packaging activation           351 validated
Creative Process read/runtime            352–354 validated
Creative dependency gate fix            358 validated
Content Studio read/runtime              355–357 validated
CAIP read/runtime                        359–361 validated
Accounting mutation ownership moved     false
Operations mutation ownership moved     false
Membership mutation ownership moved     false
Creative mutation ownership moved       false
Content mutation ownership moved        false
CAIP mutation ownership moved           false
```

## Commerce & Operations

Validated Operations pages now include:

```text
/admin/operations/
/admin/customer-documents/
/admin/orders/
/admin/membership/
```

### Membership boundary — Builds 362–365

Membership startup reads are:

```text
GET /api/admin/users
GET /api/admin/access-tiers
GET /api/admin/tier-policies
```

Before Build 362, Tier Policy GET created `membership_tier_policies` and seeded Bronze/Silver/Gold during a read.

Build 362 established a non-mutating Tier Policy read authority and GET-only `operations-membership-read`. Retained POST still owns legacy ensure/seed/update behavior.

Build 363 registers `operations-membership-read` passively and makes Operations prerequisites page-specific:

```text
/admin/operations/          catalog-read, inventory-read, accounting-read
/admin/customer-documents/  catalog-read, inventory-read, accounting-read
/admin/orders/              catalog-read, inventory-read, accounting-read
/admin/membership/          operations-membership-read
```

Build 364 adds `/admin/membership/` to explicit coverage and fixes `adminTierPolicyMount` -> `tierPolicyAdminMount`.

The first browser proof showed Build 363/364 runtime activation succeeding while both Build 362 reads returned opaque HTTP 500. Build 365 corrected the read implementation without changing the public contract or loader:

- public contract remains Build 362;
- implementation build is 365;
- no `sqlite_master` dependency in the executable read path;
- bounded `SELECT * FROM membership_tier_policies` during the compatibility window;
- defensive mapping for known legacy aliases;
- genuine missing table returns in-memory defaults and `schema_ready=false` without GET mutation;
- unexpected direct-read failures return structured JSON;
- aggregate child throws are reported with `failed_read` rather than collapsing into an opaque platform 500;
- Membership mutation ownership remains unchanged.

Browser revalidation on 2026-08-25 passed:

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

The Development database therefore already has a usable `membership_tier_policies` table with Bronze, Silver, and Gold rows. No Membership table parity deficit was observed there.

Builds 362–364 are fully validated. Build 365 requires only its corrected local regression rerun; no further Firefox proof is required unless the implementation changes again.

Known `gift_cards` fresh-install schema parity is deliberately not mixed into this batch. `/admin/members/` remains outside current narrow coverage because it composes many account/engagement/gift-card/timeline scripts.

## Business & Administration

`/admin/accounting/` is the first validated Business & Administration runtime page. Builds 343–348 are fully validated. Accounting mutations remain compatibility authorities.

## Creative & Production

Build 301 remains the completed Packaging compatibility baseline. Builds 349–351 are fully validated.

All four Creative & Production domains are now fully validated at the loader/read boundary:

```text
creative-production
  packaging -> /admin/packaging-studio/   validated
  creative  -> /admin/creative-process/   validated
  content   -> /admin/content-studio/      validated
  caip      -> /admin/creative-assets/     validated
```

Activation services:

```text
packaging: inventory-read, catalog-read, content-media
creative:  creative-process-read, inventory-read
content:   content-studio-read
caip:      caip-read, caip-media-intake-read
```

The top-level runtime creates no network transport and owns no Packaging, Creative, Content, or CAIP mutations. Do not expand this loader further merely to create more proof.

## Read-time schema rule

> GET/read paths report or verify schema readiness; migrations/readiness tooling creates or repairs schema.

Never use top-level runtime activation as permission to add request-time DDL/default seeding or move mutations.

## Development schema-parity track — separate from extraction

```text
orders.total_amount|total                     missing logical revenue column alternative (Build 324)
accounting_fixed_assets.location_note         missing column (Build 338)
hst_gst_review_records                        missing table (Build 339)
accountant_export_manifests                   missing table (Build 339)
user_profiles.profile_id                      missing expected column (Build 341)
access_tiers.tier_id                          missing expected column (Build 341)
payment_disputes.payment_dispute_id           missing expected column (Build 341)
```

Fresh-install schema parity still takes priority over Production business-data copy. Prior audit also found Production-only active tables such as `accounting_order_records`, `gift_cards`, Command Center tables, and the `notification_dispatch_log` aggregate-schema execution discrepancy.

## Validation state

```text
Builds 325–330   fully validated
Builds 331–336   fully validated 2026-08-24
Builds 337–339   fully validated 2026-08-24 (+ schema parity for 338/339)
Builds 340–342   fully validated 2026-08-24 (+ schema parity for 341)
Builds 343–345   fully validated 2026-08-24
Builds 346–348   fully validated 2026-08-24
Builds 349–351   fully validated 2026-08-24
Builds 352–354   fully validated 2026-08-25
Builds 355–357   fully validated 2026-08-25
Build 358        fully validated 2026-08-25
Builds 359–361   fully validated 2026-08-25
Builds 362–364   fully validated 2026-08-25 after Build 365 correction
Build 365        browser passed; corrected local regression required
```

## Validation-harness rule

Historical regressions verify durable executable boundaries. They must not freeze later shared runtime/cache/read implementations, require later domains/pages to remain inactive, confuse retained mutation authorities with passive activation services, or fail because explanatory comments contain names of removed legacy mechanisms.

## Mutation-authority extraction still open

Compatibility writes still requiring dedicated authority reviews include Orders/payment flows, gift cards, Membership assignment/policy lifecycle, Customer Documents actions, Accounting writes, Creative Process project/timeline/content/CAIP/cost edits, CAIP governance/media operations, and Content Studio project/media/deliverable/social-queue actions. Inventory-reviewed material posting/reversal already uses Inventory-owned authorities.

A loader, read-contract migration, or top-level runtime activation never implies mutation ownership.

## Next batched sequence

1. Pull current `dev` and rerun only `scripts/build365_membership_read_resilience_test.py`.
2. If it passes with a clean working tree, mark Build 365 fully validated; no further Membership browser proof is required.
3. Continue Commerce & Operations source audit for the next narrow read/runtime page. Prefer Custom Requests or Today Tasks only after source audit confirms clean startup-read boundaries.
4. Avoid Gift Cards unless schema parity is deliberately the batch target.
5. Keep `/admin/members/` outside the narrow Membership boundary until its coupled account/engagement/gift-card/timeline reads are separately audited.
6. Continue fresh-install schema parity separately before Production business-data copy.

## Production safety

Real Devil n Dove Production remains frozen until deliberate promotion through the separate Production workflow. No module-extraction/runtime build should implicitly promote `dev` or mutate Production D1/R2.
