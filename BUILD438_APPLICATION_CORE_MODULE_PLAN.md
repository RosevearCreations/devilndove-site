# Build 438 — Application Core / Module Activation Authority

## Status

**SOURCE IMPLEMENTATION IN PROGRESS / DEVELOPMENT-FIRST / NO PRODUCTION D1 MUTATION AUTHORIZED / PRODUCTION PROMOTION CLOSED**

Build 438 completes the activation and access-control layer around modular work that already exists in the repository. It does **not** invent a competing module system and it does not reopen Build 437 Membership work.

## Architecture discovered in the existing codebase

Builds 281–397 already established a passive client-side module registry, business-domain catalog, service contracts and three top-level umbrella runtimes under `public/js/core/` and `public/js/modules/`.

The real application architecture is therefore:

```text
Devil n Dove Application Core
    |
    +-- commerce-operations
    +-- creative-production
    +-- business-administration
```

The Customer storefront and Member account are important application **surfaces**, but they are not separate top-level runtime modules. They live inside the Commerce & Operations authority together with Catalog, Inventory, Orders, Membership and fulfillment.

## Existing top-level modules

### 1. `commerce-operations` — Commerce & Operations

Owns or composes the existing public/customer/storefront, Catalog, Inventory and day-to-day Operations domains.

Representative surfaces:

- public Shop, Cart, Checkout and product/customer workflows;
- Members account surface;
- Catalog/Product administration;
- Inventory administration;
- Orders and customer documents;
- Membership and Gift Cards;
- custom requests and Today Tasks.

Existing umbrella runtime: `public/js/modules/commerce-operations/runtime.mjs`.

### 2. `creative-production` — Creative & Production

Owns or composes the Creative, CAIP, Packaging and Content domains.

Representative surfaces:

- Creative Process / Creative Project Workflow;
- CAIP / Creative Assets;
- Packaging Studio;
- Website Media & Content Studio;
- Content Studio;
- visual enrichment/image-manifest/stage-photo/content-publication workflows.

Existing umbrella runtime: `public/js/modules/creative-production/runtime.mjs`.

### 3. `business-administration` — Business & Administration

Owns or composes Marketing, Accounting, Platform and Administration domains.

Representative surfaces:

- Accounting;
- Analytics, SEO, marketing and marketplace controls;
- users/security/settings;
- Application Sanity;
- Release & Go-Live / deployment / promotion / runtime diagnostics.

Existing umbrella runtime: `public/js/modules/business-administration/runtime.mjs`.

## What Build 438 adds

Before Build 438, the existing registry/runtime framework was intentionally passive and largely client-side. It could classify routes and lazy-load proven domain runtimes, but there was no single persistent authority for:

- globally enabling/disabling a top-level module;
- role-to-module access;
- blocking direct module-owned page/API access;
- suppressing runtime activation for a disabled module;
- granting or denying module-owned background activity;
- auditing module configuration changes.

Build 438 adds that missing central control plane while preserving the existing module/domain extraction work.

## Canonical D1 authority

Focused migration:

`database_build438_application_module_activation.sql`

Tables:

```text
app_modules
----------------------------------------
module_key                 PRIMARY KEY
display_name
description
is_enabled
requires_login
default_route
load_priority
background_activity_enabled
created_at
updated_at

app_module_role_access
----------------------------------------
module_key
role_code
is_allowed
access_level
created_at
updated_at
PRIMARY KEY (module_key, role_code)
```

Default module records are exactly:

```text
commerce-operations       enabled
creative-production       enabled
business-administration   enabled
```

All default background activity permissions are OFF. This is deliberate: a module may be enabled for interactive use without being implicitly authorized to create polling/sync/provider traffic.

Current account roles remain only `member` and `admin`. Build 438 does not invent an operator/creator role before the user model supports one.

Initial access:

```text
member -> commerce-operations allowed
member -> creative-production denied
member -> business-administration denied

admin  -> commerce-operations allowed/manage
admin  -> creative-production allowed/manage
admin  -> business-administration allowed/manage
```

No per-user override table is added in Build 438. Add one only when a real use case requires it.

## Shared-core server authority

`functions/api/_lib/appModules.js` owns:

- bounded non-user module configuration reads;
- request-scoped current-session identity;
- module availability decisions;
- role/access-level evaluation;
- read-only current-user module summaries;
- standard unavailable responses.

`functions/api/_lib/appModuleRoutes.js` owns the server-side route/API-to-top-level-module map and mirrors the existing Build 302+ domain ownership.

The server module configuration may be cached briefly per isolate because it is not request-specific. Session/user identity is never stored as global request state.

Request handlers must never create or repair `app_modules` or `app_module_role_access` at runtime.

## Pages middleware boundary

Root `functions/_middleware.js` applies the module decision before module-owned page/API execution.

For a disabled or unauthorized module:

- direct page access fails closed;
- direct API access fails closed;
- module page JavaScript never gets a chance to initialize;
- `read` access cannot perform non-read API methods;
- static assets and auth routes remain available;
- the Application Modules recovery/control surface remains available to an administrator.

The recovery surface exemption is intentional:

```text
/admin/application-modules/
/api/admin/app-modules
```

An administrator must not be able to lock themselves out of the switch used to re-enable a module.

## Client activation authority

`public/js/core/dd-application-module-bootstrap.mjs` performs one authoritative `/api/modules` read before the existing Admin module runtime is imported.

It exposes `window.DDApplicationModules` with:

- module snapshot/list/get;
- `isEnabled(moduleKey)`;
- `isAvailable(moduleKey)`;
- `canBackground(moduleKey)`;
- route-to-module lookup;
- navigation filtering;
- explicit refresh after a control change.

It adds no polling loop.

If the current top-level module is unavailable, the older umbrella/domain runtime is not imported/activated.

`public/js/core/dd-public-module-visibility.mjs` provides the smaller public/member presentation pass. It may hide disabled commerce/admin destinations, but server middleware remains the access/security boundary.

## Admin Application Modules control

`/admin/application-modules/` is a shared-core Admin screen.

It can:

1. enable/disable one of the three top-level modules;
2. allow/disallow module-owned background activity;
3. update current `member`/`admin` role access and access level;
4. display whether the Build 438 D1 authority is actually present.

All mutations use `/api/admin/app-modules` and are written to the existing `admin_action_audit` authority.

If the Build 438 schema is absent, the screen is read-only and explicitly says so. It does not self-heal schema.

Disabling a module never deletes module business data. Re-enabling it must restore access without reconstructing business records.

## Existing runtime extraction remains incremental

Build 438 central activation can be complete while individual business-domain extraction remains `in-progress`.

Do not falsely claim that every mutation has moved into a top-level umbrella runtime. Existing Build 302–397 contracts deliberately preserve many compatibility mutation authorities while moving/covering proven reads.

Examples:

- Commerce & Operations has substantial Catalog/Inventory/Operations read coverage but does not magically own every mutation.
- Creative & Production covers Packaging, Creative Process, Content Studio and CAIP activation/read boundaries while legacy mutation authorities still exist where explicitly preserved.
- Business & Administration has proven Accounting runtime coverage; other Marketing/Platform/Admin domains may remain domain-bridge surfaces.

Build 438 controls whether a top-level module may run; it does not rewrite every underlying business subsystem.

## Resource-efficiency contract

Build 438 introduces no recurring polling.

A disabled module must not initiate avoidable:

- startup/bootstrap business reads;
- umbrella/domain runtime imports;
- module polling;
- autosave/sync;
- provider/R2 work;
- module-specific background diagnostics.

`background_activity_enabled` is a permission, not a scheduler. Existing/future module-owned background code must explicitly check `canBackground()`/server authority before running.

The existing top-level runtimes are intentionally passive and report that importing them creates no network transport.

### Known efficiency consideration

The root middleware performs an indexed session/user resolution for authenticated module-owned requests so role access can be enforced centrally. Many legacy endpoints also perform their own authentication query. That creates a temporary duplicate indexed session read on some paths.

This is accepted for the first secure activation boundary, but should be measured. A future runtime/auth consolidation may pass verified request identity through shared middleware context to eliminate duplicate auth reads without weakening endpoint authorization.

Do **not** cache request-specific user/session identity globally merely to remove that query.

## Build 438 source validation

Local regression:

`scripts/build438_application_module_core_regression.py`

The regression executes the migration twice against in-memory SQLite and verifies 20 source/security/architecture contracts.

Read-only D1 verification:

`BUILD438_D1_VERIFICATION.sql`

Expected post-migration D1 identities:

```text
module_count          3
role_access_count     6
enabled_module_count  3
expected_module_count 3
```

## Development-first rollout

1. Compile/check Build 438 source locally.
2. Run the Build 438 20-check local regression.
3. Back up Development D1 if desired under normal parity discipline.
4. Apply `database_build438_application_module_activation.sql` to **Development only**.
5. Run `BUILD438_D1_VERIFICATION.sql` against Development.
6. Deploy/preview Development.
7. Verify `/api/modules` shows D1 authority and three modules.
8. Open `/admin/application-modules/`.
9. In Development, disable/re-enable each module one at a time.
10. Prove disabled module routes/APIs fail closed and the control page remains reachable.
11. Prove no business rows are deleted.
12. Prove navigation/runtime activation follows module state.
13. Prove read-only access blocks mutation methods.
14. Review request counts/Worker behavior for regressions.
15. Update canonical Markdown with Development evidence.
16. Only after Development is green decide whether Production needs the additive Build 438 migration.

## Production safety

Build 438 Production D1 mutation is **NOT AUTHORIZED**.

The completed Build 437 Membership token is spent and unrelated.

This work does not authorize:

```text
Build 438 Production D1 migration
Fractional Inventory / Creative Project rebuilds
Product / foreign-key rebuilds
Accounting default/nullability rebuilds
R2/provider mutation
CAIP D1-only media copy
Broad Production promotion
```

A normal “continue” or feature request is source/development authorization, not Production DDL/DML authorization.

## Functional roadmap after the activation core

After Build 438 Development proof, continue the existing requested feature work inside the correct module:

1. CAIP video review with exact timecode/range evidence.
2. Verified bounded proxy/frame/audio/transcript processing.
3. Reviewed Creative Process -> CAIP -> Content Studio handoff.
4. Packaging physical print/wrap proof and regulatory/source review ergonomics.
5. Product/Inventory reversal, lot-aware costing, reference inspection and review queues.
6. Media & Content Studio P1/P2 real-image replacement.
7. Reviewed social scheduling/publishing and post-release analytics.
8. Dedicated mobile operator/business workflows.
9. Final go-live reliability evidence before broad Production promotion.
