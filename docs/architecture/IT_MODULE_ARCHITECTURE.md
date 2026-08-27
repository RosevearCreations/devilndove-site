# Devil n Dove I.T. & Platform Module

Status: **BUILD 443 CARRY-FORWARD HOLD — USER-GRANT AUTHORITY PACKAGED / RUNTIME ENFORCEMENT HELD UNTIL DEVELOPMENT D1 PROOF**

Updated: 2026-08-27

## Purpose

I.T. & Platform owns technical release readiness: deployment, database/storage health, diagnostics, recovery, bindings/secrets presence, cache/service-worker identity, incidents, backup/restore evidence, provider health and technical release HOLDs. It must not silently rewrite Product, Inventory, Tool, Creative, Packaging, Accounting or marketing facts.

Top-level module key: `it-platform`.

## Proven starting point

Build 441 established `/admin/it-platform/` as the operator parent. Build 442 then closed its exact Development checkpoint at `b8868c9b77ad12de4fee4984274fe80e1d096613`, with source, Windows D1 transport and Cloudflare deployment `b72eb8b4-ac52-4b12-bdd2-cd85ea6b400d` green.

The three existing business modules remain proven Build 438 runtime authority while Build 443 carries the I.T. D1 boundary:
- `commerce-operations`
- `creative-production`
- `business-administration`

## Carried Build 442 Phase A — schema first

Build 442 adds, but does not yet activate at runtime:

- an additive `it-platform` row in `app_modules`;
- denied `member` and `admin` rows for `it-platform` in `app_module_role_access` so role membership alone cannot unlock I.T.;
- `app_module_user_access` with explicit per-user `read` / `manage` grants;
- one-time bootstrap of explicit `manage` grants for active administrators present while no I.T. user grants exist;
- a Development-only guarded migration/apply/verifier using the proven Windows-safe D1 query transport;
- migration regressions proving consistency constraints, idempotency and no automatic grant for a future admin on replay.

Runtime route/API enforcement stays unchanged until the Development D1 migration has been applied and verified. This is intentional: code that depends on `app_module_user_access` must not auto-deploy before that table exists.

## Build 443 I.T. HOLD / Phase B — after D1 verification

Phase B will:

1. add `IT_PLATFORM: 'it-platform'` to the runtime registry;
2. map reviewed I.T. routes before the Business Administration fallback;
3. require an authenticated active user for I.T.;
4. require an explicit `app_module_user_access` grant even when the user role is `admin`;
5. enforce `read` versus `manage` on API methods;
6. add audited grant management to the Application Core module-control API;
7. require explicit I.T. `manage` authority to change I.T. user grants;
8. block removal or downgrade of the last active I.T. manager;
9. extend health diagnostics and authenticated acceptance to four modules.

Hidden navigation is never treated as security.

## I.T. route ownership target

### Release / deployment
- `/admin/it-platform*`
- `/admin/startup-readiness*`
- `/admin/prelaunch*`
- `/admin/deployment-preflight*`
- `/admin/release-control*`
- `/admin/deploy-readiness*`
- `/admin/promotion-control*`

### Runtime / diagnostics
- `/admin/application-sanity*`
- `/admin/runtime-incidents*`
- `/admin/public-api-health*`
- `/admin/route-usage*`

### Data / schema / documentation
- `/admin/schema-drift*`
- `/admin/markdown-sanity*`

### Recovery / controlled opening
- `/admin/operational-continuity*`
- `/admin/go-live-execution*`
- `/admin/live-ops-followthrough*`

Matching `/api/admin/...` families become I.T.-owned only where they are truly technical authorities. Product/Inventory/Tool/Creative/Packaging/Accounting business APIs remain with their existing modules.

`/admin/application-modules*` and `/api/admin/app-modules*` remain Application Core recovery surfaces. Their future I.T.-grant mutation action is still protected by explicit current-user I.T. `manage` authority, so the exempt route cannot become an admin-role privilege escalation path.

## Access model

For the three existing business modules, role-based access remains the proven behavior unless separately revised.

For `it-platform`, access requires all of:

- module exists and is enabled;
- user is authenticated and active;
- an explicit row exists for `(it-platform, user_id)`;
- `is_allowed = 1`;
- `access_level` is `read` or `manage`.

No explicit row means denied. An ordinary admin with no I.T. user grant is denied.

`read` permits safe read operations. `manage` is required for I.T.-owned mutations. Background I.T. activity remains off by default and is not introduced by Phase A.

## Lockout protection

The first migration bootstrap is permitted only while no `it-platform` user grant exists. Replaying the migration after a future admin is created does not auto-grant that admin.

Phase B grant mutations must refuse any operation that would leave fewer than one active explicit `manage` user for `it-platform`.

Every grant mutation must be audited with actor, target user, before/after state and timestamp.

## I.T. owns

- release identity, deployment evidence and rollback readiness;
- Cloudflare Pages/Functions, D1 and R2 environment diagnostics;
- schema migration/ledger/aggregate-schema/drift review;
- runtime incidents, API health and route usage;
- binding/secret presence checks without secret values;
- cache/service-worker health;
- backup/restore and isolated restore evidence;
- provider connectivity, retry/dead-letter infrastructure;
- maintenance/recovery runbooks and technical audit history;
- technical HOLD registration and release-stop conditions.

## I.T. does not own

Product/Inventory/Tool/Order business rules, Creative/CAIP editorial decisions, Packaging formulas/claims, Accounting treatment, marketing/SEO decisions, or ordinary user/business-role administration.

## Service and repair rule

The first I.T. contracts remain read-only: release-health, schema-health, runtime-health, storage-health, provider-health and module-health. Any later repair must be a separate bounded mutation with environment refusal rules, explicit authorization, idempotency or compensating reversal, audit evidence and post-action verification. Background activity stays off by default.

## Current HOLDs

- `IT-443-H1`: apply and verify the additive authority in Development D1.
- `IT-443-H2`: activate runtime per-user enforcement only after H1 passes.
- `PAY-443-H1`: Stripe test configuration, checkout return, signed webhook and duplicate-replay evidence on the exact Development deployment.
- `PAY-443-H2`: PayPal sandbox approval/capture return, verified webhook and duplicate-replay evidence on the exact Development deployment.
- `CAIP-443-H1`: private-media Development evidence remains carried forward.
- separate live Production promotion remains closed by policy.

The operator-facing I.T. hub lists the correction mechanic and pass condition for each current-release obstacle. Payment configuration uses the existing safe public readiness endpoint and exposes only configuration booleans/mode—not credentials. A readiness flag is diagnostic evidence only; it cannot close payment acceptance without the matching end-to-end and replay proof.

The same hub includes a detailed candidate-delivery contract for the next probable major direction, an editable responsive Home carousel. Business owners retain message/image/link authority; I.T. owns its release health, failure evidence and rollback proof.

Separate live `main` / `devilndove-site` Production remains untouched unless explicitly authorized.
