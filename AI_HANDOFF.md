# Devil n Dove — AI Handoff

## Current authority

**Release 466 — Operational Resilience and Commercial Readiness.** Builds 1–3 are Development green. Build 4 implementation is **technical green / external acceptance HOLD**. CAIP private-media acceptance is green. Payment-refund hardening is Development green. Stripe, PayPal and Social/OAuth acceptance remain incomplete. Native GitHub `dev`/`main` ruleset application remains external/pending because the connected integration cannot write repository rulesets.

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

Builds 1–3 remain Development green and must continue to pass inherited proofs on every Build 4 source tree. **Build 3 is Development green.**

- Build 1 closure SHA `3ac3e249f1dfd45bb7b9d20aeb2cdcb16f178a1e`.
- Build 2 closure SHA `855171430c6b14c4f4a6ff24a120bcce722294f9`.
- Build 3 Development-green closure remains the last fully accepted convergence in `development-release.json` while Build 4 external evidence is HOLD.

## Release 466 Build 4 current technical closure

Current fully proven payment-hardening technical closure SHA: `8f6cb19f69f102b09685dbb4cf410fe123e5775d`.

- System Gate `33510294636` — PASS
- exact Preview `https://83bc32a3.devilndove-site.pages.dev`
- Build 1 Proof `33510294602` — PASS
- Build 2 Proof `33510294860` — PASS
- Build 3 Proof `33510294792` — PASS
- Build 4 Proof `33510294597` — PASS
- Build 4 proof artifact `9801397939`
- artifact SHA-256 `af257b6a2976b5d51f1667d2c8f045dfbe7f4d6a0e0ff753f7aa42bb7fce8508`
- Development deploy artifact `9801387368`, SHA-256 `b56ce91f7654664cfa3e8ebd13ac2c931fcbd67fd75c546a2b9b4379b26cdeb7`
- canonical D1 remains exactly `0001`–`0004`, with no Build 4 migration and zero Development FK violations
- Development remains `583` tables / `4` migrations / `4` proofs / `0` FK violations
- Production business rows read by Build 4 proof ZERO; Production mutation ZERO
- automated provider/payment/refund/OAuth execution ZERO

## Build 4 status

16. **CAIP private-media browser/range-streaming acceptance — DEVELOPMENT GREEN.** `3` qualifying `review_proxy_served` range audits exist with ranged streaming, no copy and no cache evidence.
17. **Stripe Development acceptance — EXTERNAL ACCEPTANCE PENDING.** Current Development evidence is `0/6`, including `0` successful provider-synchronized refunds. Acceptance requires credentials, checkout, signed webhook, real provider-synchronized Development refund, reconciliation and idempotent replay.
18. **PayPal sandbox acceptance — EXTERNAL ACCEPTANCE PENDING.** Current Development evidence is `0/6`, including `0` successful provider-synchronized refunds. Acceptance requires sandbox credentials, approval/capture, verified webhook, real provider-synchronized sandbox refund, reconciliation and idempotent replay.
19. **Social/OAuth controlled acceptance — EXTERNAL ACCEPTANCE PENDING.** Selected providers/connections/security events remain `0/0/0` until a provider is deliberately selected and tested.
20. **Production-launch readiness cockpit — TECHNICAL GREEN / HOLD.** Current launch state `HOLD_EXTERNAL_ACCEPTANCE`.

## Payment refund hardening — DEVELOPMENT GREEN

The payment-refund hardening is fully source-gated, exact-SHA Development-deployed and runtime-proven on `8f6cb19f69f102b09685dbb4cf410fe123e5775d`.

Enforced behavior:

- direct `/api/admin/payment-actions` defaults provider synchronization OFF;
- remote refund requires `PAYMENT_PROVIDER_MUTATIONS_ENABLED=1` and explicit `provider_sync_confirmed=true`;
- remote refund additionally requires the Release 466 payment boundary: Development host, `DND_ENVIRONMENT=development`, `PAYMENT_PROVIDER_EXECUTION_MODE=development-explicit`, and test/sandbox credentials;
- Stripe refund retries use `Idempotency-Key`;
- PayPal refund retries use `PayPal-Request-Id` and the sandbox API only;
- a failed provider refund cannot mark the local payment/order refunded;
- refund acceptance is derived from a successful Development `payment_refunds` provider synchronization with a provider refund ID;
- a local-only refund is not external acceptance;
- no D1 schema change was required;
- Build 4 CI performs zero external provider/refund calls.

Do **not** execute a Stripe/PayPal refund merely because this machinery exists. Real provider acceptance remains a separate deliberate operator action.

## SEO correction staged in Release 466

Build 2 measured six live Release 465 sitemap/noindex conflicts: `/cart/`, `/checkout/`, `/checkout/confirmation/`, `/supplies/health/`, `/tools/health/` and `/toolshed/duplicates/`.

Release 466 Development source removes those six noindex utility/health routes from `sitemap.xml`, and the corrected source passed the public SEO gates. Release 465 Production remains unchanged until a later promotion.

## Permanent safety rules

- Exact green Development tree only may move to `main`.
- Main-only application patches are forbidden.
- Production transactional data are never overwritten from Development.
- Request-time schema DDL remains forbidden.
- Canonical migrations remain exactly `0001`–`0004`; Release 466 Builds 1–4 are schema-neutral.
- Business-data restore is never automatic.
- Native Git-triggered Cloudflare Pages deployment remains frozen.
- Provider/payment execution remains closed except separately authorized, bounded Development test/sandbox acceptance.
- Provider publication remains closed.
- Raw CAIP R2 deletion remains closed.
- Cloudflare Access is never weakened for Preview smoke.
- Build 3 business scores remain recommendation-only.

## Next bounded work

Do **not** start another feature build. The remaining Release 466 work is deliberate external acceptance:

1. Stripe Development — complete all six evidence dimensions in test mode only.
2. PayPal sandbox — complete all six evidence dimensions in sandbox only.
3. Social/OAuth — deliberately choose intended provider(s), verify intended account, and exercise controlled connection lifecycle; publication remains closed.
4. Native GitHub rulesets — apply/review externally when repository-settings write access is available.
5. Rerun strict Build 4 acceptance and all exact inherited proofs after real external evidence exists.
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
