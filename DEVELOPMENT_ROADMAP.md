# Development Roadmap

## Current completed foundations

- auth and session model
- member orders/downloads
- admin users/security tools
- checkout and order creation
- PayPal handoff
- PayPal return capture
- PayPal webhook reconciliation
- Stripe hosted checkout session creation
- Stripe webhook reconciliation
- webhook event idempotency log foundation
- webhook review + manual replay queue admin tooling
- analytics and visitor monitoring foundation
- product SEO tools
- product media workflow foundation
- direct admin image upload endpoint for R2 media
- uploaded asset browser/delete foundation in admin
- site inventory/reorder foundation
- deeper site inventory fields for reserved/incoming/supplier/cost tracking
- refund and dispute workflow logging foundation in admin
- import preview validation improvements for duplicate slugs and malformed media URLs

## Strongest next steps after this pass

1. webhook retry / replay / dispatch hardening worker flow beyond admin requeue
2. storefront + admin refund and dispute workflows with provider sync confirmation
3. direct media replace polish, thumbnail/variant generation, and featured-image suggestions
4. deeper inventory operations for products, tools, and supplies with movement history
5. product import seeding refinement and richer row-by-row validation UX
6. richer analytics dashboards and funnel reporting

## Media-specific roadmap

- uploaded asset gallery / browser in admin ✅ foundation added
- image delete/reorder UI polish ✅ partial
- thumbnail/variant handling
- tighter annotation-to-storefront usage
- optional automatic featured-image suggestion from uploaded media

## Payment-specific roadmap

- webhook replay safety admin tooling ✅ partial foundation added
- idempotency review dashboard using webhook_events ✅ partial foundation added
- provider retry logging + admin resend tools ✅ partial foundation added
- refund/dispute workflows ✅ local foundation added
- optional Stripe customer portal / saved customer records later
