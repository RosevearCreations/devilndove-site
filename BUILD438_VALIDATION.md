# Build 438 — Application Core / Module Activation Validation

## Status

**SOURCE IMPLEMENTATION READY FOR OWNER VALIDATION / DEVELOPMENT D1 MIGRATION NOT YET APPLIED / PRODUCTION D1 MIGRATION NOT AUTHORIZED / PRODUCTION PROMOTION CLOSED**

Build 438 completes the central activation/access authority around the existing Application Core + three top-level application modules.

```text
Application Core
    |
    +-- commerce-operations
    +-- creative-production
    +-- business-administration
```

Build 438 extends the Build 281–397 module registry/domain/runtime work; it does not replace it.

## Development target

```text
Wrangler config: wrangler.toml
Pages project:   devilndove-site-dev
D1 binding:      DB
D1 database:     devilndove-dev
D1 database ID:  dbc1615b-dcbe-4951-973b-b47c99c73bfa
```

Production is not a target of this validation pass.

## Source package

### D1

- `database_build438_application_module_activation.sql`
- `BUILD438_D1_VERIFICATION.sql`

### Server/shared core

- `functions/api/_lib/appModules.js`
- `functions/api/_lib/appModuleRoutes.js`
- `functions/_middleware.js`
- `functions/api/modules.js`
- `functions/api/admin/app-modules.js`

### Browser/control

- `public/js/core/dd-application-module-bootstrap.mjs`
- `public/js/core/dd-public-module-visibility.mjs`
- `public/js/admin.js`
- `public/js/site-auth-ui.js`
- `admin/application-modules/index.html`
- `public/js/admin-application-modules.js`

### Regression/rollout

- `scripts/build438_application_module_core_regression.py`
- `scripts/build438_module_route_map_test.mjs`
- `scripts/build438_module_catalog_alignment_test.mjs`
- `scripts/build438_development_module_activation.py`
- `BUILD438_APPLICATION_CORE_MODULE_PLAN.md`
- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`

## Local source validation

Run from Git Bash:

```bash
cd /c/Dev/devilndove-site

git pull origin dev

set -o pipefail

python -m py_compile \
  scripts/build438_application_module_core_regression.py \
  scripts/build438_development_module_activation.py

python scripts/build438_application_module_core_regression.py
node scripts/build438_module_route_map_test.mjs
node scripts/build438_module_catalog_alignment_test.mjs

node --check functions/_middleware.js
node --check functions/api/_lib/appModules.js
node --check functions/api/_lib/appModuleRoutes.js
node --check functions/api/modules.js
node --check functions/api/admin/app-modules.js
node --check public/js/admin-application-modules.js
node --check public/js/admin.js
node --check public/js/site-auth-ui.js
node --check public/js/core/dd-application-module-bootstrap.mjs
node --check public/js/core/dd-public-module-visibility.mjs
```

Expected regression ending:

```text
BUILD 438 APPLICATION CORE / MODULE ACTIVATION REGRESSION: PASS (20/20)
Existing top-level modules: commerce-operations / creative-production / business-administration
Central D1 activation authority: SOURCE READY
Server page/API module guard: SOURCE READY
Read-only module access enforcement: SOURCE READY
Route ownership matrix: SOURCE READY
Authoritative client bootstrap: SOURCE READY
Admin Application Modules control: SOURCE READY
Request-time schema mutation: NONE
Background polling introduced by Build 438: NONE
Production D1 migration executed: NO
PRODUCTION PROMOTION: CLOSED
```

Route checks should finish:

```text
BUILD 438 MODULE ROUTE MAP TEST: PASS (... routes)
BUILD 438 MODULE CATALOG ALIGNMENT TEST: PASS (.../...)
Core recovery/auth surfaces: UNOWNED / AVAILABLE
Existing Build 305 domain catalog -> Build 438 server top-level ownership: ALIGNED
Production mutation capability: NONE
```

If any local check fails, stop. Do not apply the Development migration.

## Preferred Development-only D1 apply/verify

The preferred owner path is the hard-pinned helper. It validates branch `dev`, database name and the exact Development UUID before it contacts D1, and it has **no Production mode**.

```bash
cd /c/Dev/devilndove-site

python -u scripts/build438_development_module_activation.py --apply-and-verify \
  2>&1 | tee build438_development_module_activation.txt
```

The helper uses pinned Wrangler `4.126.0` and targets only:

```text
devilndove-dev
UUID dbc1615b-dcbe-4951-973b-b47c99c73bfa
```

Expected logical result after apply/verify:

```text
app_modules exists
app_module_role_access exists

module_count:          3
role_access_count:     6
enabled_module_count:  3
expected_module_count: 3

modules:
commerce-operations
creative-production
business-administration

indexes:
idx_app_modules_enabled_priority
idx_app_module_role_access_role

background_activity_enabled = 0 for all three

BUILD 438 DEVELOPMENT MODULE AUTHORITY APPLY: PASS
BUILD 438 DEVELOPMENT MODULE AUTHORITY READ-ONLY VERIFICATION: PASS
Production D1 mutation executed: NO
PRODUCTION PROMOTION: CLOSED
```

### Equivalent manual Development commands

If the helper itself has a local execution problem, the equivalent Development-only commands are:

```bash
npx --yes wrangler@4.126.0 d1 execute devilndove-dev \
  --remote \
  --config wrangler.toml \
  --file=database_build438_application_module_activation.sql \
  --yes

npx --yes wrangler@4.126.0 d1 execute devilndove-dev \
  --remote \
  --config wrangler.toml \
  --file=BUILD438_D1_VERIFICATION.sql \
  --yes
```

Do not substitute `devilndove-prod`.

## Development browser/API proof

After the Build 438 source is deployed/previewable in Development:

### Baseline

1. Login as Admin.
2. Open `/api/modules?fresh=1`.
3. Require:
   - `ok=true`
   - `build=438`
   - `schema_ready=true`
   - `source=d1`
   - exactly three modules
   - all three `is_enabled=1`.
4. Open `/admin/application-modules/`.
5. Confirm all three top-level modules are visible/enabled and background activity is OFF.

### Commerce & Operations

1. Record representative row counts first.
2. Disable `commerce-operations`.
3. Verify normal module-aware navigation hides its destinations.
4. Verify representative Shop/Member/Catalog/Inventory/Orders pages/APIs fail closed.
5. Verify `/admin/application-modules/` remains reachable.
6. Verify the account widget still exposes **Application Modules** to an Admin.
7. Re-enable Commerce & Operations.
8. Prove access returns and business row counts are unchanged.

### Creative & Production

1. Record representative Creative/CAIP/Packaging/Content row counts.
2. Disable `creative-production`.
3. Verify representative Packaging/Creative Process/CAIP/Content pages/APIs fail closed.
4. Verify the unavailable module umbrella runtime is not imported/activated.
5. Re-enable and prove access/data return unchanged.

### Business & Administration

1. Disable `business-administration`.
2. Verify representative Accounting/Analytics/Admin/Platform routes fail closed.
3. Verify `/admin/application-modules/` and `/api/admin/app-modules` remain reachable as shared-core recovery surfaces.
4. Verify the public account widget retains the Admin-only **Application Modules** recovery link even if the Admin Dashboard link is hidden.
5. Re-enable Business & Administration.

### Role/access-level proof

1. In Development only, set one non-essential Admin module access level to `read`.
2. Prove GET/HEAD remains allowed.
3. Prove a non-read module-owned API request is rejected with:

```text
code: module_access_level_read_only
```

4. Restore Admin access to `manage`.

### Data preservation proof

Before/after toggling, compare representative business row counts for the affected module. Module-control changes must only modify `app_modules`, `app_module_role_access` and audit evidence. No Catalog, Inventory, Creative, CAIP, Packaging, Content, Accounting, Orders, Membership or other business records may be deleted because a module was disabled.

### Module-authority failure behavior

Build 438 intentionally distinguishes:

```text
schema missing during rollout -> all-enabled compatibility defaults
healthy D1 authority          -> D1 module state
transient D1/config failure   -> last-known module state, otherwise fail closed
```

A real module-authority read failure must never silently turn a disabled module back on.

## Public-shell scope

Build 438 gates concrete transactional/customer Commerce surfaces such as Shop, Cart, Checkout, Product/Member workflows and their APIs. The unrelated informational/static public shell (for example About/Gallery-style pages) is intentionally not globally disabled by the Commerce switch in this first activation release.

This keeps a public informational presence available while Commerce can be taken offline. If a later business requirement calls for a full public-site maintenance switch, add that deliberately rather than overloading the transactional module flag.

## Audit behavior

Module-control changes use existing `admin_action_audit` with:

```text
application_module_state_changed
application_module_background_changed
application_module_role_access_changed
```

Disabling a module must never delete its Catalog, Inventory, Order, Membership, Creative, CAIP, Packaging, Content, Accounting or other business data.

## Resource-efficiency proof

Build 438 adds no recurring polling loop.

- Admin `/api/modules` is one bootstrap read and explicit fresh refresh after control changes.
- Public/member visibility uses a short per-tab `sessionStorage` cache rather than one Worker request for every public navigation.
- server module config cache is brief and non-user-specific;
- session/user identity stays request-scoped;
- disabled module page runtime never initializes because middleware blocks direct access;
- top-level Admin runtime is imported only after authoritative availability is known;
- `background_activity_enabled=0` by default;
- no request-time module DDL exists.

Known item to observe: root middleware can add one indexed session read to authenticated module-owned requests while legacy endpoints also perform their own auth verification. Measure this in Development; do not replace it with global user/session caching.

## Production boundary

**No Build 438 Production D1 authorization exists.**

Do not run the Build 438 migration against `devilndove-prod` from this document.

A Production authorization boundary may be prepared only after the Development disable/re-enable, role-level, recovery, data-preservation and runtime-suppression proofs are green.

Still separately locked:

```text
Fractional Inventory / Creative Project rebuilds   NOT AUTHORIZED
Product / FK rebuilds                              NOT AUTHORIZED
Accounting default/nullability rebuilds             NOT AUTHORIZED
R2/provider mutation                               DISABLED
CAIP D1-only copy                                   FORBIDDEN
Broad Production promotion                          CLOSED
```

## Development completion definition

Build 438 may be called Development-proven only after:

1. local 20/20 regression passes;
2. executable route matrix passes;
3. existing client-domain catalog/server ownership alignment passes;
4. JS/Python syntax checks pass;
5. Development D1 migration succeeds;
6. D1 verification proves exact three-module/six-role state;
7. all three modules pass disable/re-enable direct page/API proof;
8. recovery surface remains reachable;
9. read-only access-level enforcement is proven;
10. business data preservation is proven;
11. no new recurring background traffic is observed;
12. canonical Markdown is updated with owner-run Development evidence.
