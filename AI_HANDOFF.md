# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 6 — Development Cloudflare Access service-token acceptance harness** is the active Development convergence.

Release 467 Builds 1–5 are merged on `dev`. Build 6 adds the bounded external-acceptance harness required to close the separate Cloudflare Access automation lane without creating, reusing or implying an application-admin session.

Build 6 technical source authority:

- manifest: `release467-build6-access-acceptance-harness.json`
- acceptance probe: `scripts/release467_build6_access_acceptance.py`
- I.T. panel: `public/js/admin-it-access-acceptance-harness.js`
- source gate: `scripts/release467_build6_gate.py`
- source-proof workflow: `.github/workflows/release467-build6-proof.yml`
- external acceptance workflow: `.github/workflows/release467-build6-cloudflare-access-acceptance.yml`
- canonical I.T. workspace: `/admin/it/`

The Build 6 source harness can be GREEN while the real Cloudflare Access service-token lane remains **`HOLD_EXTERNAL`**. External closure requires a deliberate workflow dispatch against the exact reviewed `dev` SHA with the two canonical GitHub Actions secrets configured and a successful sanitized evidence artifact.

## Exact source boundary

### Development

- source branch: `dev`
- current Build 6 feature branch: `release467-build6-access-acceptance-current-dev`
- Build 6 source base: `70015d78ae516050feb168be4190447256032d8c`
- canonical Development Access target: `https://dev.devilndove-site.pages.dev`
- Build 6 probe path: `/api/auth/me`
- D1: `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- Product R2: `devilndove-toolshed-images-dev`
- CAIP R2: `devilndove-caip-media-dev`

### Main / Production boundary

- current `main` source head observed at Build 6 start: `fcf92f5342c04f0f0d07387034e852b4cc40f3f9`
- Build 6 does **not** update `main`.
- Build 6 does **not** authorize a Production deployment.
- Build 6 never targets Production from its Access acceptance workflow.
- Build 6 does **not** mutate Production D1/R2, business data, provider state, OAuth state or Cloudflare Access configuration.
- Before any future Production promotion, re-verify the exact deployed Production release independently; do not infer deployment state merely from the `main` branch head.

## Release 467 status

### Build 1 — I.T. readiness control tower

Development source authority is merged. Root-admin readiness, module authority, platform/provider findings and correction mechanics are surfaced through the I.T. workspace.

The canonical GitHub Actions secret names for the Cloudflare Access automation lane are:

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

Build 5 also adds a separate read-only **Production Promotion Readiness** review. It can report only `HOLD` or `READY_FOR_MANUAL_PROMOTION` for one exact Development candidate SHA. It never advances `main`, contacts Production resources, or converts unresolved external acceptance into PASS.

The CI / Access lane and Production Promotion Readiness lane are distinct authorities and both must remain intact through Build 6.

### Build 6 — Development Access acceptance harness

Build 6 implements the bounded workflow needed to satisfy the Build 5 Cloudflare Access closure condition without mixing authentication authorities.

The acceptance workflow is **`workflow_dispatch` only**. Normal pushes and pull requests do not contact Cloudflare through this workflow.

The deliberate probe:

1. checks out `dev` and requires the exact reviewed SHA supplied at dispatch;
2. targets only `https://dev.devilndove-site.pages.dev/api/auth/me`;
3. sends the Cloudflare Access client ID/secret only as runner-side Access headers;
4. sends **no** Devil n Dove application cookie;
5. sends **no** application `Authorization` bearer token;
6. requires the application itself to return `401 application/json` with `Unauthorized.`;
7. writes only sanitized evidence and uploads that evidence as a short-retention GitHub Actions artifact.

Why `401 Unauthorized.` is the correct PASS contract: it proves the request passed the outer Cloudflare Access layer and reached the Devil n Dove application, while also proving the Access token was **not** silently treated as an application-admin session.

Current external state remains **`HOLD_EXTERNAL`** until that exact workflow succeeds with the real Development-only service token.

## External/provider acceptance still bounded

The following remain deliberate external acceptance lanes and must not be faked or inferred:

- Cloudflare Access CI service-token acceptance — `HOLD_EXTERNAL` until Build 6 dispatch evidence succeeds
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
- Build 6 is schema-neutral.
- D1/R2 business-data mutation is outside Build 6.
- Cloudflare Access policy/token creation is outside Build 6.
- GitHub secret creation is outside Build 6.
- Secret values must never appear in the I.T. UI, logs, evidence downloads or committed artifacts.
- Browser acceptance and CI Access acceptance are distinct authorities.
- A Cloudflare Access token does not prove application-admin authentication.
- Build 5 Production Promotion Readiness remains a separate authority from Build 6 Access acceptance.
- The Build 6 acceptance workflow must remain Development-only and dispatch-only.
- Provider/payment execution remains closed except separately authorized bounded Development test/sandbox acceptance.
- Provider/social publication remains closed.
- Raw CAIP R2 deletion remains closed.

## Next bounded work

Do not reopen Release 467 Builds 1–5 unless a current gate proves drift.

For Build 6, first prove and merge the source harness through the exact-green feature branch. After merge, the remaining Cloudflare Access external acceptance is a deliberate operator/CI action: dispatch `.github/workflows/release467-build6-cloudflare-access-acceptance.yml` against the exact reviewed `dev` SHA only when both canonical Access secrets are configured.

A successful Build 6 external acceptance run may close only the **outer Cloudflare Access service-token lane**. It must not be used as application-admin, payment-provider, social-provider or Production acceptance evidence.

After that lane is proven or explicitly remains blocked, return to the Release 467 I.T. evidence/readiness ledger and select the highest-priority unresolved external/release-mechanics blocker before unrelated feature expansion.

## Canonical reading order

1. `AI_HANDOFF.md`
2. `release467-build6-access-acceptance-harness.json`
3. `release467-build5-ci-access-readiness.json`
4. `release467-build5-production-promotion-readiness.json`
5. `release467-build4-evidence-acceptance-ledger.json`
6. `release467-build3-browser-runtime-acceptance.json`
7. `release467-build2-it-readiness-actions.json`
8. `release467-build1-it-readiness-control-tower.json`
9. `development-release.json`
10. `PROJECT_STATUS_AND_ROADMAP.md`
11. `SANITY_HEALTH_CHECK.md`

## Historical authority

Release 466 and earlier release files remain historical evidence only. They must not be used as the current Development restart point unless a current Release 467 gate specifically delegates to them.

For inherited Release 466 source-gate compatibility, these historical carried-forward assertions remain literal:

- Builds 1–3 are Development green
- Build 4 implementation is **technical green / external acceptance HOLD**
- Stripe Development acceptance — EXTERNAL ACCEPTANCE PENDING
- PayPal sandbox acceptance — EXTERNAL ACCEPTANCE PENDING
- Build 2 closure

The Release 466 Build 2 measured live sitemap/noindex conflicts remain historical evidence at these exact paths: `/cart/`, `/checkout/`, `/checkout/confirmation/`, `/supplies/health/`, `/tools/health/`, `/toolshed/duplicates/`.

Those historical statements do not override the Release 467 Build 6 current authority above.
