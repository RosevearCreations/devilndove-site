# AI Context

## Current phase

This repo is in the payment/media hardening phase after the main storefront, auth, and admin foundations were already built.

## Important truths right now

- orders are created before payment handoff
- PayPal is a redirect + return + webhook flow
- Stripe is now a hosted checkout + webhook flow
- webhook events are stored in `webhook_events` for idempotency and manual replay queueing
- product media is managed through ordered `product_images` plus `product_image_annotations`
- direct uploads now go into R2 and can be browsed from `media_assets` in admin
- local refund/dispute records now live in `payment_refunds` and `payment_disputes`
- inventory records now track reserved/incoming quantities and supplier/cost fields

## Best next priorities after this pass

1. webhook worker/scheduler hardening
2. provider-confirmed refund/dispute sync
3. richer media library management with variants/thumbnails
4. deeper inventory movement history and automation
5. dashboard/reporting polish

## Files that matter most for the new pass

- `functions/api/checkout-prepare-payment.js`
- `functions/api/paypal-webhook.js`
- `functions/api/stripe-webhook.js`
- `functions/api/admin/webhook-events.js`
- `functions/api/admin/payment-actions.js`
- `functions/api/admin/media-upload.js`
- `functions/api/admin/media-assets.js`
- `functions/api/admin/site-item-inventory.js`
- `public/js/admin-product-images.js`
- `public/js/admin-webhook-events.js`
- `database_payments_extension.sql`
- `database_store_schema.sql`
- `database_full_schema.sql`
- `database_upgrade_current_pass.sql`
