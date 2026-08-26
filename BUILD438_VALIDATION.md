# Build 438 — Application Core / Module Activation Validation

## Status

**SOURCE IMPLEMENTATION READY FOR OWNER VALIDATION / FULL-SCHEMA LOCAL SYNC PENDING OWNER RUN / DEVELOPMENT D1 MIGRATION NOT YET APPLIED / PRODUCTION D1 MIGRATION NOT AUTHORIZED / PRODUCTION PROMOTION CLOSED**

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

### D1 / fresh-install

- `database_build438_application_module_activation.sql`
- `BUILD438_D1_VERIFICATION.sql`
- `scripts/build438_sync_full_schema.py`
- `DATABASE_SCHEMA_REFERENCE.md`

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
- `admin/index.html`
- `admin/application-modules/index.html`
- `public/js/admin-application-modules.js`

### Regression/rollout

- `scripts/build438_application_module_core_regression.py`
- `scripts/build438_module_route_map_test.mjs`
- `scripts/build438_module_catalog_alignment_test.mjs`
- `scripts/build438_module_access_policy_test.mjs`
- `scripts/build438_development_module_activation.py`
- `BUILD438_APPLICATION_CORE_MODULE_PLAN.md`
- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`

## Fresh-install aggregate synchronization

The Build 438 focused migration is the schema source of truth for the two new module-control tables. The large `database_full_schema.sql` aggregate did not yet contain those Build 438 tables when this source pass began.

The GitHub connector cannot safely rewrite the ~780 KB aggregate from a partial/truncated fetch, so Build 438 includes a deterministic **local-only** sync helper instead of risking aggregate truncation:

```text
scripts/build438_sync_full_schema.py
```

Run before the source gate:

```bash
python scripts/build438_sync_full_schema.py --sync
python scripts/build438_sync_full_schema.py --check
```

The helper:

- contacts no Cloudflare/D1 resource;
- appends the exact focused Build 438 migration only when both Build 438 CREATE TABLE authorities are absent;
- refuses a partial/ambiguous aggregate state;
- validates one `app_modules` authority;
- validates one `app_module_role_access` authority;
- validates both indexes and all three module seed keys;
- no-ops when rerun after synchronization.

After it runs, review and commit the generated `database_full_schema.sql` aggregate update. Do not manually copy/edit a partial migration fragment into the aggregate.

## Shared cross-module service policy

A module switch controls the module's **direct UI, broad/legacy API surface and runtime activation**. It does not sever an explicitly reviewed shared service contract that another enabled module legitimately consumes.

Build 438 recognizes exactly seven shared contracts:

| Contract | Owner | Reviewed consumers | Mutation |
|---|---|---|---|
| `/api/admin/contracts/catalog-read` | Commerce | Commerce, Creative, Business | No |
| `/api/admin/contracts/inventory-read` | Commerce | Commerce, Creative | No |
| `/api/admin/contracts/inventory-cost` | Commerce | Commerce, Business | No |
| `/api/admin/contracts/inventory-post` | Commerce | Commerce, Creative | Yes |
| `/api/admin/contracts/inventory-reverse` | Commerce | Commerce, Creative | Yes |
| `/api/admin/contracts/accounting-read` | Business | Business, Commerce | No |
| `/api/admin/contracts/content-media` | Creative | Creative, Commerce | No |

Rules:

1. Shared contracts are Application Core boundaries, not broad owner-module bypasses.
2. At least one reviewed consumer must be enabled and accessible to the current user.
3. Mutation contracts require a qualifying consumer with `manage` access.
4. Direct owner-module pages and broad APIs remain blocked while that owner module is disabled.
5. Adding another cross-module exception requires an explicit contract entry and regression coverage; do not exempt a general API prefix.

This preserves real module independence. Example: Commerce may be disabled for direct use while Creative remains enabled and continues to post/reverse reviewed material usage through the dedicated Inventory contracts.

## Local source validation

After the full-schema sync/check is green:

```bash
cd /c/Dev/devilndove-site

set -o pipefail

python -m py_compile \
  scripts/build438_sync_full_schema.py \
  scripts/build438_application_module_core_regression.py \
  scripts/build438_development_module_activation.py

python scripts/build438_sync_full_schema.py --check
python scripts/build438_application_module_core_regression.py
node scripts/build438_module_route_map_test.mjs
node scripts/build438_module_catalog_alignment_test.mjs
node scripts/build438_module_access_policy_test.mjs

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

Expected main regression ending:

```text
BUILD 438 APPLICATION CORE / MODULE ACTIVATION REGRESSION: PASS (20/20)
Existing top-level modules: commerce-operations / creative-production / business-administration
Central D1 activation authority: SOURCE READY
Server page/API module guard: SOURCE READY
Read-only module access enforcement: SOURCE READY
Cross-module shared service preservation: SOURCE READY / CONSUMER-GATED
Route ownership matrix: SOURCE READY
Module access policy unit proof: SOURCE READY
Authoritative client bootstrap: SOURCE READY
Admin Application Modules control + health + route proof: SOURCE READY
Deterministic full-schema sync helper: SOURCE READY / OWNER RUN REQUIRED
Request-time schema mutation: NONE
Background polling introduced by Build 438: NONE
Production D1 migration executed: NO
PRODUCTION PROMOTION: CLOSED
```

Expected executable test endings:

```text
BUILD 438 MODULE ROUTE MAP TEST: PASS (... routes + 7 shared contracts)
Core recovery/auth surfaces: UNOWNED / AVAILABLE
Cross-module service contracts: EXPLICIT / CONSUMER-GATED

BUILD 438 MODULE CATALOG ALIGNMENT TEST: PASS (.../...)
Existing Build 305 domain catalog -> Build 438 server top-level ownership: ALIGNED

BUILD 438 MODULE ACCESS POLICY TEST: PASS (12/12)
Disabled owner UI + enabled explicit consumer contract: PROVEN
Shared mutation requires manage-level consumer: PROVEN
Cold authority read failure: FAIL CLOSED

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

The helper machine-checks Wrangler JSON results and must prove:

```text
module_count                3
role_access_count           6
enabled_module_count        3
background_enabled_count    0
expected_index_count        2
verification_pass           1

module keys:
business-administration
commerce-operations
creative-production

BUILD 438 DEVELOPMENT MODULE AUTHORITY APPLY: PASS
BUILD 438 DEVELOPMENT MODULE AUTHORITY READ-ONLY VERIFICATION: PASS / EXACT
Production D1 mutation executed: NO
PRODUCTION PROMOTION: CLOSED
```

### Equivalent manual Development commands

Use these only if the helper itself has a local execution problem:

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

### Baseline/Core Health

1. Login as Admin.
2. Open `/api/modules?fresh=1`.
3. Require `ok=true`, `build=438`, `schema_ready=true`, `source=d1`, exactly three modules, and all three `is_enabled=1`.
4. Open `/admin/application-modules/` from the permanent **Application Modules** card on the Admin Dashboard.
5. Require Core Health `PASS` with:
   - Modules `3/3`;
   - Role rows `6/6`;
   - Shared contracts `7`;
   - no missing/unexpected rows;
   - no invalid role rows;
   - no disabled module with background permission;
   - no Admin recovery risk.
6. Require background activity OFF for all three modules.
7. Click **Run current-state route proof** and require `PASS (4/4)` while all three modules are enabled.

### Commerce & Operations

1. Record representative business row counts first.
2. Disable `commerce-operations`.
3. Verify normal module-aware navigation hides its direct destinations.
4. Verify representative Shop/Member/Catalog/Inventory/Orders direct pages/APIs fail closed.
5. Verify `/admin/application-modules/` remains reachable.
6. Run **Current-state route proof** and require Commerce direct route blocked while Core, Creative and Business reflect their current enabled state.
7. Verify Creative remains usable.
8. Verify safe read contracts needed by another enabled module remain available, especially `inventory-read`/`catalog-read` where the consuming workflow uses them.
9. Do **not** manufacture dummy Inventory movements merely to prove `inventory-post` or `inventory-reverse`. Their cross-module policy is unit-proven. Live mutation proof must use a real reviewed Creative material-use/reversal fixture.
10. Re-enable Commerce & Operations and prove direct access returns and business row counts are unchanged.

### Creative & Production

1. Record representative Creative/CAIP/Packaging/Content row counts.
2. Disable `creative-production`.
3. Verify representative Packaging/Creative Process/CAIP/Content direct pages/APIs fail closed.
4. Verify the unavailable Creative umbrella runtime is not imported/activated.
5. Verify Commerce can still consume the explicit `content-media` contract when a current workflow needs it.
6. Run the route proof and require Creative direct route blocked while Core and other enabled modules remain correct.
7. Re-enable and prove access/data return unchanged.

### Business & Administration

1. Disable `business-administration`.
2. Verify representative Accounting/Analytics/Admin/Platform direct routes fail closed.
3. Verify `/admin/application-modules/` and `/api/admin/app-modules` remain reachable as shared-core recovery surfaces.
4. Verify the public account widget retains the Admin-only **Application Modules** recovery link even if the normal Admin Dashboard link is hidden.
5. Verify Commerce can still consume the explicit `accounting-read` contract when its Operations workflow needs that service.
6. Run the route proof and require Business direct route blocked while Core and other enabled modules remain correct.
7. Re-enable Business & Administration.

### Role/access-level proof

1. In Development only, set one non-essential Admin module access level to `read`.
2. Prove GET/HEAD remains allowed on a direct module-owned endpoint.
3. Prove a non-read direct module-owned API request is rejected with:

```text
code: module_access_level_read_only
```

4. For a shared **mutation** contract, a read-only consumer must not qualify; the executable policy test already proves this without writing business data.
5. Restore Admin access to `manage`.

### Data preservation proof

Before/after toggling, compare representative business row counts for the affected module. Module-control changes may modify only:

```text
app_modules
app_module_role_access
admin_action_audit evidence
```

No Catalog, Inventory, Creative, CAIP, Packaging, Content, Accounting, Orders, Membership or other business records may be deleted because a module was disabled.

### Module-authority failure behavior

Build 438 intentionally distinguishes:

```text
schema missing during rollout -> all-enabled compatibility defaults
healthy D1 authority          -> D1 module state
transient D1/config failure   -> last-known module state, otherwise fail closed
```

A real module-authority read failure must never silently turn a disabled module back on.

## Public-shell scope

Build 438 gates concrete transactional/customer Commerce surfaces such as Shop, Cart, Checkout, Product/Member workflows and their APIs. The unrelated informational/static public shell is intentionally not globally disabled by the Commerce switch in this first activation release.

A future full-site maintenance switch should be separate and deliberate.

## Audit behavior

Module-control changes use existing `admin_action_audit`:

```text
application_module_state_changed
application_module_background_changed
application_module_role_access_changed
```

Disabling a module also clears its background permission. Re-enabling it does not silently restore earlier background authorization.

## Resource-efficiency proof

Build 438 adds no recurring polling loop.

- Admin `/api/modules` is one bootstrap read and an explicit fresh refresh after control changes.
- Public/member visibility uses a short per-tab `sessionStorage` cache.
- server module config cache is brief and non-user-specific;
- session/user identity stays request-scoped;
- disabled direct module page runtime never initializes because middleware blocks access;
- top-level Admin runtime is imported only after authoritative availability is known;
- `background_activity_enabled=0` by default;
- no request-time module DDL exists;
- explicit cross-module service contracts prevent enabled consumers from falling back to broad owner-module APIs.

Known item to observe: root middleware can add one indexed session read to authenticated module-owned requests while legacy endpoints also perform their own auth verification. Measure this in Development; do not replace it with global user/session caching.

## Production boundary

**No Build 438 Production D1 authorization exists.**

Do not run the Build 438 migration against `devilndove-prod` from this document.

A Production authorization boundary may be prepared only after the Development aggregate sync, disable/re-enable, role-level, recovery, data-preservation, runtime-suppression and shared-contract proofs are green.

Still separately locked:

```text
Fractional Inventory / Creative Project rebuilds   NOT AUTHORIZED
Product / FK rebuilds                              NOT AUTHORIZED
Accounting default/nullability rebuilds            NOT AUTHORIZED
R2/provider mutation                               DISABLED
CAIP D1-only copy                                   FORBIDDEN
Broad Production promotion                          CLOSED
```

## Development completion definition

Build 438 may be called Development-proven only after:

1. full-schema sync helper updates/validates `database_full_schema.sql` and the generated aggregate change is committed;
2. local 20/20 regression passes;
3. executable route/shared-contract matrix passes;
4. existing client-domain catalog/server ownership alignment passes;
5. executable access-policy test passes 12/12;
6. JS/Python syntax checks pass;
7. Development D1 migration succeeds;
8. exact D1 verification passes;
9. Core Health passes;
10. all three modules pass disable/re-enable direct page/API proof;
11. Current-State Route Proof follows each toggle;
12. recovery surface remains reachable;
13. read-only access-level enforcement is proven;
14. reviewed cross-module shared read contracts remain available to enabled consumers;
15. any live shared mutation proof uses a real reviewed fixture, never dummy stock movements;
16. business data preservation is proven;
17. no new recurring background traffic is observed;
18. canonical Markdown is updated with owner-run Development evidence.
