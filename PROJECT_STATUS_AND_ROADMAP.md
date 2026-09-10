# Devil n Dove — Project Status and Roadmap

## Current Development and Production authority

**Release 467 Build 87 — Production Authority & Restart Convergence** is the current Development closure candidate.

Last fully verified Development is Build 86 — I.T. Operations & Self-Diagnostics:
- `dev` `5fdbb5346e52f17072671274dc36e4d3527a7905`
- tree `f9037baf12bc3489b3a0df3df03eef5bdbe85e90`
- System Gate `34419070653` SUCCESS
- Current Application Quality `34419070636` SUCCESS
- I.T. Admin Runtime Proof `34419070642` SUCCESS
- Repository Branch Hygiene `34419070660` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, bindings, non-secret smoke and regression evidence: SUCCESS.

Current Production is also Build 86:
- `main` `5fdbb5346e52f17072671274dc36e4d3527a7905`
- tree `f9037baf12bc3489b3a0df3df03eef5bdbe85e90`
- Production Pages Deploy `34419211512` SUCCESS
- Production Live Resource Integrity `34419284027` SUCCESS.

The Build 86 Production chain proved exact fully-green Development ancestry, preserved Production business data, proved canonical Production D1 and isolation/FK integrity, deployed the exact `main` SHA with live bindings, passed public smoke, and re-proved live account/D1 compatibility plus Product R2/API photography.

## Build 87 scope

Build 87 consumes that external Build 86 closure and removes the intentional one-build authority lag from current operational surfaces. It converges:
- `current-development-authority.json` onto Build 86 as the verified restart/Production baseline;
- `release467-build86-it-operations-self-diagnostics.json` onto its actual final closure;
- `/admin/it/`, Reliability and Deployment Preflight onto the same Build 86 SHA/tree/run evidence;
- AI handoff, sanity, Markdown index and startup/preflight documentation onto the same restart point;
- the current System Gate onto a retained Build 87 authority-convergence contract.

Build 87 deliberately adds no automatic repair, no new D1 migration, no request-time schema mutation, no D1/R2/binding write, no provider execution/publication, no deployment/restore execution and no Production business-data overwrite.

## Current external acceptance

These remain independent of source/deployment health:
- Stripe Development: `HOLD_EXTERNAL`
- PayPal sandbox: `HOLD_EXTERNAL`
- Social OAuth selected-provider acceptance: `HOLD_EXTERNAL`
- CAIP private-media acceptance: `EVIDENCE_DEPENDENT`
- Cloudflare Access service-token acceptance: `HOLD_EXTERNAL`

Configuration booleans are readiness information only; they never imply provider acceptance or execution permission.

## Build 87 closure sequence

1. Complete the Build 87 authority/runtime-truth gate package on the candidate branch.
2. Fast-forward the exact candidate to `dev`.
3. Require exact merged-`dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene plus canonical Development D1/binding proof and exact Preview smoke.
4. Promote the same exact SHA/tree to `main` only when all Development checks are GREEN.
5. Require Production business-data preservation, canonical Production D1/FK/binding proof, exact Pages deployment, public smoke and promotion proof.
6. Require Production Live Resource Integrity to re-prove live D1, same-origin Product R2, Product API photography and account diagnostic.
7. Only then call Build 87 complete externally; the next build will ingest Build 87's final closure evidence.

Canonical migrations remain exactly `0001`–`0004`. Build 88 scope is not being started inside Build 87; it will be chosen after Build 87 receives its own exact Production closure proof.
