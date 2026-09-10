# Devil n Dove — Markdown / Authority Index

## Current authority — Release 467 Build 89

Build 89 — **External Acceptance Environment Isolation & Guided Recovery** is the current Development closure candidate.

Last fully verified Development is Build 88:
- `dev` `9c6d56b887b2aa4bb710e5980608b8942830034c`
- tree `9f7d279ed5c83795682ba763ca150f1fe91a6019`
- System `34423493650` SUCCESS
- Quality `34423493830` SUCCESS
- I.T. `34423493747` SUCCESS
- Hygiene `34423493617` SUCCESS.

Current Production is Build 88:
- `main` `9c6d56b887b2aa4bb710e5980608b8942830034c`
- tree `9f7d279ed5c83795682ba763ca150f1fe91a6019`
- Production Pages Deploy `34423649786` SUCCESS
- Production Live Resource Integrity `34423737422` SUCCESS.

## Current reading order

1. `current-development-authority.json`
2. `release467-build89-external-acceptance-environment-isolation.json`
3. `release467-build88-external-acceptance-control-center.json`
4. `docs/operations/RELEASE_467_BUILD_89_EXTERNAL_ACCEPTANCE_ENVIRONMENT_ISOLATION.md`
5. `docs/operations/RELEASE_467_BUILD_88_EXTERNAL_ACCEPTANCE_CONTROL_CENTER.md`
6. `docs/operations/RELEASE_467_BUILD_79_STRIPE_DEVELOPMENT_PREPARATION.md`
7. `docs/operations/RELEASE_467_BUILD_80_PAYPAL_SANDBOX_PREPARATION.md`
8. `release467-build85-socials-oauth-acceptance.json`
9. `release467-build86-it-operations-self-diagnostics.json`
10. `AI_HANDOFF.md`
11. `PROJECT_STATUS_AND_ROADMAP.md`
12. `SANITY_HEALTH_CHECK.md`
13. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`
14. `migrations/canonical/manifest.json`
15. Earlier Release 467 authorities when investigating historical implementation/provenance.

## Build 89 authority contract

Build 89 consumes the exact Build 88 Development and Production closure and repairs the current external-acceptance environment boundary:
- Production receives a read-only bridge-first acceptance projection and does not invoke the Development-only provider runner;
- Development may invoke the retained runner for sanitized evidence enrichment and deliberate guarded Stripe/PayPal actions;
- runner unavailability degrades to read-only evidence rather than taking down the current acceptance page;
- Stripe and PayPal each remain six real evidence dimensions;
- each payment lane exposes a guided next missing evidence action without automatic execution;
- Social OAuth, CAIP private-media and Cloudflare Access remain independent external evidence lanes.

Historical Build 6/7 engines remain preserved as regression/evidence authorities. Build 89 does not create a second payment execution engine, does not automatically contact providers, does not publish social content, and does not enable Production provider execution.

Build 88 is the exact verified restart and Production baseline while Build 89 earns its own external proof. Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains evidence-dependent until fresh evidence proves otherwise. `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains active.
