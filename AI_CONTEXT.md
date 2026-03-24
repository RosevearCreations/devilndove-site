# AI Context

## Current phase

This repo is in the payment/media hardening phase after the main storefront, auth, and admin foundations were already built.

## Important truths right now

- orders are created before payment handoff
- PayPal is a redirect + return + webhook flow
- Stripe is now a hosted checkout + webhook flow
- webhook events are stored in `webhook_events` for idempotency and later replay tooling
- product media is managed through ordered `product_images` plus `product_image_annotations`
- direct uploads now go into R2 and can be saved into product image rows from admin
- inventory, SEO, analytics, and notifications are foundational but not fully matured

## Best next priorities after this pass

1. webhook replay/retry tooling
2. refund/dispute handling
3. richer media library management
4. deeper inventory automation
5. dashboard/reporting polish

## Files that matter most for the new pass

- `functions/api/checkout-prepare-payment.js`
- `functions/api/paypal-webhook.js`
- `functions/api/stripe-webhook.js`
- `functions/api/admin/media-upload.js`
- `public/js/admin-product-images.js`
- `database_payments_extension.sql`
- `database_store_schema.sql`
- `database_full_schema.sql`
- `database_upgrade_current_pass.sql`
