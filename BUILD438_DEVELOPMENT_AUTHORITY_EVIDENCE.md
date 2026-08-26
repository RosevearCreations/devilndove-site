# Build 438 — Development Module Authority Evidence

## Status

**DEVELOPMENT D1 AUTHORITY APPLIED / EXACTLY VERIFIED / SOURCE-ROUTE-ACCESS-SESSION GATES GREEN / PAGES INVOCATION FIX IN SOURCE / LIVE DISABLE-RESTORE REPROOF NEXT / PRODUCTION NOT AUTHORIZED / PRODUCTION PROMOTION CLOSED**

This file records owner-run evidence for the Build 438 Application Core + three top-level application-module authority.

## Development target

```text
Pages project:  devilndove-site-dev
D1 database:    devilndove-dev
D1 UUID:        dbc1615b-dcbe-4951-973b-b47c99c73bfa
Wrangler:       4.126.0
Branch:         dev
```

No Production database/resource was targeted by these runs.

## Full-schema authority

The local deterministic aggregate sync succeeded and was committed as:

```text
0af372d7  Build 438: sync module authority into full schema
```

Proof:

```text
BUILD 438 FULL-SCHEMA CHECK: PASS
app_modules: PRESENT / SINGLE AUTHORITY
app_module_role_access: PRESENT / SINGLE AUTHORITY
Build 438 indexes: PRESENT
Top-level module seed keys: PRESENT
Cloudflare/D1 access during sync/check: NONE
```

## Local/source gates

Owner-run Build 438 gates are green:

```text
Application Core regression                 PASS (20/20)
Route map                                    PASS (53 routes + 7 shared contracts)
Build305 catalog/server alignment            PASS (61/61)
Cross-module access policy                   PASS (12/12)
Session resilience                           PASS (6/6)
Windows console/strict-query regression      PASS (10/10)
JavaScript syntax checks                     PASS
```

Notable proofs:

```text
Cross-module shared service preservation     PROVEN / CONSUMER-GATED
Creative can consume Inventory contracts
while Commerce direct UI is disabled         UNIT-PROVEN
Cold module-authority read failure           FAIL CLOSED
False 401/logout on D1 verification failure  PREVENTED
Windows npx.cmd --command SQL transport      REMOVED
Strict D1 verification transport             FILE-BASED / SELF-ASSERTING
```

## Development D1 apply evidence

The additive Build 438 migration executed successfully against **Development only**:

```text
Processed queries:       7
Executed queries:        7
Rows read:               6
Rows written:            35
Database size:           12.83 MB
Final bookmark:          000000c2-00000006-000050d3-87153a5ac93157f6e9d565afd6f51a90
Result:                  BUILD 438 DEVELOPMENT MODULE AUTHORITY APPLY: PASS
```

The write count is migration/schema/seed work for `app_modules` and `app_module_role_access`; it is not business-data promotion.

## Development read-only verification evidence

Final human-readable verification:

```text
Processed queries:       6
Executed queries:        6
Rows read:               6465
Rows written:            0
Final bookmark:          000000c4-00000004-000050d3-d3fa52bb96c72b911140b3ab5b3bddcf
```

Final strict self-asserting verification:

```text
Processed queries:       1
Executed queries:        1
Rows read:               1327
Rows written:            0
Final bookmark:          000000c4-00000008-000050d3-8acce3c6f0616f33b2aa34301dffe52f
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

Final verdict:

```text
BUILD 438 DEVELOPMENT MODULE AUTHORITY READ-ONLY VERIFICATION: PASS / EXACT
```

## Live isolation attempts and Pages routing finding

The first baseline-aware isolation attempt stopped before any D1 toggle because the deployed Admin HTML baseline was HTTP 200 instead of the harness's earlier assumed 401. The harness was corrected to record the deployed healthy baseline rather than assuming one authentication-shell status.

The second isolation attempt reached the real Commerce toggle and produced decisive evidence:

```text
BASELINE business-administration   /admin/accounting/        HTTP 200
BASELINE commerce-operations       /shop/                    HTTP 200
BASELINE creative-production       /admin/creative-process/  HTTP 200

commerce-operations disable D1 write    SUCCESS
/api/modules?fresh=1 sees disabled      SUCCESS
/shop/ while disabled                   HTTP 200  <-- FAILURE
commerce-operations restore D1 write    SUCCESS
/shop/ after restore                    HTTP 200
FINAL MODULE STATE                      RESTORED / EXACT
```

No Product, Inventory, Creative, CAIP, Packaging, Content, Accounting, Order, Membership or Production data was changed by the harness.

Root cause was then found in the tracked Pages routing authority:

```json
{
  "version": 1,
  "include": ["/api/*"],
  "exclude": []
}
```

Because `_routes.json` invoked Pages Functions only for `/api/*`, static `/shop/` and `/admin/...` HTML requests bypassed `functions/_middleware.js`. The D1 authority and `/api/modules` correctly changed state, but static page delivery never entered the module guard.

Cloudflare Pages' current routing model permits root middleware in front of static files only on routes that invoke Functions. Build 438 therefore now explicitly routes only module-owned static surfaces through Functions instead of forcing the whole public site through the Worker path.

Current source fix:

```text
_routes.json
  /api/*
  /admin
  /admin/*
  /shop + /shop/*
  /cart + /cart/*
  /checkout + /checkout/*
  /product + /product/*
  /products + /products/*
  /custom-request + /custom-request/*
  /members + /members/*

General informational/static pages remain outside Functions.
```

The root middleware now emits deployment diagnostics on module-owned requests:

```text
X-DND-Module-Guard: 438
X-DND-Module-Key: <module-key>
```

The isolation harness refuses any further toggle unless all representative module routes expose those headers first. This turns deployment lag into a safe pre-write stop instead of another false isolation failure.

Dedicated local regression:

```text
scripts/build438_pages_invocation_routes_test.py
```

It proves the narrow Pages invocation map, protects the static-resource-efficiency boundary, and requires the Build 438 guard diagnostic headers in source.

## Development authority now proven

```text
Application Core authority                 INSTALLED / PROVEN
commerce-operations                        ENABLED / RESTORED
creative-production                        ENABLED
business-administration                    ENABLED
All module background permissions          OFF
Admin/member role rows                     EXACT / 6
Required indexes                           EXACT / 2
Fresh-install aggregate                    SYNCHRONIZED
Pages static-module invocation fix         SOURCE READY / LIVE REPROOF PENDING
Production D1 mutation                     NO
Production promotion                       CLOSED
```

## Next live proof

The next Build 438 step is **not another migration**. After the current `dev` Pages deployment includes the `_routes.json`/middleware diagnostic commits, run:

```text
scripts/build438_development_module_isolation_proof.py
```

Before any toggle it must prove:

1. deployed Development serves Build 438 + `schema_ready=true` + `source=d1`;
2. all three module rows are enabled and background OFF;
3. each representative page has `X-DND-Module-Guard: 438` and the exact module key;
4. Core recovery is HTTP 200.

Then, one module at a time, it must prove:

1. direct module route becomes HTTP 403 while disabled;
2. disabled response identifies the module as currently disabled;
3. `/admin/application-modules/` remains reachable as Core recovery;
4. other enabled module routes retain their recorded baseline behavior;
5. `background_activity_enabled` remains/returns OFF;
6. every module restores to its exact original state in a `finally` path;
7. final three-module state equals the baseline;
8. no business table or Production resource is mutated by the proof harness.

After that automated route proof, use the authenticated Admin control screen for Core Health/current-state proof and the remaining role-level/shared-contract browser evidence where a real logged-in consumer context is required.

## Production boundary

```text
Build 438 Production D1 migration              NOT AUTHORIZED
Fractional Inventory / Creative rebuilds       NOT AUTHORIZED
Product / FK rebuilds                          NOT AUTHORIZED
Accounting default/nullability rebuilds        NOT AUTHORIZED
R2/provider mutation                           DISABLED
CAIP D1-only copy                              FORBIDDEN
Broad Production promotion                     CLOSED
```
