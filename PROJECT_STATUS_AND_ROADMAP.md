# Devil n Dove — Project Status & Roadmap

## Current release

**Release 467 Build 12 — Finance Operations Command Center** is the active Development source candidate.

Exact Development-green predecessor: **Release 467 Build 11 — Admin Operations Command Center**, merged `dev` `ce42f3b2ea553b69085705f500a9e2bd2f689818`, tree `191e4a92ebcbc94b29cfbf6a83259acd4981d302`, System Gate `33637049566` SUCCESS, Build 11 Proof `33637049079` SUCCESS.

`current-development-authority.json` remains the restart selector. `development-release.json` remains inherited Release 466 regression compatibility; the runtime Release 466 header remains inherited runtime compatibility.

## Release 467 progression

| Build | Theme | State |
|---|---|---|
| 1–4 | I.T. readiness, recovery, runtime acceptance, evidence ledger | Development merged |
| 5 | CI/Access readiness + separate Production Promotion Readiness | Source green; external/promotion separate |
| 6 | Development Access acceptance harness | Harness green; real Access `HOLD_EXTERNAL` |
| 7 | External Commercial Acceptance Bridge | Source green; external lanes bounded |
| 8 | Authority Convergence and Restart Safety | Development green |
| 9 | Historical CI Retirement & Gate Fanout Reduction | Development green |
| 10 | I.T. Control Tower Consolidation | Development green |
| 11 | Admin Operations Command Center | Development green at `ce42f3b2…` |
| 12 | Finance Operations Command Center | Active Development candidate |

## Build 12 scope

Build 12 changes `/admin/finance/` from a six-link navigation hub into a useful monthly Finance Operations Command Center by sharing the already-existing read-only Accounting Financial Operations engine.

The Finance landing page now exposes:

- review-month selection and refresh;
- open reconciliation exceptions;
- unresolved sales-tax, processor-fee and shipping reconciliation counts;
- costing gaps and negative-margin review;
- month-close blockers;
- statement/evidence gaps;
- recognized revenue, operating-cost, full-COGS, imported-fee and rough operating-result snapshot;
- severity-sorted financial work queue;
- direct links into the exact owning `/admin/accounting/` sections;
- the existing Finance grouped workspaces below the command center.

The shared engine continues to run unchanged on the Accounting page. Build 12 adds a second **view**, not a second authority. It uses authenticated `window.DDAuth.apiFetch` reads and performs no POST/PUT/DELETE operation.

## Ownership model

`/admin/finance/` = read-only financial operating first stop.

`/admin/accounting/` = existing write owner for reconciliation, statement imports, costing, close, ledger and accounting records.

`/admin/` = Build 11 daily cross-business first stop.

`/admin/it/` = Build 10 technical readiness/recovery first stop.

No financial write authority moves in Build 12.

## Development boundary

- Source: `dev`.
- Preview: `https://dev.devilndove-site.pages.dev`.
- D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- Product R2: `devilndove-toolshed-images-dev`.
- CAIP R2: `devilndove-caip-media-dev`.
- Canonical migrations: exactly `0001`–`0004`.
- Build 12 migration: NONE.
- New D1/R2 mutation authority: NONE.

## External acceptance

Cloudflare Access service-token, Stripe Development, PayPal sandbox and Social/OAuth remain **`HOLD_EXTERNAL`** until deliberate acceptance. CAIP private-media status uses fresh Build 7 evidence. Finance visibility does not authorize provider execution.

## Main / Production boundary

Carried-forward `main` source-head observation: `fcf92f5342c04f0f0d07387034e852b4cc40f3f9`. This is not proof of the deployed Production release. Build 12 does not touch `main`, Production resources/data, Access policy, provider execution or promotion authority.

## Next bounded work

Close Build 12 only after feature proof, all current PR checks, merged Build 12 proof, and the canonical merged-SHA System Gate are green with exact Development deployment/binding/smoke acceptance. After closure, use the Admin, Finance and I.T. command centers to select the next highest-value Storefront or Creator workflow improvement unless an external acceptance lane is deliberately authorized.

## Permanent boundaries

Development first. Production data remain Production-owned. Request-time DDL, historical-migration replay on restart, raw R2 deletion, automatic provider execution/publication, secret-value exposure and automatic Production promotion remain closed. Production Promotion Readiness remains a separate Build 5 authority. External lanes remain `HOLD_EXTERNAL` until deliberately proven.
