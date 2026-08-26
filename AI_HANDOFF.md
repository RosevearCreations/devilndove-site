# Devil n Dove AI Handoff — Build 438 Source / Build 437 Production Baseline

This is the **first of two canonical current project files**. Read it first for architecture, authority, safety and current release state. Read `PROJECT_STATUS_AND_ROADMAP.md` second for open functionality and ordered next work.

Historical Build validation/changed-file prose is evidence only. Specialist documents remain authoritative for specialist implementation details.

## Current release boundary

**Build 437** remains the current completed Production-proven baseline.

**Build 438** is the current source/development architecture release. Its source control plane is ready for owner validation; its Development D1 migration is still pending owner execution and its Production D1 migration is not authorized.

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

Builds 281–397 already established the real module architecture:

```text
Devil n Dove Application Core
    |
    +-- commerce-operations
    +-- creative-production
    +-- business-administration
```

Customer/storefront and Member Account are distinct UX surfaces **inside Commerce & Operations**, not separate top-level runtimes.

### Commerce & Operations

Composes public/customer/storefront, Catalog, Inventory and Operations domains: Shop, Cart/Checkout, Members, Catalog/Product admin, Inventory, Orders, Membership, Gift Cards, customer documents, custom requests and Today Tasks.

### Creative & Production

Composes Creative, CAIP, Packaging and Content domains: Creative Process/Project Workflow, Creative Assets/CAIP, Packaging Studio, Website Media & Content Studio, Content Studio, visual enrichment/image manifest/stage-photo/content-publication workflows.

### Business & Administration

Composes Marketing, Accounting, Platform and Administration domains: Accounting, Analytics/SEO/marketing, users/settings/security, Application Sanity, Release & Go-Live and deployment/runtime/platform controls.

## Existing modular runtime foundation

Key retained files:

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

The existing registry/runtime is passive/lazy. Top-level extraction is still incremental; do not claim every mutation moved into an umbrella runtime.

## Build 438 source authority

Build 438 adds the persistent/server-authoritative activation/access layer around the existing three-module architecture.

Primary source:

```text
database_build438_application_module_activation.sql
functions/api/_lib/appModules.js
functions/api/_lib/appModuleRoutes.js
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
BUILD438_D1_VERIFICATION.sql
scripts/build438_application_module_core_regression.py
scripts/build438_module_route_map_test.mjs
scripts/build438_module_catalog_alignment_test.mjs
scripts/build438_module_access_policy_test.mjs
scripts/build438_development_module_activation.py
BUILD438_APPLICATION_CORE_MODULE_PLAN.md
BUILD438_VALIDATION.md
```

## Build 438 D1 authority

Tables:

```text
app_modules
app_module_role_access
```

Expected default state:

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

## Build 438 direct module behavior

A disabled/unavailable module must:

- disappear from normal module-aware navigation;
- fail closed on direct module page access;
- fail closed on broad/legacy module API access;
- suppress top-level runtime activation;
- clear its background permission;
- retain all business data for later re-enable.

A role with module access level `read` may read direct module APIs but non-read methods are denied with:

```text
module_access_level_read_only
```

The Admin recovery/control surface is Application Core and cannot be disabled by a business-module switch:

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

The executable Build 438 policy test proves cases including **Commerce disabled + Creative enabled -> Inventory post/reverse consumer authority remains eligible**, while Creative `read` access cannot qualify for those mutation contracts.

## Module authority failure semantics

Build 438 distinguishes rollout from real failure:

```text
schema missing during rollout -> all-enabled compatibility defaults; control writes blocked
healthy D1 authority          -> D1 module state
transient D1/config failure   -> last-known module state when available
cold real authority failure   -> fail closed
```

A real authority read failure must never silently re-enable a disabled module.

Only non-user module configuration is briefly cached. User/session identity remains request-scoped.

## Admin Application Modules control

The control screen/API supports:

- enable/disable module;
- background permission;
- member/admin role access;
- audited changes;
- Core Health diagnostics;
- Current-State Route Proof.

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

Current-State Route Proof HEAD-checks representative Core, Commerce, Creative and Business routes against current configuration without changing module state.

## Background activity rule

`background_activity_enabled` is a permission, not a scheduler.

All three modules default background OFF. Disabling a module clears its background permission and re-enabling does not silently restore it.

Existing/future module-owned background work must explicitly check module authority before running.

Build 438 introduces no recurring polling loop.

## Public shell scope

The Commerce switch gates transactional/customer surfaces such as Shop, Cart, Checkout and Product/Member workflows. General informational public pages remain available in this release.

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
- never cache request-specific session/user state globally.

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
Build 438 Development D1 migration               PENDING OWNER RUN
Build 438 Production D1 migration                NOT AUTHORIZED
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

Run the consolidated Build 438 source gate, route/catalog/access-policy tests and syntax checks. Then run the hard-pinned Development-only D1 apply/verify helper. After Development deployment, require Core Health PASS and prove disable/re-enable/recovery/data-preservation/shared-contract behavior for all three modules.

Do not prepare a Production authorization boundary until those Development proofs are green.

Read `BUILD438_VALIDATION.md` for the exact owner-run procedure and `PROJECT_STATUS_AND_ROADMAP.md` for the remaining feature roadmap.
