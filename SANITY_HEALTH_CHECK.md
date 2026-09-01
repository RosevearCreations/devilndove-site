# Devil n Dove — Sanity / Health Check

## Current release

**Release 466 — Operational Resilience and Commercial Readiness.** Builds 1–3 are Development green. Build 4 is **technical green / external acceptance HOLD**. CAIP private-media acceptance is green; Stripe, PayPal and Social/OAuth remain external acceptance pending. Release 465 remains Production green and unchanged on `main`.

## Environment boundaries

- [x] `dev` → `devilndove-site` Preview/Development.
- [x] Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- [x] Development Product/CAIP R2 remain isolated Development buckets.
- [x] `main` remains Release 465 at `d5009d9c622bdf84232b3aa7bd24a1c3d61581b2`.
- [x] Production business/transactional data remain Production-owned.
- [x] Request-time schema mutation and raw R2 deletion remain closed.
- [x] Automated Build 4 CI performs no provider/payment/refund/OAuth execution.
- [x] Cloudflare Access was not weakened for Preview acceptance.

## Canonical D1 authority

- [x] Canonical stream remains exactly `0001`–`0004`.
- [x] Release 466 Builds 1–4 introduced no migration `0005`.
- [x] Last Build 4 System Gate applied `0` new migrations.
- [x] Development remained `583` tables / `4` migrations / `4` proofs / `0` FK violations.
- [x] Production canonical `0001`–`0004` remains unchanged from Release 465.

## Release 466 Build 2 closure

- [x] Release 466 Build 2 closure remains Development green at `855171430c6b14c4f4a6ff24a120bcce722294f9`.

## Release 466 Build 3 carried-forward state

Release 466 Build 3 is technically **Development GREEN**. Its inherited proof must continue to pass on every Build 4 source tree.

## Last fully proven Build 4 technical closure

- [x] Source SHA `0ca68e19339da198e25dd7d3d603a2e616bc77ec`.
- [x] System Gate `33469027060` passed.
- [x] Exact Preview `https://c3b4404c.devilndove-site.pages.dev` passed bindings and Access-safe smoke.
- [x] Build 1 Proof `33469027078` passed.
- [x] Build 2 Proof `33469027029` passed.
- [x] Build 3 Proof `33469027067` passed.
- [x] Build 4 Proof `33469026988` passed.
- [x] Build 4 proof artifact `9785894659`, SHA-256 `de5bc1ea32eeb5ec6584ca7b8f73cd082c5e9939c2ce38db63bf8c98d1907ad2`.
- [x] Production business rows read by Build 4 proof: ZERO.
- [x] Production mutation: ZERO.
- [x] Automated Stripe/PayPal execution: ZERO.
- [x] Automated OAuth action/publication: ZERO.

## Item status

- [ ] Item 1 native GitHub `dev`/`main` ruleset application — external repository setting pending; in-repository controls are green.
- [x] Items 2–15 — Development green.
- [x] Item 16 CAIP private-media browser/range-streaming acceptance — **Development green**, with `3` qualifying range-stream audits.
- [ ] Item 17 Stripe Development acceptance — **external acceptance pending**. Historical closure measured `0/5`; current corrected acceptance contract is **six-part**, with provider-synchronized refund added as real evidence.
- [ ] Item 18 PayPal sandbox acceptance — **external acceptance pending**. Historical closure measured `0/5`; current corrected acceptance contract is **six-part**, with provider-synchronized refund added as real evidence.
- [ ] Item 19 Social/OAuth controlled acceptance — **external acceptance pending**, selected providers/connections/security events `0/0/0`.
- [x] Item 20 Production-launch readiness cockpit — **technical green**, current launch state correctly `HOLD_EXTERNAL_ACCEPTANCE`.

## Payment-refund hardening sanity

- [x] No schema change is required; existing `payment_refunds` authority is reused.
- [x] Direct `/api/admin/payment-actions` provider synchronization defaults OFF in the hardening source.
- [x] Remote refund requires `PAYMENT_PROVIDER_MUTATIONS_ENABLED=1` and explicit `provider_sync_confirmed=true`.
- [x] Remote refund additionally requires the Release 466 Development/test payment execution boundary.
- [x] Stripe retry protection uses `Idempotency-Key`.
- [x] PayPal retry protection uses `PayPal-Request-Id` and sandbox endpoint only.
- [x] Failed provider refund must not mark local order/payment status refunded.
- [x] External refund acceptance must come from a successful `payment_refunds` provider synchronization with a provider refund ID; local-only refunds do not count.
- [ ] Hardening branch source/exact-SHA Development proof is still required before this becomes the new `dev` authority.

## SEO state

- [ ] Current live Release 465 still exposes sitemap/noindex conflicts for `/cart/`, `/checkout/`, `/checkout/confirmation/`, `/supplies/health/`, `/tools/health/` and `/toolshed/duplicates/`.
- [x] Release 466 Development source removes those six noindex utility/health routes from `sitemap.xml`.
- [x] The corrected Release 466 sitemap passed the current public SEO source gates.
- [x] Production was not mutated to make the Development SEO gate pass.

## Remaining HOLD boundaries

- [ ] Prove the payment-refund hardening branch through source gate and exact Development deployment/runtime proof.
- [ ] Stripe Development test credentials/checkout/signed webhook/refund/reconciliation/idempotent-replay acceptance.
- [ ] PayPal sandbox credentials/approval-capture/verified webhook/refund/reconciliation/idempotent-replay acceptance.
- [ ] Deliberate Social/OAuth provider selection and controlled intended-account lifecycle acceptance.
- [ ] Native GitHub ruleset application/review.
- [ ] Final strict Build 4 acceptance after the above evidence exists.
- [ ] Release 466 Production promotion is not authorized.

## Current verdict

Release 466 Build 4 implementation is technically **GREEN**, and CAIP private-media acceptance is **GREEN**. Overall Release 466 remains **HOLD_EXTERNAL_ACCEPTANCE**. The payment acceptance model is now correctly six-part, including a real provider-synchronized refund; the hardening source must still re-pass the full Development proof before it becomes the next exact `dev` authority. Production remains safely on Release 465.
