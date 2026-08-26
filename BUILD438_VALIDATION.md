# Build 438 — Application Core / Module Activation Validation

## Status

**SOURCE GATES GREEN / FULL SCHEMA SYNCHRONIZED / DEVELOPMENT D1 AUTHORITY APPLIED + EXACTLY VERIFIED / LIVE MODULE ISOLATION PROOF NEXT / AUTHENTICATED ADMIN ACCEPTANCE PENDING / PRODUCTION D1 NOT AUTHORIZED / PRODUCTION PROMOTION CLOSED**

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

Green source/local gates:

```text
Full-schema check                         PASS
Application Core regression               PASS (20/20)
Route map                                  PASS (53 routes + 7 shared contracts)
Build305 catalog/server alignment          PASS (61/61)
Cross-module access policy                 PASS (12/12)
Session resilience                         PASS (6/6)
Windows console/strict helper              PASS (10/10)
JavaScript/Python syntax                    PASS
```

Development D1 apply:

```text
queries executed:        7
rows read:               6
rows written:            35
result:                  PASS
bookmark:                000000c2-00000006-000050d3-87153a5ac93157f6e9d565afd6f51a90
```

Final human read-only verification:

```text
queries executed:        6
rows read:               6465
rows written:            0
bookmark:                000000c4-00000004-000050d3-d3fa52bb96c72b911140b3ab5b3bddcf
```

Final strict self-asserting verification:

```text
queries executed:        1
rows read:               1327
rows written:            0
bookmark:                000000c4-00000008-000050d3-8acce3c6f0616f33b2aa34301dffe52f
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
scripts/build438_development_module_isolation_proof.py
```

## Fresh-install aggregate authority

`database_full_schema.sql` has been synchronized with the exact focused Build 438 module migration through `scripts/build438_sync_full_schema.py`.

Commit evidence:

```text
0af372d7  Build 438: sync module authority into full schema
```

The helper is deterministic, local-only, refuses partial/ambiguous aggregate state and no-ops when the Build 438 block is already present.

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
4. Direct owner module pages/broad APIs stay blocked while the owner is disabled.
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

## Current Development next step — automated module isolation

Run:

```bash
cd /c/Dev/devilndove-site
git pull origin dev
python -m py_compile scripts/build438_development_module_isolation_proof.py
python -u scripts/build438_development_module_isolation_proof.py \
  2>&1 | tee build438_development_module_isolation_proof.txt
```

Default deployed Development URL:

```text
https://devilndove-site-dev.pages.dev
```

If Development uses another current preview/custom URL, provide it explicitly:

```bash
python -u scripts/build438_development_module_isolation_proof.py \
  --base-url https://YOUR-DEVELOPMENT-URL \
  2>&1 | tee build438_development_module_isolation_proof.txt
```

### Isolation harness safety

The harness:

- requires branch `dev`;
- reuses the hard-pinned `devilndove-dev` database/UUID helper;
- refuses all toggles unless deployed `/api/modules?fresh=1` first proves Build 438 + `schema_ready=true` + `source=d1` + exact three enabled/background-off modules;
- verifies Core recovery and representative baseline route behavior before the first write;
- changes only `app_modules`;
- disables only one module at a time;
- checks deployed state through `/api/modules?fresh=1`;
- checks a representative direct route reaches HTTP 403 with disabled messaging;
- proves `/admin/application-modules/` remains HTTP 200;
- proves other enabled module routes retain expected behavior;
- restores the exact original module/background state in `finally`;
- stops before starting another toggle if one module proof fails;
- verifies final state equals baseline;
- has no Production target/mode.

Expected final ending:

```text
BUILD 438 DEVELOPMENT MODULE ISOLATION PROOF: PASS (3/3 MODULES)
Direct module disablement: PROVEN
Core recovery availability: PROVEN
Other enabled module routes remain available: PROVEN
Automatic exact restore: PROVEN
Business data mutation by proof harness: NONE
Production D1 mutation executed: NO
PRODUCTION PROMOTION: CLOSED
```

If the deployed source is not yet Build 438 or the Development hostname is wrong, the harness must stop **before any D1 toggle**.

## Authenticated Admin acceptance after isolation proof

After the automated isolation proof is green:

### Baseline/Core Health

1. Login as Admin.
2. Open `/admin/application-modules/`.
3. Require Core Health PASS:
   - Modules 3/3;
   - Role rows 6/6;
   - Shared contracts 7;
   - no missing/unexpected rows;
   - no invalid role rows;
   - no disabled module with background permission;
   - no Admin recovery risk.
4. Require all background activity OFF.
5. Run **Current-State Route Proof** and require PASS (4/4) with all modules enabled.

### Audited control proof

Use the UI/API—not direct D1—for final operator acceptance:

- disable/re-enable each module and prove module-aware navigation/runtime suppression;
- prove `/admin/application-modules/` remains the recovery path;
- set one non-essential Admin module to `read`;
- prove GET/HEAD remains available;
- prove a non-read direct module API request is rejected with `module_access_level_read_only`;
- restore `manage`;
- confirm module actions appear in `admin_action_audit`.

### Shared-contract live proof

Use a real authenticated consumer context. Safe read contracts may be exercised while the owner UI is disabled. Do **not** manufacture Inventory movements merely to prove `inventory-post`/`inventory-reverse`; their mutation policy is already unit-proven. Any live mutation proof must use a real reviewed Creative material-use/reversal fixture.

### Data preservation proof

Compare representative business row counts before/after operator toggles. Module changes may modify only:

```text
app_modules
app_module_role_access
admin_action_audit
```

No Catalog, Inventory, Creative, CAIP, Packaging, Content, Accounting, Orders, Membership or other business rows may be deleted because a module was disabled.

## Resource-efficiency proof

Build 438 adds no recurring polling loop.

- `/api/modules` is one bootstrap read plus explicit fresh refresh after module changes;
- public/member visibility uses short per-tab `sessionStorage` caching;
- server module config caching is brief and non-user-specific;
- session/user identity remains request-scoped;
- disabled direct module runtime does not initialize;
- top-level Admin runtime imports only after authority is known;
- module background permission defaults OFF;
- no request-time module DDL exists.

Observe one remaining performance item: authenticated module-owned requests can add one indexed session lookup before a legacy endpoint performs its own authentication. Measure it in Development; do not solve it with global request-user caching.

## Production boundary

**No Build 438 Production D1 authorization exists.**

Do not run Build 438 module migration/toggle proof against `devilndove-prod`.

A Production authorization boundary may be prepared only after Development isolation, authenticated Core Health/route proof, role-level enforcement, shared-contract consumer proof, data preservation and runtime/background behavior are green.

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
10. automated 3-module disable/block/restore proof — **PENDING**;
11. authenticated Core Health + Current-State Route Proof — **PENDING**;
12. audited UI/API toggle proof — **PENDING**;
13. role-level `read` enforcement — **PENDING**;
14. authenticated shared read-contract consumer proof — **PENDING**;
15. business data preservation — **PENDING**;
16. no recurring background traffic — **PENDING OBSERVATION**;
17. final canonical Markdown evidence update — **PENDING AFTER LIVE PROOF**.
