# Devil n Dove — Markdown / Authority Index

## Current authority — Release 467 Build 86

Build 86 — **I.T. Operations & Self-Diagnostics** is the current Development closure candidate.

Last fully verified Development is Build 85:
- `dev` `33dc9857e1fada5549181a28ce4ef26c4a919572`
- tree `b2c6b80401241f1757cd172511d12f9d813bc817`
- System `34386667094` SUCCESS
- Quality `34386667361` SUCCESS
- I.T. `34386667111` SUCCESS
- Hygiene `34386667194` SUCCESS.

Current Production is Build 85:
- `main` `33dc9857e1fada5549181a28ce4ef26c4a919572`
- tree `b2c6b80401241f1757cd172511d12f9d813bc817`
- Production Pages Deploy `34386848470` SUCCESS
- Production Live Resource Integrity `34386976511` SUCCESS.

## Current reading order

1. `current-development-authority.json`
2. `release467-build86-it-operations-self-diagnostics.json`
3. `release467-build85-socials-oauth-acceptance.json`
4. `docs/operations/RELEASE_467_BUILD_86_IT_OPERATIONS_SELF_DIAGNOSTICS.md`
5. `docs/operations/RELEASE_467_BUILD_85_SOCIALS_OAUTH_ACCEPTANCE.md`
6. `docs/operations/RELEASE_467_NEXT_25_BUILDS_62_86.md`
7. `AI_HANDOFF.md`
8. `PROJECT_STATUS_AND_ROADMAP.md`
9. `SANITY_HEALTH_CHECK.md`
10. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`
11. `docs/architecture/IT_MODULE_ARCHITECTURE.md`
12. `migrations/canonical/manifest.json`
13. Builds 61–36 historical Release 467 authorities when investigating older implementation/provenance.

## Build 86 authority contract

Build 86 converges I.T. operational truth into one current read-only control centre covering:
- deployment environment/branch/SHA evidence;
- D1/R2 bindings;
- canonical migrations, schema drift and foreign-key integrity;
- API/browser/runtime incidents;
- five-module/root-admin/I.T. authority;
- provider setup/HOLDs without secret values;
- release-gate and exact-SHA promotion evidence;
- backup/recovery guidance and corrective routing.

The self-diagnostics layer performs **no automatic repair**. It does not mutate D1/R2/bindings, execute schema work, deploy or restore, contact providers, publish content, or overwrite Production business data.

Build 85 remains the exact verified restart and Production baseline until Build 86 receives its own external exact-head proof. Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains evidence-dependent. `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains active.
