# Devil n Dove Modular Split — Open Items and Source-Control Rules

Updated through staged Builds 355–357 on 2026-08-24.

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
Creative Process read contract          352 local proven / browser required
Creative runtime implementation         356 staged
Creative Process activation             354 local proven / browser required
Content Studio read contract            355 staged
Content Studio activation               357 staged
Accounting mutation ownership moved     false
Creative mutation ownership moved       false
Content mutation ownership moved        false
```

### Commerce & Operations

Proven pages remain `/admin/operations/`, `/admin/customer-documents/`, and `/admin/orders/`. Remaining loader/runtime coverage includes gift cards, members/membership, custom requests and today-tasks. Loader coverage remains separate from mutation authority.

### Business & Administration

`/admin/accounting/` is the first validated Business & Administration runtime page. Builds 346–348 are fully validated. Accounting mutations remain in compatibility authorities.

Builds 343–345 are fully validated. Their browser proof was schema-ready and the corrected historical local regression passed.

### Creative & Production

Build 301 remains the completed Packaging compatibility baseline. Builds 349–351 are fully validated in Development: the top-level `creative-production` wrapper coexists with Build 297 native Packaging transport and the Build 292 -> 291 write authority while owning no Packaging mutations.

Build 352 formalizes the Creative Process GET as `creative-process-read`. Build 353/354 adds the Creative Process page. Its local regression passed; browser activation proof is still required.

Build 355 removes request-time schema creation from the automatic Content Studio GET and exposes `content-studio-read`. Build 356 extends the top-level runtime to the `content` domain. Build 357 adds `/admin/content-studio/` coverage. Content Studio POST actions remain on the retained compatibility endpoint.

Current staged Creative runtime scope:

```text
creative-production
  packaging -> /admin/packaging-studio/   validated
  creative  -> /admin/creative-process/   local proven / browser required
  content   -> /admin/content-studio/      staged

caip        -> no top-level runtime coverage yet
```

Required services by Creative runtime domain:

```text
packaging: inventory-read, catalog-read, content-media
creative:  creative-process-read, inventory-read, inventory-post, inventory-reverse
content:   content-studio-read
```

The top-level runtime creates no network transport and owns no Creative, Packaging or Content mutations.

### CAIP blocker

CAIP is intentionally not activation-ready. `/api/admin/creative-assets` GET still calls:

```text
ensureCreativeAssetIntelligenceSchema()
ensureCreativeAssetOperationsSchema()
```

CAIP also has a separate automatic `/api/admin/caip-media-intake` GET. CAIP must remain bridge-only until both automatic read paths are audited/extracted and request-time schema mutation is removed from reads.

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
Builds 352–354   local regression passed; browser validation required
Builds 355–357   staged / validation required
```

## Validation-harness rule

Historical regression scripts verify durable boundaries introduced by their build. They must not require the continued presence of a later blocker or freeze unrelated shared runtime/cache versions forever.

The Build 349–351 and Build 352–354 historical regressions are future-compatible with later Creative runtime expansion.

## Mutation-authority extraction still open

Compatibility writes still requiring dedicated authority reviews include Orders/payment flows, gift cards, membership lifecycle, Customer Documents actions, Accounting writes, Creative Process project/timeline/content/CAIP/cost edits, CAIP governance/media operations and Content Studio project/media/deliverable/social-queue actions. Inventory-reviewed material posting/reversal already uses Inventory-owned authorities.

A loader, read-contract migration, or top-level runtime activation never implies mutation ownership.

## Next batched sequence

1. Browser-validate Build 354 on `/admin/creative-process/` using GET/read checks only.
2. Run the Build 349–351, 352–354 and 355–357 local regressions after pulling the Build 357 shared runtime.
3. Browser-validate Build 357 on `/admin/content-studio/` without invoking POST actions.
4. If clean, close Builds 352–357 while leaving all mutation authority unchanged.
5. Audit/extract CAIP automatic GETs next; do not activate CAIP until its schema-creating read paths are retired.
6. Continue fresh-install schema parity separately before Production business-data copy.

## Production safety

Real Devil n Dove Production remains frozen until deliberate promotion through the separate Production workflow. No module-extraction or runtime-activation build should implicitly promote `dev` or mutate Production D1/R2.
