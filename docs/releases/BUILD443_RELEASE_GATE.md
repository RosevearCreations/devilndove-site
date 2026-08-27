# Build 443 — Editable Home Carousel Release Gate

Updated: 2026-08-27

Build 443 is the active Devil n Dove Development release. Build 442 is closed as a safe Development checkpoint; unresolved work is carried forward here as explicit current-release **HOLDs**.

## Previous accepted checkpoint

Build 442 closed its Development checkpoint at exact source SHA:

`b8868c9b77ad12de4fee4984274fe80e1d096613`

Evidence on that SHA:
- Build 442 source convergence gate: **GREEN**
- Windows D1 transport gate: **GREEN**
- Cloudflare Pages `devilndove-site-dev` exact-SHA deployment: **GREEN**
- Cloudflare deployment id: `b72eb8b4-ac52-4b12-bdd2-cd85ea6b400d`
- Deployment preview: `https://b72eb8b4.devilndove-site-dev.pages.dev`
- Product / Inventory / Tool and responsive 35/35 regressions: **GREEN provenance**

## Environment boundary

- Source: `dev`
- Development runtime/project: `devilndove-site-dev`
- Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Separate live Production: `main` / `devilndove-site`
- Production promotion: **CLOSED**

## Build 443 carousel increment

Build 443 adds:
- additive `home_carousel_slides` and immutable `home_carousel_events` authority;
- an authenticated Admin editor for create/preview/save/publish/pause/archive/reorder and optional schedules;
- separate save-versus-publish actions with audit snapshots;
- a public read endpoint limited to published, currently scheduled, same-site slide facts;
- responsive previous/next controls, indicators, keyboard navigation and a visible pause/resume action;
- reduced-motion behavior that disables automatic rotation;
- one-H1 protection by keeping the existing Home copy authoritative;
- a fail-safe that retains/restores the current static hero when schema/API/slides/first-image evidence is unavailable.

No slide is seeded or auto-published. Build 443 source may deploy safely before its additive D1 migration because the public endpoint and browser runtime deliberately fall back to the static hero, while the editor reports the exact migration requirement.

## Current HOLD register

| ID | Hold | Completed evidence | Exact remaining proof | Impact |
| --- | --- | --- | --- | --- |
| CAR-443-H1 | Carousel Development D1 authority not yet applied | Schema, guarded runner, public/admin API, editor/runtime, audit snapshots and local regression packaged | Run `python scripts/build443_apply_development_home_carousel.py`; create draft, preview, publish, pause, schedule and fallback evidence | **HOLD — editor stays readably blocked and Home remains static until schema proof** |
| IT-443-H1 | Fourth-module/user-grant Development D1 authority not yet applied | Build 442 additive migration/guarded verifier and local lockout regression retained | Run `python scripts/build442_apply_development_it_platform.py`; require exact module/grants/FK PASS | **HOLD — blocks I.T. Phase B activation** |
| IT-443-H2 | Runtime I.T. per-user enforcement not active | Three-module runtime remains proven and unchanged | Explicit user read/manage middleware/API/UI, last-manager protection and authenticated isolation acceptance after IT-443-H1 | **HOLD — intentional database boundary** |
| PAY-443-H1 | Stripe Development checkout evidence incomplete | Safe readiness, return/webhook/idempotency source retained | Test keys + webhook secret; owner-controlled checkout; return/signed webhook reconciliation; duplicate replay proof | **HOLD — current release owns it** |
| PAY-443-H2 | PayPal Development checkout evidence incomplete | Safe sandbox readiness, approval/capture/webhook/idempotency source retained | Sandbox credentials/webhook ID; owner-controlled capture; return/verified webhook reconciliation; duplicate replay proof | **HOLD — current release owns it** |
| CAIP-443-H1 | Private R2/media evidence incomplete | Temporal/schema fail-closed safeguards retained | Private delivery, byte/range seeking, exact timecode/range, artifact/storage audit and provider-off evidence | **HOLD — promotion blocking** |
| UI-443-N1 | Authenticated automated viewport evidence | Source responsive acceptance retained | Suitable authenticated top-level viewport evidence | **NOTE — no known defect** |
| OPS-443-H1 | Separate live Production promotion | Development/live projects remain isolated | Explicit owner decision after promotion-blocking HOLDs resolve | **HOLD BY POLICY** |

## Connectivity record and correction mechanic

The 2026-08-27 workspace could reach GitHub but could not reach Cloudflare through Wrangler, and the Cloudflare dashboard cloud browser entered a repeated human-verification loop. No D1 statement ran. This is an execution-environment connection blocker, not a database PASS or application defect.

Correction:
1. Use an environment with authorized Cloudflare network access.
2. Run the guarded Build 442 I.T. auth probe/apply against the hard-pinned Development database.
3. Run the guarded Build 443 carousel runner only against the same exact Development database.
4. Record exact query/deployment evidence here; never use CI or request-time DDL to work around the boundary.

No Build 443 action may mutate `main`, `devilndove-site`, Production D1/R2, or Production payment configuration.
