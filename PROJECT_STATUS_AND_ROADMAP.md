# Devil n Dove — Project Status & Roadmap

## Current release

**Release 467 Build 11 — Admin Operations Command Center** is the active Development source candidate.

Its exact Development-green predecessor is **Release 467 Build 10 — I.T. Control Tower Consolidation and Self-Diagnostics**, merged to `dev` at `cba1fbe1c0acc71c9f2f0d29bdb6d5bef09e380a`, tree `c2de52782f96fa43d1e5d2eabd80b30a23c62ecd`, with System Gate `33635318725` and Build 10 Proof `33635318747` both successful.

The current restart pointer remains `current-development-authority.json`. `development-release.json` remains inherited regression compatibility and the middleware Release 466 header remains explicit runtime compatibility; neither selects the current Release 467 build.

## Release 467 progression

| Build | Theme | Current state |
|---|---|---|
| 1 | I.T. readiness control tower and root-admin/module authority | Development source merged |
| 2 | Readiness actions and recovery queue | Development source merged |
| 3 | Same-origin authenticated browser runtime acceptance | Development source merged |
| 4 | Sanitized evidence and acceptance ledger | Development source merged |
| 5 | CI/Cloudflare Access readiness plus separate Production Promotion Readiness | Source green; external/promotion decisions separate |
| 6 | Development Cloudflare Access service-token acceptance harness | Harness green; real Access `HOLD_EXTERNAL` |
| 7 | External Commercial Acceptance Bridge | Source green; real external lanes bounded |
| 8 | Authority Convergence and Restart Safety | Development green |
| 9 | Historical CI Retirement & Gate Fanout Reduction | Development green |
| 10 | I.T. Control Tower Consolidation and Self-Diagnostics | Development green at `cba1fbe1…` |
| 11 | Admin Operations Command Center | Active Development candidate |

## Locked Build 8 provenance

**Release 467 Build 8 — Authority Convergence and Restart Safety** remains retained provenance for the current-vs-compatibility authority model. Its locked predecessor was Release 467 Build 7 at `5eef764a67466dc2989a4681c6a7cc782b9d4df9`, with System Gate `33591744817` and Build 7 Proof `33591744787`. Real external acceptance remained `HOLD_EXTERNAL`; these facts remain historical proof and do not override current Build 11 authority or Production boundaries.

## Build 11 scope

Build 11 moves the main `/admin/` landing page from a navigation-only screen into a practical daily operating surface.

It adds:

- a desktop **Today Operations Command Center** above the four workspace cards;
- the existing owned Today Tasks read contract rather than a duplicate task engine;
- category and minimum-count filters for catalog, customers, orders, inventory, accounting and runtime health;
- direct links to the exact work surface plus the owning Storefront, Creator, Finance or I.T. workspace;
- explicit Done, Ignore and Snooze controls through the already-audited `/api/admin/today-task-actions` authority;
- visible success/failure feedback after an administrator action;
- current Release 467 Build 11 operator labeling on the admin landing page;
- explicit wording that the four admin workspaces are backed by five permission modules, with Socials/CAIP independently permissioned even though its operator navigation is grouped with Creator.

Build 11 does **not** create another task table, change task mutation ownership, run background task actions, or introduce request-time schema work.

## Retained Today Tasks authority

The Build 366/369 Today Tasks read service remains the read owner. The Build 393 action endpoint remains the explicit write owner for `completed`, `ignored` and `snoozed` actions. Build 11 only exposes these retained capabilities on the desktop admin landing page.

This distinction matters: rendering a task and allowing an administrator to click Done/Ignore/Snooze is not an automatic repair or background mutation. No task action fires merely because `/admin/` loads.

## Current operator model

- `/admin/` — daily cross-business operating first stop.
- `/admin/today-tasks/` — full Today Tasks workspace.
- `/admin/storefront/` — customer-facing merchandising, SEO, public media and customer programs.
- `/admin/creator/` — catalog, inventory, packaging, projects, CAIP/content and creator operations.
- `/admin/finance/` — orders, payments, accounting and business-health work.
- `/admin/it/` — technical readiness, release/deployment, integrations and recovery first stop from Build 10.

The permission model remains five modules: Storefront, Creators, Socials, Financials and I.T. platform.

## External acceptance remains separate

- Cloudflare Access service-token lane — `HOLD_EXTERNAL` until deliberate Build 6 evidence succeeds.
- Stripe Development — `HOLD_EXTERNAL` until deliberate test evidence succeeds.
- PayPal sandbox — `HOLD_EXTERNAL` until deliberate sandbox evidence succeeds.
- Social/OAuth — `HOLD_EXTERNAL` until deliberate intended-account lifecycle evidence succeeds with publication closed.
- CAIP private media — use fresh Build 7 runtime evidence.

Build 11 does not execute any of these external lanes merely because a daily task points toward related work.

## Development boundary

- Source branch: `dev`.
- Canonical Development target: `https://dev.devilndove-site.pages.dev`.
- D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- Product R2: `devilndove-toolshed-images-dev`.
- CAIP private R2: `devilndove-caip-media-dev`.
- Canonical migrations: exactly `0001`–`0004`; Build 11 adds none.
- New D1 mutation authority from Build 11: NONE.
- Retained explicit Today Task administrator actions: unchanged.

## Main / Production boundary

The carried-forward source-head observation for `main` is `fcf92f5342c04f0f0d07387034e852b4cc40f3f9`. The exact deployed Production release must still be verified independently before any future promotion decision.

Build 11 does not update `main`, contact Production resources, mutate Production D1/R2/business data, execute Production providers, change Cloudflare Access policy, or authorize deployment. Production promotion remains governed separately by `release467-build5-production-promotion-readiness.json` for one exact reviewed Development candidate.

## Next bounded work

First prove Build 11, keep all current Release 467/System gates green, merge to `dev`, then prove and deploy the exact merged Development SHA.

After Build 11 closure, use the new desktop daily queue and the Build 10 I.T. Control Tower together to choose the next real Storefront, Creator or Finance workflow improvement. External `HOLD_EXTERNAL` lanes remain deliberate acceptance work, not a reason to manufacture green status.

## Permanent boundaries

Development first. Production transactional/business data remain Production-owned. Historical migrations are not replayed on restart. Request-time DDL, raw R2 deletion, automatic business-data restore, automatic schema reversal, unbounded provider execution/publication, main-only application patches, secret-value exposure and automatic Production promotion remain closed.