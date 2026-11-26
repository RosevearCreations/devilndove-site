# Devil n Dove Build 762 — Production provider enrollment, original guest checkout witness and Google Store Quality revalidation

**Owner:** Devil n Dove business and financial system; Masters may consume approved summary evidence, not post the order or payment.

**Source of Truth applied:** `Rosevear_All_Applications_Source_of_Truth (2)(2).md` (26 November 2026), sections **Shared customer journey**, **Devil n Dove · Retail, commissions and workshop proof**, **Finance**, **Autonomous testing**, **Build order and release evidence**. Explicitly separate code deployed, simulated guest outcome and observed live settlement. A customer must not be shown “paid” or “confirmed” until durable provider and ledger acknowledgement.

## Baseline and first verified gap
Build761 main `d35d8bb0515079afbf824de58658cb45d68ec4f5` was verified live by the exact Cloudflare custom-domain SHA. Its guest JavaScript disables unavailable PayPal/Stripe/Square selections, but the server `POST /api/checkout-create-order` still allowed creation of a pending payment order under those unsupported remote methods. The later `/api/checkout-prepare-payment` gate then rejected payment. This allowed an avoidable unpaid/pending order. Build762 closes this on the original production host at server authority, **before any order insertion or provider call**. Existing idempotent recovery remains read-only for prior orders, and Development remains subject to its original sandbox policy.

## Customer journey verification
| Surface | Verified expected result | Field evidence |
|---|---|---|
| Original phone (390 x 844), tablet (820 x 1180), desktop (1440 x 900) guest checkout | Fetch original `/api/payment-providers` (test-only fixture); unsupported remote methods disabled, Manual/Invoice selected; zero order, payment or message writes | Protected Build762 Chromium browser suite with per-device assertions |
| Production API `POST /api/checkout-create-order` with Stripe/PayPal/Square and customer/test cart fields | HTTP 423, `checkout_payment_provider_unavailable`, `local_order_mutation_performed=false`, `provider_network_call_performed=false` before any D1 prepare | Node original-handler fixture with DB spy that throws on access; Python source-order gate |
| Development test/sandbox payment | Remains under the existing explicit Development authority, test-key and host-boundary checks | `release460_payment_execution_gate.py`, `release460_payment_execution_proof.mjs` |
| Original Admin Merchant panel | Explicit click shows Google account policy, image pixel sample, Stripe live account read, real signed live webhook and same-order ledger evidence, distinct from external Google scorecard | `/admin/local-seo-review/`, `/api/admin/merchant-original-evidence-761`; Admin authentication required |
| Google Merchant score | Unverified unless Google's own actual account/Store Quality interface returns evidence | **HOLD**, not equal to public SEO/H1/schema/source-green |

The browser journey is a **real Chromium browser against the actual repository checkout HTML with a mocked payment-readiness response**, not a real third-party transaction or signed-in private user account. It is explicitly tagged a rehearsal; source and production smoke tests are distinct. The user's authorized test accounts were examined: only `rosiedazzlers` **test-mode** Stripe account is visible through the connected Stripe service; there is no connected Devil n Dove live provider account to use or authorize here. No use of Rosie credentials against Devil n Dove.

## Source-grounded, read-only provider enrollment
The existing Admin-only GET (`/api/admin/merchant-original-evidence-761`) now includes `provider_enrollment_762`. For Stripe it only calls `GET https://api.stripe.com/v1/account` **on an explicit signed-in Admin click**, and only if the Production environment has a secret `STRIPE_SECRET_KEY` prefixed `sk_live_` **and** a separately owner-confirmed `DND_STRIPE_EXPECTED_ACCOUNT_ID` (e.g. `acct_...`). It checks account ID exact match, Canadian account, provider-reported `charges_enabled`, `payouts_enabled`, `details_submitted` and presence of a configured webhook-signing secret. It outputs booleans only, never the secret, personal information or legal identity. An account response is **configuration evidence**, not a successful payment, and the application does **not** automatically enable live remote execution.

For actual original guest payment evidence, the Admin route reads at most 12 already-recorded production Stripe `webhook_events` joined to `payments` and `orders`. It only recognizes a webhook that is provider-signature verified, durably processed, **`payload.livemode=true`**, relevant payment completion event, same linked order and payment with paid states, CAD, positive and reconciled amounts and a provider order reference. Test/sandbox receipts and synthetic fixtures are never accepted as original production evidence. No PII or raw webhook payload is returned. An actual live transaction must be independently authorized by the business before this proof can exist.

**No write operations:** no Google/Stripe provider changes, no live payment activation, no charge, no refund, no test order in production and no database schema/data changes. Site remains Canada-only, with existing policy prices. Existing middleware and paymentExecution boundary remain strict. Never copy live API keys into this document, a chat or GitHub.

## Genuine owner-dependent follow-up
1. **Owner decides** whether Devil n Dove should accept live online payments and which *business-owned* Stripe account is legally correct. Existing visible connected `rosiedazzlers` test-mode account must not be reused.
2. When the owner creates/authorizes a Devil n Dove account and completes provider onboarding, configure the correct protected Cloudflare Production secrets via the provider dashboard, including a live Stripe webhook endpoint **`https://devilndove.com/api/stripe-webhook`** (the existing server verifies signed webhook envelopes) and `DND_STRIPE_EXPECTED_ACCOUNT_ID`. Confirm payment methods, taxes, shipping, return terms, statement identity and seller controls in the original Stripe dashboard. Do not enable production execution from a generic credentials flag.
3. A **separate controlled production-activation build** should validate the owner's signed approval, live-secret bindings, verified original webhook and return/reconciliation, then activate one provider only through an audited explicit gate and a genuine owner-approved low-value guest purchase/refund. Keep idempotency, inventory and paid-vs-pending ledger separation intact. Only after original provider settlement evidence should Google Store Quality eWallet be submitted/observed.
4. For Merchant account shipping/returns, the original authenticated Google API still requires the real account ID and valid OAuth permission. Review Canada shipping $15 and 5–10 business-day handling / 3–15-day transit, and new 14-day standard returns **only if the business agrees to those policy commitments**. Image quality sample does not certify entire catalog. Google's Store Quality/eWallet results may lag and are **HOLD until original account readback**.

## Verified repository queue and next gap
Before Build762: exactly one currently authorized Build762, 21 open issues (not automatically queued builds), three unrelated open PRs (older Dovlin gallery, social-device, canonical D1), zero currently enabled Devil n Dove continuation automations and zero separately confirmed numbered post-762 builds. Avoid treating old issues as 21 scheduled releases.

**Next proposed after verified 762 source and workflow acceptance: Build 763 — Unique One-of-One Inventory, Counter/Online Last-Piece Race & Customer Receipt Reconciliation.** The repo already has unique-piece reservation D1 rules and a SQL regression `scripts/release467_build450_finished_pieces_sql_regression.py`, but a **real two-channel guest-vs-counter** simultaneous purchase and matching one inventory movement, paid receipt, tax and owner stock view is not demonstrated by the current build. Pilot the first failing step; don't replace existing inventory code if it already passes. This follows Source of Truth section **Retail**.

## Protected promotion and truth classification
- Exact feature-head PR tests, Node original-handler/Stripe-contract, Python static assertions, actual mock-browser phone/tablet/desktop, source/SEO/performance, original security and branch hygiene.
- Exact `dev` deployment and smoke; reviewed `dev→main` PR; Cloudflare Pages Production, custom domain full main SHA, production smoke and signed/source release receipt.
- Mark **Software Release GREEN** only after release checks, **Guest Journey REHEARSED** for mock tests, and **External Settlement / Merchant Scorecard HOLD** until genuine provider/owner source evidence. Report sample size, test environment and any unavailable original account/role without inventing live test user data.

References:
- Google Merchant Store Quality: https://support.google.com/merchants/answer/14261098
- Google eWallet guest checkout acceptance: https://support.google.com/merchants/answer/14187023
- Stripe keys and live/test separation: https://docs.stripe.com/keys
- CRA GST/HST invoice guidance: https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate.html
