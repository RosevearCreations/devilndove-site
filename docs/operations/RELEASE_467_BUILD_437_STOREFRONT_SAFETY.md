# Devil n Dove — Release 467 Build 437: Storefront Purchase & Shipping Safety Review

## Scope and result

Canada-first policy stays authoritative. **U.S. sales and shipping remain disabled.** No provider credentials, Stripe/PayPal execution flags, D1 data, R2 assets, orders or customer gift-card balances are changed by this build.

The Build 437 review added server-handler defence in depth:

- Validate CAD and Canadian billing/shipping at the order handler itself, not only in the shared API middleware. Unsupported countries/currency fail before an order write.
- Reject duplicate Product lines so each item's per-line stock check cannot be bypassed by splitting a quantity across several lines.
- Reject a Product whose stored currency is not CAD even if the browser sends CAD.
- Reject non-CAD gift-card purchase data independent of the parent checkout currency.
- Retain the existing authoritative server Product prices, stock checks and pending-activation gift-card purchase behavior.

## Offline acceptance

Run `node scripts/release467_build437_storefront_safety.test.mjs` or the corresponding step in **Current Application Quality Proof**. The test exercises the *actual* checkout handler with a bounded in-memory D1 stand-in:

1. Canada is allowed, the United States and other markets remain disallowed.
2. U.S. shipping, U.S. billing and USD are blocked before database access.
3. Duplicate Product lines are blocked before their separate stock checks.
4. Insufficient stock and non-CAD Product currencies fail with no order writes.
5. An injected browser unit price is ignored; the stored Product price is used.
6. Non-CAD gift-card purchases fail, and valid new cards remain `pending_activation`.
7. Gift-card quoting refuses pending cards and never quotes more than the stored active balance.

The test has no provider requests or live D1 calls. A passing source test is **not** an authenticated live checkout, successful payment, or Cloudflare Production deployment.

## Independent remaining risk: gift-card redemption settlement

The pre-existing `checkout-create-order` path currently subtracts a *redeemed* gift-card balance and inserts a `gift_card_redemptions` row when it creates an order with `payment_status='pending'`. A mixed gift-card/payment order that is later abandoned may therefore retain an unrefunded balance reduction. Do not infer completed payment, fulfillment or final gift-card settlement from an order-create response. This build does **not** invent an unreviewed payment settlement or refund workflow, and does not mutate historical balances. The next roadmap must scope a transactionally consistent reserve/commit/release lifecycle with idempotent payment and cancellation reconciliation before enabling any live mixed-payment gift-card rollout.

## Live acceptance before Production GREEN

- Four successful required workflows for one exact Development SHA.
- Successful Development Preview and protected Production Pages Deploy for the same approved tree.
- Verify real Cloudflare deployment identity, live `/release-version.json`, public checkout assets and smoke tests on `devilndove.com`.
- Exercise one authorized **non-charging** Canadian test checkout and rejected U.S. address in the relevant controlled environment. Do not trigger real payments or create business orders merely to satisfy automated proof.
- Confirm the gift-card redemption settlement risk remains recorded as an explicit hold and that no U.S. shipping toggle was enabled.

Next planned: **Build 438 — Release Evidence Consolidation & Next Roadmap Renewal**.

## Promotion proof

Record each exact-SHA check and Cloudflare live identity independently. An open pull request or locally passing test does not authorize release without the protected gate; never use a forced ref update to satisfy this proof.
