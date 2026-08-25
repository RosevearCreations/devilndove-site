# Devil n Dove Modular Split — Open Items and Source-Control Rules

Updated through staged Builds 352–354 on 2026-08-24.

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
Creative Packaging activation           351 browser proven / local required
Creative Process read contract          352 staged
Creative runtime implementation         353 staged
Creative Process activation             354 staged
Accounting mutation ownership moved     false
Creative mutation ownership moved       false
```

### Commerce & Operations

Proven pages remain `/admin/operations/`, `/admin/customer-documents/`, and `/admin/orders/`. Remaining loader/runtime coverage includes gift cards, members/membership, custom requests and today-tasks. Loader coverage remains separate from mutation authority.

### Business & Administration

`/admin/accounting/` is the first validated Business & Administration runtime page. Builds 346–348 are fully validated. Accounting mutations remain in compatibility authorities.

Builds 343–345 are browser proven and schema-ready; only the corrected historical local rerun remains outstanding.

### Creative & Production

Build 301 remains the completed Packaging compatibility baseline. Build 351 browser proof confirms `creative-production` activates over Packaging without changing its Build 297 read transport or Build 292 -> 291 write authority. The Build 349–351 local regression is still required.

Build 352 formalizes the Creative Process GET as `creative-process-read`. Build 353 expands the top-level Creative runtime to the `creative` domain and passively registers that read service. Build 354 adds explicit `/admin/creative-process/` coverage.

Current staged Creative runtime scope:

```text
creative-production
  packaging -> /admin/packaging-studio/
  creative  -> /admin/creative-process/

caip        -> no top-level runtime coverage yet
content     -> no top-level runtime coverage yet
```

Creative Process required services:

```text
creative-process-read
inventory-read
inventory-post
inventory-reverse
```

The runtime creates no network transport and owns no Creative or Packaging mutations.

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
Builds 343–345   browser proven; corrected local rerun required; schemas ready
Builds 346–348   fully validated 2026-08-24
Builds 349–351   browser proven 2026-08-24; local regression required
Builds 352–354   staged / validation required
```

## Validation-harness rule

Historical regression scripts verify durable boundaries introduced by their build. They must not require the continued presence of a later blocker or freeze unrelated shared files forever.

## Mutation-authority extraction still open

Compatibility writes still requiring dedicated authority reviews include Orders/payment flows, gift cards, membership lifecycle, Customer Documents actions, Accounting writes, and Creative Process project/timeline/content/CAIP/cost edits. Inventory-reviewed material posting/reversal already uses Inventory-owned authorities.

A loader, read-contract migration, or top-level runtime activation never implies mutation ownership.

## Next batched sequence

1. Run the combined local regressions for Builds 343–345, 349–351 and 352–354.
2. Browser-validate Build 354 on `/admin/creative-process/` using GET/read checks only.
3. If clean, close those validation gates while leaving all mutation authority unchanged.
4. Continue fresh-install schema parity separately before Production business-data copy.
5. Source-audit CAIP and Content next; expand Creative runtime coverage only after owned non-mutating startup reads are proven.

## Production safety

Real Devil n Dove Production remains frozen until deliberate promotion through the separate Production workflow. No module-extraction or runtime-activation build should implicitly promote `dev` or mutate Production D1/R2.
