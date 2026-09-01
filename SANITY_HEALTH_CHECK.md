# Devil n Dove — Sanity / Health Check

## Current release

**Release 466 — Operational Resilience and Commercial Readiness.** Builds 1–3 are Development green. Build 4 is **technical green / external acceptance HOLD**. CAIP private-media acceptance and payment-refund hardening are Development green; Stripe, PayPal and Social/OAuth remain external acceptance pending. Release 465 remains Production green and unchanged on `main`.

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
- [x] Current payment-hardening System Gate applied `0` new migrations.
- [x] Development remains `583` tables / `4` migrations / `4` proofs / `0` FK violations.
- [x] Production canonical `0001`–`0004` remains unchanged from Release 465.

## Release 466 Build 2 closure

- [x] Release 466 Build 2 closure remains Development green at `855171430c6b14c4f4a6ff24a120bcce722294f9`.

## Release 466 Build 3 carried-forward state

Release 466 Build 3 is technically **Development GREEN**. Its inherited proof must continue to pass on every Build 4 source tree.

## Current fully proven Build 4 technical closure

- [x] Source SHA `8f6cb19f69f102b09685dbb4cf410fe123e5775d`.
- [x] System Gate `33510294636` passed.
- [x] Exact Preview `https://83bc32a3.devilndove-site.pages.dev` passed bindings and Access-safe smoke.
- [x] Build 1 Proof `33510294602` passed.
- [x] Build 2 Proof `33510294860` passed.
- [x] Build 3 Proof `33510294792` passed.
- [x] Build 4 Proof `33510294597` passed.
- [x] Build 4 proof artifact `9801397939`, SHA-256 `af257b6a2976b5d51f1667d2c8f045dfbe7f4d6a0e0ff753f7aa42bb7fce8508`.
- [x] Development deploy artifact `9801387368`, SHA-256 `b56ce91f7654664cfa3e8ebd13ac2c931fcbd67fd75c546a2b9b4379b26cdeb7`.
- [x] Production business rows read by Build 4 proof: ZERO.
- [x] Production mutation: ZERO.
- [x] Automated Stripe/PayPal/refund execution: ZERO.
- [x] Automated OAuth action/publication: ZERO.

## Item status

- [ ] Item 1 native GitHub `dev`/`main` ruleset application — external repository setting pending; in-repository controls are green.
- [x] Items 2–15 — Development green.
- [x] Item 16 CAIP private-media browser/range-streaming acceptance — **Development green**, with `3` qualifying range-stream audits.
- [ ] Item 17 Stripe Development acceptance — **external acceptance pending**. Current Development evidence is `0/6`, including `0` successful provider-synchronized refunds.
- [ ] Item 18 PayPal sandbox acceptance — **external acceptance pending**. Current Development evidence is `0/6`, including `0` successful provider-synchronized refunds.
- [ ] Item 19 Social/OAuth controlled acceptance — **external acceptance pending**, selected providers/connections/security events `0/0/0`.
- [x] Item 20 Production-launch readiness cockpit — **technical green**, current launch state correctly `HOLD_EXTERNAL_ACCEPTANCE`.

## Payment-refund hardening sanity — DEVELOPMENT GREEN

- [x] No schema change was required; existing `payment_refunds` authority is reused.
- [x] Direct `/api/admin/payment-actions` provider synchronization defaults OFF.
- [x] Remote refund requires `PAYMENT_PROVIDER_MUTATIONS_ENABLED=1` and explicit `provider_sync_confirmed=true`.
- [x] Remote refund additionally requires the Release 466 Development/test payment execution boundary.
- [x] Stripe retry protection uses `Idempotency-Key`.
- [x] PayPal retry protection uses `PayPal-Request-Id` and sandbox endpoint only.
- [x] Failed provider refund cannot mark local order/payment status refunded.
- [x] External refund acceptance must come from a successful `payment_refunds` provider synchronization with a provider refund ID; local-only refunds do not count.
- [x] Source gate and exact-SHA Development deployment/runtime proof passed on `8f6cb19f69f102b09685dbb4cf410fe123e5775d`.
- [x] Current runtime evidence reports Stripe `0/6`, PayPal `0/6`, successful provider refunds `0/0`, CAIP accepted, Social/OAuth `0/0/0`, and truthful `HOLD_EXTERNAL_ACCEPTANCE`.

## SEO state

- [ ] Current live Release 465 still exposes sitemap/noindex conflicts for `/cart/`, `/checkout/`, `/checkout/confirmation/`, `/supplies/health/`, `/tools/health/` and `/toolshed/duplicates/`.
- [x] Release 466 Development source removes those six noindex utility/health routes from `sitemap.xml`.
- [x] The corrected Release 466 sitemap passed the current public SEO source gates.
- [x] Production was not mutated to make the Development SEO gate pass.

## Remaining HOLD boundaries

- [ ] Stripe Development test credentials/checkout/signed webhook/refund/reconciliation/idempotent-replay acceptance.
- [ ] PayPal sandbox credentials/approval-capture/verified webhook/refund/reconciliation/idempotent-replay acceptance.
- [ ] Deliberate Social/OAuth provider selection and controlled intended-account lifecycle acceptance.
- [ ] Native GitHub ruleset application/review.
- [ ] Final strict Build 4 acceptance after the above real external evidence exists.
- [ ] Release 466 Production promotion is not authorized.

## Current verdict

Release 466 Build 4 implementation and payment-refund hardening are technically **GREEN**, and CAIP private-media acceptance is **GREEN**. Overall Release 466 remains **HOLD_EXTERNAL_ACCEPTANCE** because Stripe is `0/6`, PayPal is `0/6`, Social/OAuth remains `0/0/0`, and native GitHub ruleset application remains external/pending. Production remains safely on Release 465.
