# Devil n Dove — Project Status and Roadmap

## Current Development and Production authority

**Release 467 Build 88 — External Acceptance Control Center Convergence** is the current Development closure candidate.

Last fully verified Development is Build 87 — Production Authority & Restart Convergence:
- `dev` `646d73710784008617157cf5746a66f053daba83`
- tree `709f802cf7ca24a12f48bd7c8b562a92b306fcae`
- System Gate `34421392242` SUCCESS
- Current Application Quality `34421392244` SUCCESS
- I.T. Admin Runtime Proof `34421392231` SUCCESS
- Repository Branch Hygiene `34421392188` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, bindings, non-secret smoke and regression evidence: SUCCESS.

Current Production is also Build 87:
- `main` `646d73710784008617157cf5746a66f053daba83`
- tree `709f802cf7ca24a12f48bd7c8b562a92b306fcae`
- Production Pages Deploy `34421532872` SUCCESS
- Production Live Resource Integrity `34421613381` SUCCESS.

The Build 87 Production chain proved exact fully-green Development ancestry, preserved Production business data, proved canonical Production D1 and isolation/FK integrity, deployed the exact `main` SHA with live bindings, passed public smoke, and re-proved live account/D1 compatibility plus Product R2/API photography.

## Build 88 scope

Build 88 moves the remaining external-acceptance work out of stale Build 6/7 operator wording and into one current control center while preserving those older engines as immutable evidence/regression authorities.

- New current route: `/admin/release-control/external-acceptance/`.
- New current GET-only status API: `/api/admin/current-external-acceptance-control-center`.
- Stripe Development is normalized to six real acceptance dimensions: credentials, checkout, signed webhook, provider-synchronized refund, reconciliation and idempotent replay.
- PayPal sandbox is normalized to six real acceptance dimensions: credentials, approval/capture, verified webhook, provider-synchronized refund, reconciliation and idempotent replay.
- Social OAuth remains selected-provider Development acceptance with provider publication closed.
- CAIP private-media remains evidence-dependent and requires fresh authenticated private review/range evidence.
- Cloudflare Access remains a separate dispatch-only service-token external proof.
- Existing Stripe/PayPal provider actions remain on the guarded historical runner; Build 88 does not create a second payment execution engine.

## Current external acceptance

These remain independent of source/deployment health unless fresh evidence proves otherwise:
- Stripe Development: `HOLD_EXTERNAL`
- PayPal sandbox: `HOLD_EXTERNAL`
- Social OAuth selected-provider acceptance: `HOLD_EXTERNAL`
- CAIP private-media acceptance: `EVIDENCE_DEPENDENT`
- Cloudflare Access service-token acceptance: `HOLD_EXTERNAL`

Configuration booleans are readiness information only; they never imply provider acceptance or Production execution permission.

## Build 88 closure sequence

1. Complete the Build 88 current acceptance API/UI, current authority/restart convergence and fail-closed source gate.
2. Fast-forward the exact candidate to `dev`.
3. Require exact merged-`dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene plus canonical Development D1/binding proof and exact Preview smoke.
4. Promote the same exact SHA/tree to `main` only when all Development checks are GREEN.
5. Require Production business-data preservation, canonical Production D1/FK/binding proof, exact Pages deployment, public smoke and promotion proof.
6. Require Production Live Resource Integrity to re-prove live D1, same-origin Product R2, Product API photography and account diagnostic.
7. Only then call Build 88 complete externally; the next build will ingest Build 88's final closure evidence.

Canonical migrations remain exactly `0001`–`0004`. Real external provider acceptance is not claimed by Build 88 merely because its source/deployment closure becomes GREEN.
