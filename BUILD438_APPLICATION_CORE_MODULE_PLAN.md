# Build 438 — Application Core / Module Activation Authority

## Status

**SOURCE CONTROL PLANE READY FOR OWNER VALIDATION / DEVELOPMENT-FIRST / DEVELOPMENT D1 APPLY PENDING / NO PRODUCTION D1 AUTHORIZATION / PRODUCTION PROMOTION CLOSED**

Build 438 completes the missing persistent/server-authoritative control plane around modular work already present from Builds 281–397. It does not create a competing module framework and it does not reopen Build 437 Membership work.

## Canonical architecture

```text
Devil n Dove Application Core
    |
    +-- commerce-operations
    +-- creative-production
    +-- business-administration
```

Customer/storefront and Member Account are important UX surfaces inside `commerce-operations`; they are not separate top-level runtime modules.

### `commerce-operations`

Composes public/customer/storefront, Catalog, Inventory and Operations domains. Representative direct surfaces include Shop, Cart, Checkout, Members, Catalog/Product admin, Inventory, Orders, Membership, Gift Cards, customer documents, custom requests and Today Tasks.

### `creative-production`

Composes Creative, CAIP, Packaging and Content domains. Representative direct surfaces include Creative Process, Creative Assets/CAIP, Packaging Studio, Website Media & Content Studio, Content Studio, visual enrichment, image manifest, stage-photo moderation and content-publication workflows.

### `business-administration`

Composes Marketing, Accounting, Platform and Administration domains. Representative direct surfaces include Accounting, Analytics/SEO/marketing, users/settings/security, Application Sanity, Release & Go-Live and deployment/runtime/platform controls.

## Existing runtime foundation retained

Build 438 reuses:

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

The existing top-level runtime extraction remains incremental. Build 438 controls whether a top-level module may be used; it does not falsely move every legacy mutation into an umbrella runtime.

## Build 438 D1 authority

Migration:

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

Default state:

```text
commerce-operations       enabled / background OFF
creative-production       enabled / background OFF
business-administration   enabled / background OFF
```

Current roles remain `member` and `admin`:

```text
member -> commerce-operations       allowed/member
member -> creative-production       denied/none
member -> business-administration   denied/none

admin  -> all three                 allowed/manage
```

No per-user module override table is added until a real use case requires one.

## Server/shared-core authority

`functions/api/_lib/appModules.js` owns:

- short non-user D1 module-config caching;
- request-scoped user/session resolution;
- module availability decisions;
- role/access-level evaluation;
- cross-module service-consumer evaluation;
- standard fail-closed responses.

`functions/api/_lib/appModuleRoutes.js` is the single server route-to-module ownership authority and mirrors the existing Build 305 client-domain catalog.

`functions/_middleware.js` is the direct page/API enforcement boundary.

No request handler creates or repairs the Build 438 tables.

### Failure semantics

Build 438 distinguishes rollout compatibility from real authority failure:

```text
schema absent during rollout   -> all-enabled compatibility defaults; writes blocked
healthy D1 authority           -> D1 module state is authoritative
transient read failure         -> last-known module state when available
cold real authority failure    -> fail closed
```

A D1/config interruption must never silently turn a disabled module back on.

## Direct module switch behavior

For a disabled/unauthorized module:

- direct module page access fails closed;
- broad/legacy module API access fails closed;
- module-aware navigation hides the direct destination;
- top-level Admin runtime activation is suppressed;
- background permission is cleared when the module is disabled;
- re-enabling does not restore old background permission automatically;
- all business data remains intact.

`read` module access permits reads but blocks non-read direct module API methods with:

```text
module_access_level_read_only
```

## Shared cross-module service contracts

A top-level module may depend on a narrow service owned by another module. Disabling an owner module must not force an enabled consumer back to broad legacy APIs.

Build 438 therefore treats exactly seven reviewed contracts as Application Core boundaries:

| Contract | Owner | Reviewed consumers | Mutation |
|---|---|---|---|
| `/api/admin/contracts/catalog-read` | Commerce | Commerce, Creative, Business | No |
| `/api/admin/contracts/inventory-read` | Commerce | Commerce, Creative | No |
| `/api/admin/contracts/inventory-cost` | Commerce | Commerce, Business | No |
| `/api/admin/contracts/inventory-post` | Commerce | Commerce, Creative | Yes |
| `/api/admin/contracts/inventory-reverse` | Commerce | Commerce, Creative | Yes |
| `/api/admin/contracts/accounting-read` | Business | Business, Commerce | No |
| `/api/admin/contracts/content-media` | Creative | Creative, Commerce | No |

Policy:

1. Direct owner UI/broad API remains disabled when the owner module is off.
2. A shared contract remains available only when a reviewed consumer module is enabled and accessible to the current user.
3. Shared mutation contracts require a qualifying `manage` consumer.
4. Adding an exception requires a named contract + consumer list + regression; never exempt a broad API family.

This makes cases such as **Commerce off + Creative on** viable: Creative can still use the reviewed Inventory post/reverse authority without reopening Commerce pages or general Inventory APIs.

## Application Modules recovery/control surface

Shared Core permanently owns:

```text
/admin/application-modules/
/api/admin/app-modules
```

The control route cannot be disabled by any business-module switch.

The Admin Dashboard now includes a permanent **Application Modules** card.

The control screen supports:

- module enable/disable;
- background permission;
- member/admin role access;
- Core Health diagnostics;
- Current-State Route Proof;
- explicit recovery guidance.

Control mutations are audited through `admin_action_audit`:

```text
application_module_state_changed
application_module_background_changed
application_module_role_access_changed
```

### Core Health diagnostics

The Admin API/UI verifies:

- exactly 3 expected modules;
- exactly 6 expected role rows;
- no unexpected/missing rows;
- no contradictory role access;
- no disabled module with background permission;
- no Admin recovery-access risk;
- exactly 7 shared service contracts.

### Current-State Route Proof

The control screen can HEAD-check representative routes without changing state:

```text
Shared Core                    /admin/application-modules/
Commerce & Operations          /admin/catalog/
Creative & Production          /admin/creative-process/
Business & Administration      /admin/accounting/
```

The expected availability is calculated from current module + Admin role state and compared with the actual middleware response.

## Client activation authority

`public/js/core/dd-application-module-bootstrap.mjs` loads `/api/modules` before the older Admin umbrella runtime and exposes:

```text
DDApplicationModules.isEnabled(...)
DDApplicationModules.isAvailable(...)
DDApplicationModules.canBackground(...)
DDApplicationModules.moduleForPath(...)
DDApplicationModules.refresh(...)
```

No polling loop is introduced.

`public/js/core/dd-public-module-visibility.mjs` is presentation-only. It uses a short per-tab cache and preserves the Application Modules recovery link. Server middleware remains the security boundary.

## Public shell scope

The Commerce switch controls concrete transactional/customer surfaces such as Shop, Cart, Checkout, Product/Member workflows and their APIs. General informational public pages are not automatically blanked by Commerce disablement.

A future full-site maintenance switch should be a separate Core feature, not an overloaded Commerce flag.

## Resource-efficiency contract

Build 438 adds no recurring polling.

A disabled module must not start avoidable:

- direct page/business startup work;
- umbrella runtime activation;
- module polling;
- autosave/sync;
- provider/R2 work;
- background diagnostics.

`background_activity_enabled` is a permission, not a scheduler. Future background logic must explicitly check module authority.

Known item to measure in Development: middleware can add one indexed session lookup while a legacy endpoint also authenticates independently. Do not solve that with global request/user caching.

## Source/test package

```text
database_build438_application_module_activation.sql
BUILD438_D1_VERIFICATION.sql
scripts/build438_application_module_core_regression.py
scripts/build438_module_route_map_test.mjs
scripts/build438_module_catalog_alignment_test.mjs
scripts/build438_module_access_policy_test.mjs
scripts/build438_development_module_activation.py
BUILD438_VALIDATION.md
```

The local gate includes:

- migration rerun safety;
- exact module/role/index seeds;
- route ownership;
- Build305 client-domain alignment;
- hyphenated API families;
- direct read-only enforcement;
- cross-module service policy;
- Commerce-off/Creative-on Inventory contract proof;
- fail-closed authority behavior;
- Admin recovery/core health/current-route proof source;
- no request-time DDL;
- no new polling.

## Development-first rollout

1. Run local source/syntax/regression gates.
2. Apply the focused migration to **Development only** through the hard-pinned helper.
3. Require exact D1 verification: 3 modules, 6 role rows, 3 enabled, 0 background-enabled, 2 indexes, exact keys.
4. Deploy/preview Development.
5. Require Core Health PASS.
6. Require Current-State Route Proof PASS with the baseline state.
7. Disable/re-enable each direct module one at a time and rerun route proof.
8. Prove shared read contracts remain available to enabled reviewed consumers.
9. Do not create fake stock movements to prove mutation contracts; use real reviewed Creative material usage/reversal if/when live mutation proof is needed.
10. Prove no business data is deleted by module switches.
11. Prove read-only direct module access blocks mutation methods.
12. Observe request counts/Worker behavior.
13. Record Development evidence in canonical Markdown.
14. Only then decide whether a narrow Production migration authorization boundary should be prepared.

## Production safety

Build 438 Production D1 mutation is **NOT AUTHORIZED**.

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

A normal `continue`, feature request or pasted Development output is not Production authorization.

## Functional roadmap after Build 438 Development proof

Continue requested feature work inside the appropriate module:

1. CAIP video review with exact timecode/range evidence.
2. Bounded proxy/frame/audio/transcript processing and verified outputs.
3. Reviewed Creative Process -> CAIP -> Content Studio handoff.
4. Packaging physical print/wrap proof and regulatory/source review ergonomics.
5. Product/Inventory reversal, lot-aware costing, reference inspection and review queues.
6. Media & Content Studio P1/P2 real-image replacement.
7. Reviewed social scheduling/publishing and post-release analytics.
8. Dedicated mobile operator/business workflows.
9. Final go-live reliability evidence before broad Production promotion.
