# Build 442 — I.T. & Platform Enforcement Release Gate

Updated: 2026-08-27

Build 442 is the active Devil n Dove Development release. It carries unresolved Build 441 work forward as explicit Build 442 **HOLDs** rather than reopening an old release.

## Previous accepted checkpoint

Build 441 closed its Development convergence checkpoint at exact source SHA:

`96e3256b608190a8780829ea9e6409670a898fb4`

Evidence on that SHA:
- Build 441 source convergence gate: **GREEN**
- Windows D1 transport gate: **GREEN**
- Cloudflare Pages `devilndove-site-dev` exact-SHA deployment: **GREEN**
- Cloudflare deployment id: `594c671f-3893-4a06-9eac-becf4e6a1a3e`
- Product / Inventory / Tool and responsive 35/35 regressions: **GREEN provenance**

## Environment boundary

- Source: `dev`
- Development runtime/project: `devilndove-site-dev`
- Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Separate live Production: `main` / `devilndove-site`
- Production promotion: **CLOSED**

## Build 442 two-phase rollout

### Phase A — current

Build 442 Phase A is deliberately additive and migration-first:
- register the planned `it-platform` module in an additive D1 migration;
- add `app_module_user_access` as explicit per-user I.T. read/manage authority;
- keep `member` and `admin` role-derived I.T. access denied;
- seed explicit `manage` grants only for active administrators present during the first bootstrap and only while no I.T. user grants exist;
- provide a guarded Development-only apply/verifier that reuses the proven Windows-safe D1 query transport;
- locally prove idempotency, grant consistency and that a future admin is not auto-granted on migration replay;
- retain all Build 441 Product/Inventory/Tool/source/hygiene regressions.

**Runtime enforcement remains intentionally off during Phase A until the Development D1 migration is applied and verified.** This prevents a code-before-schema deployment from locking administrators out of I.T. routes.

### Phase B — only after D1 proof

After the exact Development migration/verifier is GREEN:
- add `it-platform` to runtime module registry and route ownership;
- require authenticated user + enabled I.T. module + explicit user grant;
- enforce `read` versus `manage` in middleware/APIs;
- add audited grant management to Application Core;
- block removal/downgrade of the last active I.T. manager;
- expose four-module health and authenticated isolation acceptance;
- keep repair/background actions out until read-only authority is proven.

## Build 442 HOLD register

| ID | Hold | Evidence already complete | Exact remaining proof | Promotion impact |
| --- | --- | --- | --- | --- |
| IT-442-H1 | Development D1 fourth-module/user-grant authority not yet applied | Additive migration, verification SQL, guarded runner and local regression packaged in Phase A | Run guarded migration against `devilndove-dev`; verifier must prove exact module row, denied role rows, >=1 active explicit I.T. manager and clean FKs | **HOLD — blocks Phase B activation; does not block safe Phase A deployment** |
| IT-442-H2 | Runtime I.T. per-user enforcement not yet active | Build 438 three-module middleware remains proven and unchanged during Phase A | Phase B registry/routes/middleware/API/UI implementation + source and authenticated isolation acceptance | **HOLD — implementation boundary, not a false PASS** |
| PAY-442-H1 | Stripe Development checkout evidence incomplete | Provider-return/webhook/idempotency implementation and Build 409 mutation gate remain source provenance | Development test keys + endpoint-specific webhook secret; safe readiness check; owner-controlled simulated checkout; return and signed webhook reconciliation; duplicate-event no-side-effect proof | **HOLD — carried as Build 442 payment evidence, never as an obsolete Build 409 requirement** |
| PAY-442-H2 | PayPal Development checkout evidence incomplete | Sandbox-capable approval/capture return and webhook/idempotency implementation remain source provenance | `PAYPAL_ENV=sandbox`; sandbox credentials/webhook ID; safe readiness check; owner-controlled approval/capture; return and verified webhook reconciliation; duplicate-event no-side-effect proof | **HOLD — carried as Build 442 payment evidence, never as an obsolete earlier-build requirement** |
| CAIP-442-H1 | Private R2/media evidence still incomplete | Temporal-evidence schema/source safeguards and verified-artifact fail-closed behavior retained | Development private R2 delivery, byte/range seeking, exact timecode/range evidence, storage audit and expected provider-off behavior | **HOLD — blocks separate live Production promotion; does not block continued Development** |
| UI-442-N1 | Authenticated automated viewport harness | 35/35 source/responsive regression retained | Future suitable authenticated top-level viewport evidence | **NOTE — no known UI defect** |
| OPS-442-H1 | Separate live Production promotion | Development and live projects remain isolated | Explicit owner promotion decision after all promotion-blocking HOLDs are resolved | **HOLD BY POLICY** |

## Phase A acceptance

Phase A may be deployed to `devilndove-site-dev` when its source gate is GREEN. It is not Phase B-complete until the guarded Development D1 runner returns PASS. CI must never apply the remote migration automatically.

The Build 442 I.T. page is the operator-facing bridge for payment/provider and CAIP obstacles. It may read `/api/payment-providers` once on explicit user request to display safe configuration flags. That read does not prove checkout, webhook verification, replay safety or provider mutation, and it never returns secret values.

The next probable bounded direction is the Build 443 editable Home carousel described in the I.T. feature register and current roadmap. It is not active release scope until Build 442 reaches a safe checkpoint.

No Build 442 action may mutate `main`, `devilndove-site`, Production D1/R2, or Production provider configuration.
