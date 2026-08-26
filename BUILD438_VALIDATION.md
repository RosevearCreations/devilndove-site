# Build 438 — Application Core / Module Activation Validation

## Status

**SOURCE GATES GREEN / FULL SCHEMA SYNCHRONIZED / DEVELOPMENT D1 AUTHORITY APPLIED + EXACTLY VERIFIED / PAGES GUARD PROVEN / LIVE MODULE ISOLATION PASS 3/3 / AUTHENTICATED ADMIN ACCEPTANCE NEXT / PRODUCTION D1 NOT AUTHORIZED / PRODUCTION PROMOTION CLOSED**

Build 438 completes the central activation/access authority around the existing Application Core + three top-level application modules.

```text
Application Core
    |
    +-- commerce-operations
    +-- creative-production
    +-- business-administration
```

Customer/storefront and Member Account remain Commerce & Operations surfaces, not separate top-level runtimes.

## Development target

```text
Wrangler config: wrangler.toml
Pages project:   devilndove-site-dev
D1 binding:      DB
D1 database:     devilndove-dev
D1 database ID:  dbc1615b-dcbe-4951-973b-b47c99c73bfa
Wrangler:        4.126.0
```

Production is not a target of this validation document.

## Current Build 438 evidence

Authoritative owner-run evidence is recorded in `BUILD438_DEVELOPMENT_AUTHORITY_EVIDENCE.md`.

Green gates:

```text
Full-schema check                         PASS
Application Core regression               PASS (20/20)
Route map                                  PASS (53 routes + 7 shared contracts)
Build305 catalog/server alignment          PASS (61/61)
Cross-module access policy                 PASS (12/12)
Session resilience                         PASS (6/6)
Windows console/strict helper              PASS (10/10)
Pages invocation routing                   PASS (10/10)
JavaScript/Python syntax                    PASS
Development D1 migration                   APPLIED / PASS
Human read-only verification               PASS / 0 writes
Strict self-asserting verification         PASS / 0 writes
Pages module guard live markers            PROVEN
Three-module live isolation                PASS (3/3)
Final module state                         RESTORED / EXACT
Business data mutation from isolation      NONE
```

Exact Development authority:

```text
module_count:               3
role_access_count:          6
enabled_module_count:       3
background_enabled_count:   0
expected_index_count:       2
module_keys:                business-administration|commerce-operations|creative-production
```

## Source package

### D1/fresh-install

```text
database_build438_application_module_activation.sql
database_full_schema.sql
BUILD438_D1_VERIFICATION.sql
BUILD438_D1_STRICT_VERIFICATION.sql
scripts/build438_sync_full_schema.py
scripts/build438_development_module_activation.py
```

### Shared Core/server

```text
_routes.json
functions/api/_lib/appModules.js
functions/api/_lib/appModuleRoutes.js
functions/api/_lib/appModuleSessionGuard.js
functions/_middleware.js
functions/api/modules.js
functions/api/admin/app-modules.js
```

### Browser/control

```text
public/js/core/dd-application-module-bootstrap.mjs
public/js/core/dd-public-module-visibility.mjs
public/js/admin.js
public/js/site-auth-ui.js
admin/index.html
admin/application-modules/index.html
public/js/admin-application-modules.js
```

### Regression/live proof

```text
scripts/build438_application_module_core_regression.py
scripts/build438_module_route_map_test.mjs
scripts/build438_module_catalog_alignment_test.mjs
scripts/build438_module_access_policy_test.mjs
scripts/build438_module_session_resilience_test.mjs
scripts/build438_development_helper_console_test.py
scripts/build438_pages_invocation_routes_test.py
scripts/build438_development_module_isolation_proof.py
scripts/build438_authenticated_acceptance_regression.py
```

## Fresh-install aggregate authority

`database_full_schema.sql` is synchronized with the exact focused Build 438 module migration through `scripts/build438_sync_full_schema.py`.

Commit evidence:

```text
0af372d7  Build 438: sync module authority into full schema
```

The helper is deterministic, local-only, refuses partial/ambiguous aggregate state and no-ops when the Build 438 block is already present.

## Pages invocation boundary — proven

An early live toggle proved D1 changed correctly but `/shop/` stayed HTTP 200 because tracked `_routes.json` invoked Functions only for `/api/*`.

Build 438 now routes only module-owned static surfaces through Functions:

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

General informational/static pages remain outside Functions.

Live deployment diagnostics:

```text
X-DND-Module-Guard: 438
X-DND-Module-Key: <module-key>
X-DND-Shared-Contract: <contract-path>
```

Owner-run baseline after deployment:

```text
/admin/accounting/        HTTP 401 / X-DND-Module-Guard=438
/shop/                    HTTP 200 / X-DND-Module-Guard=438
/admin/creative-process/  HTTP 401 / X-DND-Module-Guard=438
```

## Three-module Development isolation — DONE

Owner-run final result:

```text
Commerce   /shop/                    200 -> disabled 403 -> restored 200
Creative   /admin/creative-process/  401 -> disabled 403 -> restored 401
Business   /admin/accounting/        401 -> disabled 403 -> restored 401
Core       /admin/application-modules/ stayed HTTP 200 throughout
Other enabled module routes          retained recorded baseline behavior
Final module state                    RESTORED / EXACT
Business data mutation               NONE
Production D1 mutation               NO
```

Final harness verdict:

```text
BUILD 438 DEVELOPMENT MODULE ISOLATION PROOF: PASS (3/3 MODULES)
Pages module guard invocation: PROVEN
Enabled baseline behavior: RECORDED / RESTORED EXACTLY
Direct module disablement: PROVEN
Core recovery availability: PROVEN
Other enabled module routes remain available: PROVEN
Automatic exact restore: PROVEN
Business data mutation by proof harness: NONE
PRODUCTION PROMOTION: CLOSED
```

## Shared cross-module service policy

A module switch controls direct UI, broad/legacy API surface and runtime activation. It does not sever an explicitly reviewed shared contract another enabled module consumes.

Exactly seven shared contracts exist:

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
2. At least one reviewed consumer must be enabled and accessible.
3. Mutation contracts require `manage` access.
4. Direct owner-module pages/broad APIs stay blocked while the owner is disabled.
5. Never exempt a broad API prefix simply for convenience.

The 12/12 policy test proves Commerce-disabled + Creative-enabled Inventory contract eligibility and rejects read-only Creative access for shared Inventory mutation contracts.

## Session/module authority resilience

Build 438 intentionally distinguishes:

```text
schema missing during rollout -> all-enabled compatibility defaults / control writes blocked
healthy D1 authority          -> D1 module state
transient D1/config failure   -> last-known state when available
cold authority failure        -> fail closed
transient session query error -> retryable HTTP 503 / no false logout
invalid/expired session       -> normal unauthenticated state
```

Request-specific user/session state is never globally cached.

## Current Development next step — authenticated Admin acceptance

The remaining Development gate is now centered in:

```text
/admin/application-modules/
```

The page contains **Run authenticated acceptance proof**.

### Local safety gate first

```bash
cd /c/Dev/devilndove-site
git pull origin dev

python -m py_compile \
  scripts/build438_authenticated_acceptance_regression.py

python scripts/build438_authenticated_acceptance_regression.py
node --check public/js/admin-application-modules.js
```

Expected ending:

```text
BUILD 438 AUTHENTICATED ACCEPTANCE SAFETY REGRESSION: PASS (.../...)
Audited temporary module controls: PRESENT / RESTORING
Shared live probes: READ-ONLY ONLY
Inventory post/reverse dummy mutation probes: ABSENT
Read-level mutation probe: PRE-ENDPOINT / UNSUPPORTED ACTION / FAIL-SAFE
Production mutation capability: NONE
```

### Browser acceptance

1. Login as Admin in Development.
2. Open `/admin/application-modules/`.
3. Require Core Health PASS and 3 enabled / 0 background enabled / 7 shared contracts.
4. Click **Run current-state route proof** and require PASS (4/4).
5. Click **Run authenticated acceptance proof**.
6. Capture the complete rendered result and browser console if any item fails.

The authenticated runner uses the logged-in Admin session and performs a restoring proof:

```text
D1 source/schema                         exact
Core Health                              PASS
3 module baseline                       enabled/background OFF
Admin baseline                           manage on all three
Core control API                        available

Commerce audited disable                direct 403 / guard 438
Commerce client availability            false
inventory-read while Commerce disabled  GET 200 through Creative consumer
Commerce restore                        exact

Creative audited disable                direct 403 / guard 438
Creative client availability            false
content-media while Creative disabled   GET 200 through Commerce consumer
Creative restore                        exact

Business audited disable                direct 403 / guard 438
Business client availability            false
accounting-read while Business disabled GET 200 through Commerce consumer
Business restore                        exact

Business Admin manage -> read           audited
read-level GET                           allowed
read-level POST                          403 module_access_level_read_only
Business Admin role restore             exact/manage

Final Core Health                       PASS
Final modules                            all enabled
Final backgrounds                        all OFF
```

### Authenticated runner safety

The runner:

- uses `/api/admin/app-modules`, so module/role changes are normally audited;
- restores each module in `finally` before moving to the next owner;
- restores the Admin role in `finally`;
- uses only the read-only `inventory-read`, `content-media`, and `accounting-read` shared contracts;
- never invokes `inventory-post` or `inventory-reverse`;
- uses an intentionally unsupported `__build438_read_guard_probe__` POST for the read-level test, so even if middleware failed the endpoint would reject it instead of performing a business mutation;
- never contains Product/Inventory/Creative business-table SQL;
- has no Production mode.

## Resource-efficiency proof

Build 438 adds no recurring polling loop.

- `/api/modules` is one bootstrap read plus explicit fresh refresh after module changes;
- public/member visibility uses short per-tab `sessionStorage` caching;
- server module config caching is brief and non-user-specific;
- session/user identity remains request-scoped;
- disabled direct module runtime does not initialize;
- top-level Admin runtime imports only after authority is known;
- module background permission defaults OFF;
- no request-time module DDL exists;
- `_routes.json` deliberately avoids forcing general static pages/assets through Functions.

Observe one remaining performance item: authenticated module-owned requests can add one indexed session lookup before a legacy endpoint performs its own authentication. Measure it in Development; do not solve it with global request-user caching.

## Production boundary

**No Build 438 Production D1 authorization exists.**

Do not run Build 438 module migration/toggle proof against `devilndove-prod`.

A Production authorization boundary may be prepared only after authenticated Development acceptance and final evidence are green.

Still locked:

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

1. fresh-install aggregate synchronized — **DONE**;
2. source regression 20/20 — **DONE**;
3. route matrix — **DONE**;
4. client-domain/server alignment — **DONE**;
5. access policy 12/12 — **DONE**;
6. session resilience 6/6 — **DONE**;
7. syntax checks — **DONE**;
8. Development migration — **DONE**;
9. exact read-only D1 verification — **DONE**;
10. Pages invocation routing — **DONE**;
11. automated 3-module disable/block/restore proof — **DONE / PASS 3/3**;
12. final isolation state restored exactly — **DONE**;
13. authenticated Core Health + Current-State Route Proof — **PENDING**;
14. audited Admin module toggle/client suppression proof — **PENDING**;
15. role-level `read` enforcement — **PENDING**;
16. authenticated shared read-contract consumer proof — **PENDING**;
17. final authenticated restore/Core Health — **PENDING**;
18. no recurring background traffic — **PENDING OBSERVATION**;
19. final canonical Markdown evidence update — **PENDING AFTER AUTHENTICATED PROOF**.
