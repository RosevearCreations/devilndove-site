# Devil n Dove Modular Split — Open Items and Source-Control Rules

Updated through staged Build 365 on 2026-08-25.

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
Commerce runtime                        363 Membership browser-proven
Operations Membership read contract     362 browser-failed / Build 365 patch staged
Operations Membership activation        364 browser-proven
Membership read hardening               365 staged
Contract catalog                        345
Default passive adapters                345
Business Accounting activation          348 validated
Packaging baseline                      301 validated
Creative Packaging activation           351 validated
Creative Process read/runtime            browser-proven; corrected local required
Creative dependency gate fix            358 browser-proven; corrected local required
Content Studio read/runtime              355–357 browser-proven; corrected local required
CAIP read/runtime                        359–361 browser-proven; local required
Accounting mutation ownership moved     false
Operations mutation ownership moved     false
Membership mutation ownership moved     false
Creative mutation ownership moved       false
Content mutation ownership moved        false
CAIP mutation ownership moved           false
```

### Commerce & Operations

Previously proven Operations pages remain:

```text
/admin/operations/
/admin/customer-documents/
/admin/orders/
```

Builds 362–364 add `/admin/membership/` as the fourth explicit Operations runtime page.

The page's intended startup reads are:

```text
GET /api/admin/users
GET /api/admin/access-tiers
GET /api/admin/tier-policies
```

Users and access tiers are SELECT-only. Before Build 362, Tier Policies created `membership_tier_policies` and seeded Bronze/Silver/Gold during GET.

Build 362 established a non-mutating Tier Policy read contract and GET-only `operations-membership-read` aggregate. The retained POST still owns legacy ensure/seed/update behavior.

Build 363 registers `operations-membership-read` passively and makes Operations prerequisites page-specific:

```text
/admin/operations/          catalog-read, inventory-read, accounting-read
/admin/customer-documents/  catalog-read, inventory-read, accounting-read
/admin/orders/              catalog-read, inventory-read, accounting-read
/admin/membership/          operations-membership-read
```

Build 364 adds `/admin/membership/` to explicit coverage, cache-busts Core, and fixes the existing Tier Policy mount mismatch (`adminTierPolicyMount` -> `tierPolicyAdminMount`). Assignment/removal and policy-edit mutations remain compatibility authorities.

#### Browser evidence — 2026-08-25

The Build 363/364 loader/runtime boundary passed:

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

However both Build 362 read endpoints returned opaque HTTP 500 before contract metadata could be parsed:

```text
GET /api/admin/tier-policies                         500
GET /api/admin/contracts/operations-membership-read  500
```

A genuinely missing `membership_tier_policies` table should have returned HTTP 200 with `schema_ready=false`; therefore this is treated as a thrown legacy-schema/read assumption, not normal missing-table readiness.

#### Build 365

Build 365 preserves public Build 362 contract identity while hardening the read implementation:

- no `sqlite_master` dependency;
- no fixed explicit legacy column list;
- bounded `SELECT * FROM membership_tier_policies` during the compatibility window;
- defensive mapping for known legacy aliases;
- genuine missing-table fallback remains non-mutating and returns in-memory defaults;
- unexpected Tier Policy errors return structured Build 362 / implementation Build 365 JSON;
- aggregate Membership read catches thrown child reads and reports `failed_read` rather than collapsing into an opaque platform 500;
- Build 363/364 runtime/page identities remain unchanged;
- Membership mutation ownership remains unchanged.

Known `gift_cards` fresh-install schema parity is deliberately not mixed into this batch. `/admin/members/` also remains outside current coverage because it composes many more account/engagement/gift-card/timeline scripts.

### Business & Administration

`/admin/accounting/` is the first validated Business & Administration runtime page. Builds 343–348 are fully validated. Accounting mutations remain compatibility authorities.

### Creative & Production

Build 301 remains the completed Packaging compatibility baseline. Builds 349–351 are fully validated.

All four Creative & Production domains now have browser-proven top-level pages:

```text
creative-production
  packaging -> /admin/packaging-studio/   validated
  creative  -> /admin/creative-process/   browser-proven; corrected local required
  content   -> /admin/content-studio/      browser-proven; corrected local required
  caip      -> /admin/creative-assets/     browser-proven; local required
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

If Build 365 reports `membership_tier_policies` missing on a true fresh install, record it as additional schema-parity evidence. Do not restore GET-time CREATE/INSERT.

## Validation state

```text
Builds 325–330   fully validated
Builds 331–336   fully validated 2026-08-24
Builds 337–339   fully validated 2026-08-24 (+ schema parity for 338/339)
Builds 340–342   fully validated 2026-08-24 (+ schema parity for 341)
Builds 343–345   fully validated 2026-08-24
Builds 346–348   fully validated 2026-08-24
Builds 349–351   fully validated 2026-08-24
Builds 352–354   browser revalidation passed after Build 358; corrected local regression required
Builds 355–357   browser proof passed; corrected local regression required
Build 358        browser proof passed; corrected local regression required
Builds 359–361   browser proof passed 2026-08-25; local regression required
Builds 362–364   runtime/browser activation proven; Build 362 read failed 500
Build 365        staged / local + browser read revalidation required
```

## Validation-harness rule

Historical regression scripts verify durable boundaries introduced by their own build. They must not freeze later shared runtime/cache/read implementations, require a later domain/page to remain inactive, or confuse retained mutation authorities with passive activation services.

## Mutation-authority extraction still open

Compatibility writes still requiring dedicated authority reviews include Orders/payment flows, gift cards, Membership assignment/policy lifecycle, Customer Documents actions, Accounting writes, Creative Process project/timeline/content/CAIP/cost edits, CAIP governance/media operations, and Content Studio project/media/deliverable/social-queue actions. Inventory-reviewed material posting/reversal already uses Inventory-owned authorities.

A loader, read-contract migration, or top-level runtime activation never implies mutation ownership.

## Next batched sequence

1. Pull current `dev` and run corrected Creative regressions plus Builds 362–364 and Build 365 Membership regressions.
2. If Builds 352–361 local gates pass, close them; their browser gates are already complete.
3. Browser-revalidate `/admin/membership/` with GET/runtime checks only after Build 365 deploys.
4. Accept `schema_ready=true` or explicit `schema_ready=false`; the latter is parity evidence, not permission for GET-time repair.
5. If a 500 remains, use Build 365 structured `error_code`, `failed_read`, and `error` metadata to correct the exact drift.
6. After Membership closes, continue Commerce & Operations source audit. Avoid Gift Cards unless schema parity is deliberately the batch target.
7. Continue fresh-install schema parity separately before Production business-data copy.

## Production safety

Real Devil n Dove Production remains frozen until deliberate promotion through the separate Production workflow. No module-extraction/runtime build should implicitly promote `dev` or mutate Production D1/R2.
