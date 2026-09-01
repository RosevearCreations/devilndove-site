# Devil n Dove — AI Handoff

## Current authority

**Release 466 — Operational Resilience and Commercial Readiness.** Builds 1–3 are Development green. Build 4 implementation is **technical green / external acceptance HOLD**. CAIP private-media acceptance is already green. Stripe, PayPal and Social/OAuth acceptance remain incomplete. Native GitHub `dev`/`main` ruleset application remains external/pending because the connected integration cannot write repository rulesets.

Release 465 remains fully GREEN on Production and must not be reopened unless a current gate proves drift.

## Exact environment boundary

### Development
- branch: `dev`
- Pages: `devilndove-site` / Preview
- D1: `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- Product R2: `devilndove-toolshed-images-dev`
- CAIP R2: `devilndove-caip-media-dev`

### Production
- branch: `main`
- current Production release: **465**
- current Production source: `d5009d9c622bdf84232b3aa7bd24a1c3d61581b2`
- live: `https://devilndove.com`
- D1: `devilndove-prod-r462` (`f34a741b-0000-45b0-9a96-6be08754d563`)
- Product R2: `devilndove-toolshed-images`
- CAIP R2: `devilndove-caip-media`

Production business/transactional data remain Production-owned. Release 466 has **not** been promoted.

## Builds 1–3

Builds 1–3 remain Development green and pass their inherited proofs on the current Build 4 source lineage.

- Build 1 closure SHA `3ac3e249f1dfd45bb7b9d20aeb2cdcb16f178a1e`; current-tree inherited run `33468360674` PASS.
- Build 2 closure SHA `855171430c6b14c4f4a6ff24a120bcce722294f9`; current-tree inherited run `33468360701` PASS.
- Build 3 is Development green; current-tree inherited run `33468360735` PASS after exact runtime rerun job `99733359874`.

The first Build 3 runtime attempt on the Build 4 SHA hit a transient Wrangler/D1 remote SELECT exit while several proofs were concurrent. No source/schema change was made; the exact rerun passed.

## Release 466 Build 4 technical-green evidence

Technical source SHA: `6421187fb7c1f1eed932c2dd8e223b5f9589484d`.

Canonical System Gate:
- run `33468360898` — PASS
- source job `99732822736`
- deploy-development job `99732868160`
- exact Preview `https://7d8d9c89.devilndove-site.pages.dev`
- Development deploy proof artifact `9785671708`
- deploy proof SHA-256 `af1353d6c23882870067f01acecc00012d9ac388dc4288e25650c11e7ead123b`
- regression artifact `9785672087`
- canonical D1 `4` migrations / `0` newly applied / `0` FK violations / `583` tables
- Preview remained `CLOUDFLARE_ACCESS_PROTECTED`; authentication headers ZERO; Access weakened NO.

Release 466 Build 4 Proof:
- run `33468360774` — PASS
- source-proof job `99732822552`
- runtime-proof job `99732864996`
- artifact `9785676849`
- artifact SHA-256 `5f789155e831a00a6af4816ac4cacb3613f4a975be2e76799a4b906314328fc1`
- Development D1 operation SELECT only
- Production business rows read ZERO
- Production mutation ZERO
- automated provider/payment/OAuth execution ZERO

## Build 4 status

16. **CAIP private-media browser/range-streaming acceptance — DEVELOPMENT GREEN.** `3` qualifying `review_proxy_served` range audits exist with ranged streaming, no copy and no cache evidence.
17. **Stripe Development acceptance — EXTERNAL ACCEPTANCE PENDING.** I.T. ledger: `0/5` required checks passed.
18. **PayPal sandbox acceptance — EXTERNAL ACCEPTANCE PENDING.** I.T. ledger: `0/5` required checks passed.
19. **Social/OAuth controlled acceptance — EXTERNAL ACCEPTANCE PENDING.** Selected providers/connections/security events: `0/0/0`.
20. **Production-launch readiness cockpit — TECHNICAL GREEN / HOLD.** Current launch state `HOLD_EXTERNAL_ACCEPTANCE`.

Configuration, credentials or an enabled Development operator switch are never acceptance. Real Development test/sandbox/OAuth evidence must exist before items 17–19 can pass.

## SEO correction staged in Release 466

Build 2 measured six live Release 465 sitemap/noindex conflicts: `/cart/`, `/checkout/`, `/checkout/confirmation/`, `/supplies/health/`, `/tools/health/` and `/toolshed/duplicates/`.

Release 466 Development source now removes those six noindex utility/health routes from `sitemap.xml`, and the corrected source passed the public SEO gates. Release 465 Production is deliberately unchanged until a later promotion.

## Permanent safety rules

- Exact green Development tree only may move to `main`.
- Main-only application patches are forbidden.
- Production transactional data are never overwritten from Development.
- Request-time schema DDL remains forbidden.
- Canonical migrations remain exactly `0001`–`0004`; Release 466 Builds 1–4 are schema-neutral.
- Business-data restore is never automatic.
- Native Git-triggered Cloudflare Pages deployment remains frozen.
- Provider/payment execution remains closed except deliberate bounded Development test/sandbox acceptance.
- Provider publication remains closed.
- Raw CAIP R2 deletion remains closed.
- Cloudflare Access is never weakened for Preview smoke.
- Build 3 business scores remain recommendation-only.

## Next bounded work

Do **not** start another feature build. The remaining Release 466 work is deliberate external acceptance:

1. Stripe Development — complete the five required test-mode checks: credentials, checkout, signed webhook, reconciliation and idempotent replay.
2. PayPal sandbox — complete the five required checks: credentials, approval/capture, verified webhook, reconciliation and idempotent replay.
3. Social/OAuth — deliberately choose the intended provider(s), verify intended account, controlled connection lifecycle, refresh/revoke/disconnect behavior as applicable; publication remains closed.
4. Native GitHub rulesets — apply/review externally when repository-settings write access is available.
5. Rerun strict Build 4 acceptance, then exact canonical/inherited proofs.
6. Only after those are green may a separate Release 466 Production-promotion decision be considered.

No real Stripe/PayPal/OAuth action should be faked or inferred. If credentials/session/operator authorization are unavailable, keep the item HOLD and surface the exact correction mechanics in the I.T. readiness workspace.

## Canonical reading order

1. `development-release.json` — last fully accepted convergence remains Build 3 while Build 4 external acceptance is HOLD.
2. `release466-build4-external-commercial-readiness.json` — Build 4 technical/evidence authority.
3. `LIVE_TESTING_GUIDE.md` — current Build 4 operator acceptance procedure.
4. `docs/operations/RELEASE_466_FOUR_BUILD_ROADMAP.md`
5. `AI_HANDOFF.md`
6. `PROJECT_STATUS_AND_ROADMAP.md`
7. `SANITY_HEALTH_CHECK.md`
8. `release466-build3-revenue-business-intelligence.json`
9. `release466-build2-runtime-storefront-intelligence.json`
10. `release466-build1-governance-recovery-reliability.json`
11. `.github/RELEASE466_BRANCH_PROTECTION_POLICY.md`
12. `release463-environment.json`

Release 465 files remain immutable historical acceptance authorities and must continue to pass their append-safe gates.
