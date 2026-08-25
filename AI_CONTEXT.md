# Devil n Dove AI Context — All Creative Domains Browser-Proven Through Build 361

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader roadmap.

Primary modular authorities include `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`, `docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md`, architecture notes through Build 361, and validation files through `BUILD359_361_VALIDATION.md`.

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
Accounting mutation ownership moved            false
Creative/Packaging mutation ownership moved    false
Content mutation ownership moved               false
CAIP mutation ownership moved                  false
```

All four Creative & Production domains now have a browser-proven top-level runtime page. Do not extend or rework that loader again merely to create more evidence; close the corrected local regressions first, then move to another bounded ownership target.

Build 306 and Build 308 retain their historical standalone local-signoff caveats; do not silently relabel them.

## Read/runtime boundary rule

GET/read paths report or verify schema readiness; migrations/readiness tooling creates or repairs schema. Never restore request-time DDL to a read because Development reports a schema deficit.

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

## Browser-proven Creative Process state after Build 358

```text
application_module                     creative-production
application_mode                       active
active_application_module              creative-production
creative_domain                        creative
runtime_build                          358
runtime_state                          active
services_ready                         true
required_services                      ["creative-process-read","inventory-read"]
mutation_authorities                   ["inventory-post","inventory-reverse"]
mutation_authorities_activation_gate   false
page_proven                            true
creates_network_transport              false
creative_mutation_ownership            false
contracts_ok                           true
services_ok                            true
```

## Browser-proven Content Studio state

Development proof on `/admin/content-studio/` returned:

```text
legacy_status                    200
legacy_build                     355
legacy_legacy_build              273
legacy_owner                     content
legacy_contract                  content-studio-read
legacy_schema_ready              true
legacy_schema_mutation           false
contract_status                  200
contract_build                   355
contract_owner                   content
contract_schema_ready            true
contract_schema_mutation         false
service_registered               true
service_build                    355
application_module               creative-production
application_mode                 active
active_application_module        creative-production
content_domain                   content
runtime_build                    358
runtime_state                    active
services_ready                   true
required_service_count           1
content_page_proven              true
content_contract_build           355
creates_network_transport        false
content_mutation_ownership       false
contracts_ok                     true
services_ok                      true
```

## CAIP startup-read audit correction

Historical `ensure...Schema()` / `assert...Schema()` names were misleading. Current source proves these helpers are migration-owned verification only:

```text
ensureCreativeAssetIntelligenceSchema()  SELECT-only verification
ensureCreativeAssetOperationsSchema()    SELECT-only verification
assertCaipMediaIntakeSchema()             SELECT-only verification
```

The CAIP page starts two automatic reads:

```text
GET /api/admin/creative-assets
GET /api/admin/caip-media-intake
```

Neither current GET requires CREATE/ALTER/INSERT/UPDATE/DELETE merely to load the page.

## Builds 359–361 — CAIP read/runtime boundary

Build 359 adds two GET-only CAIP-owned wrappers:

```text
/api/admin/contracts/caip-read
/api/admin/contracts/caip-media-intake-read
```

Both report `request_time_schema_mutation=false`, `mutation_ownership_moved=false`, and `schema_verification_only=true`. The intake contract also reports `r2_mutation=false` and `binary_mutation=false`.

Build 360 passively registers exactly:

```text
caip-read
caip-media-intake-read
```

Registration performs no HTTP request. The top-level Creative runtime creates no network transport and owns no CAIP mutations.

Build 361 adds `/admin/creative-assets/` to explicit top-level coverage and loads Core before the retained Build 279 media-intake and Build 271 CAIP UI scripts. Existing compatibility GET/POST authorities and R2/media helpers remain unchanged.

### Browser proof — PASSED 2026-08-24

```text
caip_contract_status                     200
caip_contract_build                      359
caip_contract_legacy_build               Build 201 + Build 202 + Build 279
caip_contract_owner                      caip
caip_contract_id                         caip-read
caip_contract_schema_mutation            false
caip_contract_mutation_ownership_moved   false
caip_contract_verification_only          true
caip_contract_r2_mutation                false
intake_contract_status                   200
intake_contract_build                    359
intake_contract_legacy_build             Build 279
intake_contract_owner                    caip
intake_contract_id                       caip-media-intake-read
intake_contract_schema_mutation          false
intake_contract_mutation_ownership_moved false
intake_contract_verification_only        true
intake_contract_r2_mutation              false
intake_contract_binary_mutation          false
caip_read_service_registered             true
caip_read_service_build                  359
caip_intake_service_registered           true
caip_intake_service_build                359
application_module                       creative-production
application_mode                         active
active_application_module                creative-production
caip_domain                              caip
runtime_entry                            ../modules/creative-production/runtime.mjs?v=360
runtime_build                            360
activation_build                         361
runtime_state                            active
current_domain                           caip
last_pathname                            /admin/creative-assets/
services_ready                           true
required_service_count                   2
required_services                        ["caip-read","caip-media-intake-read"]
caip_page_proven                         true
caip_read_contract_build                 359
caip_intake_contract_build               359
creates_network_transport                false
caip_mutation_ownership                  false
contracts_ok                             true
services_ok                              true
```

No project/evidence/story mutation, probe, derivative, secure-review, upload/session, governance, duplicate-cleanup, R2, binary, or public-promotion action was invoked during the proof.

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

Prior parity audit also identified Production-only active tables including `accounting_order_records`, `gift_cards`, several Command Center tables, and the `notification_dispatch_log` aggregate-schema execution discrepancy. Keep schema parity separate from module activation and resolve it before Production business-data copy.

## Windows Git pack cleanup note

Windows previously refused to unlink an obsolete `.git/objects/pack/*.idx` and matching `.pack` during automatic Git housekeeping. Fast-forward and regressions still succeeded. Use `git -c gc.auto=0 pull ...` while validating if needed; do not manually delete one half of a pack pair.

## Historical regression rule

Historical regression scripts verify durable boundaries introduced by their own build. They must not freeze later shared runtime/cache versions or require a later domain to remain inactive. Build 355–357 and Build 358 regressions are future-compatible with CAIP activation.

## Next direction

1. Pull the browser-proof Build 361 documentation checkpoint with automatic Git GC disabled if needed.
2. Run corrected regressions for Builds 352–354, 355–357, 358, and 359–361.
3. If all four local gates pass with a clean working tree, mark Builds 352–361 fully validated. No further browser proof is required for these loader/read checkpoints.
4. Stop expanding Creative & Production top-level loader coverage; all four domains now have browser-proven pages.
5. Choose the next bounded ownership target from source evidence. Prefer a remaining Commerce & Operations page with a clean read boundary; avoid mixing known `gift_cards` fresh-install parity work into loader activation unless schema parity is deliberately the batch target.
6. Continue fresh-install schema parity separately and before any Production business-data copy.

## Validation preference

Batch related builds and provide one Git Bash block plus Firefox-safe browser blocks whenever practical.
