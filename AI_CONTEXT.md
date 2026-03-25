# AI Context

## Current phase

This repo is in the payment, media, inventory, and public SEO hardening phase after the main storefront, auth, and admin foundations were already built.

## Important truths right now

- orders are created before payment handoff
- PayPal is a redirect, return, and webhook flow
- Stripe is now a hosted checkout and webhook flow
- webhook events are stored in `webhook_events` for idempotency and manual replay queueing
- product media is managed through ordered `product_images` plus `product_image_annotations`
- direct uploads now go into R2 and can be browsed from `media_assets` in admin
- local refund and dispute records now live in `payment_refunds` and `payment_disputes`
- inventory records now track reserved, incoming, supplier, and cost fields
- inventory changes now also write to `site_inventory_movements`
- public-facing pages are expected to maintain a one-H1 rule and a complete metadata baseline
- public search awareness now includes sitemap, robots intent, structured data, and the `/search/` page

## Best next priorities after this pass

1. webhook worker and scheduler hardening
2. provider-confirmed refund and dispute sync
3. richer media library management with variants, thumbnails, and replace flow
4. deeper inventory movement history UX and automation
5. dashboard and reporting polish
6. keep improving crawl, metadata, and search-awareness coverage each pass

## Files that matter most for the new pass

- `functions/api/checkout-prepare-payment.js`
- `functions/api/paypal-webhook.js`
- `functions/api/stripe-webhook.js`
- `functions/api/admin/webhook-events.js`
- `functions/api/admin/payment-actions.js`
- `functions/api/admin/media-upload.js`
- `functions/api/admin/media-assets.js`
- `functions/api/admin/site-item-inventory.js`
- `functions/api/site-search-event.js`
- `functions/sitemap.xml.js`
- `public/js/admin-product-images.js`
- `public/js/admin-webhook-events.js`
- `public/js/admin-site-item-inventory.js`
- `public/js/site-search.js`
- `database_payments_extension.sql`
- `database_growth_analytics_seo_extension.sql`
- `database_full_schema.sql`
- `database_upgrade_current_pass.sql`


- Shared layout currently depends on `main.js` for nav/footer and `site-auth-ui.js` for the floating account widget.
- Logged-out recovery links point to `/account-help/`, which records requests in `auth_recovery_requests`.


- Shared auth/session fixes should preserve sign-in visibility across admin and outward-facing pages.
- Keep the one-H1 rule intact on outward-facing pages while continuing incremental SEO/crawl improvements each pass.
- Shared footer and account widget are baseline layout requirements now.
