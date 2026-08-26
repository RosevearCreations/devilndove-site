# Build 438 — Application Core / Module Activation Validation

## Status

**SOURCE IMPLEMENTATION READY FOR OWNER VALIDATION / DEVELOPMENT D1 MIGRATION NOT YET APPLIED / PRODUCTION D1 MIGRATION NOT AUTHORIZED / PRODUCTION PROMOTION CLOSED**

Build 438 completes the central activation/access authority around the existing Application Core + three top-level application modules.

This document is the owner-run validation authority for the Build 438 source package.

## Existing architecture retained

```text
Application Core
    |
    +-- commerce-operations
    +-- creative-production
    +-- business-administration
```

Build 438 does not replace the Build 281–397 module registry/domain/runtime work. It adds the missing persistent D1 activation/access authority and server enforcement.

## Development target

```text
Wrangler config: wrangler.toml
Pages project:   devilndove-site-dev
D1 binding:      DB
D1 database:     devilndove-dev
D1 database ID:  dbc1615b-dcbe-4951-973b-b47c99c73bfa
```

Production is not a target of this validation pass.

## Build 438 source package

### D1

- `database_build438_application_module_activation.sql`
- `BUILD438_D1_VERIFICATION.sql`

### Server/shared core

- `functions/api/_lib/appModules.js`
- `functions/api/_lib/appModuleRoutes.js`
- `functions/_middleware.js`
- `functions/api/modules.js`
- `functions/api/admin/app-modules.js`

### Browser/control surfaces

- `public/js/core/dd-application-module-bootstrap.mjs`
- `public/js/core/dd-public-module-visibility.mjs`
- `public/js/admin.js`
- `public/js/site-auth-ui.js`
- `admin/application-modules/index.html`
- `public/js/admin-application-modules.js`

### Regression/docs

- `scripts/build438_application_module_core_regression.py`
- `BUILD438_APPLICATION_CORE_MODULE_PLAN.md`
- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`

## Local source validation

Run from Git Bash:

```bash
cd /c/Dev/devilndove-site

git pull origin dev

set -o pipefail

python -m py_compile scripts/build438_application_module_core_regression.py
python scripts/build438_application_module_core_regression.py

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
Authoritative client bootstrap: SOURCE READY
Admin Application Modules control: SOURCE READY
Request-time schema mutation: NONE
Background polling introduced by Build 438: NONE
Production D1 migration executed: NO
PRODUCTION PROMOTION: CLOSED
```

If any source/syntax check fails, stop. Do not apply the Development migration yet.

## Development-only D1 apply

After the local 20/20/source checks are green:

```bash
cd /c/Dev/devilndove-site

npx --yes wrangler@4.126.0 d1 execute devilndove-dev \
  --remote \
  --config wrangler.toml \
  --file=database_build438_application_module_activation.sql \
  --yes
```

This is an additive Development-only migration. It creates the two module-control tables/indexes and seeds three enabled top-level modules plus six member/admin role rows.

It does not delete or rewrite existing business-domain data.

## Development read-only verification

```bash
npx --yes wrangler@4.126.0 d1 execute devilndove-dev \
  --remote \
  --config wrangler.toml \
  --file=BUILD438_D1_VERIFICATION.sql \
  --yes
```

Expected logical result:

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
```

Default `background_activity_enabled` must be 0 for all three modules.

## Development browser/API proof

After Development code is deployed/previewable:

### Baseline

1. Login as Admin.
2. Open `/api/modules`.
3. Require:
   - `ok=true`
   - `build=438`
   - `schema_ready=true`
   - `source=d1`
   - exactly three modules
   - all three `is_enabled=1`.
4. Open `/admin/application-modules/`.
5. Confirm all three top-level modules are visible and enabled.

### Commerce & Operations disable/re-enable

1. Disable `commerce-operations`.
2. Verify normal navigation hides its destinations where module-aware navigation is loaded.
3. Verify direct module-owned page/API routes fail closed, including representative Shop/Member/Catalog/Inventory/Orders surfaces.
4. Verify `/admin/application-modules/` remains reachable.
5. Re-enable Commerce & Operations.
6. Verify access returns without reconstructing data.

### Creative & Production disable/re-enable

1. Disable `creative-production`.
2. Verify representative Packaging/Creative Process/CAIP/Content routes fail closed.
3. Verify the current page cannot activate the Creative & Production umbrella runtime while unavailable.
4. Re-enable it and verify access returns.

### Business & Administration disable/re-enable

1. Disable `business-administration`.
2. Verify representative Accounting/Analytics/Admin/Platform routes fail closed.
3. Verify `/admin/application-modules/` and `/api/admin/app-modules` remain reachable as shared-core recovery surfaces.
4. Re-enable Business & Administration.

### Role/access-level proof

1. In Development only, set one non-essential Admin module access level to `read`.
2. Prove GET/HEAD remains allowed.
3. Prove a non-read module-owned API request is rejected with:

```text
code: module_access_level_read_only
```

4. Restore the Admin access level to `manage`.

### Data preservation proof

Before/after toggling, compare representative business row counts for the affected module. Module-control changes must only modify `app_modules`, `app_module_role_access` and audit evidence. No Catalog, Inventory, Creative, CAIP, Packaging, Content, Accounting, Orders, Membership or other business records may be deleted because a module was disabled.

## Expected audit behavior

Admin control mutations write existing `admin_action_audit` events:

```text
application_module_state_changed
application_module_background_changed
application_module_role_access_changed
```

## Resource-efficiency proof

Build 438 adds no polling loop.

Required checks:

- `/api/modules` is a one-shot bootstrap read, not a timer;
- disabled Admin module runtime is not imported/activated for its blocked page;
- `background_activity_enabled=0` by default;
- module background permission is opt-in;
- no request-time module DDL exists.

Known item to observe: middleware centrally resolves the current session/role for authenticated module-owned requests, while many legacy endpoints also perform their own auth verification. This can temporarily mean two indexed session reads on a request. Measure rather than guessing. Do not replace this with global request/user caching.

## Fail-safe behavior before migration

If Build 438 source is deployed before the Development migration, read paths use the all-enabled Build 438 compatibility defaults. The Admin control screen must clearly show schema not ready and block writes.

This prevents an absent migration from accidentally disabling existing functionality while still preserving the no-request-time-DDL rule.

## Production boundary

**No Build 438 Production D1 authorization exists.**

Do not run the migration against `devilndove-prod` from this document.

A separate Production authorization boundary may be prepared only after Development disable/re-enable/access/data-preservation proof is green.

Still separately locked:

```text
Fractional Inventory / Creative Project rebuilds   NOT AUTHORIZED
Product / FK rebuilds                              NOT AUTHORIZED
Accounting default/nullability rebuilds             NOT AUTHORIZED
R2/provider mutation                               DISABLED
CAIP D1-only copy                                   FORBIDDEN
Broad Production promotion                          CLOSED
```

## Completion definition

Build 438 is not complete merely because the migration exists.

Build 438 may be called Development-proven only after:

1. local 20/20 regression passes;
2. source syntax checks pass;
3. Development D1 migration succeeds;
4. Development D1 verification proves exact three-module/six-role state;
5. all three modules pass disable/re-enable route/API/runtime proof;
6. Application Modules recovery surface remains reachable;
7. read-only access-level enforcement is proven;
8. business data preservation is proven;
9. no new recurring background traffic is observed;
10. canonical Markdown is updated with the owner-run evidence.
