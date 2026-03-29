# Sanity / Health Check

## What is currently working well
- Public site routing and shared layout are stable enough for continued feature work.
- Movie covers load from the enriched pipeline, and the movie shelf now has real pagination support through `/api/movies`.
- Admin foundations for users, products, orders, media, inventory, analytics, and webhook review are present.
- Mobile finished-product capture exists and is useful for draft-first product entry.
- Tools and supplies reorder workflows have moved closer together operationally.

## What still needs the most attention
- Stripe completion and provider-confirmed payment reconciliation.
- Webhook replay/retry hardening with auditable operator actions.
- Inventory movement depth and single-source-of-truth cleanup.
- Media lifecycle polish across upload, replace, reorder, and storefront usage.
- Funnel-quality analytics and richer reporting.
- Trusted movie metadata/value enrichment once IMDb/AWS access is ready.

## Current risk posture
- Moderate operational risk from mixed JSON and D1 data sources.
- Moderate UX risk on admin-heavy and small-screen layouts despite current CSS cleanup.
- Moderate payment-state risk until Stripe and webhook workflows are completed end to end.

## Recommended next build focus
1. Stripe + webhook hardening.
2. Inventory movement / reorder depth.
3. Media lifecycle completion.
4. Analytics and funnel reporting.
5. Continued JSON → D1 migration.
