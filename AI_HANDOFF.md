# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 5 — CI / Cloudflare Access service-token readiness** is the active Development convergence.

Release 467 Builds 1–4 are already merged on `dev`. Build 5 adds a dedicated, read-only CI / Access readiness lane so authenticated browser success can never be mistaken for automated Cloudflare Access acceptance.

Build 5 technical source authority:

- manifest: `release467-build5-ci-access-readiness.json`
- I.T. panel: `public/js/admin-it-ci-access-readiness.js`
- source gate: `scripts/release467_build5_gate.py`
- workflow: `.github/workflows/release467-build5-proof.yml`
- canonical I.T. workspace: `/admin/it/`

The external Cloudflare Access service-token lane remains **`HOLD_EXTERNAL`** until an independently observed Development-only CI run succeeds with sanitized evidence. Build 5 does not create Access tokens, GitHub secrets or application sessions.

## Exact source boundary

### Development

- source branch: `dev`
- Build 5 feature branch: `release467-build5-ci-access-readiness`
- Build 5 source base: `85b68116c8a467c480e4e3ef7fe32eee6968975c`
- Build 4 merge base tree: `3a867b8c83d9598b7afa7f388a7a9f76f13878a5`
- D1: `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- Product R2: `devilndove-toolshed-images-dev`
- CAIP R2: `devilndove-caip-media-dev`

### Main / Production boundary

- `main` source head observed before Build 5: `fcf92f5342c04f0f0d07387034e852b4cc40f3f9`
- Build 5 does **not** update `main`.
- Build 5 does **not** authorize a Production deployment.
- Build 5 does **not** mutate Production D1/R2, business data, provider state, OAuth state or Cloudflare Access configuration.
- Before any future Production promotion, re-verify the exact deployed Production release independently; do not infer deployment state merely from the `main` branch head.

## Release 467 status

### Build 1 — I.T. readiness control tower

Development source authority is merged. Root-admin readiness, module authority, platform/provider findings and correction mechanics are surfaced through the I.T. workspace.

The Cloudflare Access CI action established the canonical GitHub Actions secret names:

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

Build 5 makes the separate automation-authentication lane explicit.

Current external state: **`HOLD_EXTERNAL`**.

Closure requires all of the following:

1. Create or reuse a Cloudflare Access service token accepted by the **Development host only**.
2. Store its client ID in the GitHub Actions repository secret named `CF_ACCESS_CLIENT_ID`.
3. Store its client secret in the GitHub Actions repository secret named `CF_ACCESS_CLIENT_SECRET`.
4. Exercise a bounded Development-only CI check that uses the token without echoing or persisting either value.
5. Capture only sanitized evidence: workflow name/run, status/conclusion, Development host, commit SHA and timestamp.
6. Keep application-admin authentication a separate proof. A Cloudflare Access service token is **not** an admin login/session.

Until that independent evidence exists, the state stays `HOLD_EXTERNAL` even when browser/root-admin acceptance is GREEN.

## External/provider acceptance still bounded

The following remain deliberate external acceptance lanes and must not be faked or inferred:

- Cloudflare Access CI service-token acceptance — `HOLD_EXTERNAL`
- Stripe Development/test acceptance — external/operator controlled
- PayPal sandbox acceptance — external/operator controlled
- Social/OAuth controlled acceptance — external/operator controlled; publication remains closed
- Native repository/ruleset changes — external when write authority is unavailable

No real Stripe, PayPal or OAuth execution is authorized merely because the I.T. readiness surfaces exist.

## Permanent safety rules

- Development first; Production promotion requires a separately reviewed exact-green Development tree.
- Main-only application patches are forbidden.
- Production transactional/business data are never overwritten from Development.
- Request-time schema DDL remains forbidden.
- Build 5 is schema-neutral.
- D1/R2 business-data mutation is outside Build 5.
- Cloudflare Access policy/token creation is outside Build 5.
- GitHub secret creation is outside the browser/admin application.
- Secret values must never appear in the I.T. UI, logs, evidence downloads or committed artifacts.
- Browser acceptance and CI Access acceptance are distinct authorities.
- A Cloudflare Access token does not prove application-admin authentication.
- Provider/payment execution remains closed except separately authorized bounded Development test/sandbox acceptance.
- Provider/social publication remains closed.
- Raw CAIP R2 deletion remains closed.

## Next bounded work

Do not reopen Release 467 Builds 1–4 unless a current gate proves drift.

For Build 5, first prove the source gate and merge the exact green feature branch into `dev`. The remaining external CI / Access acceptance stays `HOLD_EXTERNAL` until the real Development-only service-token workflow evidence exists.

After Build 5 source convergence, the next work must come from the I.T. readiness/evidence ledger and should prioritize unresolved external acceptance or release-mechanics blockers before unrelated feature expansion.

## Canonical reading order

1. `AI_HANDOFF.md`
2. `release467-build5-ci-access-readiness.json`
3. `release467-build4-evidence-acceptance-ledger.json`
4. `release467-build3-browser-runtime-acceptance.json`
5. `release467-build2-it-readiness-actions.json`
6. `release467-build1-it-readiness-control-tower.json`
7. `development-release.json`
8. `PROJECT_STATUS_AND_ROADMAP.md`
9. `SANITY_HEALTH_CHECK.md`

## Historical authority

Release 466 and earlier release files remain historical evidence only. They must not be used as the current Development restart point unless a current Release 467 gate specifically delegates to them.

For inherited Release 466 Build 3 gate compatibility, these historical carried-forward assertions remain literal:

- Builds 1–3 are Development green
- Build 4 implementation is **technical green / external acceptance HOLD**

Those two statements describe the historical Release 466 authority only; they do not override the Release 467 Build 5 current authority above.
