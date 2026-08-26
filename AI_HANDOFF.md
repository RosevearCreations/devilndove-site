# Devil n Dove AI Handoff — Build 438 Source / Build 437 Production Baseline

This is the **first of two canonical current project files**. Read this file first for architecture, authority, safety and current release state. Read `PROJECT_STATUS_AND_ROADMAP.md` second for open functionality and ordered next work.

Historical Build validation/changed-file prose is evidence only and does not override these two canonical files. Specialist documents remain authoritative for specialist implementation details.

## Current release boundary

**Build 437 — Membership canonical completion and release alignment** remains the current completed Production-proven release baseline.

Build 438 is the current **source/development architecture release in progress**. Its Production D1 migration is not authorized.

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

The repo already contains an Application Core and three top-level application modules created progressively in Builds 281–397.

```text
Devil n Dove Application Core
    |
    +-- commerce-operations
    +-- creative-production
    +-- business-administration
```

### Commerce & Operations

Composes public/storefront, Catalog, Inventory and Operations domains.

Representative surfaces include Shop, Cart/Checkout, customer/member account, Catalog/Product admin, Inventory, Orders, Membership, Gift Cards, customer documents, custom requests and Today Tasks.

### Creative & Production

Composes Creative, CAIP, Packaging and Content domains.

Representative surfaces include Creative Process/Creative Project Workflow, CAIP/Creative Assets, Packaging Studio, Website Media & Content Studio, Content Studio, visual enrichment/image-manifest/stage-photo/content-publication workflows.

### Business & Administration

Composes Marketing, Accounting, Platform and Administration domains.

Representative surfaces include Accounting, Analytics/SEO/marketing, users/settings/security, Application Sanity, Release & Go-Live and deployment/runtime/platform controls.

### Customer/member clarification

Customer Commerce and Member Account remain important distinct UX surfaces, but they are **not separate top-level runtime modules**. They are part of Commerce & Operations. Do not create a competing fourth top-level module merely to mirror UI surfaces.

## Existing modular runtime foundation

Key existing files:

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

The existing registry is passive and already supports route resolution, role checks, lazy loading and lifecycle state. The top-level runtimes are intentionally passive and do not create network transport merely by import.

Business-domain extraction is still incremental. Do not claim every mutation is owned by an umbrella runtime merely because the top-level module exists.

## Build 438 purpose

Build 438 adds the missing **persistent/server-authoritative activation layer** around the existing three-module architecture.

Source authority added in Build 438:

```text
database_build438_application_module_activation.sql
functions/api/_lib/appModules.js
functions/api/_lib/appModuleRoutes.js
functions/_middleware.js
functions/api/modules.js
functions/api/admin/app-modules.js
admin/application-modules/index.html
public/js/admin-application-modules.js
public/js/core/dd-application-module-bootstrap.mjs
public/js/core/dd-public-module-visibility.mjs
BUILD438_D1_VERIFICATION.sql
scripts/build438_application_module_core_regression.py
BUILD438_APPLICATION_CORE_MODULE_PLAN.md
```

Build 438 provides:

- D1 `app_modules` authority;
- D1 `app_module_role_access` authority;
- all three modules enabled by default;
- current `member`/`admin` access seeded explicitly;
- bounded module-config caching only for non-request-specific configuration;
- request-scoped session/user evaluation;
- server route/API module mapping;
- root Pages middleware fail-closed module enforcement;
- read-only access-level enforcement for non-read API methods;
- read-only `/api/modules` bootstrap;
- Admin Application Modules recovery/control screen;
- audited enable/disable/background/role-access changes;
- authoritative browser bootstrap before legacy umbrella runtime activation;
- public/member navigation visibility pass;
- no request-time module-schema DDL;
- no new polling loop.

## Build 438 safety behavior

Before the Build 438 D1 schema exists, server reads use a safe all-enabled compatibility fallback so source deployment does not unexpectedly disable the application. Module-control writes are blocked until the canonical migration is present.

Once the D1 authority exists, module state is authoritative.

A disabled/unavailable module should:

- disappear from normal module-aware navigation;
- fail closed on direct page/API access;
- suppress top-level runtime activation;
- not be implicitly allowed to run module-owned polling/sync/provider work;
- retain all business data for later re-enable.

The recovery/control route is shared core and intentionally exempt from module disablement:

```text
/admin/application-modules/
/api/admin/app-modules
```

## Background activity rule

`background_activity_enabled` is a permission, not a scheduler.

Existing/future background operations owned by a module must explicitly check module authority before running. Build 438 exposes `canBackground(moduleKey)` client-side and the same D1 authority server-side.

All three default module records start with background activity OFF.

## Current roles

Current user-role authority remains:

```text
member
admin
```

Build 438 intentionally does not invent creator/operator/supervisor roles. Add them later only through a deliberate user/authorization design.

Initial module access:

```text
member -> commerce-operations       allowed
member -> creative-production       denied
member -> business-administration   denied

admin  -> all three                 allowed/manage
```

## Shared core authority

Shared core remains outside switchable business modules:

- authentication/session handling;
- common authorization helpers;
- D1 access wrappers/read helpers;
- module registry/availability service;
- route guard/recovery control;
- common security/CSP/error/fallback behavior;
- responsive shell/navigation primitives;
- bounded shared analytics where applicable;
- release/build metadata.

## Major subsystem authority boundaries

### Creative Process

Project/process/material/time/cost authority. Planned material facts do not change Inventory. Actual reviewed use changes stock only through explicit posting. Posted usage is audit data and corrections use compensating reversals.

### CAIP / Creative Assets

Private source-media/intake/recovery/evidence/story/derivative-plan authority. Multipart completion remains fail-closed and must prove actual parts/ETags/ranges/bytes and final R2 size.

### Content Studio

Reviewed channel-package/deliverable preparation. It does not create duplicate Creative Process project identity and must not invent public claims unsupported by reviewed evidence.

### Packaging Studio

Label/package presentation plus reviewed printed ingredient/claim evidence. Inventory links are source/identity traceability only and must not consume/reserve stock. English/French printed declarations remain review/fit gated.

### Media & Content Studio

Static/public-site content/media placement authority. Product/Inventory specialist records and private CAIP originals remain outside it.

### Catalog / Inventory / Production

Product/supply/tool identity and stock facts. Actual production/material posting must retain immutable/reversible evidence.

## Worker/resource-efficiency rules

- no routine request-time schema creation/repair;
- no automatic retry of CPU/resource-limit failures;
- keep polling bounded/opt-in;
- avoid whole-workspace refresh after small mutations;
- disabled modules should not initialize avoidable runtime work;
- analytics/fallback diagnostics must not block business actions;
- server authorization, not hidden UI, is the security boundary;
- never cache request-specific session/user state globally.

### Build 438 efficiency note

The first secure middleware boundary can introduce one additional indexed session lookup on authenticated module-owned requests because many legacy endpoints also verify auth independently. Measure this after Development deployment. A future consolidation can pass verified request identity through shared request context, but do not weaken endpoint authorization or use global user caches merely to remove the query.

## SEO/public rules

- one clear H1 per exposed page;
- truthful concise titles/descriptions/canonicals;
- natural searcher language rather than stuffing;
- crawlable descriptive internal links;
- descriptive alt text and real product/process/workshop evidence;
- meaningful mobile content parity;
- no manufactured local pages/claims/social proof;
- measure Search Console/Business Profile outcomes;
- Admin/private workflow pages remain `noindex`.

## Production safety state

```text
Build 437 Membership authorization               SPENT / COMPLETE
Build 438 Production D1 migration                NOT AUTHORIZED
Fractional Inventory/Creative rebuilds            NOT AUTHORIZED
Product/FK rebuilds                               NOT AUTHORIZED
Accounting/default/nullability rebuilds           NOT AUTHORIZED
R2/provider mutation                              DISABLED unless explicitly scoped
CAIP D1-only media copy                           FORBIDDEN
Broad Production promotion                        CLOSED
Main/Production broad promotion                   FROZEN pending broader acceptance
```

A generic “continue”, “next release”, pasted output or feature request does not authorize Production mutation.

## Development next step

Complete the Build 438 local source gate, then apply the focused Build 438 migration to **Development only**, run `BUILD438_D1_VERIFICATION.sql`, deploy/preview Development and prove enable/disable/re-enable behavior for all three modules.

Read `BUILD438_APPLICATION_CORE_MODULE_PLAN.md` for the activation contract and `PROJECT_STATUS_AND_ROADMAP.md` for the remaining functional roadmap.
