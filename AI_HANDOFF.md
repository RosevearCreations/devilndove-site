# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 13 — Repository Hygiene and Historical CI Cleanup** is the active Development source candidate.

Start every restart by reading `current-development-authority.json`, then this file. `development-release.json` remains **INHERITED_REGRESSION_COMPATIBILITY** and is not the current Release 467 selector. The middleware Release 466 header remains **INHERITED_RUNTIME_COMPATIBILITY**.

The exact Development-green predecessor is **Release 467 Build 12 — Finance Operations Command Center**:

- merged `dev`: `374983f68fb16172fb357b1755293a29e5d2953f`
- tree: `339f13b5a6e6ba5cc4a9c64ea3b04b70ad8aef91`
- System Gate `33642231716` — SUCCESS
- Build 12 Proof `33642231794` — SUCCESS

Build 12 remains a closed application authority. Its exact Build 11 source base was `ce42f3b2ea553b69085705f500a9e2bd2f689818`; **Finance Operations Command Center** remains read-only and `/admin/accounting/` retains financial write ownership.

## Build 13 technical authority

- manifest: `release467-build13-repository-hygiene-cleanup.json`
- gate: `scripts/release467_build13_gate.py`
- proof: `.github/workflows/release467-build13-proof.yml`
- permanent hygiene fence: `scripts/repository_hygiene_gate.py`
- retired live workflow definitions: 39 Release 448–461 files
- historical Git evidence: retained
- application/runtime change: NONE
- schema/D1/R2 change: NONE

Build 13 removes obsolete live Actions definitions that predate the canonical Release 463–467 operating model. It does not delete historical commits, migration authorities, Release 463 infrastructure tooling, Release 466 compatibility evidence, current Release 467 proofs, Development runtime acceptance, or Production deploy/rollback workflows.

## Release 467 authority separation

### Builds 1–4
I.T. readiness, recovery actions, authenticated browser runtime acceptance and sanitized evidence ledger remain retained authorities.

### Build 5 — CI / Cloudflare Access readiness
Build 5 — CI / Cloudflare Access readiness remains separate. Masked references are `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET`; secret values never belong in source, UI, logs or evidence. **Production Promotion Readiness** remains a separate HOLD/READY authority and never deploys automatically.

### Release 467 Build 6 — Development Cloudflare Access acceptance harness
Release 467 Build 6 remains the dispatch-only Development Cloudflare Access service-token acceptance harness. Real Access acceptance remains `HOLD_EXTERNAL` until deliberately proven.

### Release 467 Build 7 — External Commercial Acceptance Bridge
Release 467 Build 7 — **External Commercial Acceptance Bridge** remains the visibility authority for CAIP private media, Stripe Development, PayPal sandbox and Social/OAuth. It does not execute providers automatically.

### Release 467 Build 8 — Authority Convergence and Restart Safety
Release 467 Build 8 established `current-development-authority.json` as the current restart pointer and fenced inherited Release 466 compatibility evidence away from current Release 467 authority.

### Release 467 Build 9 — Historical CI Retirement & Gate Fanout Reduction
Release 467 Build 9 made Release 466 Build 1–6 proof workflows manual-only while preserving historical proof source and Actions evidence. Build 13 preserves those six manual-only files.

### Release 467 Build 10 — I.T. Control Tower Consolidation and Self-Diagnostics
Release 467 Build 10 retains the read-only I.T. technical first stop at `/admin/it/`.

### Release 467 Build 11 — Admin Operations Command Center
Build 11 remains the daily cross-business first stop at `/admin/`, sharing the owned Today Tasks read contract and retained explicit administrator Done/Ignore/Snooze action authority.

### Release 467 Build 12 — Finance Operations Command Center
Build 12 makes `/admin/finance/` the financial operating first stop. It shares the existing Accounting read engine; it does not create another ledger, reconciliation service, statement importer, costing service or close workflow.

### Release 467 Build 13 — Repository Hygiene and Historical CI Cleanup
Build 13 retires 39 obsolete Release 448–461 workflow definitions from the live repository surface and adds a permanent hygiene assertion preventing their return. Historical Git provenance remains available.

## Exact environment boundary

- source: `dev`
- Development Preview: `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Product R2: `devilndove-toolshed-images-dev`
- CAIP private R2: `devilndove-caip-media-dev`
- canonical migrations: exactly `0001`–`0004`
- Build 13 schema change: NONE
- Build 13 new D1/R2 mutation authority: NONE

A chat, workstation, deployment or source commit is not a migration event. Never replay historical migrations merely because work resumed.

## External/provider boundary

External lanes remain truthfully **`HOLD_EXTERNAL`** unless separately and deliberately proven: Cloudflare Access service token, Stripe Development, PayPal sandbox and Social/OAuth. CAIP private-media status uses fresh Build 7 evidence. Build 13 performs no provider/payment/refund/OAuth action.

## Main / Production boundary

`main` is verified at Build 11 SHA `ce42f3b2ea553b69085705f500a9e2bd2f689818`, tree `191e4a92ebcbc94b29cfbf6a83259acd4981d302`. Production Pages Deploy `33640133776` completed successfully on that exact SHA. Build 12 and Build 13 remain Development-only until separately authorized for Production promotion. Build 13 does not update `main`, contact Production, mutate Production D1/R2/business data or change Cloudflare Access policy.

## Permanent safety rules

Development first. Request-time schema DDL remains forbidden. Canonical migrations remain forward-only and Development-first. Raw CAIP deletion remains closed. Provider execution/publication remains closed outside deliberate acceptance. Production business data remain Production-owned. Secret values never belong in UI/logs/artifacts/docs. Build 5 remains Production Promotion Readiness authority; Build 6 Access acceptance; Build 7 external-commercial visibility; Build 9 historical-CI retirement; Build 10 technical first stop; Build 11 daily cross-business first stop; Build 12 Finance projection remains read-only; Build 13 repository cleanup remains runtime-neutral.

## Branch cleanup boundary

Preserve `main`, `dev`, and `backup-main-before-dev-replacement-20260830`. Merged/superseded Release 467 feature branches are prune candidates after their commits are proven reachable from `dev`. Branch-ref deletion is repository administration and is separate from the Build 13 source-tree cleanup.

## Next bounded work

Prove Build 13 on its exact feature SHA, require all current Release 467/System checks green, merge only the unchanged green head, then require the merged Build 13 proof and canonical System Gate on the exact merged `dev` SHA. Do not promote Build 12/13 to Production merely as part of repository cleanup.

## Canonical reading order

1. `current-development-authority.json`
2. `AI_HANDOFF.md`
3. `release467-build13-repository-hygiene-cleanup.json`
4. `PROJECT_STATUS_AND_ROADMAP.md`
5. `SANITY_HEALTH_CHECK.md`
6. `docs/operations/RELEASE_467_BUILD_13_REPOSITORY_HYGIENE.md`
7. `release467-build12-finance-operations-command-center.json`
8. `release467-build11-admin-operations-command-center.json`
9. `release467-build10-it-control-tower-consolidation.json`
10. `release467-build9-historical-ci-retirement.json`
11. `release467-build8-authority-convergence.json`
12. `release467-build7-external-commercial-acceptance.json`
13. `release467-build6-access-acceptance-harness.json`
14. `release467-build5-production-promotion-readiness.json`
15. `development-release.json` — compatibility evidence only

## Historical authority

Release 466 and earlier source remains compatibility/provenance only and cannot override current Release 467 Build 13 authority. Retiring obsolete live workflow definitions does not erase their Git history.
