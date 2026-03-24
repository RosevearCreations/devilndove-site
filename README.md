# Devil n Dove Website

Devil n Dove is a public website, storefront, member area, and admin management system for the workshop.

## Current state

The current build includes:

- public storefront and product detail pages
- member login, registration, account tools, orders, and downloads
- admin dashboard for users, products, orders, analytics, inventory, SEO, notifications, and media
- checkout and order creation
- PayPal handoff, PayPal return capture, and PayPal webhook reconciliation
- Stripe hosted checkout preparation and Stripe webhook reconciliation
- webhook event logging for provider idempotency / audit trail
- live visitor/session analytics and historical website data by path and country
- product SEO fields, product image annotations, and product media workflow tools
- direct image upload endpoint for R2-backed product media
- site inventory/reorder tracking for tools, supplies, and sellable products

## Main payment status

Implemented now:

- order creation
- payment preparation
- PayPal redirect handoff
- PayPal return capture
- PayPal webhook reconciliation endpoint
- Stripe Checkout session creation
- Stripe webhook reconciliation endpoint
- webhook event storage for duplicate-event safety
- admin manual payment recording

Still to deepen later:

- webhook retry workers / scheduled dispatch
- refund automation
- provider dispute handling
- admin replay/retry tooling on webhook events

## Main product/media status

Implemented now:

- create, edit, archive, delete products
- bulk update products
- import preview and import tools
- product SEO editor
- product image annotation editor
- product image workflow editor for ordered images, alt text, captions, focal points, and featured image sync
- direct admin upload endpoint for product images to R2
- inventory tracking on products and site inventory records

## Database files

- `database_schema.sql`
- `database_store_schema.sql`
- `database_access_tiers.sql`
- `database_payments_extension.sql`
- `database_profiles_extension.sql`
- `database_growth_analytics_seo_extension.sql`
- `database_full_schema.sql`
- `database_upgrade_current_pass.sql`
- `database_admin_seed_template.sql`

## Important endpoints

Auth:
- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/logout-all`
- `/api/auth/me`
- `/api/auth/change-password`
- `/api/auth/session-info`
- `/api/auth/bootstrap-admin`
- `/api/auth/bootstrap-status`

Storefront and checkout:
- `/api/products`
- `/api/product-detail`
- `/api/payment-providers`
- `/api/checkout-create-order`
- `/api/checkout-prepare-payment`
- `/api/paypal-return`
- `/api/paypal-webhook`
- `/api/stripe-webhook`

Admin products/media:
- `/api/admin/products`
- `/api/admin/product-detail`
- `/api/admin/create-product`
- `/api/admin/update-product`
- `/api/admin/delete-product`
- `/api/admin/archive-product`
- `/api/admin/product-seo`
- `/api/admin/product-image-annotations`
- `/api/admin/product-images`
- `/api/admin/media-upload`
- `/api/admin/bulk-update-products`
- `/api/admin/import-products-preview`
- `/api/admin/import-products`
- `/api/admin/site-item-inventory`

Analytics:
- `/api/track/visit`
- `/api/track/cart`
- `/api/admin/visitor-analytics`

## Notes for deployment

Keep secrets in Cloudflare Variables and Secrets.

Important payment variables include:

- `PUBLIC_SITE_URL`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_SECRET`
- `PAYPAL_ENV`
- `PAYPAL_WEBHOOK_ID`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

Important media variables/bindings include:

- R2 binding: `PRODUCT_MEDIA_BUCKET`
- `PRODUCT_MEDIA_PUBLIC_BASE_URL`
- optional `PRODUCT_MEDIA_BUCKET_NAME`

## Admin/media note

Images can now be added to products in two ways:

- paste image URLs directly into the product media workflow
- upload image files through admin to R2, then save the generated URL into the product media list
