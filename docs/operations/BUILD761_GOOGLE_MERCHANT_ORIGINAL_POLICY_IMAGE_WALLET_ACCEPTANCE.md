# Build 761 — Original Google Merchant account, product image bytes, and wallet checkout acceptance

## Critical truth boundaries
The Build 760 software release put indexable Canada shipping/returns pages and a truthful $15 CAD shipping feed in production. It did NOT authenticate Merchant Center accounts, guarantee Google scorecard updates, photograph products or activate live PayPal/Google Pay. This release adds a source-checkable Admin workbench, explicitly clicked only at **https://devilndove.com/admin/local-seo-review/**. Do not call site SEO/H1 PASS a Google Merchant policy acceptance certificate.

## Genuine Google Merchant Center reconciliation (source unavailable => HOLD)
The Admin action sends an authenticated **GET only** to `/api/admin/merchant-original-evidence-761`. No scheduled work, background call, Google policy write, D1 mutation, payment intent or new Google login is initiated by opening the page.

**If** the Cloudflare Production environment has BOTH protected variables `GOOGLE_MERCHANT_ACCOUNT_ID` (real numeric Merchant ID) and `GOOGLE_MERCHANT_ACCESS_TOKEN` (valid OAuth access token with Merchant API read scopes), the Admin-only endpoint makes two read-only Merchant API **v1** calls to the fixed `merchantapi.googleapis.com` host:
1. `GET /accounts/v1/accounts/{accountId}/shippingSettings`. Reject if no active Canada shipping, any compared default rate is not **CAD $15**, or actual handling/transit don't exactly match **5–10 / 3–15 business days** (or a rate group/label cannot prove broad coverage).
2. `GET /accounts/v1/accounts/{accountId}/onlineReturnPolicies`. Require exactly one default CA policy with URL `https://devilndove.com/returns/`, eligible standard **14-day** return window, `BY_MAIL`, real buyer-paid return carrier fee (`CUSTOMER_PAYING_ACTUAL_FEE`), no restocking fee, and refund handling **10 business days or less**.

The endpoint returns sanitized parsed values only; never returns or logs OAuth credentials, sends external writes or claims a Google Store Quality score. If the token is missing/expired, policy differs or Google denies access, result is explicitly **HOLD**. Access tokens typically expire; obtaining a consented, maintainable OAuth connection must be separately authorized, not solved by hardcoding a secret into code. Shipping/returns site targets are new Build 760 commitments; owner must confirm they are operationally feasible.

Google references:
- https://developers.google.com/merchant/api/guides/accounts/manage-shipping-settings
- https://developers.google.com/merchant/api/guides/online-return-policies/overview
- https://support.google.com/merchants/answer/14261098
- https://merchants.google.com/

## Real product image quality
The on-demand Admin API reads the existing approved Canadian Merchant feed coverage from D1 and samples a maximum of four original products, with the primary and one alternate image each. It requests up to 65,536 bytes of **actual** publicly reachable image content, from approved Devil n Dove first-party image URLs only, with no redirects or other hosts. PNG/JPEG/WebP pixel dimensions are decoded directly from image binary markers; unsupported/remote/redirected/missing/corrupt assets **HOLD**, never pass as real photography.

Google's Store Quality high-resolution metric considers images with **more than 1,024 pixels** high-resolution. This conservative check requires **both axes above 1,024 pixels** for a sampled image to receive `PIXEL_DIMENSIONS_VERIFIED`; real photographic authenticity, blur, provenance, lighting, all-catalog coverage, public Google crawl and Merchant scorecard acceptance remain independently unverified. It is **not** a blanket original-photo certification.

Google resources:
- https://support.google.com/merchants/answer/14185775
- https://support.google.com/merchants/answer/18353357

## Real production eWallet checkout
The canonical first-party `/api/payment-providers` endpoint and `functions/api/_lib/paymentExecution.js` distinguish an HTML payment-method label from actual remote payment authority. The current policy **restricts remote PayPal and Stripe execution to development test hosts**; the production domain does **not** authorize remote PayPal/Stripe regardless of configured credentials. Square is not implemented for live provider execution.

Build 761 visibly checks `/api/payment-providers` on guest checkout, disables remote provider select options unless actually ready, defaults to the available **Manual / Invoice** method if the previous method is unavailable, and makes the payment outcome clearly **unpaid**. It blocks unsupported remote-method submissions before creating an order. It does not configure Stripe/PayPal live credentials, activate wallets, create charges or pretend PayPal is completed. A genuine consented production payment-provider activation and a completed guest purchase with independent provider webhook/payment receipt are prerequisites for a true eWallet scorecard signal. **Do not** bypass the existing test-only payment authority in a quality build.

Google's documented supported eWallet signals include **PayPal, Google Wallet, Apple Pay and Amazon Pay** and require a guest checkout experience. The scorecard can take approximately 30 days to reflect new wallet evidence:
- https://support.google.com/merchants/answer/14187023
- https://support.google.com/merchants/answer/14261098

## Exact buyer and operator acceptance
1. Original signed-in Admin: visit https://devilndove.com/admin/local-seo-review/ and select **Verify original Merchant, images & checkout now**. Review source status; missing Merchant API credentials must be HOLD, not inherited from a static screenshot.
2. Actual guest user, separate tab: visit https://devilndove.com/checkout/. The live payment readiness statement must match `/api/payment-providers`; unavailable PayPal/Stripe/Square are disabled, Manual / Invoice remains an unpaid order route. Do NOT place an order merely to test this Build 761.
3. Check actual product media and the original `/api/merchant-feed?format=json`; select real image uploads to improve low-resolution/low-image-count issues. The Admin sample is not the entire catalog.
4. Review the Google Merchant Center account Store Quality scorecard and settings after Google processes them. No provider status can be invented from GitHub/Cloudflare software checks.

## Protected promotion
- Feature PR into `dev`, exact-source Build761/760/759 tests, runtime source/quality/I.T./branch hygiene, Cloudflare Development success.
- Protected PR from exact green dev into `main`, original Cloudflare Pages Production, public smoke, custom-domain `/release-version.json` equal to final full main SHA, independent production receipt, post-deploy resource proof. Production software GREEN is separate from Google account, human media visual review and live provider-payment GREEN.
- Source budget allowance: Build760 measured 20,242,271 bytes/1,887 files; Build761 adds one protected read-only Admin GET runtime file and a bounded Admin/checkout UI. Reviewed +25,000 bytes (20,270,000 ceiling, +0.1235%) and +1 runtime file (1,888 ceiling). Other strict file/media/SEO/release/security limits are unchanged.
