# Devil n Dove AI Handoff — Build 438 Development Authority / Build 437 Production Baseline

This is the **first of two canonical current project files**. Read it first for architecture, authority, safety and current release state. Read `PROJECT_STATUS_AND_ROADMAP.md` second for open functionality and ordered next work.

Historical Build validation/changed-file prose is evidence only. Specialist documents remain authoritative for specialist implementation details.

## Current release boundary

**Build 437** remains the current completed Production-proven baseline.

**Build 438** is the current source/development architecture release. Its Application Core + three-module D1 authority is **APPLIED AND EXACTLY VERIFIED IN DEVELOPMENT**, the Pages module guard is live, and all three modules have passed Development disable/block/restore isolation. The remaining Build 438 Development acceptance is authenticated Admin/Core Health/role/shared-contract proof. Build 438 Production D1 is not authorized.

Build 437 completed/proved:

```text
Build 427 Product numbers                  COMPLETE / PROVEN
Build 430 Gift Card                        COMPLETE / PROVEN
Build 432 Notification Build 403           COMPLETE / PROVEN
Build 433 Build 197 annotation index       COMPLETE / PROVEN
Build 437 Membership Build 395             COMPLETE / PROVEN
```

The Membership authorization token is SPENT / COMPLETE and must never be reused.

Build 437 deterministic release artifacts:

```text
RELEASE_NOTES.md                           Build 437
release-package-manifest.json              Build 437
manifest source scope                      git_tracked_release_files
manifest file count                        1872
manifest total size                        66279989 bytes
```

## Application architecture truth

Builds 281–397 established the retained top-level architecture:

```text
Devil n Dove Application Core
    |
    +-- commerce-operations
    +-- creative-production
    +-- business-administration
```

Customer/storefront and Member Account are distinct UX surfaces **inside Commerce & Operations**, not separate top-level runtimes.

### Commerce & Operations

Public/customer/storefront, Catalog, Inventory and Operations domains: Shop, Cart/Checkout, Members, Catalog/Product admin, Inventory, Orders, Membership, Gift Cards, customer documents, custom requests and Today Tasks.

### Creative & Production

Creative, CAIP, Packaging and Content domains: Creative Process/Project Workflow, Creative Assets/CAIP, Packaging Studio, Website Media & Content Studio, Content Studio, visual enrichment/image manifest/stage-photo/content-publication workflows.

### Business & Administration

Marketing, Accounting, Platform and Administration domains: Accounting, Analytics/SEO/marketing, users/settings/security, Application Sanity, Release & Go-Live and deployment/runtime/platform controls.

## Existing modular runtime foundation

Retained core/runtime files:

```text
public/js/core/dd-module-registry.mjs
public/js/core/dd-module-definitions.mjs
public/js/core/dd-module-contracts.mjs
public/js/core/dd-module-service-adapters.mjs
public/js/core/dd-application-module-groups.mjs
public/js/core/dd-admin-module-runtime.mjs
public/js/modules/commerce-operations/runtime.mjs
public/js/modules/creative-production/runtime.mjs
public/js/modules/business-administration/runtime.mjs
```

The registry/runtime is passive/lazy. Top-level extraction is still incremental; do not claim every legacy mutation moved into an umbrella runtime.

## Build 438 activation authority

Build 438 adds the persistent/server-authoritative activation/access layer around the existing three-module architecture.

Primary authority:

```text
database_build438_application_module_activation.sql
database_full_schema.sql                         synchronized with Build 438
BUILD438_D1_VERIFICATION.sql
BUILD438_D1_STRICT_VERIFICATION.sql
_routes.json
functions/api/_lib/appModules.js
functions/api/_lib/appModuleRoutes.js
functions/api/_lib/appModuleSessionGuard.js
functions/_middleware.js
functions/api/modules.js
functions/api/admin/app-modules.js
admin/index.html
admin/application-modules/index.html
public/js/admin-application-modules.js
public/js/admin.js
public/js/site-auth-ui.js
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
BUILD438_APPLICATION_CORE_MODULE_PLAN.md
BUILD438_VALIDATION.md
BUILD438_DEVELOPMENT_AUTHORITY_EVIDENCE.md
```

## Build 438 Development authority — proven

Target:

```text
Pages project:  devilndove-site-dev
D1 database:    devilndove-dev
D1 UUID:        dbc1615b-dcbe-4951-973b-b47c99c73bfa
Wrangler:       4.126.0
```

Owner-run evidence is recorded in `BUILD438_DEVELOPMENT_AUTHORITY_EVIDENCE.md`.

Green gates:

```text
Full-schema Build 438 authority              PASS / SINGLE AUTHORITY
Application Core regression                 PASS (20/20)
Route map                                    PASS (53 routes + 7 shared contracts)
Build305 catalog/server alignment            PASS (61/61)
Cross-module access policy                   PASS (12/12)
Session resilience                           PASS (6/6)
Windows/strict verification regression       PASS (10/10)
Pages invocation routing                     PASS (10/10)
Development migration                        APPLIED / PASS
Development human read-only verification     PASS / 0 writes
Development strict self-asserting verify     PASS / 0 writes
Development module isolation                 PASS (3/3)
Pages module guard invocation                PROVEN
Final isolation state                        RESTORED / EXACT
```

Exact Development D1 state:

```text
module_count:               3
role_access_count:          6
enabled_module_count:       3
background_enabled_count:   0
expected_index_count:       2
module_keys:                business-administration|commerce-operations|creative-production
```

## Pages invocation boundary — proven

An early live isolation attempt exposed that the tracked `_routes.json` invoked Functions only for `/api/*`; static `/shop/` and `/admin/...` pages therefore bypassed root middleware even though D1 module state changed correctly.

Build 438 now invokes Functions narrowly for:

```text
/api/*
/admin + /admin/*
/shop + /shop/*
/cart + /cart/*
/checkout + /checkout/*
/product + /product/*
/products + /products/*
/custom-request + /custom-request/*
/members + /members/*
```

General informational/static public pages remain outside Functions.

Module-owned responses expose:

```text
X-DND-Module-Guard: 438
X-DND-Module-Key: <module-key>
X-DND-Shared-Contract: <contract-path>  when applicable
```

Live baseline evidence:

```text
business-administration   /admin/accounting/        HTTP 401 / guard=438
commerce-operations       /shop/                    HTTP 200 / guard=438
creative-production       /admin/creative-process/  HTTP 401 / guard=438
```

## Build 438 D1 tables/default role state

```text
app_modules
app_module_role_access
```

Expected/default state:

```text
commerce-operations       enabled / background OFF
creative-production       enabled / background OFF
business-administration   enabled / background OFF

member -> Commerce allowed/member
member -> Creative denied/none
member -> Business denied/none
admin  -> all three allowed/manage
```

No per-user override table exists yet.

## Direct module behavior contract — live proven

A disabled/unavailable module must:

- disappear from normal module-aware navigation;
- fail closed on direct module page access;
- fail closed on broad/legacy module API access;
- suppress top-level runtime activation;
- clear its background permission;
- retain all business data for later re-enable.

Development live proof established:

```text
commerce-operations       /shop/                    enabled 200 -> disabled 403 -> restored 200
creative-production       /admin/creative-process/  enabled 401 -> disabled 403 -> restored 401
business-administration   /admin/accounting/        enabled 401 -> disabled 403 -> restored 401
Core recovery             /admin/application-modules/ stayed HTTP 200 throughout
Other enabled modules     retained recorded baseline behavior
Final module state        RESTORED / EXACT
Business table mutation   NONE
Production mutation       NONE
```

A role with module access level `read` may read direct module APIs but non-read methods are denied with:

```text
module_access_level_read_only
```

Core recovery/control surfaces are never owned by a business module:

```text
/admin/application-modules/
/api/admin/app-modules
```

The Admin Dashboard contains a permanent **Application Modules** card and the authenticated account widget retains an Admin-only recovery link.

## Cross-module shared service policy

Module independence does **not** mean severing a narrow reviewed service that another enabled module consumes.

Build 438 recognizes exactly seven Application Core service contracts:

| Contract | Owner | Reviewed consumers | Mutation |
|---|---|---|---|
| `catalog-read` | Commerce | Commerce, Creative, Business | No |
| `inventory-read` | Commerce | Commerce, Creative | No |
| `inventory-cost` | Commerce | Commerce, Business | No |
| `inventory-post` | Commerce | Commerce, Creative | Yes |
| `inventory-reverse` | Commerce | Commerce, Creative | Yes |
| `accounting-read` | Business | Business, Commerce | No |
| `content-media` | Creative | Creative, Commerce | No |

Full routes are `/api/admin/contracts/<contract>`.

Rules:

- direct owner UI/broad API remains blocked when the owner module is disabled;
- a shared contract remains callable only when a reviewed consumer is enabled and accessible to the current user;
- shared mutation contracts require a qualifying consumer with `manage` access;
- no broad API prefix may be exempted merely for convenience.

The 12/12 policy test proves Commerce-disabled + Creative-enabled Inventory contract eligibility and rejects a read-only Creative consumer for shared Inventory mutation contracts.

## Module authority/session failure semantics

Build 438 distinguishes rollout from real failure:

```text
schema missing during rollout -> all-enabled compatibility defaults; control writes blocked
healthy D1 authority          -> D1 module state
transient D1/config failure   -> last-known module state when available
cold real authority failure   -> fail closed
```

A transient session-verification failure returns a retryable 503 and does **not** masquerade as a false 401/logout. Invalid/expired sessions still behave as ordinary unauthenticated state.

Only non-user module configuration is briefly cached. User/session identity remains request-scoped.

## Admin Application Modules control

The control screen/API supports:

- enable/disable module;
- background permission;
- member/admin role access;
- audited changes;
- Core Health diagnostics;
- Current-State Route Proof;
- **Authenticated Acceptance Proof** with automatic module/role restoration.

Core Health checks:

```text
3 expected module rows
6 expected role rows
7 shared contracts
no missing/unexpected rows
no contradictory role state
no disabled module with background permission
no Admin recovery-access risk
```

## Authenticated Admin acceptance — current next step

Open:

```text
/admin/application-modules/
```

while logged in as Admin and run **Run authenticated acceptance proof**.

The runner is designed to prove in one restoring pass:

```text
Core Health                            PASS
3 modules enabled/background OFF      exact baseline
Admin access                           manage on all three
Commerce audited disable              direct 403 + client unavailable
Commerce shared Inventory read        remains available through Creative consumer
Creative audited disable              direct 403 + client unavailable
Creative shared content-media read    remains available through Commerce consumer
Business audited disable              direct 403 + client unavailable
Business shared accounting-read       remains available through Commerce consumer
Admin Business access -> read         GET allowed
Admin Business read-level POST        403 module_access_level_read_only
All modules/roles                     restored exactly
Final Core Health                     PASS
```

Safety:

- module/role changes go through the audited Core control API;
- shared live probes are GET/read-only only;
- no `inventory-post` or `inventory-reverse` dummy calls are made;
- the read-level POST probe uses an intentionally unsupported action so even a guard regression cannot create a business write;
- restore paths are in `finally` blocks.

Local source safety authority:

```text
scripts/build438_authenticated_acceptance_regression.py
```

## Background activity rule

`background_activity_enabled` is a permission, not a scheduler.

All three modules default background OFF. Disabling a module clears its background permission and re-enabling does not silently restore it.

Build 438 introduces no recurring polling loop.

## Public shell scope

The Commerce switch gates transactional/customer surfaces such as Shop, Cart, Checkout and Product/Member workflows. General informational public pages remain available.

A future full-site maintenance mode should be a separate Application Core feature, not an overloaded Commerce switch.

## Major subsystem authority boundaries

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

### Catalog / Inventory / Production
Product/supply/tool identity and stock facts. Actual production/material posting retains immutable/reversible evidence.

## Worker/resource-efficiency rules

- no routine request-time schema creation/repair;
- no automatic retry of CPU/resource-limit failures;
- polling bounded/opt-in only;
- avoid whole-workspace refresh after small mutations;
- disabled modules do not initialize avoidable runtime work;
- analytics/fallback diagnostics must not block business actions;
- server authorization, not hidden UI, is the security boundary;
- never cache request-specific session/user state globally;
- `_routes.json` must stay narrow: do not route the entire static site through Functions merely to implement module switches.

Known Build 438 observation item: middleware can add one indexed session lookup on authenticated module-owned requests while a legacy endpoint also authenticates independently. Measure this in Development; do not solve it with global user caches.

## SEO/public rules

- one clear H1 per exposed page;
- truthful concise titles/descriptions/canonicals;
- natural searcher language, no stuffing;
- crawlable descriptive internal links;
- descriptive alt text and real product/process/workshop evidence;
- meaningful mobile content parity;
- no manufactured local claims/social proof;
- measure Search Console/Business Profile outcomes;
- Admin/private workflow pages remain `noindex`.

## Production safety state

```text
Build 437 Membership authorization               SPENT / COMPLETE
Build 438 Development D1 authority                APPLIED / EXACTLY VERIFIED
Build 438 Pages module guard                      PROVEN
Build 438 Development live isolation              PASS (3/3) / RESTORED EXACT
Build 438 authenticated Admin acceptance          PENDING
Build 438 Production D1 migration                 NOT AUTHORIZED
Fractional Inventory/Creative rebuilds            NOT AUTHORIZED
Product/FK rebuilds                               NOT AUTHORIZED
Accounting/default/nullability rebuilds           NOT AUTHORIZED
R2/provider mutation                              DISABLED unless explicitly scoped
CAIP D1-only media copy                           FORBIDDEN
Broad Production promotion                        CLOSED
Main/Production broad promotion                   FROZEN pending broader acceptance
```

A generic `continue`, `next release`, pasted output or feature request does not authorize Production mutation.

## Immediate Development next step

Run the local authenticated-acceptance safety regression, deploy/pull the current Build 438 Admin control bundle, then log in to `/admin/application-modules/` and click **Run authenticated acceptance proof**. Record the complete output/result. Do not prepare a Production authorization boundary until that authenticated Development proof is green.

Read `BUILD438_DEVELOPMENT_AUTHORITY_EVIDENCE.md` and `BUILD438_VALIDATION.md` for owner-run evidence/procedure, then `PROJECT_STATUS_AND_ROADMAP.md` for the remaining feature roadmap.
