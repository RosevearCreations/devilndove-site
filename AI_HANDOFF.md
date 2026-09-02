# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 7 — External Commercial Acceptance Bridge** is the active Development source candidate.

Release 467 Builds 1–6 are merged on `dev`. Build 7 bridges the existing sanitized external-commercial runtime evidence into current Release 467 I.T. authority so Stripe Development, PayPal sandbox, CAIP private-media and Social/OAuth acceptance no longer depend on stale release labels or historical Production metadata in the operator view.

Build 7 does **not** execute a provider, mutate D1/R2, change Cloudflare Access, change `main`, contact Production, or declare external acceptance by configuration alone.

Build 7 technical source authority:

- manifest: `release467-build7-external-commercial-acceptance.json`
- current API: `functions/api/admin/release467-external-commercial-acceptance.js`
- I.T. panel: `public/js/admin-it-external-commercial-acceptance.js`
- source gate: `scripts/release467_build7_gate.py`
- source-proof workflow: `.github/workflows/release467-build7-proof.yml`
- canonical I.T. workspace: `/admin/it/`
- existing deliberate payment acceptance runner: `/admin/release-control/external-commercial-readiness/#provider-acceptance-runner`

The Build 7 source can be GREEN while real external commercial acceptance remains **`HOLD_EXTERNAL`**. Existing runtime evidence is reused read-only; historical Production-release/SHA wording is explicitly not accepted as current authority.

## Exact source boundary

### Development

- source branch: `dev`
- Build 7 feature branch: `release467-build7-external-commercial-acceptance`
- Build 7 source base: `493454d50c4a6f3f1ed8eb74e189bc576879a040`
- canonical Development Access target: `https://dev.devilndove-site.pages.dev`
- D1: `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- Product R2: `devilndove-toolshed-images-dev`
- CAIP R2: `devilndove-caip-media-dev`

The Build 7 bridge reports the runtime source SHA when exposed by the Development environment and keeps exact-SHA Production promotion authority separate from commercial/provider acceptance.

### Main / Production boundary

- current `main` source head at Build 7 start: `fcf92f5342c04f0f0d07387034e852b4cc40f3f9`
- Build 7 does **not** update `main`.
- Build 7 does **not** authorize a Production deployment.
- Build 7 does **not** contact Production resources.
- Build 7 does **not** mutate Production D1/R2, business data, provider state, OAuth state or Cloudflare Access configuration.
- Before any future Production promotion, re-verify the exact deployed Production release independently; do not infer deployment state merely from the `main` branch head.

## Release 467 status

### Build 1 — I.T. readiness control tower

Development source authority is merged. Root-admin readiness, module authority, platform/provider findings and correction mechanics are surfaced through the I.T. workspace.

The canonical GitHub Actions secret names for the Cloudflare Access automation lane remain:

- `CF_ACCESS_CLIENT_ID`
- `CF_ACCESS_CLIENT_SECRET`

Only the names are repository/UI authority. Secret values must never be displayed, logged, serialized or downloaded.

### Build 2 — readiness actions and recovery queue

Development source authority is merged. Non-GREEN findings are converted into prioritized read-only recovery/runbook actions.

### Build 3 — browser runtime acceptance

Development source authority is merged. Same-origin authenticated browser acceptance proves the root-admin runtime surfaces only.

**Browser runtime PASS is not CI / Cloudflare Access PASS.**

### Build 4 — evidence and acceptance ledger

Development source authority is merged. Build 4 consolidates source gates, exact-SHA/runtime evidence, browser acceptance and outstanding external HOLDs into a sanitized evidence ledger.

Build 4 explicitly forbids inferring CI/service-token readiness from browser success.

### Build 5 — CI / Cloudflare Access readiness

Build 5 source authority is merged and GREEN. It defines the separate automation-authentication lane and preserves the external state as **`HOLD_EXTERNAL`** until independent Development-only service-token evidence succeeds.

### Build 5 — Production Promotion Readiness

Build 5 also provides the separate read-only **Production Promotion Readiness** review. It can report only `HOLD` or `READY_FOR_MANUAL_PROMOTION` for one exact Development candidate SHA. It never advances `main`, contacts Production resources, or converts unresolved external acceptance into PASS.

The CI / Access lane and Production Promotion Readiness lane remain distinct authorities.

### Release 467 Build 6 — Development Access acceptance harness

Build 6 source implementation is merged and Development-proven. Its acceptance workflow remains **`workflow_dispatch` only** and targets only the canonical Development preview.

The Build 6 deliberate probe sends the Cloudflare Access service-token headers but no Devil n Dove application cookie and no application bearer token. A `401 Unauthorized.` application response is the PASS contract because it proves the request crossed outer Access without becoming an application-admin session.

Current outer Access service-token state remains **`HOLD_EXTERNAL`** until the dispatch-only workflow succeeds with the real Development-only service token. Build 7 does not alter or infer that lane.

### Build 7 — External Commercial Acceptance Bridge

Build 7 creates the current Release 467 operator authority for these four external/commercial lanes:

1. CAIP private-media authenticated browser/range evidence.
2. Stripe Development acceptance.
3. PayPal sandbox acceptance.
4. Social/OAuth controlled acceptance.

The Build 7 API wraps the existing sanitized runtime readiness authority read-only. It does not rewrite the historical authority. Historical Production release/SHA fields and historical live-SEO wording are explicitly rejected as current authority.

The I.T. panel surfaces exact correction mechanics:

- Stripe Development → open the existing commercial acceptance runner and complete test payment, verified webhook, reconciliation, duplicate replay and provider-synchronized refund evidence.
- PayPal sandbox → open the existing commercial acceptance runner and complete approval/capture, verified webhook, reconciliation, duplicate replay and provider-synchronized refund evidence.
- CAIP → open Runtime Acceptance and create fresh authenticated Development range-stream evidence through the private review proxy.
- Social/OAuth → open I.T. Integrations and complete controlled intended-account/lifecycle evidence while publication remains disabled.
- Native repository rulesets → review through GitHub repository Settings → Rules → Rulesets; source state alone is not acceptance.

Build 7 performs none of those provider actions automatically.

## External/provider acceptance still bounded

The following remain deliberate external acceptance lanes and must not be faked or inferred:

- Cloudflare Access CI service-token acceptance — `HOLD_EXTERNAL` until Build 6 dispatch evidence succeeds
- Stripe Development/test acceptance — external/operator controlled
- PayPal sandbox acceptance — external/operator controlled
- CAIP private-media authenticated range acceptance — runtime/operator controlled
- Social/OAuth controlled acceptance — external/operator controlled; publication remains closed
- Native repository/ruleset changes — external when write authority is unavailable

No real Stripe, PayPal or OAuth execution is authorized merely because Build 7 displays the correction mechanics.

## Permanent safety rules

- Development first; Production promotion requires a separately reviewed exact-green Development tree.
- Main-only application patches are forbidden.
- Production transactional/business data are never overwritten from Development.
- Request-time schema DDL remains forbidden.
- Build 7 is schema-neutral.
- Build 7 D1/R2 mutation is closed.
- Build 7 provider execution/publication is closed.
- Build 7 Cloudflare Access policy/token mutation is closed.
- Secret values must never appear in the I.T. UI, logs, evidence downloads or committed artifacts.
- Browser acceptance, CI Access acceptance, commercial/provider acceptance and application-admin authentication are distinct authorities.
- Build 5 Production Promotion Readiness remains the promotion HOLD/READY authority.
- Build 6 remains the separate outer Cloudflare Access service-token authority.
- Provider/payment execution remains closed except separately authorized bounded Development test/sandbox acceptance.
- Provider/social publication remains closed.
- Raw CAIP R2 deletion remains closed.

## Next bounded work

First prove Build 7 on its exact feature branch, merge only after the Build 7 proof and canonical System Gate are GREEN, then re-prove the exact merged `dev` SHA.

After Build 7 is Development-green, use the I.T. panel to select the highest-priority external lane that can be deliberately accepted with available operator credentials/session. Do not automatically execute Stripe, PayPal, OAuth or Cloudflare Access merely to make the dashboard green.

If credentials/operator authorization are unavailable, leave the lane at **`HOLD_EXTERNAL`** and move to the next bounded release-mechanics improvement that does not fake external evidence.

## Canonical reading order

1. `AI_HANDOFF.md`
2. `release467-build7-external-commercial-acceptance.json`
3. `release467-build6-access-acceptance-harness.json`
4. `release467-build5-ci-access-readiness.json`
5. `release467-build5-production-promotion-readiness.json`
6. `release467-build4-evidence-acceptance-ledger.json`
7. `release467-build3-browser-runtime-acceptance.json`
8. `release467-build2-it-readiness-actions.json`
9. `release467-build1-it-readiness-control-tower.json`
10. `development-release.json`
11. `PROJECT_STATUS_AND_ROADMAP.md`
12. `SANITY_HEALTH_CHECK.md`

## Historical authority

Release 466 and earlier release files remain historical evidence only. They must not be used as the current Development restart point unless a current Release 467 gate specifically delegates to them.

For inherited Release 466 source-gate compatibility, these historical carried-forward assertions remain literal:

- Builds 1–3 are Development green
- Build 4 implementation is **technical green / external acceptance HOLD**
- Stripe Development acceptance — EXTERNAL ACCEPTANCE PENDING
- PayPal sandbox acceptance — EXTERNAL ACCEPTANCE PENDING
- Build 2 closure

The Release 466 Build 2 measured live sitemap/noindex conflicts remain historical evidence at these exact paths: `/cart/`, `/checkout/`, `/checkout/confirmation/`, `/supplies/health/`, `/tools/health/`, `/toolshed/duplicates/`.

Those historical statements do not override the Release 467 Build 7 current authority above.
