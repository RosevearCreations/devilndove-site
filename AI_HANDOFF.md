# Devil n Dove AI Handoff — Build 439 Active Development / Build 437 Production Baseline

This is the **first of two canonical current project files**. Read it first for architecture, authority, safety and current release state. Read `PROJECT_STATUS_AND_ROADMAP.md` second for the ordered subsystem completion queue.

Historical Build prose is evidence only. Specialist documents remain authoritative for specialist implementation details.

## Current release boundary

**Build 437** remains the current completed Production-proven baseline.

**Build 438 — Application Core / Module Activation** is **DEVELOPMENT-PROVEN**. The persistent three-module authority, Pages routing guard, anonymous isolation, authenticated Admin controls, shared contracts, client suppression and role-level `read` enforcement are all live-proven in Development. Build 438 Production D1 is **not authorized**.

**Build 439 — CAIP Media / Video Evidence Review** is the active Development feature family. Its source/schema/D1 authority is proven, but browser acceptance is still open while Development private-media D1 <-> R2 parity is audited. The selected test asset successfully created an authenticated review grant, but its recorded object key was absent from the bound Development R2 bucket. A read-only storage diagnostic now audits recorded CAIP media candidates with D1 reads + R2 HEAD only.

Build 437 completed/proved:

```text
Build 427 Product numbers                  COMPLETE / PROVEN
Build 430 Gift Card                        COMPLETE / PROVEN
Build 432 Notification Build 403           COMPLETE / PROVEN
Build 433 Build 197 annotation index       COMPLETE / PROVEN
Build 437 Membership Build 395             COMPLETE / PROVEN
```

The Membership Production authorization token is SPENT / COMPLETE and must never be reused.

## Application architecture truth

```text
Devil n Dove Application Core
    |
    +-- commerce-operations
    +-- creative-production
    +-- business-administration
```

This remains **one application with three top-level modules**. Specialist areas may have separate workspaces/pages/APIs, but should stay under the correct owner module unless a genuine isolation/security requirement justifies a new top-level module.

Customer/storefront and Member Account are separate UX surfaces **inside Commerce & Operations**, not separate top-level runtimes.

### Commerce & Operations

Shop, Cart/Checkout, Members, Catalog/Product admin, Inventory, Tools, Collections, Movies, Orders, Membership, Gift Cards, customer documents, custom requests, merchandising and operational/customer workflows.

### Creative & Production

Creative Process, Creative Projects, CAIP/Creative Assets, Packaging Studio, Media & Content Studio, Content Studio, visual enrichment and reviewed production/content workflows.

### Business & Administration

Accounting, Analytics/SEO/marketing, users/settings/security, Application Sanity, Release & Go-Live and platform/runtime administration.

## Completion discipline

A subsystem is not complete because code exists. Before marking a coherent family Development-complete, require all applicable gates:

```text
authority/schema exact
source regression green
Development migration/apply + strict verification when required
API/auth/degraded behavior acceptance
real browser end-to-end acceptance
mobile/desktop/CSS acceptance
integrity/recovery/observability acceptance
SEO/public quality for exposed surfaces
canonical documentation updated
Production promotion still separately authorized
```

The ordered queue is owned by `PROJECT_STATUS_AND_ROADMAP.md`. Current order begins with completing CAIP, then Commerce/Product/Inventory/Tools, Shop/Collections/merchandising, Movies, Creative Process, Packaging, Media & Content, Content/social publishing, Business Administration/mobile workflows, Customer/Member polish, final SEO and go-live certification.

## Build 438 authority

Primary authority:

```text
database_build438_application_module_activation.sql
database_full_schema.sql
BUILD438_D1_VERIFICATION.sql
BUILD438_D1_STRICT_VERIFICATION.sql
_routes.json
functions/api/_lib/appModules.js
functions/api/_lib/appModuleRoutes.js
functions/api/_lib/appModuleSessionGuard.js
functions/_middleware.js
functions/api/modules.js
functions/api/admin/app-modules.js
admin/application-modules/index.html
public/js/admin-application-modules.js
public/js/core/dd-application-module-bootstrap.mjs
public/js/core/dd-public-module-visibility.mjs
scripts/build438_application_module_core_regression.py
scripts/build438_module_route_map_test.mjs
scripts/build438_module_catalog_alignment_test.mjs
scripts/build438_module_access_policy_test.mjs
scripts/build438_module_session_resilience_test.mjs
scripts/build438_pages_invocation_routes_test.py
scripts/build438_development_module_activation.py
scripts/build438_development_module_isolation_proof.py
scripts/build438_authenticated_acceptance_regression.py
BUILD438_DEVELOPMENT_AUTHORITY_EVIDENCE.md
BUILD438_VALIDATION.md
```

## Build 438 Development evidence — complete

Target:

```text
Pages project:  devilndove-site-dev
D1 database:    devilndove-dev
D1 UUID:        dbc1615b-dcbe-4951-973b-b47c99c73bfa
Wrangler:       4.126.0
```

Green source/local gates:

```text
Full-schema authority                         PASS / SINGLE AUTHORITY
Application Core regression                   PASS (20/20)
Route map                                      PASS (53 routes + 7 shared contracts)
Build305 catalog/server alignment              PASS (61/61)
Cross-module access policy                     PASS (12/12)
Session resilience                             PASS (6/6)
Windows/strict verification                    PASS (10/10)
Pages invocation routing                       PASS (10/10)
Authenticated acceptance safety                PASS (18/18)
```

Development D1:

```text
migration                                      APPLIED / PASS
human read-only verification                   PASS / 0 writes
strict self-asserting verification             PASS / 0 writes
module_count                                   3
role_access_count                              6
enabled_module_count                           3
background_enabled_count                       0
expected_index_count                           2
module_keys                                    business-administration|commerce-operations|creative-production
```

Anonymous live isolation:

```text
commerce-operations       enabled 200 -> disabled 403 -> restored 200
creative-production       enabled 401 -> disabled 403 -> restored 401
business-administration   enabled 401 -> disabled 403 -> restored 401
Core recovery             HTTP 200 throughout
Other enabled modules     baseline preserved
Final state               RESTORED / EXACT
Result                    PASS (3/3 MODULES)
```

Authenticated Admin/browser acceptance:

```text
Current-state route proof                      PASS (4/4)
Authenticated acceptance                       PASS (31/31)
Core Health                                    PASS
All three audited disable/restore flows        PASS
Client availability suppression                PASS
Shared inventory-read/content-media/
accounting-read while owner disabled            PASS
Admin manage -> read transition                PASS
Read-level GET                                 PASS / HTTP 200
Read-level non-read request                    BLOCKED / HTTP 403
Canonical denial                               module_access_level_read_only
Endpoint mutation reached                      NO
Admin manage restore                           PASS
Final modules                                  ALL THREE ENABLED
Final backgrounds                              ALL THREE OFF
```

The acceptance runner contains no direct SQL, never calls `inventory-post`/`inventory-reverse`, uses read-only shared probes and restores temporary module/role state in `finally` paths. A separate before/after business-table row-count sample was not captured, so do not claim that measurement.

## Build 439 current evidence and blocker

Implemented/proven:

```text
Build 439 source regression                         PASS 27/27
provider fail-closed rerun                          PASS 3/3
storage diagnostic regression                      PASS / READ-ONLY
full-schema sync                                    PASS / SINGLE AUTHORITY
Development D1 migration                            APPLIED / PASS
Build 439 tables                                    3 / EXACT
Build 439 indexes                                   7 / EXACT
verified-completion triggers                        2 / EXACT
disabled provider profiles                          2 / EXACT
migration ledger                                    1 / EXACT
API readiness                                       HTTP 200 / schema_ready true
provider execution                                  false
missing Build 439 tables                            none
```

Private review grant creation is working. The live secure-review request failed with:

```text
HTTP 400
The R2 review object was not found. Source media has not been changed.
```

Therefore do not weaken auth or range-streaming logic and do not rerun the Build 439 schema migration. First complete the bounded Development temporal-media storage audit. Classifications are:

```text
healthy_media_asset_binding
recoverable_metadata_drift
recorded_keys_missing_from_dev_r2
r2_binding_unavailable
no_recorded_r2_key
```

Repairs must remain evidence-based:

- if another recorded candidate exists in R2, repair only the metadata linkage through an audited Development path;
- if no candidate object exists, require a proper Development re-upload/recovery path;
- never invent or copy a D1-only media authority;
- never mutate Production while closing Development acceptance.

Build 439 does not close until secure private playback/seeking, reviewed temporal evidence, story-evidence promotion/approval, internal story drafting and manifest download all pass live in Development.

## Module behavior contract

A disabled module must:

- disappear from module-aware navigation;
- fail closed on direct module pages and broad module APIs;
- suppress umbrella runtime activation;
- clear background permission;
- retain business data for later re-enable.

A `read` role may read module APIs but POST/PUT/PATCH/DELETE is denied by middleware with `module_access_level_read_only`.

Core recovery remains outside all business modules:

```text
/admin/application-modules/
/api/admin/app-modules
```

## Cross-module shared contracts

Exactly seven reviewed Application Core contracts exist:

| Contract | Owner | Reviewed consumers | Mutation |
|---|---|---|---|
| `catalog-read` | Commerce | Commerce, Creative, Business | No |
| `inventory-read` | Commerce | Commerce, Creative | No |
| `inventory-cost` | Commerce | Commerce, Business | No |
| `inventory-post` | Commerce | Commerce, Creative | Yes |
| `inventory-reverse` | Commerce | Commerce, Creative | Yes |
| `accounting-read` | Business | Business, Commerce | No |
| `content-media` | Creative | Creative, Commerce | No |

Rules:

- owner UI/broad API stays blocked when owner is disabled;
- shared contract requires an enabled, authorized reviewed consumer;
- mutation contracts require `manage`;
- never exempt a broad API prefix for convenience.

Live Development acceptance proved the three safe read contracts survive their owner module being disabled. Mutation policy is unit-proven; real Inventory completion must later prove valid posting/reversal with controlled Development fixtures rather than fabricated destructive tests.

## Major subsystem authority boundaries

### Product / Inventory / Tools

Product/Catalog owns sellable/product identity. Inventory owns stock/material quantities, movement and costing. Tools is a specialist operational catalogue/history surface and must not create a second stock/material authority. Cross-workspace mutations use reviewed shared contracts.

### Shop / Collections / merchandising

Public Shop/Collections use Product/Catalog authority. Existing `public_display_priorities` is the reviewed manual merchandising authority. Future automated Top Sellers must derive from real completed sale/order-line evidence and may coexist with manual pinning without pretending a manually pinned item is a sales-ranked bestseller.

### Movies

Movie catalogue identity remains specialist collection metadata under Commerce & Operations. Existing JSON + D1 overlay needs authority cleanup. Movies may expose catalogue/trailer/reference metadata but must not implement redistribution/streaming of copyrighted disc content.

### Creative Process

Project/process/material/time/cost authority. Planned material facts do not change Inventory. Actual reviewed use changes stock only through explicit posting; corrections use compensating reversals.

### CAIP / Creative Assets

Private source-media/intake/recovery/evidence/story/derivative-plan authority. Multipart completion stays fail closed and proves parts/ETags/ranges/bytes/final R2 size.

### Content Studio

Reviewed channel-package/deliverable preparation. It must not duplicate Creative Process identity or invent public claims unsupported by evidence.

### Packaging Studio

Label/package presentation plus reviewed printed ingredient/claim evidence. Inventory links are source/identity traceability only and do not consume/reserve stock.

### Media & Content Studio

Static/public-site content/media placement authority. Product/Inventory specialist records and private CAIP originals remain outside it.

## Failure and resource semantics

```text
schema missing during rollout -> all-enabled compatibility / writes blocked
healthy D1 authority          -> D1 state
transient config failure      -> last-known state when available
cold authority failure        -> fail closed
transient session failure     -> retryable 503 / no false logout
invalid/expired session       -> normal unauthenticated state
```

Only non-user module configuration is briefly cached. Session/user identity stays request-scoped.

`background_activity_enabled` is permission, not a scheduler. All modules default OFF; disabling a module clears it and re-enable does not silently restore it.

`_routes.json` deliberately sends only APIs, Admin surfaces and transactional Commerce routes through Functions. General informational/static pages remain static.

## Worker/resource-efficiency rules

- no request-time schema repair;
- no automatic retry of CPU/resource-limit failures;
- polling bounded/opt-in only;
- disabled modules do not initialize avoidable runtime work;
- avoid whole-workspace refresh after narrow writes;
- server authorization is the security boundary;
- never cache request-specific users globally;
- keep `_routes.json` narrow;
- do not compute Top Sellers or other merchandising rankings expensively on every unrelated page request; use bounded/cacheable reviewed outputs.

Known observation: module middleware can add one indexed session lookup before a legacy endpoint authenticates again. Measure before optimizing; never solve it with a global user cache.

## SEO/public rules

Continue one clear H1, truthful concise title/meta/canonical, natural searcher language, crawlable descriptive links, descriptive alt text, real product/process evidence, mobile parity and measured Search Console/Business Profile outcomes. Admin/private workflow pages remain `noindex`.

## Production safety state

```text
Build 437 Membership authorization               SPENT / COMPLETE
Build 438 Development                            PROVEN
Build 438 Production D1 migration                NOT AUTHORIZED
Build 439 Development                            ACTIVE / BROWSER ACCEPTANCE OPEN
Fractional Inventory/Creative rebuilds           NOT AUTHORIZED
Product/FK rebuilds                              NOT AUTHORIZED
Accounting/default/nullability rebuilds          NOT AUTHORIZED
R2/provider mutation                             DISABLED unless explicitly scoped
CAIP D1-only media copy                          FORBIDDEN
Broad Production promotion                       CLOSED
Main/Production broad promotion                  FROZEN
```

A generic `continue`, `next release`, pasted output or feature request does not authorize Production mutation.

Read `BUILD438_DEVELOPMENT_AUTHORITY_EVIDENCE.md` for detailed Build 438 evidence and `PROJECT_STATUS_AND_ROADMAP.md` for the ordered completion queue and go-live gate.
