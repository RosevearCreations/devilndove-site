# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 10 — I.T. Control Tower Consolidation and Self-Diagnostics** is the active Development source candidate.

Start every new chat/workstation/restart by reading `current-development-authority.json`, then this file. `development-release.json` remains compatibility evidence and is not the current Release 467 selector.

The exact Development-green predecessor is **Release 467 Build 9 — Historical CI Retirement & Gate Fanout Reduction**:

- merged `dev` commit: `d8a9ffba03f980b9632643d91d9aa69b25bd94fd`
- tree: `949f2523d31e0f47ed1e19ff7655de2762fbc1df`
- System Gate `33633043297` — SUCCESS
- Release 467 Build 9 Historical CI Retirement Proof `33633043229` — SUCCESS

Build 10 moves the I.T. workspace back into application improvement. `/admin/it/` becomes the consolidated read-only first stop for current release/deployment authority, D1/R2 readiness, administrator/module authority, external policy states, and one prioritized corrective queue.

## Build 10 technical authority

- current pointer: `current-development-authority.json`
- Build 10 manifest: `release467-build10-it-control-tower-consolidation.json`
- source gate: `scripts/release467_build10_gate.py`
- source proof: `.github/workflows/release467-build10-proof.yml`
- runtime endpoint: `/api/admin/it-operations-control-tower`
- operator workspace: `/admin/it/`
- operations authority: `docs/operations/RELEASE_467_BUILD_10_IT_CONTROL_TOWER.md`
- source base: exact merged Build 9 `d8a9ffba03f980b9632643d91d9aa69b25bd94fd`

The new endpoint wraps the existing read-only readiness engine rather than replacing its bounded subsystem checks. It generates a prioritized recovery queue but performs **no automatic repair**.

## Historical authority compatibility boundary

`development-release.json` deliberately remains **INHERITED_REGRESSION_COMPATIBILITY** for still-valid historical assertions. The application middleware runtime release header remains `466` as explicit **INHERITED_RUNTIME_COMPATIBILITY** until that separate compatibility contract is deliberately migrated. Neither compatibility surface overrides `current-development-authority.json` or the Release 467 Build 10 I.T. operator authority.

Release 467 Build 8 — Authority Convergence and Restart Safety established this current-vs-compatibility separation. Release 467 Build 9 then retired obsolete Release 466 automatic CI fanout while retaining historical proof source and evidence.

## Release 467 authority separation

### Builds 1–4

Builds 1–4 established the I.T. readiness control tower, recovery/readiness actions, authenticated browser runtime acceptance, and sanitized evidence/acceptance ledger. Build 10 consolidates their read-only findings without removing those bounded authorities.

### Build 5 — CI / Cloudflare Access readiness

Build 5 — CI / Cloudflare Access readiness remains separate from browser acceptance and application-admin authentication. Canonical masked GitHub Actions references are `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET`; secret values must never appear in UI, logs, artifacts or committed evidence.

**Production Promotion Readiness** remains the separate Build 5 HOLD/READY review authority. It does not deploy Production automatically.

### Release 467 Build 6 — Development Cloudflare Access acceptance harness

Release 467 Build 6 remains the dispatch-only Development Cloudflare Access service-token acceptance authority. Real Access acceptance remains `HOLD_EXTERNAL` until deliberately proven.

### Release 467 Build 7 — External Commercial Acceptance Bridge

Release 467 Build 7 — **External Commercial Acceptance Bridge** — remains the operator visibility bridge for CAIP private media, Stripe Development, PayPal sandbox and Social/OAuth acceptance. Build 7 performs no provider action automatically.

### Release 467 Build 8 — Authority Convergence and Restart Safety

Release 467 Build 8 established `current-development-authority.json` as the restart pointer and fenced inherited Release 466 compatibility evidence away from current Release 467 authority.

### Release 467 Build 9 — Historical CI Retirement & Gate Fanout Reduction

Build 9 made Release 466 Build 1–6 workflow files manual-only so current Release 467 work no longer produces false-red legacy fanout. Proof scripts/history remain available.

### Release 467 Build 10 — I.T. Control Tower Consolidation and Self-Diagnostics

Build 10 adds a current I.T. operations wrapper and UI summary. It surfaces exact last-green Build 9 evidence, runtime ancestry when available, root-admin/profile/module metrics, D1 migration/FK metrics, explicit external policy HOLDs and a severity-sorted recovery queue. It does not silently convert runtime binding presence into exact control-plane identity and does not auto-repair access or data.

## Exact environment boundary

- source authority: `dev`
- Development target: `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Product R2: `devilndove-toolshed-images-dev`
- CAIP private R2: `devilndove-caip-media-dev`
- canonical migrations: exactly `0001`–`0004`
- Build 10 schema/D1/R2 mutation: NONE

A chat, workstation, deployment or source commit is not a migration event. Historical migrations are never replayed merely because work resumed.

## External/provider acceptance remains bounded

External lanes remain truthfully **`HOLD_EXTERNAL`** unless separately and deliberately proven:

- Cloudflare Access service-token acceptance — Build 6 authority;
- Stripe Development/test acceptance — operator/provider controlled;
- PayPal sandbox acceptance — operator/provider controlled;
- Social/OAuth controlled acceptance — operator/provider controlled, publication closed;
- native GitHub rulesets — separate repository-setting authority;
- CAIP private media — use fresh Build 7 runtime evidence.

The Build 10 I.T. page displays those policy states but performs no Stripe, PayPal, OAuth or Cloudflare Access execution.

## Main / Production boundary

The last source-head verification carried forward for `main` is `fcf92f5342c04f0f0d07387034e852b4cc40f3f9`; this is a source-head observation only, not proof of the deployed Production release.

Build 10 does not update `main`, contact Production resources, mutate Production D1/R2/business data, execute provider/payment/OAuth actions, change Cloudflare Access policy, expose secrets or authorize Production promotion.

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
- Build 10 I.T. recovery guidance is read-only; repairs require the specific corrective workspace/authority.

## Next bounded work

Prove Build 10 with its dedicated source proof and current Release 467/System gates, merge only when green, then re-prove and deploy the exact merged `dev` SHA to the canonical Development Preview.

After Build 10 closure, use the consolidated I.T. view to choose the next **non-provider** application improvement unless we deliberately authorize an external `HOLD_EXTERNAL` acceptance lane.

## Canonical reading order

1. `current-development-authority.json`
2. `AI_HANDOFF.md`
3. `release467-build10-it-control-tower-consolidation.json`
4. `PROJECT_STATUS_AND_ROADMAP.md`
5. `SANITY_HEALTH_CHECK.md`
6. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`
7. `docs/operations/RELEASE_467_BUILD_10_IT_CONTROL_TOWER.md`
8. `release467-build9-historical-ci-retirement.json`
9. `release467-build8-authority-convergence.json`
10. `release467-build7-external-commercial-acceptance.json`
11. `release467-build6-access-acceptance-harness.json`
12. `release467-build5-production-promotion-readiness.json`
13. `release467-build5-ci-access-readiness.json`
14. `development-release.json` — compatibility evidence only

## Historical authority

Release 466 and earlier release/build files remain provenance and compatibility evidence. Their Build 1–6 workflow definitions remain manual-only under Build 9 and cannot override current Release 467 Build 10 authority.
