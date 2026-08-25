# Devil n Dove Modular Split — Open Items and Source-Control Rules

Updated through staged Builds 359–361 on 2026-08-24.

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
Creative dependency gate fix            358 browser-proven / local required
Content Studio read/activation           355–357 browser-proven / local required
CAIP read contracts                     359 staged
Creative runtime implementation         360 staged
CAIP activation                         361 staged
Accounting mutation ownership moved     false
Creative mutation ownership moved       false
Content mutation ownership moved        false
CAIP mutation ownership moved           false
```

### Commerce & Operations

Proven pages remain `/admin/operations/`, `/admin/customer-documents/`, and `/admin/orders/`. Remaining loader/runtime coverage includes gift cards, members/membership, custom requests and today-tasks. Loader coverage remains separate from mutation authority.

### Business & Administration

`/admin/accounting/` is the first validated Business & Administration runtime page. Builds 343–348 are fully validated. Accounting mutations remain in compatibility authorities.

### Creative & Production

Build 301 remains the completed Packaging compatibility baseline. Builds 349–351 are fully validated.

Creative Process browser activation now passes after Build 358 corrected the dependency gate. Creative activation requires `creative-process-read` and `inventory-read`; Inventory-owned `inventory-post` and `inventory-reverse` remain separate retained mutation authorities and are not Core activation services.

Content Studio browser proof passed with Build 355 legacy/contract reads schema-ready and non-mutating, one registered `content-studio-read` service, active Creative top-level runtime, and `contentMutationOwnership=false`.

Current staged Creative runtime scope:

```text
creative-production
  packaging -> /admin/packaging-studio/   validated
  creative  -> /admin/creative-process/   browser-proven after Build 358; corrected local required
  content   -> /admin/content-studio/      browser-proven; corrected local required
  caip      -> /admin/creative-assets/     staged Builds 359–361
```

Activation services by domain:

```text
packaging: inventory-read, catalog-read, content-media
creative:  creative-process-read, inventory-read
content:   content-studio-read
caip:      caip-read, caip-media-intake-read
```

The top-level runtime creates no network transport and owns no Packaging, Creative, Content, or CAIP mutations.

### CAIP audit correction and staged activation

Historical CAIP schema helper names were misleading. Current source shows:

```text
ensureCreativeAssetIntelligenceSchema()  -> SELECT-only migration verification
ensureCreativeAssetOperationsSchema()    -> SELECT-only migration verification
assertCaipMediaIntakeSchema()             -> SELECT-only migration verification
```

The CAIP page automatically reads:

```text
GET /api/admin/creative-assets
GET /api/admin/caip-media-intake
```

Build 359 adds GET-only owned wrappers:

```text
/api/admin/contracts/caip-read
/api/admin/contracts/caip-media-intake-read
```

Build 360 registers both passively and expands the Creative umbrella to `caip`. Build 361 adds only `/admin/creative-assets/` to top-level lifecycle coverage and loads Core before the retained CAIP UI scripts.

CAIP project/evidence/story edits, probes, derivative plans, secure-review actions, private-media uploads, R2 writes, duplicate cleanup, governance changes, and public-promotion review requests remain on retained mutation authorities.

## Read-time schema rule

> GET/read paths report or verify schema readiness; migrations/readiness tooling creates or repairs schema.

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
Builds 352–354   browser revalidation passed after Build 358; corrected local regression required
Builds 355–357   browser proof passed 2026-08-24; corrected local regression required
Build 358        browser proof passed 2026-08-24; corrected local regression required
Builds 359–361   staged / local + browser validation required
```

## Validation-harness rule

Historical regression scripts verify durable boundaries introduced by their build. They must not freeze later shared runtime/cache versions, require a later domain to remain inactive, or confuse retained mutation authorities with passive activation services.

## Mutation-authority extraction still open

Compatibility writes still requiring dedicated authority reviews include Orders/payment flows, gift cards, membership lifecycle, Customer Documents actions, Accounting writes, Creative Process project/timeline/content/CAIP/cost edits, CAIP governance/media operations, and Content Studio project/media/deliverable/social-queue actions. Inventory-reviewed material posting/reversal already uses Inventory-owned authorities.

A loader, read-contract migration, or top-level runtime activation never implies mutation ownership.

## Next batched sequence

1. Pull the staged Build 361 checkpoint and run Build 352–354, 355–357, 358, and 359–361 local regressions.
2. Browser-validate `/admin/creative-assets/` using GET/read checks only.
3. If all pass, close Builds 352–361 and stop expanding Creative top-level loader coverage because all four Creative & Production domains will have proven pages.
4. Choose the next bounded ownership target from source evidence rather than reworking passing Creative pages.
5. Continue fresh-install schema parity separately before Production business-data copy.

## Production safety

Real Devil n Dove Production remains frozen until deliberate promotion through the separate Production workflow. No module-extraction/runtime build should implicitly promote `dev` or mutate Production D1/R2.
