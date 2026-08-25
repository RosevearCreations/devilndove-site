# Devil n Dove Modular Split — Open Items and Source-Control Rules

Updated through browser-proven Build 358 on 2026-08-24.

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
Commerce runtime                        315
Contract catalog                        345
Default passive adapters                345
Business Accounting activation          348 validated
Packaging baseline                      301 validated
Creative Packaging activation           351 validated
Creative Process read contract          352 browser-proven
Creative Process activation             browser-proven after Build 358
Content Studio read contract            355 staged
Creative runtime coverage               357 staged
Creative dependency gate fix            358 browser-proven / local required
Accounting mutation ownership moved     false
Creative mutation ownership moved       false
Content mutation ownership moved        false
```

### Commerce & Operations

Proven pages remain `/admin/operations/`, `/admin/customer-documents/`, and `/admin/orders/`. Remaining loader/runtime coverage includes gift cards, members/membership, custom requests and today-tasks. Loader coverage remains separate from mutation authority.

### Business & Administration

`/admin/accounting/` is the first validated Business & Administration runtime page. Builds 346–348 are fully validated. Accounting mutations remain in compatibility authorities. Builds 343–345 are fully validated.

### Creative & Production

Build 301 remains the completed Packaging compatibility baseline. Builds 349–351 are fully validated in Development.

Build 352 formalizes the Creative Process GET as `creative-process-read`. Its browser read contract passed with `request_time_schema_mutation=false` and `mutation_ownership_moved=false`.

The initial top-level browser activation failed because the shared Creative runtime incorrectly required `inventory-post` and `inventory-reverse` as registered Core browser services. Those are real Inventory-owned mutation authorities, but not passive activation services.

Build 358 corrects that distinction and the browser revalidation now passes.

Current Creative runtime scope:

```text
creative-production
  packaging -> /admin/packaging-studio/   validated
  creative  -> /admin/creative-process/   browser-proven after Build 358; corrected local required
  content   -> /admin/content-studio/      staged

caip        -> no top-level runtime coverage yet
```

Activation services by Creative runtime domain:

```text
packaging: inventory-read, catalog-read, content-media
creative:  creative-process-read, inventory-read
content:   content-studio-read
```

Retained Creative Process mutation authorities are declared separately:

```text
inventory-post
inventory-reverse
```

They are **not** top-level runtime activation services. Build 358 reports `mutationAuthoritiesRequiredAsActivationServices=false`.

Browser-proven Build 358 Creative state:

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

The top-level runtime creates no network transport and owns no Creative, Packaging or Content mutations.

### Content Studio

Build 355 removes request-time schema creation from the automatic Content Studio GET and exposes `content-studio-read`. Build 356 extends the top-level runtime to the `content` domain. Build 357 adds `/admin/content-studio/` coverage. Content Studio POST actions remain on the retained compatibility endpoint.

### CAIP startup-read audit correction

Earlier notes treated CAIP's `ensure...Schema()` calls as request-time DDL. Current source shows these helpers are migration-owned verification only:

```text
ensureCreativeAssetIntelligenceSchema()  -> SELECT-only table verification
ensureCreativeAssetOperationsSchema()    -> SELECT-only table verification
assertCaipMediaIntakeSchema()             -> SELECT-only table verification
```

The `/admin/creative-assets/` page starts two automatic reads:

```text
GET /api/admin/creative-assets
GET /api/admin/caip-media-intake
```

The main CAIP GET uses verification-only schema checks plus listing/detail/operations reads. The media-intake GET uses verification-only schema checks, readiness queries and duplicate-audit reads. No request-time CREATE/ALTER/INSERT/UPDATE/DELETE is required merely to load the page.

So CAIP is **not blocked by request-time schema mutation**. Its actual modular gap is explicit ownership/registration of the two startup read boundaries. Keep `caip` outside top-level runtime coverage until those reads are formalized as passive services/contracts and browser-proven.

CAIP POST/upload/governance/probe/derivative/review-link actions remain compatibility mutation authorities and must not move merely to activate the page.

## Read-time schema mutation rule

> GET/read paths report schema readiness; migrations/readiness tooling creates or repairs schema.

Never use top-level runtime activation as permission to add request-time DDL or move mutations.

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

These findings belong in fresh-install schema/migrations/readiness tooling, never in GET handlers or runtime activation code.

Fresh-install schema parity still takes priority over any Production business-data copy. Prior audit also found Production-only active tables such as `accounting_order_records`, `gift_cards`, Command Center tables, and the `notification_dispatch_log` aggregate-schema execution discrepancy.

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
Builds 355–357   staged / corrected local + Content Studio browser validation required
Build 358        browser passed / corrected local regression required
```

## Validation-harness rule

Historical regression scripts verify durable boundaries introduced by their build. They must not freeze unrelated shared runtime/cache versions or confuse retained mutation authorities with passive activation services.

The Build 349–351, Build 352–354, and Build 355–357 historical regressions are future-compatible with later Creative runtime changes.

## Mutation-authority extraction still open

Compatibility writes still requiring dedicated authority reviews include Orders/payment flows, gift cards, membership lifecycle, Customer Documents actions, Accounting writes, Creative Process project/timeline/content/CAIP/cost edits, CAIP governance/media operations and Content Studio project/media/deliverable/social-queue actions. Inventory-reviewed material posting/reversal already uses Inventory-owned authorities.

A loader, read-contract migration, or top-level runtime activation never implies mutation ownership.

## Next batched sequence

1. Pull the browser-proof documentation checkpoint and run the corrected Build 352–354, Build 355–357 and Build 358 regressions.
2. Browser-validate `/admin/content-studio/` without POST actions.
3. If the corrected local tests and Content Studio browser proof pass, close Builds 352–358 while leaving all mutation authority unchanged.
4. Next CAIP batch should formalize both automatic CAIP read boundaries as passive/owned services, then add `/admin/creative-assets/` top-level coverage only after those reads are proven.
5. Continue fresh-install schema parity separately before Production business-data copy.

## Production safety

Real Devil n Dove Production remains frozen until deliberate promotion through the separate Production workflow. No module-extraction or runtime-activation build should implicitly promote `dev` or mutate Production D1/R2.
