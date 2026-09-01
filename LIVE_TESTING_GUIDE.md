# Development I.T. Test Environment — Release 466

Updated: 2026-09-01

This is the current release-independent procedure for **Release 466 Build 4 — External Acceptance & Commercial Readiness**. Historical numbered testing guides are provenance only; they are not current operating instructions.

## Current boundary

- Source branch: `dev`
- Development Pages project: `devilndove-site`
- Development environment: Cloudflare Pages Preview
- Development D1: `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- Development Product R2: `devilndove-toolshed-images-dev`
- Development CAIP R2: `devilndove-caip-media-dev`
- Production branch: `main`
- Production release: Release 465
- Production exact source: `d5009d9c622bdf84232b3aa7bd24a1c3d61581b2`
- Production business/transactional data remain Production-owned.

Canonical D1 migrations remain exactly `0001`–`0004`. Release 466 Builds 1–4 remain schema-neutral.

## Build 4 acceptance cockpit

Open:

`/admin/release-control/external-commercial-readiness/`

The cockpit is GET-only. It combines existing I.T., Financials, Socials and CAIP acceptance authority and must render unresolved external work as **HOLD**, never as an inferred PASS.

Related workspaces:

- `/admin/it-integrations/` — provider readiness checks, correction mechanics and sanitized evidence references.
- `/admin/runtime-acceptance/` — Development runtime/private-media acceptance workspace.
- `/admin/release-control/runtime-storefront-intelligence/` — Build 2 monitoring/SEO evidence.
- `/admin/release-control/revenue-business-intelligence/` — Build 3 business intelligence.

## Permanent evidence rules

- Configuration is not acceptance.
- A credential reference is not acceptance.
- An enabled Development operator switch is not acceptance.
- Do not store passwords, cookies, tokens, provider secrets, card data or OAuth token material in Markdown, D1 evidence text, Git, screenshots, shell arguments or chat.
- Provider/payment testing is Development test/sandbox only until a separate Production authorization.
- Production payment/provider execution remains forbidden.
- Provider publication remains closed.
- Raw CAIP R2 deletion remains closed.
- Preview Cloudflare Access must not be weakened for testing.
- Any Production promotion remains a separate deliberate decision after Development acceptance.

## 16. CAIP private-media browser/range-streaming acceptance

Acceptance requires real authenticated Development evidence through the administrator-bound secure review proxy, not merely an R2 binding or object listing.

Require:

1. Use a current authenticated Development administrator session.
2. Select an existing private CAIP source object; do not fabricate or copy a Production object.
3. Create/use the normal short-lived administrator-bound secure review grant.
4. Load the media through `/api/admin/creative-asset-review`.
5. Seek within the media so the browser issues an HTTP `Range` request.
6. Confirm the response is HTTP `206` with valid `Content-Range`, `Accept-Ranges: bytes`, private/no-store caching and same-origin protections.
7. Confirm `creative_asset_access_audit` records `review_proxy_served` evidence with `ranged_streaming=true`, `no_copy=true` and `no_cache=true`.
8. Confirm the source R2 object remains unchanged and no raw token is logged.

**Pass condition:** the Build 4 cockpit reports CAIP private-media acceptance as accepted from a qualifying real range-stream audit.

## Payment provider execution boundary

All outbound Stripe/PayPal actions, including refunds, are fail-closed. A provider refund requires all of these controls simultaneously:

- request host is the Development Preview host;
- `DND_ENVIRONMENT=development`;
- `PAYMENT_PROVIDER_EXECUTION_MODE=development-explicit`;
- `PAYMENT_PROVIDER_MUTATIONS_ENABLED=1`;
- the admin request explicitly carries `provider_sync_confirmed=true`;
- Stripe credentials are test-only, or PayPal is sandbox-only;
- no live credential/environment is detected.

The direct `/api/admin/payment-actions` implementation defaults provider synchronization **off**. A failed provider refund records failure evidence only; it must not mark the local order/payment refunded. Stripe refund retries use `Idempotency-Key`; PayPal refund retries use `PayPal-Request-Id`.

## 17. Stripe Development acceptance

The Build 4 Stripe acceptance contract has **six** required evidence dimensions:

1. `credentials` — Development test credentials configured.
2. `checkout` — one owner-controlled Stripe test checkout completes without a live charge.
3. `webhook-signature` — signed Development webhook verification passes.
4. `refund` — one deliberate Development refund succeeds at Stripe. This is derived from a `payment_refunds` row with successful provider synchronization and a provider refund ID; a local-only refund does not count.
5. `reconciliation` — payment and refund state reconcile to the local order/payment/accounting evidence without duplicate posting.
6. `idempotent-replay` — retry/replay of the same test operation or signed event creates no duplicate charge, refund, order, Inventory or Accounting effect.

Do not use a real card or live key. Provider configuration alone must remain pending.

## 18. PayPal sandbox acceptance

The Build 4 PayPal acceptance contract also has **six** required evidence dimensions:

1. `credentials` — sandbox credentials configured.
2. `approval-capture` — one owner-controlled sandbox approval/capture completes.
3. `webhook-verification` — sandbox webhook authenticity is verified.
4. `refund` — one deliberate PayPal sandbox refund succeeds. This is derived from a `payment_refunds` row with successful provider synchronization and a provider refund ID; a local-only refund does not count.
5. `reconciliation` — sandbox capture/refund reconciles to local order/payment/accounting evidence.
6. `idempotent-replay` — duplicate operation/event replay creates no duplicate financial/order effect.

## 19. Social / OAuth controlled acceptance

OAuth remote authorization remains fail-closed unless the Development-only operator switch is explicitly enabled. Raw state, PKCE verifiers and provider tokens must remain encrypted/redacted.

Only deliberately enabled Development providers are acceptance targets. For each selected provider require:

1. provider readiness checks marked `passed` with sanitized evidence;
2. the intended provider account verified before token persistence/use;
3. a controlled OAuth connection lifecycle producing safe local security evidence;
4. refresh/revoke/disconnect behavior exercised where supported;
5. token and provider-subject values absent from diagnostics/evidence;
6. provider publication remains disabled.

If no provider is deliberately selected, Build 4 must show `pending_provider_selection`; it must not infer acceptance.

## 20. Production-launch readiness

The Build 4 cockpit must stay **HOLD** until external acceptance is complete and all launch blockers have been deliberately resolved/reviewed.

Current carried-forward launch blockers include:

- native GitHub `dev`/`main` ruleset application remains an external repository-setting action;
- Release 465 sitemap/noindex conflicts remain visible for `/cart/`, `/checkout/`, `/checkout/confirmation/`, `/supplies/health/`, `/tools/health/` and `/toolshed/duplicates/`;
- any incomplete Build 4 external acceptance item.

A zero-blocker cockpit does **not** deploy Production. It only supports a later separate promotion review of the exact green Development tree.

## Source and CI proof

Build 4 source-gating is owned by:

```bash
python scripts/release466_build4_gate.py
```

The Build 4 GitHub workflow must prove source safety and read Development evidence only. It must not automatically call Stripe, PayPal, refund APIs, OAuth providers, Production APIs or mutate Production. External browser/provider tests remain deliberate operator-controlled acceptance activities.

## Existing fail-closed execution authorities

Payment execution:

- `functions/api/_lib/paymentExecution.js`
- `functions/api/admin/contracts/operations-payment-action-write.js`
- `functions/api/admin/payment-actions.js`
- Development host + explicit operator switch + old provider-mutation gate + explicit request confirmation + test/sandbox credentials are required for remote refunds.
- live credentials are rejected.
- successful refund acceptance is derived from `payment_refunds`, not inferred from configuration.

OAuth:

- `functions/api/admin/oauth-start.js`
- `functions/api/admin/oauth-connections.js`
- encrypted state/PKCE/token lifecycle with intended-account verification.
- remote authorization requires the Development-only explicit switch.

CAIP private review:

- `functions/api/admin/creative-asset-review.js`
- administrator-bound grant, private/no-store response, R2 range streaming, no source copy/delete.

I.T. acceptance ledger:

- `functions/api/admin/it-provider-readiness.js`
- stores only safe state, correction mechanics and evidence references.
- secret-like values are refused.

## Final rule

Release 466 Build 4 is an **acceptance and readiness** build. Never turn missing external evidence into a green result merely to complete the release. A truthful HOLD is the correct state until the real Development test/sandbox/browser evidence exists.
