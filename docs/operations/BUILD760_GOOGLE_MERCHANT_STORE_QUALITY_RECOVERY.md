# Devil n Dove Build 760 — Google Merchant Center Shipping, Returns, Media & Store Quality Recovery

## Scope and pre-Build 760 findings
The earlier SEO/H1/schema/sitemap gates were not Merchant Center account certification. Google's November Canada store-quality scorecard marked **Delivery time, Shipping cost, Return window, Return cost, eWallet, High resolution images, Images per offer** incomplete. The existing Build 660 evidence desk is internal, and Build 759 only linked Merchant policy guidance. Before this build there were **no dedicated indexed public shipping or returns pages** in the repository. More critically, `merchantConfiguration` applied `Number('')===0` to a missing `MERCHANT_CA_SHIPPING_PRICE_CAD`, potentially advertising free $0.00 shipping instead of the actual authoritative Canadian physical checkout **$15.00 CAD** fee.

## Deployed consumer-facing pages, current source
- Public shipping and local pickup: https://devilndove.com/shipping/
- Public returns, refund & exchange policy: https://devilndove.com/returns/
- Shopping and checkout remain Canada-only; U.S. sales/shipping stay suspended.
- Server `functions/api/checkout-create-order.js` and browser `public/js/checkout-reliability-core.js` both charge $15 CAD once for a shipped physical order, $0 for pickup/digital. Price is **before tax**.
- Newly adopted published service estimates: ready-to-ship **5–10 business day handling**, carrier **3–15 business day transit**, exceptions for individually agreed custom order scope. These are new customer service targets, **not** verified historical carrier SLA statistics. This should be reviewed against actual workshop capacity.
- Newly introduced returns policy: standard eligible unused/unmodified merchandise return request within **14 calendar days of delivery/collection**, buyer pays actual carrier postage for ordinary change-of-mind returns, no restocking fee, defective/wrong goods corrected with required return expense covered, refund initiation normally within 10 business days of actual receipt and review. Customized/personalized, opened hygiene or digital items excluded from voluntary change-of-mind returns, not from statutory consumer remedies. These are **new business commitments** adopted for readiness, not previously approved values recovered from D1. Owners should review them promptly. Never change the checkout price or publish a false refund event.
- Indexable canonical page titles/H1, plain contact routes, legal links in home/shop/product/cart/checkout/help/terms, sitemap additions, site-wide `OnlineStore.hasShippingService` and `OnlineStore.hasMerchantReturnPolicy` markup consistent with the published pages. No Dovlin menu/art changes.

## Merchant product feed corrections
- Public original source is `GET /api/merchant-feed` (XML; `?format=json` returns original bounded coverage and blocker reasons). No external Google submission or API write.
- Missing explicit price **never means free shipping**. A missing `MERCHANT_CA_SHIPPING_PRICE_CAD` uses the already verified real $15 server checkout charge. Explicit override unequal to 15, invalid, negative, or 0 **fails closed**; no false Google shipping price. Do not change checkout fees indirectly with a Google setting.
- Offer-level XML shipping includes CA, CAD $15, handling **5–10**, transit **3–15** so an offer shipping override does not erase the timing. Canadian rates exclude tax.
- The published /returns/ page establishes a real site policy, **not a verified Merchant Center account setting**. Google account return confirmation is a separately visible fact. A `MERCHANT_RETURN_POLICY_LABEL` is emitted only when actually supplied; no invented label.
- `product_images` is queried read-only, bounded at 3,000, and only genuine linked product URLs are deduplicated and exported to `additional_image_link` (up to 10). Decorative brand hero, logo and placeholders cannot substitute for real item photos. `image_count` and `image_coverage_recommended` are visible as diagnostics; we **do not** pretend to know pixel dimensions or fabricate new photos. A product with no genuine image stays blocked.
- Feed eligibility remains restricted to real active/approved physical, onsite, CAD items requiring Canada shipping; no automatic Etsy/Google publishing, D1 mutation, payment, carrier booking, refund or customer message.

## What still needs verification within Google's account
This ChatGPT execution has GitHub repository access but **no authenticated Google Merchant Center account-write connector**. Website modifications cannot directly submit or confirm Merchant Center policies. The new site pages are publicly crawlable *after* exact SHA Cloudflare production promotion, but Google must index/process them.

For every real Merchant Center account/store listing these products, use https://merchants.google.com/:
1. Products & store > Shipping and returns > Shipping policies; for destination Canada, publish $15 CAD before tax, standard handling 5–10 business days and transit 3–15 business days (consistent with new public policy), excluding U.S. and international delivery. Check policy overrides and products that use local pickup/digital delivery.
2. Shipping and returns > Return policies: submit **https://devilndove.com/returns/**, 14-day eligible standard return window, mail return method, customer-paid *actual carrier postage* on change of mind, merchant-paid required remedy for defective/incorrect items, and 10-business-day refund-processing estimate. Enter only fields Google supports; ensure exceptions for custom, hygiene or digital products match the site.
3. Confirm Google discovered the actual site-wide shipping/return structured data and is using the account's live policies rather than stale values; monitor Store Quality and item disapprovals after Google processes them. Do not claim "fixed on Google" without a live account readback.
4. Verify eligible wallet method(s) from an actual checkout. PayPal and Stripe are in the site UI, but **Google eWallet detection** may require authenticated real payment method availability; do not infer Apple Pay/Google Pay enabled.
5. Review original products and upload actual high-resolution item photos and multiple views in Product Editor/media. 2+ genuine image URLs is a minimum practical evidence target in this build, not a Google minimum-resolution certification. Avoid decorative/fake item images.

Source references:
- https://support.google.com/merchants/answer/14261098
- https://support.google.com/merchants/answer/12578516
- https://support.google.com/merchants/answer/14011730
- https://developers.google.com/search/docs/appearance/structured-data/return-policy
- https://developers.google.com/search/docs/appearance/structured-data/shipping-policy
- https://www.ontario.ca/page/returns-exchanges-and-warranties-ontario

## Promotion gates
Protected Build 760 contract tests, original source/quality/I.T./hygiene, Cloudflare development exact tree. Then protected dev→main PR, original Cloudflare Production and live custom domain exact main-SHA readback, smoke, and source receipt. Software Production GREEN is separate from Google Merchant account policy processing and independent actual buyer/carrier/provider evidence.
