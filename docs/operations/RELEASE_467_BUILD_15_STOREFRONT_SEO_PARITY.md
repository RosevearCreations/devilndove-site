# Release 467 Build 15 — Storefront / SEO Parity

Build 15 executes autonomous backlog items **6–10** on the exact Development-green Build 14 predecessor.

## Exact predecessor

- Release 467 Build 14 — **Product Release Quality Command Center**
- merged `dev`: `dd92a10799f0f7656fe9508a25a983839117a1d0`
- tree: `dbe3ed8e1be82c02223a346f58a626654f8d5382`
- System Gate `33649971571` — SUCCESS
- Build 14 Proof `33649971525` — SUCCESS

Build 14 retains its exact Release 467 Build 13 — **Repository Hygiene and Historical CI Cleanup** predecessor `794fd5b36191fff4c9e8376197f968d9c6d6da80`; Build 13 retains Release 467 Build 12 — **Finance Operations Command Center** predecessor `374983f68fb16172fb357b1755293a29e5d2953f`.

## 6 — Product structured-data parity

`public/js/storefront-parity.js` is the shared visible-fact model. Product, Offer and BreadcrumbList structured data now derive from the same Product/listing-profile/story facts shown to a buyer. Price, currency, SKU, availability, images, category and canonical URL are not separately invented for schema. Canada-only shipping uses OfferShippingDetails with `addressCountry: CA` only when the Product actually requires shipping.

The retained Release 465 SEO bootstrap `public/js/seo-page-overrides.js` loads this model and converges its dynamic Product JSON-LD on the same facts. It remains a compatibility authority rather than being replaced.

## 7 — Full public SEO quality pass

`scripts/release467_build15_public_seo_gate.py` audits every checked-in indexable public HTML surface and requires:

- exactly one H1;
- useful title and meta description;
- canonical `https://devilndove.com/` URL;
- crawlable internal links;
- valid image sources and meaningful non-decorative alt text;
- applicable JSON-LD structured data.

Dynamic Product schema parity is separately checked through the retained SEO bootstrap and shared Storefront parity model.

## 8 — Normalized buyer-facing facts

`/api/product-buyer-facts` reads active Product facts plus only approved/published listing profiles and public-safe story notes. It is read-only and never creates or repairs schema during a request.

The shared buyer-fact model normalizes:

- materials;
- making/process facts;
- finish or condition;
- size/dimensions;
- care;
- personalization limits;
- availability;
- shipping/pickup;
- honest handmade limitations.

`public/js/admin-product-quality-command-center.js` remains the single Product Quality operator surface. Build 15 adds missing buyer facts to that same ranked remediation queue rather than creating another product-quality system. Missing evidence becomes admin work; public code does not manufacture a fact.

## 9 — Shop / Collection relationships

Product Detail already had proof-based related Products and retained curated collection links. Build 15 extends the same relationship vocabulary to buyer navigation through material, process, product type, merchandise origin and category links. `public/js/shop-parity.js` adds those proof relationships and approved buyer facts to existing Shop cards without becoming another Product authority.

## 10 — Shipping / pickup / policy consistency

The existing server authority in `functions/api/checkout-create-order.js` already fails closed before order mutation when a shipping country is not Canada:

- code `shipping_country_not_supported`;
- allowed countries `["CA"]`;
- `local_order_mutation_performed: false`;
- `provider_network_call_performed: false`.

Build 15 exposes the same policy on Shop, Product, Cart and Checkout through `public/js/storefront-shipping-policy.js`. Checkout visually pins the shipping country to Canada before submission, but the server remains the real enforcement authority.

The existing **U.S. sales/shipping suspension remains intact**. Build 15 does not authorize U.S. sales, shipping, provider execution or publication.

Marketplace preparation remains local-only. Existing `shipping_profile_reference`, image validation and provider-execution/publication guards remain authoritative; Build 15 does not contact Etsy, Facebook, Pinterest, TikTok, Stripe, PayPal or Social/OAuth providers.

## Safety boundary

- canonical migrations remain exactly `0001`–`0004`;
- Build 15 migration: NONE;
- request-time DDL: NONE;
- new D1/R2 mutation authority: NONE;
- provider execution/publication: NONE;
- Cloudflare Access policy mutation: NONE;
- `main` mutation: NONE;
- Production mutation/contact: NONE;
- secrets emitted: NONE;
- external lanes remain `HOLD_EXTERNAL`.

`development-release.json` remains Release 466 **INHERITED_REGRESSION_COMPATIBILITY** and the Release 466 runtime header remains **INHERITED_RUNTIME_COMPATIBILITY**.

## Retained Release 467 authorities

Builds 1–4 retain I.T. readiness, recovery, **same-origin authenticated browser runtime acceptance**, and the sanitized evidence acceptance ledger. **Build 4 consolidates source-proof authorities into its same-session evidence and acceptance ledger; Build 10 preserves that ledger rather than replacing it.**

**Build 5 — CI / Cloudflare Access readiness** remains separate from **Production Promotion Readiness**. Masked names `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` may be referenced; secret values may not. Release 467 Build 6 — Development Cloudflare Access acceptance harness remains dispatch-only. Release 467 Build 7 — **External Commercial Acceptance Bridge** owns external visibility. Release 467 Build 8 retains current-vs-compatibility authority separation. Release 467 Build 9 retains Historical CI Retirement & Gate Fanout Reduction. Release 467 Build 10 retains the I.T. Control Tower. Release 467 Build 11 retains the Admin Operations Command Center. Release 467 Build 12 — Finance Operations Command Center remains read-only. Release 467 Build 13 — Repository Hygiene and Historical CI Cleanup remains historical cleanup authority. Release 467 Build 14 — Product Release Quality Command Center remains the Product quality authority extended by Build 15.
