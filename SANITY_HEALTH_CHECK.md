# Devil n Dove — Sanity / Health Check

## Current authority

**Release 467 Build 11 — Admin Operations Command Center** is the active Development source candidate.

The exact green predecessor is **Release 467 Build 10 — I.T. Control Tower Consolidation and Self-Diagnostics** at `cba1fbe1c0acc71c9f2f0d29bdb6d5bef09e380a` with tree `c2de52782f96fa43d1e5d2eabd80b30a23c62ecd`.

- [x] Build 10 System Gate `33635318725` — SUCCESS.
- [x] Build 10 Proof `33635318747` — SUCCESS.
- [x] `current-development-authority.json` identifies Build 11 and preserves Build 10 as last-green.
- [x] `development-release.json` remains **INHERITED_REGRESSION_COMPATIBILITY**.
- [x] Middleware Release 466 header remains explicitly **INHERITED_RUNTIME_COMPATIBILITY**, not current Release 467 authority.

## Locked Build 8 provenance sanity

**Release 467 Build 8 — Authority Convergence and Restart Safety** remains the locked authority-convergence provenance. Its exact Build 7 predecessor was `5eef764a67466dc2989a4681c6a7cc782b9d4df9`; System Gate `33591744817` and Build 7 Proof `33591744787` were SUCCESS. External acceptance remained `HOLD_EXTERNAL`. These facts are retained for regression proof without overriding current Build 11 authority.

## Build 11 Admin Operations Command Center

- [x] `/admin/` exposes a `desktopTodayTasksMount` above the workspace cards.
- [x] The desktop panel reads from `/api/admin/contracts/operations-today-tasks-read`.
- [x] The full `/admin/today-tasks/` workspace remains available and unchanged as the dedicated queue.
- [x] Catalog, customers, orders, inventory, accounting and runtime-health groups map visibly to Creator, Storefront, Finance or I.T. operator workspaces.
- [x] Category and minimum-count filters are available on desktop.
- [x] Direct work links remain the task authority's own links.
- [x] Done, Ignore and Snooze use the retained `/api/admin/today-task-actions` endpoint.
- [x] Every action requires an explicit administrator click.
- [x] Build 11 adds visible success/failure feedback after an action.
- [x] Loading `/admin/` performs no Today Task mutation automatically.
- [x] The admin landing page retains exactly one H1.
- [x] The page explains that four operator workspaces are backed by five permission modules and Socials/CAIP remains independently permissioned.

## Retained task authority sanity

- [x] Today Tasks read ownership remains Build 366/369 and is not rewritten by Build 11.
- [x] Today Task write ownership remains Build 393.
- [x] Allowed retained write actions remain `completed`, `ignored` and `snoozed`.
- [x] `today_task_actions` schema authority remains `database_today_task_actions_runtime_parity.sql`.
- [x] Build 11 does not edit the retained action endpoint.
- [x] Build 11 does not edit the owned Today Tasks read contract.
- [x] No request-time `CREATE TABLE`, `ALTER TABLE` or `DROP TABLE` is introduced.

## Environment boundary

- [x] Source authority remains `dev`.
- [x] Development Preview remains `https://dev.devilndove-site.pages.dev`.
- [x] Development D1 remains `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- [x] Development Product R2 remains `devilndove-toolshed-images-dev`.
- [x] Development CAIP R2 remains `devilndove-caip-media-dev`.
- [x] Build 11 adds no new D1/R2 mutation authority.
- [x] Build 11 authorizes no Cloudflare Access policy mutation.
- [x] Build 11 authorizes no `main` mutation.
- [x] Build 11 authorizes no Production mutation/contact.

## D1 / schema sanity

- [x] Canonical migration stream remains exactly `0001`–`0004`.
- [x] Build 11 adds no migration.
- [x] Request-time schema DDL remains forbidden.
- [x] A new chat/workstation/deployment is not a migration event.
- [x] Explicit Today Task Done/Ignore/Snooze writes remain existing business-operation records, not a new migration or schema authority.

## External acceptance sanity

Build 11 source/runtime state and external acceptance remain intentionally independent.

- [ ] Cloudflare Access service-token acceptance — `HOLD_EXTERNAL` until deliberate Build 6 evidence succeeds.
- [ ] Stripe Development acceptance — `HOLD_EXTERNAL` until deliberate test-mode evidence succeeds.
- [ ] PayPal sandbox acceptance — `HOLD_EXTERNAL` until deliberate sandbox evidence succeeds.
- [ ] Social/OAuth controlled acceptance — `HOLD_EXTERNAL` until deliberate intended-account evidence succeeds.
- [ ] CAIP private-media current state — use fresh Build 7 runtime evidence.

- [x] Provider execution from Build 11: NONE.
- [x] Provider publication from Build 11: NONE.
- [x] Payment/refund execution from Build 11: NONE.
- [x] OAuth connect/revoke from Build 11: NONE.
- [x] Secret values inspected/emitted by Build 11: NONE.

## CI / prior authority sanity

- [x] Release 466 Build 1–6 proof workflows remain manual-only provenance under Build 9.
- [x] Build 8 remains forward-compatible while retaining locked Build 7 predecessor evidence.
- [x] Build 9 remains forward-compatible while retaining historical-CI retirement provenance.
- [x] Build 10 gate is forward-compatible with Build 11 while still proving the Build 10 I.T. runtime contract.
- [x] Release 467 Build 6, Build 7, Build 8, Build 9 and Build 10 authorities remain separate and retained.
- [x] Production Promotion Readiness remains the separate Build 5 authority.

## Main / Production sanity

The carried-forward source-head observation for `main` is `fcf92f5342c04f0f0d07387034e852b4cc40f3f9`; this is not proof of the currently deployed Production release.

- [x] Build 11 does not update `main`.
- [x] Build 11 does not contact Production resources.
- [x] Build 11 does not copy Development business data to Production.
- [x] Production promotion remains a separate exact-candidate review under Release 467 Build 5 Production Promotion Readiness.

## Current verdict

Release 467 Build 10 is the exact proven Development predecessor. Release 467 Build 11 is a bounded, schema-neutral admin application candidate that brings the existing daily Operations queue onto the desktop admin home without duplicating read ownership, moving task mutation authority, or opening any external/Production lane. External lanes remain truthfully `HOLD_EXTERNAL`.