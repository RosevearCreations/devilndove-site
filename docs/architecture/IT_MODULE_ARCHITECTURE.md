# Devil n Dove I.T. & Platform Module

Status: **BUILD 441 OPERATOR HUB ACTIVE / FULL FOURTH-MODULE ACCESS MODEL NEXT**

Updated: 2026-08-27

## Purpose

I.T. & Platform owns technical release readiness: deployment, database/storage health, diagnostics, recovery, bindings/secrets presence, cache/service-worker identity, incidents, backup/restore evidence, provider health and technical release HOLDs. It must not silently rewrite Product, Inventory, Tool, Creative, Packaging, Accounting or marketing facts.

Target top-level module key: `it-platform`.

## Build 441 boundary

Build 441 introduces `/admin/it-platform/` as a read-only operator parent for existing Preflight/Startup/Release/Schema/Runtime/Continuity authorities. It also makes current technical HOLDs visible in `docs/releases/BUILD441_RELEASE_GATE.md` and `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`.

Build 441 does **not** falsely claim that the backend module registry or per-user grant authority already contains a fourth fully enforced module. The three proven business-module controls remain operational while I.T. access enforcement is implemented incrementally.

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

## Future access authority

Full module implementation adds explicit `app_module_user_access` rows with `read` or `manage` access. No explicit I.T. grant means denied, including for an ordinary admin. Middleware/APIs must enforce grants; hidden navigation alone is not security. Every grant and I.T. mutation is audited.

## Existing route ownership map

- Release/deployment: `/admin/deployment-preflight*`, `/admin/release-control*`, `/admin/deploy-readiness*`, `/admin/promotion-control*`
- Runtime: `/admin/application-sanity*`, `/admin/runtime-incidents*`, `/admin/public-api-health*`, `/admin/route-usage*`
- Data/schema: `/admin/schema-drift*`, `/admin/markdown-sanity*`
- Recovery: `/admin/operational-continuity*`
- Controlled opening: `/admin/go-live-execution*`, `/admin/live-ops-followthrough*`
- Module recovery remains Application Core-owned.

## Service and repair rule

Initial I.T. contracts are read-only: release-health, schema-health, runtime-health, storage-health, provider-health and module-health. Any repair must later be a separate bounded mutation with environment refusal rules, explicit authorization, idempotency or compensating reversal, audit evidence and post-action verification. Background activity stays off by default.

## Acceptance path

Build 441: operator hub + HOLD ownership + release documentation/gates.

Build 442+: registry integration, explicit per-user grants, route/API enforcement and four-module health contract. Repair actions come only after read-only health and access isolation are proven.

Separate live `main` / `devilndove-site` Production remains untouched unless explicitly authorized.
