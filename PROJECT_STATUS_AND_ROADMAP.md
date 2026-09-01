# Devil n Dove — Project Status & Roadmap

## Current release

**Release 466 — Operational Resilience and Commercial Readiness** is the current Development release. Builds 1, 2 and 3 are Development green. Build 4 is **technical green with external acceptance HOLD**, including Development-green payment-refund hardening. Item 16 CAIP private-media acceptance is green; Stripe, PayPal and Social/OAuth acceptance remain incomplete. Native GitHub ruleset application remains the external repository-setting boundary pending. Release 465 remains fully Production green on `main` at `d5009d9c622bdf84232b3aa7bd24a1c3d61581b2`.

## Four-build plan

| Build | Items | Theme | State |
|---|---:|---|---|
| Build 1 | 1–5 | Governance, Recovery & Production Reliability | Development green / native GitHub ruleset external pending |
| Build 2 | 6–10 | Runtime & Storefront Intelligence | Development green |
| Build 3 | 11–15 | Revenue & Business Intelligence | Development green |
| Build 4 | 16–20 | External Acceptance & Commercial Readiness | Technical green / external acceptance HOLD |

## Builds 1–3

Builds 1–3 remain green on the Build 4 lineage. Historical closure authorities remain:

- Build 1 closure `3ac3e249f1dfd45bb7b9d20aeb2cdcb16f178a1e`; System Gate `33464419372`; Build 1 Proof `33464419380`.
- Build 2 closure `855171430c6b14c4f4a6ff24a120bcce722294f9`; System Gate `33466171233`; Build 2 Proof `33466171290`.
- Build 3 technical source `5ca09eab9e2a3441ffbdf76c46e35b3a6fcd52a6`; System Gate `33466655732`; Build 3 Proof `33466655735`.

All Release 466 Builds remain schema-neutral. Canonical migrations remain exactly `0001`–`0004`.

## Build 4 — External Acceptance & Commercial Readiness

Current fully proven payment-hardening technical closure source: `8f6cb19f69f102b09685dbb4cf410fe123e5775d`.

- System Gate `33510294636` — PASS
- exact Development Preview `https://83bc32a3.devilndove-site.pages.dev`
- Build 1/2/3/4 proofs `33510294602` / `33510294860` / `33510294792` / `33510294597` — PASS
- Build 4 proof artifact `9801397939`, SHA-256 `af257b6a2976b5d51f1667d2c8f045dfbe7f4d6a0e0ff753f7aa42bb7fce8508`
- Development deploy artifact `9801387368`, SHA-256 `b56ce91f7654664cfa3e8ebd13ac2c931fcbd67fd75c546a2b9b4379b26cdeb7`
- canonical migrations `4`; newly applied `0`; Development FK violations `0`
- Production mutation/provider publication/payment/refund/OAuth execution by automated proof: ZERO

### Item status

16. **CAIP private-media browser/range-streaming acceptance — Development green.** Development evidence contains `3` qualifying range-stream audits.
17. **Stripe Development acceptance — external acceptance pending.** Current Development evidence is `0/6`, including `0` successful provider-synchronized refunds. The six dimensions are credentials, checkout, signed webhook, real provider-synchronized Development refund, reconciliation and idempotent replay.
18. **PayPal sandbox acceptance — external acceptance pending.** Current Development evidence is `0/6`, including `0` successful provider-synchronized refunds. The six dimensions are sandbox credentials, approval/capture, verified webhook, real provider-synchronized sandbox refund, reconciliation and idempotent replay.
19. **Social/OAuth controlled acceptance — external acceptance pending.** Selected Development providers `0`; selected-provider connections `0`; selected-provider security events `0`.
20. **Production-launch readiness cockpit — technical green / HOLD.** Current state `HOLD_EXTERNAL_ACCEPTANCE`.

Payment refund hardening is Development green. Provider synchronization defaults OFF at `/api/admin/payment-actions`; remote refunds require the legacy provider gate, explicit `provider_sync_confirmed=true`, the Release 466 Development/test execution boundary, and test/sandbox credentials. Stripe retries use `Idempotency-Key`, PayPal sandbox retries use `PayPal-Request-Id`, failed remote refunds cannot mark local order/payment state refunded, and only successful provider-synchronized `payment_refunds` evidence counts toward external acceptance. Local-only refunds do not count.

The six Release 465 live sitemap/noindex findings remain visible for `/cart/`, `/checkout/`, `/checkout/confirmation/`, `/supplies/health/`, `/tools/health/` and `/toolshed/duplicates/`. Release 466 Development source removes those six noindex utility/health routes from `sitemap.xml`; Production remains unchanged until deliberate promotion.

## Production boundary

Release 466 has **not** been promoted. Production remains Release 465 at exact SHA `d5009d9c622bdf84232b3aa7bd24a1c3d61581b2`. Production business data remain Production-owned.

Release 466 is not complete and is not promotion-ready while Stripe, PayPal and Social/OAuth external acceptance remain pending and native GitHub ruleset application remains external/pending. Real provider/browser acceptance must not be inferred from configuration.

## Next bounded work

The remaining Release 466 work is deliberate external acceptance, not another feature build:

- complete the six Stripe Development evidence dimensions using test mode only;
- complete the six PayPal evidence dimensions using sandbox only;
- deliberately select the intended Social/OAuth provider(s) and perform controlled intended-account lifecycle acceptance with publication still closed;
- retain CAIP range-streaming evidence as already accepted;
- review/apply native GitHub rulesets externally when repository-settings access permits;
- then rerun strict Build 4 acceptance and the exact Development gates before considering a separate Production-promotion decision.

## Permanent boundaries

Production data is never replaced wholesale from Development. Request-time DDL, schema reversal, automatic business-data restore, raw R2 deletion, unbounded provider execution/publication, automatic financial correction, automatic price/reorder/project actions, and main-only application patches remain closed. Production promotion requires a separate deliberate authorization.
