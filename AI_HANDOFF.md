# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 12 — Finance Operations Command Center** is the active Development source candidate.

Start every restart by reading `current-development-authority.json`, then this file. `development-release.json` remains **INHERITED_REGRESSION_COMPATIBILITY** and is not the current Release 467 selector. The middleware Release 466 header remains **INHERITED_RUNTIME_COMPATIBILITY**.

The exact Development-green predecessor is **Release 467 Build 11 — Admin Operations Command Center**:

- merged `dev`: `ce42f3b2ea553b69085705f500a9e2bd2f689818`
- tree: `191e4a92ebcbc94b29cfbf6a83259acd4981d302`
- System Gate `33637049566` — SUCCESS
- Build 11 Proof `33637049079` — SUCCESS

## Build 12 technical authority

- manifest: `release467-build12-finance-operations-command-center.json`
- gate: `scripts/release467_build12_gate.py`
- proof: `.github/workflows/release467-build12-proof.yml`
- workspace: `/admin/finance/`
- shared read engine: `public/js/admin-accounting-operations.js`
- Finance mount: `financeOperationsMount`
- write owner: existing `/admin/accounting/` workflows
- source base: exact merged Build 11 `ce42f3b2ea553b69085705f500a9e2bd2f689818`

Build 12 promotes the existing read-only Accounting Financial Operations intelligence to the Finance landing page. It surfaces current-month reconciliation exceptions, statement/evidence gaps, product-costing gaps, month-close blockers, recognized revenue/cost snapshots and direct owner links. On Finance, every Accounting anchor resolves to `/admin/accounting/`; no write authority is duplicated or moved.

## Release 467 authority separation

### Builds 1–4
I.T. readiness, recovery actions, authenticated runtime acceptance and sanitized evidence ledger remain retained authorities.

### Build 5 — CI / Cloudflare Access readiness
Build 5 — CI / Cloudflare Access readiness remains separate. Masked secret references are `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET`; secret values never belong in source, UI, logs or evidence. **Production Promotion Readiness** remains a separate HOLD/READY authority and never deploys automatically.

### Release 467 Build 6
Release 467 Build 6 remains the dispatch-only Development Cloudflare Access service-token acceptance harness. Real Access acceptance remains `HOLD_EXTERNAL` until deliberately proven.

### Release 467 Build 7 — External Commercial Acceptance Bridge
Release 467 Build 7 — **External Commercial Acceptance Bridge** remains the visibility authority for CAIP private media, Stripe Development, PayPal sandbox and Social/OAuth. It does not execute providers automatically.

### Builds 8–10
Build 8 retains Authority Convergence and Restart Safety. Build 9 retains Historical CI Retirement. Build 10 retains the read-only I.T. Control Tower at `/admin/it/`.

### Release 467 Build 11 — Admin Operations Command Center
Build 11 remains the daily cross-business first stop at `/admin/`, sharing the owned Today Tasks read contract and retained explicit administrator Done/Ignore/Snooze action authority. Four operator workspaces remain backed by five permission modules; Socials/CAIP remains independently permissioned.

### Release 467 Build 12 — Finance Operations Command Center
Build 12 makes `/admin/finance/` the financial operating first stop. It shares the existing Accounting read engine; it does not create another ledger, reconciliation service, statement importer, costing service or close workflow. Accounting remains the only write owner for those operations.

## Exact environment boundary

- source: `dev`
- Development Preview: `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Product R2: `devilndove-toolshed-images-dev`
- CAIP private R2: `devilndove-caip-media-dev`
- canonical migrations: exactly `0001`–`0004`
- Build 12 schema change: NONE
- Build 12 new D1/R2 mutation authority: NONE

A chat, workstation, deployment or source commit is not a migration event. Never replay historical migrations merely because work resumed.

## External/provider boundary

External lanes remain truthfully **`HOLD_EXTERNAL`** unless separately and deliberately proven: Cloudflare Access service token, Stripe Development, PayPal sandbox and Social/OAuth. CAIP private-media status uses fresh Build 7 evidence. Build 12 performs no provider/payment/refund/OAuth action merely by rendering Finance intelligence.

## Main / Production boundary

The carried-forward `main` source-head observation is `fcf92f5342c04f0f0d07387034e852b4cc40f3f9`; it is not proof of the deployed Production release. Build 12 does not update `main`, contact Production, mutate Production D1/R2/business data, change Cloudflare Access policy or authorize Production promotion.

## Permanent safety rules

Development first. Request-time schema DDL remains forbidden. Canonical migrations remain forward-only and Development-first. Raw CAIP deletion remains closed. Provider execution/publication remains closed outside deliberate acceptance. Production business data remain Production-owned. Secret values never belong in UI/logs/artifacts/docs. Build 5 remains Production Promotion Readiness authority; Build 6 Access acceptance; Build 7 external-commercial visibility; Build 9 historical-CI retirement; Build 10 technical first stop; Build 11 daily cross-business first stop; Build 12 Finance projection remains read-only.

## Next bounded work

Prove Build 12 on its exact feature SHA, open a PR to `dev`, require all current Release 467/System checks green, merge only the unchanged green head, then require the merged Build 12 proof and canonical System Gate to deploy and smoke-test that exact merged `dev` SHA.

## Canonical reading order

1. `current-development-authority.json`
2. `AI_HANDOFF.md`
3. `release467-build12-finance-operations-command-center.json`
4. `PROJECT_STATUS_AND_ROADMAP.md`
5. `SANITY_HEALTH_CHECK.md`
6. `docs/operations/RELEASE_467_BUILD_12_FINANCE_OPERATIONS_COMMAND_CENTER.md`
7. `release467-build11-admin-operations-command-center.json`
8. `release467-build10-it-control-tower-consolidation.json`
9. `release467-build9-historical-ci-retirement.json`
10. `release467-build8-authority-convergence.json`
11. `release467-build7-external-commercial-acceptance.json`
12. `release467-build6-access-acceptance-harness.json`
13. `release467-build5-production-promotion-readiness.json`
14. `development-release.json` — compatibility evidence only

## Historical authority

Release 466 and earlier material is compatibility/provenance only and cannot override current Release 467 Build 12 authority.
