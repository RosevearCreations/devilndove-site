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
- analytics and visitor monitoring foundation
- product SEO tools
- product media workflow foundation
- direct admin image upload endpoint for R2 media
- site inventory/reorder foundation

## Strongest next steps after this pass

1. webhook retry / replay / dispatch hardening UI and worker flow
2. storefront + admin refund and dispute workflows
3. direct media delete/reorder/replace polish and asset library browsing
4. deeper inventory operations for products, tools, and supplies
5. product import seeding refinement and validation UX
6. richer analytics dashboards and funnel reporting

## Media-specific roadmap

- uploaded asset gallery / browser in admin
- image delete/reorder UI polish
- thumbnail/variant handling
- tighter annotation-to-storefront usage
- optional automatic featured-image suggestion from uploaded media

## Payment-specific roadmap

- webhook replay safety admin tooling
- idempotency review dashboard using webhook_events
- provider retry logging + admin resend tools
- refund/dispute workflows
- optional Stripe customer portal / saved customer records later
