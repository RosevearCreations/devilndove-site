# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 11 — Admin Operations Command Center** is the active Development source candidate.

Start every new chat/workstation/restart by reading `current-development-authority.json`, then this file. `development-release.json` remains compatibility evidence and is not the current Release 467 selector.

The exact Development-green predecessor is **Release 467 Build 10 — I.T. Control Tower Consolidation and Self-Diagnostics**:

- merged `dev` commit: `cba1fbe1c0acc71c9f2f0d29bdb6d5bef09e380a`
- tree: `c2de52782f96fa43d1e5d2eabd80b30a23c62ecd`
- System Gate `33635318725` — SUCCESS
- Release 467 Build 10 I.T. Control Tower Proof `33635318747` — SUCCESS

Build 11 makes `/admin/` the daily operating first stop. It mounts the already-owned Today Tasks read contract on the desktop dashboard and exposes the retained explicit Done/Ignore/Snooze action authority without creating a second task engine or background mutation path.

## Build 11 technical authority

- current pointer: `current-development-authority.json`
- Build 11 manifest: `release467-build11-admin-operations-command-center.json`
- source gate: `scripts/release467_build11_gate.py`
- source proof: `.github/workflows/release467-build11-proof.yml`
- operator workspace: `/admin/`
- full queue: `/admin/today-tasks/`
- retained read contract: `/api/admin/contracts/operations-today-tasks-read`
- retained action authority: `/api/admin/today-task-actions`
- operations authority: `docs/operations/RELEASE_467_BUILD_11_ADMIN_OPERATIONS_COMMAND_CENTER.md`
- source base: exact merged Build 10 `cba1fbe1c0acc71c9f2f0d29bdb6d5bef09e380a`

The desktop Command Center adds module ownership, category/minimum-count filtering, exact-work links, runtime incident detail visibility and explicit administrator Done/Ignore/Snooze controls. Loading the page does not perform task actions.

## Historical authority compatibility boundary

`development-release.json` deliberately remains **INHERITED_REGRESSION_COMPATIBILITY** for still-valid Release 466 historical assertions. The application middleware runtime release header remains `466` as explicit **INHERITED_RUNTIME_COMPATIBILITY** until that separate compatibility contract is deliberately migrated. Neither compatibility surface overrides `current-development-authority.json` or the Release 467 Build 11 operator authority.

Release 467 Build 8 — Authority Convergence and Restart Safety established this current-vs-compatibility separation. Release 467 Build 9 then retired obsolete Release 466 automatic CI fanout while retaining historical proof source and evidence.

## Release 467 authority separation

### Builds 1–4

Builds 1–4 established the I.T. readiness control tower, recovery/readiness actions, authenticated browser runtime acceptance, and sanitized evidence/acceptance ledger. Build 10 consolidated their read-only findings without removing those bounded authorities.

### Build 5 — CI / Cloudflare Access readiness

Build 5 — CI / Cloudflare Access readiness remains separate from browser acceptance and application-admin authentication. Canonical masked GitHub Actions references are `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET`; secret values must never appear in UI, logs, artifacts or committed evidence.

**Production Promotion Readiness** remains the separate Build 5 HOLD/READY review authority. It does not deploy Production automatically.

### Release 467 Build 6 — Development Cloudflare Access acceptance harness

Release 467 Build 6 remains the dispatch-only Development Cloudflare Access service-token acceptance authority. Real Access acceptance remains `HOLD_EXTERNAL` until deliberately proven.

### Release 467 Build 7 — External Commercial Acceptance Bridge

Release 467 Build 7 — **External Commercial Acceptance Bridge** — remains the operator visibility bridge for CAIP private media, Stripe Development, PayPal sandbox and Social/OAuth acceptance. Build 7 performs no provider action automatically.

### Release 467 Build 8 — Authority Convergence and Restart Safety

Release 467 Build 8 established `current-development-authority.json` as the restart pointer and fenced inherited compatibility evidence away from current Release 467 authority.

### Release 467 Build 9 — Historical CI Retirement & Gate Fanout Reduction

Build 9 made Release 466 Build 1–6 workflow files manual-only so current Release 467 work no longer produces false-red legacy fanout. Proof scripts/history remain available.

### Release 467 Build 10 — I.T. Control Tower Consolidation and Self-Diagnostics

Build 10 added the current I.T. operations wrapper and UI summary. It surfaces release/deployment authority, runtime ancestry, root-admin/profile/module metrics, D1 migration/FK metrics, explicit external policy HOLDs and a severity-sorted recovery queue. `/admin/it/` remains the technical first stop.

### Release 467 Build 11 — Admin Operations Command Center

Build 11 adds the daily cross-business first stop to `/admin/`. The four operator workspaces remain Storefront, Creator, Finance and I.T.; the underlying permission model remains five modules because Socials/CAIP retains independent module authority while its operator navigation is grouped with Creator.

Today Tasks ownership does not move. Reads stay on the Build 366/369 owned read contract. `POST /api/admin/today-task-actions` remains the Build 393 explicit administrator mutation authority for `completed`, `ignored` and `snoozed`. Build 11 only surfaces that retained authority on desktop and adds visible action feedback.

## Exact environment boundary

- source authority: `dev`
- Development target: `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Product R2: `devilndove-toolshed-images-dev`
- CAIP private R2: `devilndove-caip-media-dev`
- canonical migrations: exactly `0001`–`0004`
- Build 11 schema change: NONE
- Build 11 new D1/R2 mutation authority: NONE
- retained explicit Today Task administrator action authority: unchanged

A chat, workstation, deployment or source commit is not a migration event. Historical migrations are never replayed merely because work resumed.

## External/provider acceptance remains bounded

External lanes remain truthfully **`HOLD_EXTERNAL`** unless separately and deliberately proven:

- Cloudflare Access service-token acceptance — Build 6 authority;
- Stripe Development/test acceptance — operator/provider controlled;
- PayPal sandbox acceptance — operator/provider controlled;
- Social/OAuth controlled acceptance — operator/provider controlled, publication closed;
- native GitHub rulesets — separate repository-setting authority;
- CAIP private media — use fresh Build 7 runtime evidence.

Build 11 may display Today task links that lead toward operational work, but it performs no Stripe, PayPal, OAuth or Cloudflare Access execution merely because the dashboard loads.

## Main / Production boundary

The last source-head verification carried forward for `main` is `fcf92f5342c04f0f0d07387034e852b4cc40f3f9`; this is a source-head observation only, not proof of the deployed Production release.

Build 11 does not update `main`, contact Production resources, mutate Production D1/R2/business data, execute provider/payment/OAuth actions, change Cloudflare Access policy, expose secrets or authorize Production promotion.

## Permanent safety rules

- Development first; Production promotion requires a separately reviewed exact-green Development candidate.
- Production transactional/business data remain Production-owned.
- Request-time schema DDL remains forbidden.
- Canonical migrations remain forward-only and Development-first.
- Raw CAIP R2 deletion remains closed.
- Provider execution/publication remains closed outside deliberate acceptance.
- Secret values never belong in UI, logs, artifacts or handoff documents.
- Build 5 remains Production Promotion Readiness authority.
- Build 6 remains outer Access service-token authority.
- Build 7 remains external-commercial visibility authority.
- Build 9 remains historical-CI retirement authority.
- Build 10 I.T. recovery guidance remains read-only.
- Build 11 Today Task writes require an explicit administrator action and do not move the existing mutation authority.

## Next bounded work

Prove Build 11 with its dedicated source proof and all current Release 467/System gates, merge only when green, then re-prove and deploy the exact merged `dev` SHA to the canonical Development Preview.

After Build 11 closure, use `/admin/` for daily business work and `/admin/it/` for technical readiness. Select the next **non-provider** Storefront, Creator or Finance improvement unless we deliberately authorize an external `HOLD_EXTERNAL` acceptance lane.

## Canonical reading order

1. `current-development-authority.json`
2. `AI_HANDOFF.md`
3. `release467-build11-admin-operations-command-center.json`
4. `PROJECT_STATUS_AND_ROADMAP.md`
5. `SANITY_HEALTH_CHECK.md`
6. `docs/operations/RELEASE_467_BUILD_11_ADMIN_OPERATIONS_COMMAND_CENTER.md`
7. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`
8. `release467-build10-it-control-tower-consolidation.json`
9. `docs/operations/RELEASE_467_BUILD_10_IT_CONTROL_TOWER.md`
10. `release467-build9-historical-ci-retirement.json`
11. `release467-build8-authority-convergence.json`
12. `release467-build7-external-commercial-acceptance.json`
13. `release467-build6-access-acceptance-harness.json`
14. `release467-build5-production-promotion-readiness.json`
15. `release467-build5-ci-access-readiness.json`
16. `development-release.json` — compatibility evidence only

## Historical authority

Release 466 and earlier release/build files remain provenance and compatibility evidence. Their manual-only workflow definitions and compatibility metadata cannot override current Release 467 Build 11 authority.