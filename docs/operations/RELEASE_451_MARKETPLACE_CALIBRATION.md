# Release 451 — Marketplace Calibration

Status: Development source calibration. Release 450 remains the proven D1 marketplace-schema authority; Release 451 deliberately adds no D1 migration.

## Purpose

Move local marketplace preparation closer to provider acceptance without enabling publication. Release 451 derives go-live evidence from existing Product/media truth, Release 450 listing profiles/policies, Release 449 commerce transaction costs, provider setup authorities and the public SEO gates.

## 26 calibration changes

1. Provider setup authority evidence.
2. Provider execution lock evidence.
3. Publication lock evidence.
4. Channel title readiness.
5. Description depth readiness.
6. Positive price readiness.
7. Positive quantity readiness.
8. SKU/reference readiness.
9. At least one public-ready image.
10. Multi-image coverage depth.
11. Public image alt-text evidence.
12. Canonical Product URL/slug evidence.
13. Marketplace taxonomy/category mapping.
14. Search tags/keyword preparation.
15. Materials preparation.
16. Shipping-profile/method preparation.
17. Processing/readiness-state preparation.
18. Return-policy preparation.
19. Typed personalization validity/not-required evidence.
20. Variation validity/not-required evidence.
21. Marketplace/provider fee-model evidence.
22. Payout-reference reconciliation evidence.
23. Marketplace tax-handling review evidence.
24. Currency-handling review evidence.
25. Channel-specific compliance evidence.
26. Public SEO/canonical/structured-data gate evidence.

## Channel calibration notes

### Etsy

Release 450's draft authority remains canonical: local draft preparation only, publication disabled, up to 20 prepared images, up to 13 tags, current typed personalization handling and up to three variation properties. Release 451 adds the missing shop/API-terms, fee/payout, tax/currency and go-live evidence layer. It does not call Etsy.

### Pinterest

Calibration expects business-account and claimed-domain evidence before provider execution. Catalog publication remains disabled.

### Meta / Facebook

Calibration records local catalog/commerce-account readiness only. No Commerce API call is added.

### TikTok

Calibration records creator-info, verified-media-domain and consent review evidence. Current local preparation remains provider-locked; no direct-post or upload call is added.

## Accounting relationship

`commerce_transaction_costs` remains the cost evidence authority. Release 451 reads quarterly channel/provider cost rows and payout references; it does not create a parallel fee ledger or modify journal data.

The calibration deliberately treats a missing fee model as incomplete once marketplace/provider costs are expected. Listing fees, transaction fees, payment processing, ads, shipping labels/postage, refunds/reversals, tax handling and currency conversion can therefore be reviewed before profitability is trusted.

## SEO safety

Release 451 requires both:

- `scripts/public_seo_gate.py`
- `scripts/public_seo_depth_gate.py`

The depth gate protects Home, Shop, Collections and Collages for one H1, usable title/description, `index,follow`, clean canonical URL, Open Graph, Twitter card and JSON-LD. Marketplace admin/calibration pages remain `noindex,nofollow`.

## D1 / Cloudflare rule

Release 451 marketplace calibration requires **no new D1 migration**. A new chat must continue to use `docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md`; it must not replay Releases 447–450 because Release 451 source work started.

## Provider boundary

A 100% local calibration score is not provider authorization. Provider execution and publication remain disabled until a later explicit acceptance release performs current-provider credential/OAuth/sandbox testing and deliberately changes that authority.
